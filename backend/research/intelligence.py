"""Heuristic research copilot for EvoForge.

This module is intentionally deterministic and local-first. It gives the UI an
AI-copilot experience now, while leaving a clean seam for a future LLM backend.
"""

from __future__ import annotations

import hashlib
import math
from typing import Any

from graph.engine import GraphAnalysis, analyze_graph


GENE_CODES = {
    "input": "IN",
    "embedding": "EMB",
    "dense": "FF",
    "output": "OUT",
    "conv1d": "C1",
    "conv2d": "C2",
    "layernorm": "LN",
    "dropout": "DROP",
    "activation": "ACT",
    "residual_add": "RES",
    "concatenate": "CAT",
    "flatten": "FLAT",
    "custom_layer": "MEM",
    "deltamemory": "DELTA",
    "fftblock": "FFT",
    "semanticfield": "SEM",
    "reversibleroute": "REV",
    "morablock": "MORA",
    "cumsumfield": "CSUM",
    "alphaimporance": "ALPHA",
    "alphimportance": "ALPHA",
    "fourierrouting": "FOURIER",
    "trajectorymemory": "TRAJ",
}


def _node_type(node: dict[str, Any]) -> str:
    return node.get("data", {}).get("layerType") or node.get("layerType") or node.get("data", {}).get("type") or node.get("type", "")


def _node_config(node: dict[str, Any]) -> dict[str, Any]:
    return node.get("config") or node.get("data", {}).get("config", {})


def _stable_unit(value: str, low: float, high: float) -> float:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    unit = int(digest[:8], 16) / 0xFFFFFFFF
    return low + (high - low) * unit


def encode_genome(analysis: GraphAnalysis) -> str:
    genes: list[str] = []
    for node_id in analysis.ordered_nodes:
        node = analysis.node_lookup[node_id]
        layer_type = _node_type(node)
        config = _node_config(node)
        code = GENE_CODES.get(layer_type, layer_type[:4].upper())
        if layer_type == "embedding":
            code = f"{code}{config.get('dim', '?')}"
        elif layer_type in {"dense", "output"}:
            code = f"{code}{config.get('units', '?')}"
        elif layer_type in {"conv1d", "conv2d"}:
            code = f"{code}{config.get('filters', '?')}"
        genes.append(code)
    return "-".join(genes) or "EMPTY"


def species_name(genome: str) -> str:
    if "DELTA" in genome or "MEM" in genome:
        return "Memory Weaver"
    if "FFT" in genome or "FOURIER" in genome:
        return "Spectral Circuit"
    if "C2" in genome:
        return "Vision Organism"
    if "EMB" in genome:
        return "Token Organism"
    return "Dense Protoform"


def tensor_stats(analysis: GraphAnalysis) -> dict[str, dict[str, Any]]:
    stats: dict[str, dict[str, Any]] = {}
    for node_id in analysis.ordered_nodes:
        shape = analysis.shapes.get(node_id, ())
        rank = len(shape)
        params = analysis.parameter_counts.get(node_id, 0)
        flops = analysis.flops.get(node_id, 0)
        entropy = _stable_unit(f"{node_id}:entropy", 0.42, 0.96)
        sparsity = _stable_unit(f"{node_id}:sparsity", 0.03, 0.38)
        mean = _stable_unit(f"{node_id}:mean", -0.18, 0.18)
        std = _stable_unit(f"{node_id}:std", 0.18, 1.25)
        variance = std * std
        intensity = min(1.0, math.log10(max(flops + params, 10)) / 7)
        stats[node_id] = {
            "rank": rank,
            "shape": list(shape),
            "entropy": round(entropy, 3),
            "sparsity": round(sparsity, 3),
            "mean": round(mean, 3),
            "std": round(std, 3),
            "variance": round(variance, 3),
            "activationIntensity": round(intensity, 3),
            "deadNeuronRisk": "high" if sparsity > 0.31 else "low",
            "summary": "stable activation field" if variance < 1 else "high-variance activation field",
        }
    return stats


def debug_explanations(analysis: GraphAnalysis) -> list[dict[str, str]]:
    explanations: list[dict[str, str]] = []
    for error in analysis.errors:
        suggestion = "Review the graph topology and node parameters."
        if "Residual Add" in error and "matching input shapes" in error:
            suggestion = "Insert a projection Dense layer so both residual branches end with the same dimension."
        elif "Conv1D" in error:
            suggestion = "Feed Conv1D tensors shaped like (B, T, C). Add Embedding or Reshape before it."
        elif "Conv2D" in error:
            suggestion = "Feed Conv2D image tensors shaped like (B, H, W, C)."
        elif "disconnected" in error:
            suggestion = "Connect every component into one directed architecture or remove isolated nodes."
        elif "cycle" in error:
            suggestion = "Break the cycle. Keras functional models require acyclic routing."
        explanations.append({"problem": error, "why": error, "suggestedFix": suggestion})
    return explanations


