import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const TEMPLATE_OWNER = "Sreedharreddymukkamalla";
const TEMPLATE_REPO = "myagent_adk";

// GitHub API helper
async function githubFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

// Poll until fork exists (GitHub forks are async)
async function waitForFork(owner: string, repo: string, token: string, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const repoData = await githubFetch(`/repos/${owner}/${repo}`, token);
      if (repoData.full_name) return repoData;
    } catch (_) {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Timed out waiting for fork: ${owner}/${repo}`);
}

// Build agent.py file content
function buildAgentPy(name: string, description: string, instructions: string, mcpUrls: string[]): string {
  const safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const toolsBlock = mcpUrls.length > 0
    ? mcpUrls
      .map(
        (url) =>
          `        McpToolset(\n            connection_params=StreamableHTTPConnectionParams(\n                url="${url}",\n            ),\n        )`
      )
      .join(",\n")
    : `        McpToolset(\n            connection_params=StreamableHTTPConnectionParams(\n                url="https://example.com/mcp",\n            ),\n        )`;

  return `from google.adk.agents.llm_agent import Agent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams

root_agent = Agent(
    model='gemini-2.5-flash',
    name='${safeName}',
    description='${description.replace(/'/g, "\\'").replace(/\n/g, " ")}',
    instruction="""
        ${instructions.trim()}
    """,
    tools=[
${toolsBlock}
    ],
)
`;
}

export async function POST(req: Request) {
  const supabase = await createClient();

  // Ensure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      instructions,
      mcp_urls,
      github_token: userToken,
      github_username,
    } = body;

    // Validate required fields
    if (!name || !instructions || !github_username) {
      return NextResponse.json(
        { error: "Missing required fields: name, instructions, github_username" },
        { status: 400 }
      );
    }

    const serverGithubToken = process.env.GITHUB_TOKEN ?? "";
    const token = userToken || serverGithubToken;

    if (!token || token.trim() === "" || token === "dasdsa") {
      return NextResponse.json(
        { error: "A valid GitHub Personal Access Token is required." },
        { status: 400 }
      );
    }

    // Sanitize repo name
    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const repoName = `${safeName}-agent`;
    const mcpUrlsArray: string[] = mcp_urls || [];

    // --- Step 1: Generate repo from template ---
    console.log(`Generating from template ${TEMPLATE_OWNER}/${TEMPLATE_REPO} for ${github_username}...`);
    await githubFetch(`/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/generate`, token, {
      method: "POST",
      body: JSON.stringify({
        owner: github_username,
        name: repoName,
        description: description || `My custom ${name} agent`,
        private: false
      }),
    });

    // --- Step 2: Wait for repo to be ready ---
    console.log("Waiting for new repository to be ready...");
    const forkedRepo = await waitForFork(github_username, repoName, token);
    const githubRepoUrl = forkedRepo.html_url;

    // Give GitHub a moment to fully initialize the fork
    await new Promise((r) => setTimeout(r, 3000));

    // --- Step 3: Get current agent.py SHA (needed for update) ---
    const filePath = "my_agent_new/agent.py";
    let fileSha = "";
    try {
      const fileData = await githubFetch(
        `/repos/${github_username}/${repoName}/contents/${filePath}`,
        token
      );
      fileSha = fileData.sha;
    } catch (_) {
      console.log("agent.py not found, will create it");
    }

    // --- Step 4: Generate and push patched agent.py ---
    console.log("Generating agent.py...");
    const agentPyContent = buildAgentPy(name, description || name, instructions, mcpUrlsArray);
    const encodedContent = Buffer.from(agentPyContent).toString("base64");

    await githubFetch(
      `/repos/${github_username}/${repoName}/contents/${filePath}`,
      token,
      {
        method: "PUT",
        body: JSON.stringify({
          message: `Configure agent: ${name}`,
          content: encodedContent,
          ...(fileSha ? { sha: fileSha } : {}),
        }),
      }
    );

    console.log("agent.py pushed — GitHub Actions will now deploy to Cloud Run");

    // --- Step 4.5: Update deploy.yml ---
    const deployFilePath = ".github/workflows/deploy.yml";
    let deployFileSha = "";
    let deployFileContent = "";
    try {
      const deployData = await githubFetch(
        `/repos/${github_username}/${repoName}/contents/${deployFilePath}`,
        token
      );
      deployFileSha = deployData.sha;
      deployFileContent = Buffer.from(deployData.content, "base64").toString("utf-8");
    } catch (err: any) {
      console.log("deploy.yml not found or could not be read:", err.message);
    }

    if (deployFileSha && deployFileContent) {
      console.log("Updating deploy.yml...");
      const updatedDeployContent = deployFileContent.replace(
        /service:\s*capital-agent-service-git/,
        `service: ${safeName}`
      );
      const encodedDeployContent = Buffer.from(updatedDeployContent).toString("base64");

      await githubFetch(
        `/repos/${github_username}/${repoName}/contents/${deployFilePath}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            message: `Configure deploy.yml for agent: ${name}`,
            content: encodedDeployContent,
            sha: deployFileSha,
          }),
        }
      );
      console.log("deploy.yml pushed");
    }

    // --- Step 5: Save to Supabase ---
    // Derive expected Cloud Run URL from deploy.yml service name convention
    const cloudRunUrl = `https://${safeName}-475756125529.us-central1.run.app`;

    const { error: upsertError } = await supabase
      .from("adk_agents")
      .upsert(
        {
          user_id: user.id,
          name,
          instructions,
          mcp_sse_endpoints: mcpUrlsArray,
          github_repo: githubRepoUrl,
          github_username,
          cloud_run_url: cloudRunUrl,
          status: "inactive",
        },
        { onConflict: "name" }
      );

    if (upsertError) {
      console.error("UPSERT ERROR", upsertError);
      throw upsertError;
    }

    return NextResponse.json({
      success: true,
      github_repo: githubRepoUrl,
      cloud_run_url: cloudRunUrl,
      message: `Agent repository created! GitHub Actions is deploying to Cloud Run.`,
    });
  } catch (err: any) {
    console.error("Build API error:", err);
    return NextResponse.json(
      { error: err.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
