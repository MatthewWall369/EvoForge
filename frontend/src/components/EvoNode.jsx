import { Handle, Position } from "@xyflow/react";
import { Atom, Cpu, Layers, MemoryStick, Route } from "lucide-react";

const categoryStyles = {
  input: "from-cyan-400/30 to-sky-500/10 text-cyan-100 border-cyan-300/30",
  dense: "from-cyan-400/24 to-blue-500/10 text-cyan-100 border-cyan-300/30",
  embedding: "from-emerald-400/24 to-cyan-500/10 text-emerald-100 border-emerald-300/30",
  conv1d: "from-violet-400/28 to-fuchsia-500/10 text-violet-100 border-violet-300/30",
  conv2d: "from-violet-400/28 to-fuchsia-500/10 text-violet-100 border-violet-300/30",
  residual_add: "from-orange-400/28 to-amber-500/10 text-orange-100 border-orange-300/30",
  concatenate: "from-orange-400/28 to-amber-500/10 text-orange-100 border-orange-300/30",
  custom_layer: "from-fuchsia-400/30 to-pink-500/10 text-fuchsia-100 border-fuchsia-300/30",
};

function iconFor(layerType) {
  if (layerType === "input") return <Layers size={16} />;
  if (layerType === "custom_layer" || layerType === "embedding") return <MemoryStick size={16} />;
  if (layerType === "residual_add" || layerType === "concatenate") return <Route size={16} />;
  if (layerType === "activation") return <Atom size={16} />;
  return <Cpu size={16} />;
}

export default function EvoNode({ data, selected }) {
  const statusAccent = data.hasError
    ? "border-rose-400/80 shadow-[0_0_34px_rgba(244,63,94,0.34)]"
    : data.hasWarning
      ? "border-amber-300/80 shadow-[0_0_30px_rgba(251,191,36,0.26)]"
      : selected
        ? "border-cyan-300/80 shadow-[0_0_34px_rgba(34,211,238,0.34)]"
        : "border-slate-500/20";
  const category = categoryStyles[data.layerType] || "from-slate-400/20 to-slate-700/20 text-slate-100 border-slate-300/20";
  const statusLabel = data.hasError ? "INVALID" : data.hasWarning ? "WARN" : "VALID";

  return (
    <div className={`neural-node min-w-56 rounded-2xl border bg-slate-950/86 p-3 text-white shadow-2xl ${statusAccent}`}>
      {data.layerType !== "input" && <Handle className="!h-3 !w-3 !border-cyan-200 !bg-cyan-400" type="target" position={Position.Left} />}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/70">{data.layerType}</div>
          <div className="mt-1 text-sm font-semibold">{data.label}</div>
        </div>
        <div className={`rounded-xl border bg-gradient-to-br p-2 ${category}`}>
          {iconFor(data.layerType)}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-bold tracking-[0.16em]">
        <span className={`rounded-full border px-2 py-0.5 ${category}`}>{statusLabel}</span>
        {data.badge ? <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-2 py-0.5 text-fuchsia-100">{data.badge}</span> : null}
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-slate-300">RANK {data.rank ?? 0}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
        <div className="rounded-lg bg-white/5 px-2 py-1">
          <span className="block text-slate-500">output</span>
          <span className="font-mono text-cyan-100">{data.shapeLabel || "pending"}</span>
        </div>
        <div className="rounded-lg bg-white/5 px-2 py-1">
          <span className="block text-slate-500">params</span>
          <span className="font-mono text-violet-100">{data.parameters || 0}</span>
        </div>
        <div className="node-detail rounded-lg bg-white/5 px-2 py-1">
          <span className="block text-slate-500">input</span>
          <span className="font-mono text-slate-200">{data.inputShapeLabels?.[0] || "source"}</span>
        </div>
        <div className="node-detail rounded-lg bg-white/5 px-2 py-1">
          <span className="block text-slate-500">memory</span>
          <span className="font-mono text-emerald-100">{data.memoryLabel || "0 B"}</span>
        </div>
      </div>
      <div className="tensor-indicator mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300" />
      </div>
      {data.layerType !== "output" && <Handle className="!h-3 !w-3 !border-violet-200 !bg-violet-400" type="source" position={Position.Right} />}
    </div>
  );
}
