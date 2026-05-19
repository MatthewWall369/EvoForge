export const layerCatalog = [
  {
    group: "Core",
    color: "cyan",
    nodes: [
      { type: "input", label: "Input", config: { shape: [32], dtype: "float32" } },
      { type: "dense", label: "Dense", config: { units: 64, activation: "relu" } },
      { type: "embedding", label: "Embedding", config: { vocab_size: 10000, dim: 128 } },
      { type: "output", label: "Output", config: { units: 10, activation: "softmax" } },
    ],
  },
  {
    group: "Spatial",
    color: "purple",
    nodes: [
      { type: "conv1d", label: "Conv1D", config: { filters: 32, kernel_size: 3, activation: "relu", padding: "same" } },
      { type: "conv2d", label: "Conv2D", config: { filters: 32, kernel_size: [3, 3], activation: "relu", padding: "same" } },
      { type: "flatten", label: "Flatten", config: {} },
    ],
  },
  {
    group: "Routing",
    color: "orange",
    nodes: [
      { type: "residual_add", label: "Residual Add", config: {} },
      { type: "concatenate", label: "Concatenate", config: { axis: -1 } },
      { type: "dropout", label: "Dropout", config: { rate: 0.1 } },
      { type: "layernorm", label: "LayerNorm", config: { epsilon: 0.00001 } },
      { type: "activation", label: "Activation", config: { activation: "gelu" } },
    ],
  },
  {
    group: "Memory",
    color: "green",
    nodes: [
      { type: "custom_layer", label: "Memory Block", config: { class_name: "MemoryLayer", badge: "MEM" }, badge: "MEM" },
      { type: "custom_layer", label: "RAG Block", config: { class_name: "RagFusionLayer", badge: "RAG" }, badge: "RAG" },
    ],
  },
  {
    group: "Experimental",
    color: "magenta",
    nodes: [
      { type: "deltamemory", label: "DeltaMemory", config: { class_name: "DeltaMemoryLayer", badge: "DELTA" }, badge: "DELTA" },
      { type: "fftblock", label: "FFTBlock", config: { class_name: "FFTBlock", badge: "FFT" }, badge: "FFT" },
      { type: "semanticfield", label: "SemanticField", config: { class_name: "SemanticFieldLayer", badge: "SEM" }, badge: "SEM" },
      { type: "reversibleroute", label: "ReversibleRoute", config: { class_name: "ReversibleRouteLayer", badge: "REV" }, badge: "REV" },
      { type: "morablock", label: "MoraBlock", config: { class_name: "MoraBlock", badge: "MORA" }, badge: "MORA" },
      { type: "cumsumfield", label: "CumsumField", config: { class_name: "CumsumFieldLayer", badge: "CSUM" }, badge: "CSUM" },
      { type: "alphaimportance", label: "AlphaImportance", config: { class_name: "AlphaImportanceLayer", badge: "ALPHA" }, badge: "ALPHA" },
      { type: "fourierrouting", label: "FourierRouting", config: { class_name: "FourierRoutingLayer", badge: "FOURIER" }, badge: "FOURIER" },
      { type: "trajectorymemory", label: "TrajectoryMemory", config: { class_name: "TrajectoryMemoryLayer", badge: "TRAJ" }, badge: "TRAJ" },
    ],
  },
];

export const starterNodes = [
  {
    id: "input_1",
    type: "evoNode",
    position: { x: 40, y: 120 },
    data: { label: "Input", layerType: "input", config: { shape: [32], dtype: "float32" } },
  },
  {
    id: "dense_1",
    type: "evoNode",
    position: { x: 330, y: 120 },
    data: { label: "Dense", layerType: "dense", config: { units: 128, activation: "gelu" } },
  },
  {
    id: "output_1",
    type: "evoNode",
    position: { x: 620, y: 120 },
    data: { label: "Output", layerType: "output", config: { units: 10, activation: "softmax" } },
  },
];

export const starterEdges = [
  { id: "input_1-dense_1", source: "input_1", target: "dense_1", animated: true },
  { id: "dense_1-output_1", source: "dense_1", target: "output_1", animated: true },
];
