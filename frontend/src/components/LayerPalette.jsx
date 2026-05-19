import { ChevronsLeft, FlaskConical, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { layerCatalog } from "../data/layerCatalog";
import { architectureTemplates } from "../data/templates";
import { useGraphStore } from "../store/graphStore";

const groupColors = {
  cyan: "hover:border-cyan-300/50 hover:bg-cyan-300/10",
  purple: "hover:border-violet-300/50 hover:bg-violet-300/10",
  orange: "hover:border-orange-300/50 hover:bg-orange-300/10",
  green: "hover:border-emerald-300/50 hover:bg-emerald-300/10",
  magenta: "hover:border-fuchsia-300/50 hover:bg-fuchsia-300/10",
};

export default function LayerPalette({ collapsed = false }) {
  const [query, setQuery] = useState("");
  const applyTemplate = useGraphStore((state) => state.applyTemplate);
  const togglePalette = useGraphStore((state) => state.togglePalette);
  const filteredCatalog = useMemo(
    () =>
      layerCatalog.map((group) => ({
        ...group,
        nodes: group.nodes.filter((node) => `${node.label} ${node.type} ${node.badge || ""}`.toLowerCase().includes(query.toLowerCase())),
      })),
    [query],
  );

  return (
    <aside className={`glass side-panel ${collapsed ? "collapsed" : ""}`}>
      <button className="panel-toggle" onClick={togglePalette} title="Toggle palette"><ChevronsLeft size={15} /></button>
      <div className="panel-rail-label">LAYERS</div>
      <div className="panel-content flex h-full flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-cyan-200">
            <Sparkles size={18} />
            <span className="text-xs uppercase tracking-[0.34em]">EvoForge</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Architecture Lab</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Pick a template or drag layers onto the canvas.</p>
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-slate-400">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search layers..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
        </label>

      <div className="space-y-5 overflow-y-auto pr-1">
        <section>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            <Sparkles size={13} />
            Templates
          </div>
          <div className="grid gap-2">
            {architectureTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="template-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">{template.name}</span>
                  <span className="rounded-full border border-cyan-200/20 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-cyan-100">{template.badge}</span>
                </div>
                <div className="mt-1 text-[11px] leading-4 text-slate-500">{template.description}</div>
              </button>
            ))}
          </div>
        </section>

        {filteredCatalog.map((group) => (
          <section key={group.group} className={group.nodes.length ? "" : "hidden"}>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <FlaskConical size={13} />
              {group.group}
            </div>
            <div className="grid gap-2">
              {group.nodes.map((node) => (
                <button
                  key={node.type}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/evoforge-layer", JSON.stringify(node))}
                  className={`layer-card group hover:shadow-glow ${groupColors[group.color] || groupColors.cyan}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{node.label}</div>
                    {node.badge ? <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em] text-slate-300">{node.badge}</span> : null}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-500">{node.type}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      </div>
    </aside>
  );
}
