import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useRef } from "react";
import EvoNode from "./EvoNode";
import WelcomeOverlay from "./WelcomeOverlay";
import { useGraphStore } from "../store/graphStore";

export default function BuilderCanvas() {
  const wrapperRef = useRef(null);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const onNodesChange = useGraphStore((state) => state.onNodesChange);
  const onEdgesChange = useGraphStore((state) => state.onEdgesChange);
  const onConnect = useGraphStore((state) => state.onConnect);
  const addLayer = useGraphStore((state) => state.addLayer);
  const setSelectedNode = useGraphStore((state) => state.setSelectedNode);
  const activeNodes = useGraphStore((state) => state.activeNodes);
  const activeEdges = useGraphStore((state) => state.activeEdges);
  const autoLayout = useGraphStore((state) => state.autoLayout);
  const nodeTypes = useMemo(() => ({ evoNode: EvoNode }), []);
  const flowRef = useRef(null);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        className: activeNodes.includes(node.id) ? "animate-pulse" : "",
      })),
    [activeNodes, nodes],
  );

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        animated: edge.animated || activeEdges.includes(edge.id),
        className: activeEdges.includes(edge.id) ? "tensor-edge-active" : "",
      })),
    [activeEdges, edges],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/evoforge-layer");
      if (!raw || !wrapperRef.current) {
        return;
      }
      const bounds = wrapperRef.current.getBoundingClientRect();
      const layer = JSON.parse(raw);
      addLayer(layer, {
        x: event.clientX - bounds.left - 120,
        y: event.clientY - bounds.top - 80,
      });
    },
    [addLayer],
  );

  return (
    <main ref={wrapperRef} className="canvas-shell" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <button className="toolbar-button" onClick={() => flowRef.current?.fitView({ padding: 0.2, duration: 450 })}>Fit View</button>
        <button className="toolbar-button" onClick={autoLayout}>Auto Layout</button>
      </div>
      <WelcomeOverlay />
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node.id)}
        onPaneClick={() => setSelectedNode(null)}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        fitView
      >
        <Background color="#334155" gap={24} size={1.4} />
        <MiniMap className="!bg-slate-950/80" nodeColor={() => "#22d3ee"} maskColor="rgba(2, 6, 23, 0.66)" />
        <Controls />
      </ReactFlow>
    </main>
  );
}
