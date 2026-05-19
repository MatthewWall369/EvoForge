import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { create } from "zustand";
import { starterEdges, starterNodes } from "../data/layerCatalog";

const storageKey = "evoforge.architecture";

function snapshot(state) {
  return { nodes: state.nodes, edges: state.edges };
}

function pushHistory(state) {
  return [...state.history.slice(-40), snapshot(state)];
}

function autoLayoutNodes(nodes) {
  const columns = 4;
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 80 + (index % columns) * 290,
      y: 110 + Math.floor(index / columns) * 190,
    },
  }));
}

function serializeConfigValue(value) {
  if (typeof value === "string" && value.includes(",")) {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => (Number.isNaN(Number(part)) ? part : Number(part)));
  }
  return value;
}

export const useGraphStore = create((set, get) => ({
  nodes: starterNodes,
  edges: starterEdges,
  selectedNodeId: null,
  analysis: null,
  generatedCode: "",
  logs: ["EvoForge online. Drag layers, connect nodes, and generate Keras code."],
  trainingMetrics: null,
  activeNodes: [],
  activeEdges: [],
  executionMode: "idle",
  propagationSpeedMs: 280,
  isBusy: false,
  copilotBrief: null,
  copilotTab: "copilot",
  genomeLineage: [],
  experimentMemory: [],
  mutationGeneration: 0,
  paletteOpen: true,
  inspectorOpen: true,
  bottomOpen: true,
  history: [],
  future: [],

  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
  toggleBottom: () => set((state) => ({ bottomOpen: !state.bottomOpen })),
  setCopilotTab: (copilotTab) => set({ copilotTab }),
  setCopilotBrief: (copilotBrief) =>
    set((state) => ({
      copilotBrief,
      genomeLineage: copilotBrief?.genome
        ? [
            ...state.genomeLineage.slice(-12),
            {
              id: `${Date.now()}`,
              genome: copilotBrief.genome,
              species: copilotBrief.species,
              parameters: copilotBrief.summary?.parameters || 0,
              flops: copilotBrief.summary?.flops || 0,
            },
          ]
        : state.genomeLineage,
    })),

  onNodesChange: (changes) =>
    set((state) => ({
      history: changes.some((change) => change.type === "remove") ? pushHistory(state) : state.history,
      future: changes.some((change) => change.type === "remove") ? [] : state.future,
      nodes: applyNodeChanges(changes, state.nodes),
    })),
  onEdgesChange: (changes) =>
    set((state) => ({
      history: changes.some((change) => change.type === "remove") ? pushHistory(state) : state.history,
      future: changes.some((change) => change.type === "remove") ? [] : state.future,
      edges: applyEdgeChanges(changes, state.edges),
    })),
  onConnect: (connection) =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      edges: addEdge({ ...connection, animated: true, id: `${connection.source}-${connection.target}-${Date.now()}` }, state.edges),
    })),
  setSelectedNode: (selectedNodeId) => set({ selectedNodeId }),
  setBusy: (isBusy) => set({ isBusy }),
  setAnalysis: (analysis) =>
    set((state) => ({
      analysis,
      copilotBrief: analysis
        ? {
            genome: analysis.genome,
            species: analysis.species,
            suggestions: analysis.copilotSuggestions || [],
            debugExplanations: analysis.debugExplanations || [],
            tensorStats: analysis.tensorStats || {},
            summary: {
              parameters: analysis.totalParameters,
              flops: analysis.totalFlops,
              memoryBytes: analysis.totalMemoryBytes,
              valid: analysis.valid,
            },
          }
        : state.copilotBrief,
      genomeLineage: analysis?.genome
        ? [
            ...state.genomeLineage.slice(-12),
            {
              id: `${Date.now()}`,
              genome: analysis.genome,
              species: analysis.species,
              parameters: analysis.totalParameters,
              flops: analysis.totalFlops,
            },
          ]
        : state.genomeLineage,
      generatedCode: analysis?.code || state.generatedCode,
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          shapeLabel: analysis?.shapeLabels?.[node.id],
          inputShapeLabels: analysis?.inputShapeLabels?.[node.id] || [],
          parameters: analysis?.parameterCounts?.[node.id] || 0,
          rank: analysis?.ranks?.[node.id] || 0,
          status: analysis?.nodeStatus?.[node.id] || "valid",
          flops: analysis?.flops?.[node.id] || 0,
          memoryBytes: analysis?.memoryBytes?.[node.id] || 0,
          memoryLabel: analysis?.nodeSummaries?.[node.id]?.memoryLabel || "0 B",
          hasError: analysis?.nodeStatus?.[node.id] === "error",
          hasWarning: analysis?.nodeStatus?.[node.id] === "warning",
        },
      })),
    })),
  setTrainingMetrics: (trainingMetrics) => set({ trainingMetrics }),
  bookmarkExperiment: (note = "Bookmarked architecture snapshot.") =>
    set((state) => ({
      experimentMemory: [
        ...state.experimentMemory.slice(-20),
        {
          id: `${Date.now()}`,
          note,
          genome: state.copilotBrief?.genome || state.analysis?.genome || "UNKNOWN",
          parameters: state.analysis?.totalParameters || 0,
          flops: state.analysis?.totalFlops || 0,
          createdAt: new Date().toLocaleTimeString(),
        },
      ],
      logs: [...state.logs.slice(-80), note],
    })),
  appendLog: (message) => set((state) => ({ logs: [...state.logs.slice(-80), message] })),
  setActiveNodes: (activeNodes) => set({ activeNodes }),
  setActiveEdges: (activeEdges) => set({ activeEdges }),
  setExecutionMode: (executionMode) => set({ executionMode }),

  animatePropagation: async (orderedNodes = [], label = "Execution") => {
    const { edges, propagationSpeedMs, appendLog } = get();
    set({ executionMode: label.toLowerCase(), activeNodes: [], activeEdges: [] });
    appendLog(`${label} propagation started: ${orderedNodes.length} nodes.`);
    for (const nodeId of orderedNodes) {
      const incoming = edges.filter((edge) => edge.target === nodeId).map((edge) => edge.id);
      set((state) => ({
        activeNodes: [nodeId],
        activeEdges: incoming,
        logs: [...state.logs.slice(-80), `activate ${nodeId}`],
      }));
      await new Promise((resolve) => setTimeout(resolve, propagationSpeedMs));
    }
    set({ activeNodes: [], activeEdges: [], executionMode: "idle" });
    appendLog(`${label} propagation complete.`);
  },

  addLayer: (layer, position) => {
    const id = `${layer.type}_${Date.now()}`;
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: [
        ...state.nodes,
        {
          id,
          type: "evoNode",
          position,
          data: {
            label: layer.label,
            layerType: layer.type,
            config: { ...layer.config },
            badge: layer.badge || layer.config?.badge,
          },
        },
      ],
      selectedNodeId: id,
    }));
  },

  updateNodeConfig: (nodeId, key, value) =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: { ...node.data.config, [key]: serializeConfigValue(value) },
              },
            }
          : node,
      ),
    })),

  saveGraph: () => {
    const { nodes, edges } = get();
    localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }));
    set((state) => ({ logs: [...state.logs, "Architecture saved to local browser storage."] }));
  },

  loadGraph: () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      set((state) => ({ logs: [...state.logs, "No saved architecture found."] }));
      return;
    }
    const parsed = JSON.parse(raw);
    set((state) => ({ history: pushHistory(state), future: [], nodes: parsed.nodes || [], edges: parsed.edges || [], selectedNodeId: null }));
  },

  applyTemplate: (template) =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: template.nodes,
      edges: template.edges,
      selectedNodeId: null,
      analysis: null,
      trainingMetrics: null,
      activeNodes: [],
      activeEdges: [],
      logs: [...state.logs.slice(-80), `Loaded ${template.name} template.`],
    })),

  replaceGraph: (nodes, edges, message = "Graph updated.") =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes,
      edges,
      selectedNodeId: null,
      analysis: null,
      activeNodes: [],
      activeEdges: [],
      logs: [...state.logs.slice(-80), message],
    })),

  applyGeneratedArchitecture: (payload) =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: payload.nodes || [],
      edges: payload.edges || [],
      selectedNodeId: null,
      analysis: null,
      copilotBrief: payload.brief || state.copilotBrief,
      mutationGeneration: state.mutationGeneration + 1,
      logs: [...state.logs.slice(-80), payload.explanation || "AI generated an architecture."],
    })),

  recordMutation: (message) =>
    set((state) => ({
      mutationGeneration: state.mutationGeneration + 1,
      experimentMemory: [
        ...state.experimentMemory.slice(-20),
        {
          id: `${Date.now()}`,
          note: message,
          genome: state.copilotBrief?.genome || "MUTANT",
          parameters: state.analysis?.totalParameters || 0,
          flops: state.analysis?.totalFlops || 0,
          createdAt: new Date().toLocaleTimeString(),
        },
      ],
    })),

  autoLayout: () =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: autoLayoutNodes(state.nodes),
      logs: [...state.logs.slice(-80), "Auto layout applied."],
    })),

  undo: () =>
    set((state) => {
      const previous = state.history.at(-1);
      if (!previous) {
        return { logs: [...state.logs.slice(-80), "Nothing to undo."] };
      }
      return {
        nodes: previous.nodes,
        edges: previous.edges,
        history: state.history.slice(0, -1),
        future: [snapshot(state), ...state.future.slice(0, 40)],
        selectedNodeId: null,
        logs: [...state.logs.slice(-80), "Undo applied."],
      };
    }),

  redo: () =>
    set((state) => {
      const next = state.future[0];
      if (!next) {
        return { logs: [...state.logs.slice(-80), "Nothing to redo."] };
      }
      return {
        nodes: next.nodes,
        edges: next.edges,
        history: pushHistory(state),
        future: state.future.slice(1),
        selectedNodeId: null,
        logs: [...state.logs.slice(-80), "Redo applied."],
      };
    }),

  resetGraph: () =>
    set((state) => ({
      history: pushHistory(state),
      future: [],
      nodes: starterNodes,
      edges: starterEdges,
      selectedNodeId: null,
      analysis: null,
      generatedCode: "",
      trainingMetrics: null,
      activeNodes: [],
      activeEdges: [],
      executionMode: "idle",
    })),
}));
