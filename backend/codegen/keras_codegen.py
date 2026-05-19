"""TensorFlow/Keras code generation for analyzed EvoForge graphs."""

from __future__ import annotations

from typing import Any

from graph.engine import GraphAnalysis
from layers.registry import get_layer_spec
from research.intelligence import research_brief


def _safe_name(node_id: str) -> str:
    cleaned = "".join(char if char.isalnum() else "_" for char in node_id)
    if cleaned and cleaned[0].isdigit():
        cleaned = f"n_{cleaned}"
    return cleaned or "node"


def generate_keras_code(analysis: GraphAnalysis) -> str:
    lines = [
        "import tensorflow as tf",
    ]
    custom_classes = {
        node["config"].get("class_name", "CustomLayer")
        for node in analysis.node_lookup.values()
        if node.get("layerType") == "custom_layer" or node["config"].get("class_name")
    }
    for class_name in sorted(custom_classes):
        lines.extend(
            [
                "",
                "",
                f"class {class_name}(tf.keras.layers.Layer):",
                "    def call(self, inputs):",
                "        # Replace this visual placeholder with generated tensor ops.",
                "        return inputs",
            ]
        )
    lines.extend(["", "", "def build_model():"])
    variable_for: dict[str, str] = {}
    input_vars: list[str] = []

    for node_id in analysis.ordered_nodes:
        node = analysis.node_lookup[node_id]
        layer_type = node["layerType"]
        spec = get_layer_spec(layer_type)
        if not spec:
            continue

        variable_name = _safe_name(node_id)
        if layer_type == "input":
            variable_name = "inputs" if not input_vars else f"inputs_{len(input_vars) + 1}"

        inbound_vars = [variable_for[parent] for parent in analysis.graph.predecessors(node_id) if parent in variable_for]
        expression = spec.code(node["config"], inbound_vars)
        lines.append(
            f"    # {node.get('label') or node.get('data', {}).get('label') or spec.label}: "
            f"{node.get('inputShapeLabels') or ['input']} -> {node.get('shapeLabel', '?')} | "
            f"params={node.get('parameters', 0)} rank={node.get('rank', 0)}"
        )
        lines.append(f"    {variable_name} = {expression}")
        variable_for[node_id] = variable_name
        if layer_type == "input":
            input_vars.append(variable_name)

    output_nodes = [node_id for node_id in analysis.ordered_nodes if analysis.graph.out_degree(node_id) == 0 and node_id in variable_for]
    output_vars = [variable_for[node_id] for node_id in output_nodes]

    if not input_vars:
        input_vars = ["inputs"]
    if not output_vars:
        output_vars = [variable_for[analysis.ordered_nodes[-1]]] if analysis.ordered_nodes else ["inputs"]

    inputs_expr = input_vars[0] if len(input_vars) == 1 else f"[{', '.join(input_vars)}]"
    outputs_expr = output_vars[0] if len(output_vars) == 1 else f"[{', '.join(output_vars)}]"
    lines.extend(
        [
            f"    model = tf.keras.Model(inputs={inputs_expr}, outputs={outputs_expr}, name='EvoForgeModel')",
            "    return model",
            "",
            "",
            "model = build_model()",
            "model.summary()",
        ]
    )
    return "\n".join(lines)


def analysis_payload(analysis: GraphAnalysis, code: str) -> dict[str, Any]:
    brief = research_brief(analysis)
    return {
        "valid": analysis.valid,
        "code": code,
        "orderedNodes": analysis.ordered_nodes,
        "shapes": {node_id: list(shape) for node_id, shape in analysis.shapes.items()},
        "shapeLabels": {node_id: node["shapeLabel"] for node_id, node in analysis.node_lookup.items()},
        "inputShapeLabels": {node_id: node.get("inputShapeLabels", []) for node_id, node in analysis.node_lookup.items()},
        "parameterCounts": analysis.parameter_counts,
        "ranks": {node_id: node.get("rank", 0) for node_id, node in analysis.node_lookup.items()},
        "nodeStatus": analysis.node_status,
        "nodeSummaries": analysis.node_summaries,
        "flops": analysis.flops,
        "memoryBytes": analysis.memory_bytes,
        "totalParameters": analysis.total_parameters,
        "totalFlops": analysis.total_flops,
        "totalMemoryBytes": analysis.total_memory_bytes,
        "genome": brief["genome"],
        "species": brief["species"],
        "copilotSuggestions": brief["suggestions"],
        "debugExplanations": brief["debugExplanations"],
        "tensorStats": brief["tensorStats"],
        "warnings": analysis.warnings,
        "errors": analysis.errors,
    }
