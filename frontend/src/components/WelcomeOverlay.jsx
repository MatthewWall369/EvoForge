import { Sparkles } from "lucide-react";
import { architectureTemplates } from "../data/templates";
import { useGraphStore } from "../store/graphStore";

export default function WelcomeOverlay() {
  const nodes = useGraphStore((state) => state.nodes);
  const analysis = useGraphStore((state) => state.analysis);
  const applyTemplate = useGraphStore((state) => state.applyTemplate);

  if (nodes.length > 3 || analysis) {
    return null;
  }

  return (
    <div className="empty-state glass">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
        <Sparkles size={22} />
      </div>
      <h2 className="text-2xl font-black text-white">Start sculpting a neural system</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Choose a quick-start template, drag layers from the palette, or connect the starter graph and press Forward to watch tensors propagate.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {architectureTemplates.slice(0, 4).map((template) => (
          <button key={template.id} onClick={() => applyTemplate(template)} className="template-card">
            <div className="text-sm font-bold text-white">{template.name}</div>
            <div className="mt-1 text-[10px] font-bold tracking-[0.16em] text-cyan-100">{template.badge}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
