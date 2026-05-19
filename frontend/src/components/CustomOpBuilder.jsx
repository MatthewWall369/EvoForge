import { useMemo, useState } from "react";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { generateCustomLayer } from "../api/client";
import { useGraphStore } from "../store/graphStore";

const opTypes = ["add", "subtract", "multiply", "divide", "matmul", "concat", "cumsum", "cumprod", "mean", "max", "softmax", "softplus", "fft", "reshape", "transpose", "gather"];

export default function CustomOpBuilder({ compact = false }) {
  const [name, setName] = useState("CustomLayer");
  const [ops, setOps] = useState([{ type: "softplus", kwargs: {} }, { type: "fft", kwargs: {} }]);
  const [code, setCode] = useState("");
  const appendLog = useGraphStore((state) => state.appendLog);

  const preview = useMemo(() => ops.map((op) => op.type.toUpperCase()).join(" -> "), [ops]);

  async function synthesize() {
    try {
      const result = await generateCustomLayer(name, ops);
      setCode(result.code);
      appendLog(`Generated custom layer ${name}: ${preview}`);
    } catch (error) {
      appendLog(`Custom layer generation failed: ${error.message}`);
    }
  }

  return (
    <div className={`rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.04] p-3 ${compact ? "" : "mt-4"}`}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-100">
        <Boxes size={14} /> Tensor Op Builder
      </div>
      <input value={name} onChange={(event) => setName(event.target.value)} className="mb-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none focus:border-fuchsia-300/70" />
      <div className="space-y-2">
        {ops.map((op, index) => (
          <div key={`${op.type}-${index}`} className="flex gap-2">
            <select
              value={op.type}
              onChange={(event) => setOps((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, type: event.target.value } : item)))}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-white outline-none"
            >
              {opTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button onClick={() => setOps((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-white/10 bg-white/5 px-2 text-slate-300 hover:border-rose-300/50 hover:text-rose-200">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => setOps((current) => [...current, { type: "softmax", kwargs: {} }])} className="toolbar-button flex-1 justify-center"><Plus size={14} /> Add Op</button>
        <button onClick={synthesize} className="toolbar-button-primary flex-1 justify-center">Generate</button>
      </div>
      <div className="mt-3 rounded-xl bg-slate-950/70 p-2 font-mono text-[11px] text-fuchsia-100">{preview || "No ops"}</div>
      {code ? <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-slate-950/80 p-3 text-[11px] leading-4 text-slate-300">{code}</pre> : null}
    </div>
  );
}
