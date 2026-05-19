import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 120000,
  validateStatus: (status) => status < 500,
});

export async function generateModel(nodes, edges, config = {}) {
  const { data } = await api.post("/generate_model", { nodes, edges }, config);
  return data;
}

export async function forwardPass(nodes, edges) {
  const { data } = await api.post("/forward_pass", { nodes, edges });
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function trainModel(nodes, edges, options = {}) {
  const { data } = await api.post("/train", { nodes, edges, ...options });
  if (data.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function mutateArchitecture(nodes, edges) {
  const { data } = await api.post("/evolve/mutate", { nodes, edges });
  return data;
}

export async function generateCustomLayer(name, ops) {
  const { data } = await api.post("/custom_layers/generate", { name, ops });
  return data;
}

export async function analyzeWithCopilot(nodes, edges) {
  const { data } = await api.post("/copilot/analyze", { nodes, edges });
  return data;
}

export async function generateArchitectureFromPrompt(prompt) {
  const { data } = await api.post("/copilot/generate_architecture", { prompt });
  return data;
}
