import BottomPanel from "./components/BottomPanel";
import BuilderCanvas from "./components/BuilderCanvas";
import LayerPalette from "./components/LayerPalette";
import LiveGraphAnalyzer from "./components/LiveGraphAnalyzer";
import NodeInspector from "./components/NodeInspector";
import ForgeToolbar from "./components/ForgeToolbar";
import { useGraphStore } from "./store/graphStore";

export default function App() {
  const paletteOpen = useGraphStore((state) => state.paletteOpen);
  const inspectorOpen = useGraphStore((state) => state.inspectorOpen);

  return (
    <div className="app-shell">
      <div className="app-frame">
        <ForgeToolbar />
        <LiveGraphAnalyzer />
        <div className="workspace">
          <LayerPalette collapsed={!paletteOpen} />
          <BuilderCanvas />
          <NodeInspector collapsed={!inspectorOpen} />
        </div>
        <BottomPanel />
      </div>
    </div>
  );
}
