import { useEffect, useRef } from "react";
import { generateModel } from "../api/client";
import { useGraphStore } from "../store/graphStore";

export default function LiveGraphAnalyzer() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setAnalysis = useGraphStore((state) => state.setAnalysis);
  const appendLog = useGraphStore((state) => state.appendLog);
  const lastSignature = useRef("");

  useEffect(() => {
    const signature = JSON.stringify({
      nodes: nodes.map((node) => ({ id: node.id, data: node.data, position: node.position })),
      edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
    });
    if (signature === lastSignature.current) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const result = await generateModel(nodes, edges, { signal: controller.signal });
        lastSignature.current = signature;
        setAnalysis(result);
      } catch (error) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          appendLog(`Live analysis paused: ${error.message}`);
        }
      }
    }, 420);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [appendLog, edges, nodes, setAnalysis]);

  return null;
}
