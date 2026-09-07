import express from 'express';
import cors from 'cors';
import { AGENT_REGISTRY } from './agents/registry.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    runtime: 'DeepSeek Harness Microservice',
    registeredAgents: Object.keys(AGENT_REGISTRY).length,
    agents: Object.values(AGENT_REGISTRY).map(a => ({ name: a.name, icon: a.icon, role: a.role }))
  });
});

app.get('/agents', (req, res) => {
  res.json({ agents: AGENT_REGISTRY });
});

app.listen(PORT, () => {
  console.log(`DeepSeek Harness Agent Runtime running on port ${PORT}`);
});
