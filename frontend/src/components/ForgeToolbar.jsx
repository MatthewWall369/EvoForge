import { Bot, Braces, ChevronDown, ChevronLeft, ChevronRight, PanelBottom, Play, Redo2, RotateCcw, Save, Sidebar, Undo2, Upload, WandSparkles } from "lucide-react";
import { forwardPass, generateModel, mutateArchitecture, trainModel } from "../api/client";
import { useGraphStore } from "../store/graphStore";

export default function ForgeToolbar() {
  const nodes = useGraphStore((state) => state.nodes);
  const edges = useGraphStore((state) => state.edges);
  const setAnalysis = useGraphStore((state) => state.setAnalysis);
  const appendLog = useGraphStore((state) => state.appendLog);
  const setTrainingMetrics = useGraphStore((state) => state.setTrainingMetrics);
  const animatePropagation = useGraphStore((state) => state.animatePropagation);
  const setBusy = useGraphStore((state) => state.setBusy);
  const isBusy = useGraphStore((state) => state.isBusy);
  const saveGraph = useGraphStore((state) => state.saveGraph);
  const loadGraph = useGraphStore((state) => state.loadGraph);
  const resetGraph = useGraphStore((state) => state.resetGraph);
  const replaceGraph = useGraphStore((state) => state.replaceGraph);
  const recordMutation = useGraphStore((state) => state.recordMutation);
  const analysis = useGraphStore((state) => state.analysis);
  const togglePalette = useGraphStore((state) => state.togglePalette);
  const toggleInspector = useGraphStore((state) => state.toggleInspector);
  const toggleBottom = useGraphStore((state) => state.toggleBottom);
  const paletteOpen = useGraphStore((state) => state.paletteOpen);
  const inspectorOpen = useGraphStore((state) => state.inspectorOpen);
  const bottomOpen = useGraphStore((state) => state.bottomOpen);
  const autoLayout = useGraphStore((state) => state.autoLayout);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);

  async function withBusy(label, action) {
    setBusy(true);
    appendLog(label);
    try {
      await action();
    } catch (error) {
      appendLog(error.response?.data?.error || error.response?.data?.errors?.join(" ") || error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="topbar glass">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200">Visual Neural Forge</div>
        <div className="text-sm text-slate-400">
          {analysis ? (
            <span className={analysis.valid ? "text-emerald-300" : "text-amber-300"}>{analysis.valid ? "Valid graph" : `${analysis.errors?.length || 0} issue(s)`}</span>
          ) : (
            "Live graph analysis ready"
          )}
          <span className="ml-2 text-slate-500">params {analysis?.totalParameters ?? 0}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className="toolbar-button" onClick={togglePalette} title="Toggle layer palette"><Sidebar size={15} /> {paletteOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}</button>
        <button className="toolbar-button" onClick={toggleInspector} title="Toggle inspector"><Sidebar size={15} /> {inspectorOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}</button>
        <button className="toolbar-button" onClick={toggleBottom} title="Toggle mission control"><PanelBottom size={15} /> {bottomOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</button>
        <button className="toolbar-button" onClick={undo}><Undo2 size={15} /> Undo</button>
        <button className="toolbar-button" onClick={redo}><Redo2 size={15} /> Redo</button>
        <button className="toolbar-button" onClick={saveGraph}><Save size={15} /> Save</button>
        <button className="toolbar-button" onClick={loadGraph}><Upload size={15} /> Load</button>
        <button className="toolbar-button" onClick={resetGraph}><RotateCcw size={15} /> Reset</button>
        <button className="toolbar-button" onClick={autoLayout}>Auto Layout</button>
        <button
          className="toolbar-button-primary"
          disabled={isBusy}
          onClick={() =>
            withBusy("Generating TensorFlow model code...", async () => {
              const result = await generateModel(nodes, edges);
              setAnalysis(result);
              await animatePropagation(result.orderedNodes || [], "Generate");
              appendLog(result.valid ? `Generated model with ${result.totalParameters} parameters.` : "Graph has validation errors.");
            })
          }
        >
          <Braces size={15} /> Generate
        </button>
        <button
          className="toolbar-button"
          disabled={isBusy}
          onClick={() =>
            withBusy("Running forward pass...", async () => {
              const analysis = await generateModel(nodes, edges);
              setAnalysis(analysis);
              await animatePropagation(analysis.orderedNodes || [], "Forward");
              const result = await forwardPass(nodes, edges);
              appendLog(`Forward pass output ${result.outputShape?.join(" x ")} mean=${result.outputMean?.toFixed(4)}`);
            })
          }
        >
          <Play size={15} /> Forward
        </button>
        <button
          className="toolbar-button"
          disabled={isBusy}
          onClick={() =>
            withBusy("Training synthetic dataset...", async () => {
              const analysis = await generateModel(nodes, edges);
              setAnalysis(analysis);
              await animatePropagation(analysis.orderedNodes || [], "Train");
              const result = await trainModel(nodes, edges, { epochs: 3, batchSize: 16 });
              setTrainingMetrics(result.metrics);
              result.logs?.forEach(appendLog);
            })
          }
        >
          <Bot size={15} /> Train
        </button>
        <button
          className="toolbar-button"
          disabled={isBusy}
          onClick={() =>
            withBusy("Mutating architecture...", async () => {
              const result = await mutateArchitecture(nodes, edges);
              replaceGraph(result.nodes || nodes, result.edges || edges, `Evolution mutation applied: ${result.mutation}`);
              recordMutation(`Generation mutation: ${result.mutation}`);
              await animatePropagation((result.nodes || nodes).map((node) => node.id), "Evolution");
              appendLog(`Evolution mutation: ${result.mutation}`);
            })
          }
        >
          <WandSparkles size={15} /> Mutate
        </button>
      </div>
    </header>
  );
}
