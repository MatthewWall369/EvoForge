const makeNode = (id, layerType, label, x, y, config = {}, extra = {}) => ({
  id,
  type: "evoNode",
  position: { x, y },
  data: { label, layerType, config, ...extra },
});

const makeEdge = (source, target) => ({ id: `${source}-${target}`, source, target, animated: true });

export const architectureTemplates = [
  {
    id: "transformer",
    name: "Transformer",
    badge: "CAUSAL",
    description: "Token embedding, normalization, dense mixer, residual route.",
    nodes: [
      makeNode("input_tokens", "input", "Token Input", 40, 120, { shape: [128], dtype: "int32" }),
      makeNode("tok_embed", "embedding", "Token Embedding", 300, 120, { vocab_size: 32000, dim: 256 }, { badge: "MEM" }),
      makeNode("ln_1", "layernorm", "Pre Norm", 560, 120, { epsilon: 0.00001 }),
      makeNode("ff_1", "dense", "Feed Forward", 820, 120, { units: 512, activation: "gelu" }),
      makeNode("ff_2", "dense", "Projection", 1080, 120, { units: 256, activation: "linear" }),
      makeNode("out", "output", "LM Head", 1340, 120, { units: 32000, activation: "softmax" }, { badge: "CAUSAL" }),
    ],
    edges: [makeEdge("input_tokens", "tok_embed"), makeEdge("tok_embed", "ln_1"), makeEdge("ln_1", "ff_1"), makeEdge("ff_1", "ff_2"), makeEdge("ff_2", "out")],
  },
  {
    id: "cnn",
    name: "CNN",
    badge: "VISION",
    description: "Image input through convolution, flatten, dense classifier.",
    nodes: [
      makeNode("image", "input", "Image Input", 40, 150, { shape: [28, 28, 1], dtype: "float32" }),
      makeNode("conv_a", "conv2d", "Conv Stem", 300, 150, { filters: 32, kernel_size: [3, 3], activation: "relu", padding: "same" }),
      makeNode("conv_b", "conv2d", "Conv Block", 560, 150, { filters: 64, kernel_size: [3, 3], activation: "relu", padding: "same" }),
      makeNode("flat", "flatten", "Flatten", 820, 150, {}),
      makeNode("head", "output", "Classifier", 1080, 150, { units: 10, activation: "softmax" }),
    ],
    edges: [makeEdge("image", "conv_a"), makeEdge("conv_a", "conv_b"), makeEdge("conv_b", "flat"), makeEdge("flat", "head")],
  },
  {
    id: "autoencoder",
    name: "Autoencoder",
    badge: "REV",
    description: "Dense encoder bottleneck and reconstruction head.",
    nodes: [
      makeNode("input_vec", "input", "Vector Input", 40, 120, { shape: [128], dtype: "float32" }),
      makeNode("enc", "dense", "Encoder", 300, 120, { units: 64, activation: "gelu" }),
      makeNode("latent", "dense", "Latent", 560, 120, { units: 16, activation: "linear" }, { badge: "REV" }),
      makeNode("dec", "dense", "Decoder", 820, 120, { units: 64, activation: "gelu" }),
      makeNode("recon", "output", "Reconstruction", 1080, 120, { units: 128, activation: "linear" }),
    ],
    edges: [makeEdge("input_vec", "enc"), makeEdge("enc", "latent"), makeEdge("latent", "dec"), makeEdge("dec", "recon")],
  },
  {
    id: "tinylm",
    name: "Tiny Language Model",
    badge: "MEM",
    description: "Small byte/token model for synthetic or TinyShakespeare experiments.",
    nodes: [
      makeNode("tokens", "input", "Tokens", 40, 130, { shape: [64], dtype: "int32" }),
      makeNode("embed", "embedding", "Byte Embedding", 300, 130, { vocab_size: 256, dim: 96 }, { badge: "MEM" }),
      makeNode("mix", "dense", "Token Mixer", 560, 130, { units: 192, activation: "gelu" }),
      makeNode("norm", "layernorm", "Norm", 820, 130, { epsilon: 0.00001 }),
      makeNode("logits", "output", "Byte Head", 1080, 130, { units: 256, activation: "softmax" }),
    ],
    edges: [makeEdge("tokens", "embed"), makeEdge("embed", "mix"), makeEdge("mix", "norm"), makeEdge("norm", "logits")],
  },
  {
    id: "mora",
    name: "Mora",
    badge: "DELTA",
    description: "Experimental dense memory-style block with routing hooks.",
    nodes: [
      makeNode("mora_in", "input", "Mora Input", 40, 110, { shape: [256], dtype: "float32" }),
      makeNode("delta", "dense", "Delta Projection", 300, 110, { units: 256, activation: "gelu" }, { badge: "DELTA" }),
      makeNode("memory", "custom_layer", "Memory Op", 560, 110, { class_name: "MoraMemoryLayer", badge: "MEM" }, { badge: "MEM" }),
      makeNode("route", "activation", "Route Gate", 820, 110, { activation: "sigmoid" }, { badge: "ROUTE" }),
      makeNode("mora_out", "output", "Mora Output", 1080, 110, { units: 64, activation: "linear" }),
    ],
    edges: [makeEdge("mora_in", "delta"), makeEdge("delta", "memory"), makeEdge("memory", "route"), makeEdge("route", "mora_out")],
  },
  {
    id: "rag",
    name: "RAG Pipeline",
    badge: "RAG",
    description: "Retriever-like embedding and fusion graph placeholder.",
    nodes: [
      makeNode("query", "input", "Query Tokens", 40, 80, { shape: [96], dtype: "int32" }),
      makeNode("context", "input", "Context Tokens", 40, 220, { shape: [96], dtype: "int32" }),
      makeNode("query_embed", "embedding", "Query Embed", 300, 80, { vocab_size: 32000, dim: 128 }),
      makeNode("ctx_embed", "embedding", "Context Embed", 300, 220, { vocab_size: 32000, dim: 128 }),
      makeNode("fusion", "concatenate", "Fusion", 580, 150, { axis: -1 }, { badge: "RAG" }),
      makeNode("answer", "output", "Answer Head", 860, 150, { units: 32000, activation: "softmax" }),
    ],
    edges: [makeEdge("query", "query_embed"), makeEdge("context", "ctx_embed"), makeEdge("query_embed", "fusion"), makeEdge("ctx_embed", "fusion"), makeEdge("fusion", "answer")],
  },
];
