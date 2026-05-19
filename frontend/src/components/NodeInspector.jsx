import { ChevronsRight, Info, SlidersHorizontal } from "lucide-react";
import CustomOpBuilder from "./CustomOpBuilder";
import ResearchCopilot from "./ResearchCopilot";
import TensorMRI from "./TensorMRI";
import { useGraphStore } from "../store/graphStore";

const emptyTensorStats = {};

function renderValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return value ?? "";
}

export default function NodeInspector({ collapsed = false }) {
  const nodes = useGraphStore((state) => state.nodes);
  const selectedNodeId = useGraphStore((state) => state.selectedNodeId);
  const updateNodeConfig = useGraphStore((state) => state.updateNodeConfig);
  const toggleInspector = useGraphStore((state) => state.toggleInspector);
  const copilotTab = useGraphStore((state) => state.copilotTab);
  const setCopilotTab = useGraphStore((state) => state.setCopilotTab);
  const tensorStats = useGraphStore((state) => state.copilotBrief?.tensorStats || state.analysis?.tensorStats || emptyTensorStats);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedStats = selectedNode ? tensorStats[selectedNode.id] : null;

  return (
    <aside className={`glass side-panel ${collapsed ? "collapsed" : ""}`}>
      <button className="panel-toggle" onClick={toggleInspector} title="Toggle inspector"><ChevronsRight size={15} /></button>
      <div className="panel-rail-label">INSPECTOR</div>
      <div className="panel-content flex h-full flex-col">
        <div className="flex items-center gap-2 text-cyan-200">
          <SlidersHorizontal size={18} />
          <span className="text-xs uppercase tracking-[0.3em]">Research Console</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-950/60 p-1">
          <button onClick={() => setCopilotTab("inspect")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${copilotTab === "inspect" ? "bg-cyan-300/20 text-cyan-100" : "text-slate-400"}`}>Inspect</button>
          <button onClick={() => setCopilotTab("copilot")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${copilotTab === "copilot" ? "bg-violet-300/20 text-violet-100" : "text-slate-400"}`}>Copilot</button>
        </div>

      {copilotTab === "copilot" ? (
        <div className="mt-4 min-h-0 overflow-y-auto pr-1">
          <ResearchCopilot />
        </div>
      ) : !selectedNode ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm leading-6 text-slate-400">
            <div className="mb-3 flex items-center gap-2 font-semibold text-cyan-100"><Info size={16} /> No node selected</div>
            Select a node to tune dimensions, activations, dropout rates, convolution kernels, and output heads.
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-4 text-xs leading-5 text-slate-400">
            Shortcuts: drag layers from the left, connect handles, press Delete to remove selected items, use Auto Layout when graphs get messy.
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-5 overflow-y-auto">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{selectedNode.data.layerType}</div>
            <div className="mt-1 text-xl font-bold text-white">{selectedNode.data.label}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="rounded-xl bg-slate-950/60 p-2">
                <span className="block text-slate-500">Shape</span>
                <span className="font-mono text-cyan-100">{selectedNode.data.shapeLabel || "pending"}</span>
              </div>
              <div className="rounded-xl bg-slate-950/60 p-2">
                <span className="block text-slate-500">Params</span>
                <span className="font-mono text-violet-100">{selectedNode.data.parameters || 0}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(selectedNode.data.config || {}).map(([key, value]) => (
              <label key={key} className="block">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{key}</span>
                {key === "activation" ? (
                  <select value={renderValue(value)} onChange={(event) => updateNodeConfig(selectedNode.id, key, event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-sm text-white outline-none transition focus:border-cyan-300/70">
                    {["relu", "gelu", "tanh", "sigmoid", "softmax", "linear"].map((activation) => (
                      <option key={activation} value={activation}>{activation}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={typeof value === "number" ? "number" : "text"}
                    value={renderValue(value)}
                    onChange={(event) => updateNodeConfig(selectedNode.id, key, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-sm text-white outline-none transition focus:border-cyan-300/70"
                  />
                )}
              </label>
            ))}
          </div>
          <TensorMRI node={selectedNode} stats={selectedStats} />
          {selectedNode.data.layerType === "custom_layer" ? <CustomOpBuilder compact /> : null}
        </div>
      )}
      </div>
    </aside>
  );
}