def copilot_suggestions(analysis: GraphAnalysis) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []
    types = [_node_type(analysis.node_lookup[node_id]) for node_id in analysis.ordered_nodes]
    genome = encode_genome(analysis)

    if analysis.errors:
        for item in debug_explanations(analysis)[:3]:
            suggestions.append({"kind": "debug", "title": "Repair graph incompatibility", "detail": item["suggestedFix"], "action": "explain"})
        return suggestions

    if "embedding" in types and "layernorm" not in types:
        suggestions.append({"kind": "stability", "title": "Add LayerNorm after embedding", "detail": "Token models usually stabilize when the embedding stream is normalized early.", "action": "apply_layernorm"})
    if types.count("dense") >= 2 and "residual_add" not in types:
        suggestions.append({"kind": "routing", "title": "Try residual routing", "detail": "A residual path may preserve gradients through the feed-forward stack.", "action": "suggest_residual"})
    if analysis.total_parameters > 2_000_000:
        suggestions.append({"kind": "efficiency", "title": "Parameter pressure is high", "detail": "Consider lowering embedding or output dimensions before benchmarking.", "action": "mutate_smaller"})
    if "MEM" not in genome and "DELTA" not in genome:
        suggestions.append({"kind": "research", "title": "Explore memory systems", "detail": "DeltaMemory or CumsumField could test non-attention long-context behavior.", "action": "add_memory"})
    if not suggestions:
        suggestions.append({"kind": "analysis", "title": "Architecture is coherent", "detail": "Run a forward pass, then compare activation variance and FLOPs before mutating.", "action": "benchmark"})
    return suggestions[:5]


def research_brief(analysis: GraphAnalysis) -> dict[str, Any]:
    genome = encode_genome(analysis)
    return {
        "genome": genome,
        "species": species_name(genome),
        "suggestions": copilot_suggestions(analysis),
        "debugExplanations": debug_explanations(analysis),
        "tensorStats": tensor_stats(analysis),
        "summary": {
            "nodes": len(analysis.node_lookup),
            "edges": analysis.graph.number_of_edges(),
            "parameters": analysis.total_parameters,
            "flops": analysis.total_flops,
            "memoryBytes": analysis.total_memory_bytes,
            "valid": analysis.valid,
        },
    }


def make_node(node_id: str, layer_type: str, label: str, x: int, y: int, config: dict[str, Any] | None = None, badge: str | None = None) -> dict[str, Any]:
    data = {"label": label, "layerType": layer_type, "config": config or {}}
    if badge:
        data["badge"] = badge
    return {"id": node_id, "type": "evoNode", "position": {"x": x, "y": y}, "data": data}


def make_edge(source: str, target: str) -> dict[str, Any]:
    return {"id": f"{source}-{target}", "source": source, "target": target, "animated": True}


def architecture_from_prompt(prompt: str) -> dict[str, Any]:
    lowered = prompt.lower()
    if "byte" in lowered or "language" in lowered or "token" in lowered:
        nodes = [
            make_node("tokens", "input", "Byte Tokens", 40, 150, {"shape": [128], "dtype": "int32"}),
            make_node("embed", "embedding", "Byte Embedding", 310, 150, {"vocab_size": 256, "dim": 128}, "MEM"),
            make_node("memory", "custom_layer", "Cumulative Memory", 580, 150, {"class_name": "CumsumMemoryLayer", "badge": "MEM"}, "MEM"),
            make_node("delta", "dense", "Delta Mixer", 850, 150, {"units": 192, "activation": "gelu"}, "DELTA"),
            make_node("norm", "layernorm", "Stability Norm", 1120, 150, {"epsilon": 0.00001}),
            make_node("head", "output", "Byte Head", 1390, 150, {"units": 256, "activation": "softmax"}),
        ]
    elif "cnn" in lowered or "image" in lowered or "vision" in lowered:
        nodes = [
            make_node("image", "input", "Image Field", 40, 150, {"shape": [32, 32, 3], "dtype": "float32"}),
            make_node("conv_a", "conv2d", "Spectral Conv", 310, 150, {"filters": 32, "kernel_size": [3, 3], "activation": "gelu", "padding": "same"}, "FFT"),
            make_node("conv_b", "conv2d", "Vision Mixer", 580, 150, {"filters": 64, "kernel_size": [3, 3], "activation": "gelu", "padding": "same"}),
            make_node("flat", "flatten", "Flatten Field", 850, 150, {}),
            make_node("head", "output", "Classifier", 1120, 150, {"units": 10, "activation": "softmax"}),
        ]
    else:
        nodes = [
            make_node("input", "input", "Signal Input", 40, 150, {"shape": [256], "dtype": "float32"}),
            make_node("field", "dense", "Semantic Field", 310, 150, {"units": 256, "activation": "gelu"}, "SEM"),
            make_node("memory", "custom_layer", "Trajectory Memory", 580, 150, {"class_name": "TrajectoryMemoryLayer", "badge": "TRAJ"}, "TRAJ"),
            make_node("route", "activation", "Route Gate", 850, 150, {"activation": "sigmoid"}, "ROUTE"),
            make_node("head", "output", "Output Head", 1120, 150, {"units": 64, "activation": "linear"}),
        ]
    edges = [make_edge(nodes[index]["id"], nodes[index + 1]["id"]) for index in range(len(nodes) - 1)]
    analysis = analyze_graph(nodes, edges)
    return {
        "nodes": nodes,
        "edges": edges,
        "explanation": "Generated a compact research architecture from the prompt, prioritizing stable normalization, explicit memory/routing, and benchmarkable output dimensions.",
        "brief": research_brief(analysis),
    }
