"use client";

import { Card, Button, Chip, TextField, InputGroup, Spinner } from "@heroui/react";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { AgentTemplate } from "@/types/agent";
import { createClient } from "@/utils/supabase/client";

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("adk_agent_templates")
        .select("*");
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (template: AgentTemplate) => {
    setDeploying(template.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert("Please log in to deploy agents.");
        return;
      }

      // 1. Call Backend to Build the Agent
      const backendUrl = process.env.NEXT_PUBLIC_ADK_BACKEND_URL || "http://localhost:8000";
      let response = await fetch(`${backendUrl}/api/build-agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_name: template.name,
          instructions: template.instructions,
          mcp_sse_endpoints: template.mcp_sse_endpoints,
        }),
      });

      // Handle Conflict (409): Delete and Retry
      if (response.status === 409) {
        console.log(`Agent ${template.name} already exists on backend. Deleting and retrying...`);
        await fetch(`${backendUrl}/api/agents/${encodeURIComponent(template.name)}`, {
          method: "DELETE",
        });
        
        // Retry build
        response = await fetch(`${backendUrl}/api/build-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_name: template.name,
            instructions: template.instructions,
            mcp_sse_endpoints: template.mcp_sse_endpoints,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || errorData.detail || "Failed to initialize agent on backend.");
      }

      // 2. Synchronize with Supabase (Upsert on name conflict)
      const { error: upsertError } = await supabase
        .from("adk_agents")
        .upsert({
          user_id: user.id,
          name: template.name,
          instructions: template.instructions,
          mcp_sse_endpoints: template.mcp_sse_endpoints,
          status: "inactive"
        }, { onConflict: 'name' });
      
      if (upsertError) throw upsertError;
      alert(`Successfully deployed ${template.name}! Check your agents dashboard.`);
    } catch (error: any) {
      console.error("Deployment error:", error);
      alert(error.message || "An unexpected error occurred during deployment.");
    } finally {
      setDeploying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" color="current" />
        <p className="text-default-500 animate-pulse">Loading Agent MarketPlace templates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-default-900">Agent MarketPlace</h1>
          <p className="text-default-500">Discover and deploy pre-trained AI agent templates.</p>
        </div>
        
        <div className="w-full md:w-80">
          <TextField aria-label="Search templates" type="search">
            <InputGroup>
              <InputGroup.Prefix>
                <SearchIcon className="text-muted-foreground" size={18} />
              </InputGroup.Prefix>
              <InputGroup.Input placeholder="Search templates..." />
            </InputGroup>
          </TextField>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-divider rounded-xl">
          <p className="text-default-500">No templates found in the Agent MarketPlace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="bg-surface border border-divider p-6 transition-colors hover:bg-surface-secondary flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <Chip size="sm" variant="soft" color="default" className="font-medium">
                    {template.category}
                  </Chip>
                  <div className="flex items-center gap-1 text-xs text-default-400">
                    <span>⭐ {template.stars}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-default-900 mb-2">{template.name}</h3>
                <p className="text-default-500 text-sm mb-6 pb-4 border-b border-divider">
                  {template.description}
                </p>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-default-900">
                  {template.price === 0 ? "Free" : `$${template.price}/mo`}
                </span>
                <Button 
                  size="sm" 
                  variant="primary" 
                  className="font-bold min-w-[120px]"
                  isDisabled={deploying !== null}
                  onClick={() => handleDeploy(template)}
                >
                  {deploying === template.id ? <Spinner size="sm" color="current" /> : "Deploy Template"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
