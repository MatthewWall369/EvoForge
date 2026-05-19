import { BrainCircuit, FlaskConical, Lightbulb, WandSparkles } from "lucide-react";
import { useState } from "react";
import { analyzeWithCopilot, generateArchitectureFromPrompt, mutateArchitecture } from "../api/client";
import { useGraphStore } from "../store/graphStore";

export default function ResearchCopilot() {
  const [prompt, setPrompt] = useState("Create a lightweight byte-level language model using cumulative memory instead of attention.");
  const [isThinking, setIsThinking] = useState(false);
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const brief = useGraphStore((state) => state.copilotBrief);
  const setCopilotBrief = useGraphStore((state) => state.setCopilotBrief);
  const applyGeneratedArchitecture = useGraphStore((state) => state.applyGeneratedArchitecture);
  const replaceGraph = useGraphStore((state) => state.replaceGraph);
  const animatePropagation = useGraphStore((state) => state.animatePropagation);
  const appendLog = useGraphStore((state) => state.appendLog);
  const recordMutation = useGraphStore((state) => state.recordMutation);

  async function refresh() {
    setIsThinking(true);
    try {
      const result = await analyzeWithCopilot(nodes, edges);
      setCopilotBrief(result);
      appendLog(`Copilot analyzed ${result.species}: ${result.genome}`);
    } catch (error) {
      appendLog(`Copilot analysis failed: ${error.message}`);
    } finally {
      setIsThinking(false);
    }
  }

  async function generateFromPrompt() {
    setIsThinking(true);
    try {
      const result = await generateArchitectureFromPrompt(prompt);
      applyGeneratedArchitecture(result);
      await animatePropagation((result.nodes || []).map((node) => node.id), "AI Genesis");
    } catch (error) {
      appendLog(`Prompt generation failed: ${error.message}`);
    } finally {
      setIsThinking(false);
    }
  }

  async function mutate() {
    setIsThinking(true);
    try {
      const result = await mutateArchitecture(nodes, edges);
      replaceGraph(result.nodes || nodes, result.edges || edges, `Copilot mutation applied: ${result.mutation}`);
      recordMutation(`Copilot mutation: ${result.mutation}`);
      await animatePropagation((result.nodes || nodes).map((node) => node.id), "Mutation");
    } catch (error) {
      appendLog(`Mutation failed: ${error.message}`);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-cyan-100">
          <BrainCircuit size={15} /> AI Research Copilot
        </div>
        <div className="text-xs leading-5 text-slate-400">
          Genome <span className="font-mono text-cyan-100">{brief?.genome || "analyzing..."}</span>
          <br />
          Species <span className="text-violet-100">{brief?.species || "unknown organism"}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Generate architecture from prompt</label>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-2 h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 p-3 text-sm leading-5 text-white outline-none focus:border-cyan-300/60" />
        <div className="mt-2 flex gap-2">
          <button onClick={generateFromPrompt} disabled={isThinking} className="toolbar-button-primary flex-1 justify-center"><WandSparkles size={14} /> Create</button>
          <button onClick={refresh} disabled={isThinking} className="toolbar-button flex-1 justify-center"><FlaskConical size={14} /> Analyze</button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
          <Lightbulb size={14} /> Suggestions
        </div>
        <div className="space-y-2">
          {(brief?.suggestions || []).map((suggestion, index) => (
            <div key={`${suggestion.title}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
              <div className="text-sm font-semibold text-white">{suggestion.title}</div>
              <div className="mt-1 text-xs leading-5 text-slate-400">{suggestion.detail}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={refresh} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-cyan-100">Explain</button>
                <button onClick={mutate} className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-1 text-[11px] text-fuchsia-100">Mutate</button>
              </div>
            </div>
          ))}
          {!brief?.suggestions?.length ? <div className="text-xs leading-5 text-slate-500">Run Analyze or change the graph to wake the copilot.</div> : null}
        </div>
      </div>
    </div>
  );
}
