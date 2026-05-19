import { Activity, AlertTriangle, ChevronDown, ChevronUp, Clipboard, Code2, Download, TerminalSquare } from "lucide-react";
import ResearchMemory from "./ResearchMemory";
import { useGraphStore } from "../store/graphStore";

function metricSeries(metrics) {
  if (!metrics) {
    return [];
  }
  return Object.entries(metrics).map(([name, values]) => ({ name, values }));
}

export default function BottomPanel() {
  const analysis = useGraphStore((state) => state.analysis);
  const code = useGraphStore((state) => state.generatedCode);
  const logs = useGraphStore((state) => state.logs);
  const trainingMetrics = useGraphStore((state) => state.trainingMetrics);
  const bottomOpen = useGraphStore((state) => state.bottomOpen);
  const toggleBottom = useGraphStore((state) => state.toggleBottom);
  const series = metricSeries(trainingMetrics);

  async function copyCode() {
    if (code) {
      await navigator.clipboard.writeText(code);
    }
  }

  function exportText(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportNotebook() {
    const notebook = {
      cells: [
        { cell_type: "markdown", metadata: {}, source: ["# EvoForge Generated Model\n"] },
        { cell_type: "code", execution_count: null, metadata: {}, outputs: [], source: code.split("\n").map((line) => `${line}\n`) },
      ],
      metadata: { kernelspec: { display_name: "Python 3", language: "python", name: "python3" } },
      nbformat: 4,
      nbformat_minor: 5,
    };
    exportText("evoforge_model.ipynb", JSON.stringify(notebook, null, 2), "application/json");
  }

  return (
    <section className={`glass bottom-panel rounded-3xl p-4 ${bottomOpen ? "" : "collapsed"}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.28em] text-cyan-200">Mission Control</div>
        <button onClick={toggleBottom} className="toolbar-button">{bottomOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />} {bottomOpen ? "Collapse" : "Open"}</button>
      </div>
      <div className="bottom-content grid h-[calc(100%-2.25rem)] grid-cols-4 gap-4">
      <div className="flex min-w-0 flex-col">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs uppercase tracking-[0.24em] text-cyan-200">
          <span className="flex items-center gap-2"><Code2 size={15} /> Live Keras</span>
          <span className="flex gap-1 tracking-normal">
            <button onClick={copyCode} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-cyan-100" title="Copy code"><Clipboard size={13} /></button>
            <button onClick={() => exportText("evoforge_model.py", code || "")} className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 hover:text-cyan-100" title="Export Python"><Download size={13} /></button>
            <button onClick={exportNotebook} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300 hover:text-cyan-100">ipynb</button>
          </span>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto rounded-2xl bg-slate-950/80 p-3 text-xs leading-5 text-slate-300">{code || "# Click Generate to synthesize TensorFlow/Keras code."}</pre>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-violet-200">
          <Activity size={15} /> Metrics
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-2xl bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">Total Parameters</div>
            <div className="mt-1 font-mono text-lg text-white">{analysis?.totalParameters ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">Graph Status</div>
            <div className={`mt-1 text-sm font-semibold ${analysis?.valid ? "text-emerald-300" : "text-amber-300"}`}>{analysis ? (analysis.valid ? "Valid" : "Needs work") : "Pending"}</div>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">FLOPs</div>
            <div className="mt-1 font-mono text-lg text-violet-100">{analysis?.totalFlops ?? 0}</div>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-3">
            <div className="text-xs text-slate-500">VRAM Est.</div>
            <div className="mt-1 font-mono text-lg text-emerald-100">{analysis?.totalMemoryBytes ? `${(analysis.totalMemoryBytes / 1024).toFixed(1)} KB` : "0 KB"}</div>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-2xl bg-slate-950/70 p-3">
          {series.length === 0 ? (
            <div className="text-sm text-slate-500">Training loss and accuracy curves appear here after Train.</div>
          ) : (
            series.map((item) => (
              <div key={item.name} className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{item.name}</span>
                  <span>{item.values.at(-1)?.toFixed(4)}</span>
                </div>
                <div className="flex h-12 items-end gap-1">
                  {item.values.map((value, index) => (
                    <div key={`${item.name}-${index}`} className="w-5 rounded-t bg-gradient-to-t from-violet-500 to-cyan-300" style={{ height: `${Math.max(8, Math.min(48, value * 48))}px` }} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-amber-200">
          <TerminalSquare size={15} /> Console
        </div>
        <div className="mb-3 min-h-0 flex-1 overflow-auto rounded-2xl bg-slate-950/80 p-3 font-mono text-xs leading-5 text-slate-300">
          {logs.map((line, index) => (
            <div key={`${line}-${index}`}>{">"} {line}</div>
          ))}
        </div>
        {(analysis?.warnings?.length || analysis?.errors?.length) ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100">
            <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> Graph warnings</div>
            {[...(analysis.errors || []), ...(analysis.warnings || [])].map((message) => (
              <div key={message}>{message}</div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        <ResearchMemory />
      </div>
      </div>
    </section>
  );
}
