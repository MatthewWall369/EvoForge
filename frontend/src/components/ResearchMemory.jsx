import { Dna, GitBranch, Star } from "lucide-react";
import { useGraphStore } from "../store/graphStore";

export default function ResearchMemory() {
  const lineage = useGraphStore((state) => state.genomeLineage);
  const experiments = useGraphStore((state) => state.experimentMemory);
  const generation = useGraphStore((state) => state.mutationGeneration);
  const bookmarkExperiment = useGraphStore((state) => state.bookmarkExperiment);
  const brief = useGraphStore((state) => state.copilotBrief);

  return (
    <div className="grid h-full grid-rows-3 gap-3">
      <div className="rounded-2xl bg-slate-950/70 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-100"><Dna size={14} /> Neural Genome</div>
        <div className="font-mono text-sm text-white">{brief?.genome || "UNKNOWN"}</div>
        <div className="mt-2 text-xs text-slate-400">Species: <span className="text-violet-100">{brief?.species || "unclassified"}</span></div>
        <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-2 text-xs text-cyan-100">Generation {generation}</div>
      </div>
      <div className="min-h-0 rounded-2xl bg-slate-950/70 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-violet-100"><GitBranch size={14} /> Lineage</div>
        <div className="max-h-32 space-y-2 overflow-auto">
          {lineage.slice().reverse().map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-xs">
              <div className="font-mono text-slate-200">{item.genome}</div>
              <div className="mt-1 text-slate-500">{item.species} | params {item.parameters}</div>
            </div>
          ))}
          {!lineage.length ? <div className="text-xs text-slate-500">Analyze a graph to create lineage.</div> : null}
        </div>
      </div>
      <div className="min-h-0 rounded-2xl bg-slate-950/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-amber-100">
          <span className="flex items-center gap-2"><Star size={14} /> Research Memory</span>
          <button onClick={() => bookmarkExperiment("Bookmarked architecture discovery.")} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] tracking-normal text-amber-100">Save</button>
        </div>
        <div className="max-h-32 space-y-2 overflow-auto">
          {experiments.slice().reverse().map((item) => (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-xs">
              <div className="text-slate-200">{item.note}</div>
              <div className="mt-1 font-mono text-slate-500">{item.createdAt} | {item.genome}</div>
            </div>
          ))}
          {!experiments.length ? <div className="text-xs text-slate-500">Bookmarks, mutations, and runs appear here.</div> : null}
        </div>
      </div>
    </div>
  );
}
