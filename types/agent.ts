export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  instructions: string;
  mcp_sse_endpoints: string[];
  category: string;
  price: number;
  stars: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface UserAgent {
  id: string;
  user_id: string;
  name: string;
  instructions: string;
  mcp_sse_endpoints: string[];
  status: 'active' | 'inactive' | 'paused';
  created_at: string;
  updated_at: string;
}
