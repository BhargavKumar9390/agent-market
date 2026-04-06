import { Suspense } from 'react';
import MCPInspector from '../../../components/dashboard/mcp-inspection/MCPInspector';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading MCP Inspector...</div>}>
      <MCPInspector />
    </Suspense>
  );
}
