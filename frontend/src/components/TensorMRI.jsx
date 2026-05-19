import { Activity, ScanLine } from "lucide-react";

function bar(value, color = "from-cyan-400 to-violet-400") {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${Math.max(4, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export default function TensorMRI({ node, stats }) {
  if (!node) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">
        <ScanLine size={14} /> Tensor MRI
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-slate-950/70 p-2">
          <span className="block text-slate-500">Rank</span>
          <span className="font-mono text-white">{stats?.rank ?? node.data.rank ?? 0}</span>
        </div>
        <div className="rounded-xl bg-slate-950/70 p-2">
          <span className="block text-slate-500">FLOPs</span>
          <span className="font-mono text-violet-100">{node.data.flops || 0}</span>
        </div>
        <div className="rounded-xl bg-slate-950/70 p-2">
          <span className="block text-slate-500">Mean</span>
          <span className="font-mono text-cyan-100">{stats?.mean ?? "?"}</span>
        </div>
        <div className="rounded-xl bg-slate-950/70 p-2">
          <span className="block text-slate-500">Std</span>
          <span className="font-mono text-cyan-100">{stats?.std ?? "?"}</span>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-xs text-slate-400">
        <div>
          <div className="mb-1 flex justify-between"><span>Entropy</span><span>{stats?.entropy ?? 0}</span></div>
          {bar(stats?.entropy || 0)}
        </div>
        <div>
          <div className="mb-1 flex justify-between"><span>Sparsity</span><span>{stats?.sparsity ?? 0}</span></div>
          {bar(stats?.sparsity || 0, "from-amber-400 to-rose-400")}
        </div>
        <div>
          <div className="mb-1 flex justify-between"><span>Activation intensity</span><span>{stats?.activationIntensity ?? 0}</span></div>
          {bar(stats?.activationIntensity || 0, "from-emerald-400 to-cyan-400")}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-950/70 p-2 text-xs text-slate-400">
        <Activity size={13} />
        {stats?.summary || "Activation profile will appear after live analysis."}
      </div>
    </div>
  );
}
