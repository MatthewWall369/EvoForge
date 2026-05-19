from __future__ import annotations

from flask import Flask, jsonify, request
from flask_cors import CORS

from codegen.keras_codegen import analysis_payload, generate_keras_code
from custom_layers.generator import generate_custom_layer
from datasets.loaders import SAMPLE_DATASETS
from evolution.mutations import mutate_architecture
from graph.engine import analyze_graph
from layers.registry import LAYER_REGISTRY
from research.intelligence import architecture_from_prompt, research_brief
from training.runner import run_forward_pass, train_synthetic


app = Flask(__name__)
CORS(app)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "EvoForge API"})


@app.get("/layers")
def layers():
    return jsonify(
        [
            {
                "type": layer_type,
                "label": spec.label,
                "defaults": spec.defaults,
                "minInputs": spec.min_inputs,
                "maxInputs": spec.max_inputs,
            }
            for layer_type, spec in LAYER_REGISTRY.items()
        ]
    )


@app.get("/datasets")
def datasets():
    return jsonify(SAMPLE_DATASETS)


@app.post("/generate_model")
def generate_model():
    payload = request.get_json(force=True) or {}
    analysis = analyze_graph(payload.get("nodes", []), payload.get("edges", []))
    code = generate_keras_code(analysis)
    status = 200 if analysis.valid else 422
    return jsonify(analysis_payload(analysis, code)), status


@app.post("/copilot/analyze")
def copilot_analyze():
    payload = request.get_json(force=True) or {}
    analysis = analyze_graph(payload.get("nodes", []), payload.get("edges", []))
    return jsonify(research_brief(analysis))


@app.post("/copilot/generate_architecture")
def copilot_generate_architecture():
    payload = request.get_json(force=True) or {}
    return jsonify(architecture_from_prompt(payload.get("prompt", "")))


@app.post("/forward_pass")
def forward_pass():
    try:
        return jsonify(run_forward_pass(request.get_json(force=True) or {}))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 422


@app.post("/train")
def train():
    try:
        return jsonify(train_synthetic(request.get_json(force=True) or {}))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 422


@app.post("/custom_layers/generate")
def custom_layer():
    payload = request.get_json(force=True) or {}
    return jsonify({"code": generate_custom_layer(payload.get("name", "CustomLayer"), payload.get("ops", []))})


@app.post("/evolve/mutate")
def evolve_mutate():
    return jsonify(mutate_architecture(request.get_json(force=True) or {}))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
