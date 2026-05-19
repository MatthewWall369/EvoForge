"""Graph parsing, validation, and lightweight shape analysis for EvoForge."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import networkx as nx

from layers.registry import LAYER_REGISTRY, get_layer_spec
from shape_inference.validators import estimate_flops, memory_bytes, node_summary, status_for_node, validate_tensor_route


@dataclass
class GraphAnalysis:
    graph: nx.DiGraph
    ordered_nodes: list[str]
    node_lookup: dict[str, dict[str, Any]]
    shapes: dict[str, tuple[int | None, ...]]
    parameter_counts: dict[str, int]
    input_shapes: dict[str, list[tuple[int | None, ...]]]
    flops: dict[str, int]
    memory_bytes: dict[str, int]
    node_status: dict[str, str]
    node_summaries: dict[str, dict[str, Any]]
    total_parameters: int
    total_flops: int
    total_memory_bytes: int
    warnings: list[str]
    errors: list[str]

    @property
    def valid(self) -> bool:
        return not self.errors


def _node_type(node: dict[str, Any]) -> str:
    return node.get("data", {}).get("layerType") or node.get("data", {}).get("type") or node.get("layerType") or node.get("type", "")


def _node_config(node: dict[str, Any]) -> dict[str, Any]:
    data = node.get("data", {})
    config = dict(data.get("config") or {})
    layer_type = _node_type(node)
    spec = get_layer_spec(layer_type)
    if spec:
        return {**spec.defaults, **config}
    return config


def _shape_label(shape: tuple[int | None, ...]) -> str:
    labels = ["B", "T", "D", "C", "N"]
    parts = []
    for index, value in enumerate(shape):
        if value is None:
            parts.append(labels[index] if index < len(labels) else "?")
        else:
            parts.append(str(value))
    return "(" + ", ".join(parts) + ")"


def build_graph(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> tuple[nx.DiGraph, dict[str, dict[str, Any]], list[str]]:
    graph = nx.DiGraph()
    warnings: list[str] = []
    node_lookup = {str(node["id"]): node for node in nodes if node.get("id")}

    for node_id, node in node_lookup.items():
        layer_type = _node_type(node)
        graph.add_node(node_id, layer_type=layer_type)
        if layer_type not in LAYER_REGISTRY:
            warnings.append(f"Node {node_id} uses unknown layer type '{layer_type}'.")

    for edge in edges:
        source = str(edge.get("source", ""))
        target = str(edge.get("target", ""))
        if source not in node_lookup or target not in node_lookup:
            warnings.append(f"Edge {edge.get('id', '<unknown>')} references a missing node.")
            continue
        graph.add_edge(source, target, id=edge.get("id"))

    return graph, node_lookup, warnings


def analyze_graph(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> GraphAnalysis:
    graph, node_lookup, warnings = build_graph(nodes, edges)
    errors: list[str] = []
    shapes: dict[str, tuple[int | None, ...]] = {}
    parameter_counts: dict[str, int] = {}
    input_shapes_by_node: dict[str, list[tuple[int | None, ...]]] = {}
    flops_by_node: dict[str, int] = {}
    memory_by_node: dict[str, int] = {}

    if not nodes:
        errors.append("Graph is empty.")

    if graph.number_of_nodes() and not nx.is_directed_acyclic_graph(graph):
        errors.append("Graph contains a cycle. Keras functional graphs must be acyclic.")
        ordered_nodes = list(graph.nodes)
    else:
        ordered_nodes = list(nx.topological_sort(graph)) if graph.number_of_nodes() else []

    if graph.number_of_nodes():
        weak_components = list(nx.weakly_connected_components(graph))
        if len(weak_components) > 1:
            errors.append("Graph has disconnected components. Connect all layers into one architecture.")

    input_nodes = [node_id for node_id in graph.nodes if graph.in_degree(node_id) == 0]
    output_nodes = [node_id for node_id in graph.nodes if graph.out_degree(node_id) == 0]
    typed_inputs = [node_id for node_id in input_nodes if _node_type(node_lookup[node_id]) == "input"]

    if graph.number_of_nodes() and not typed_inputs:
        errors.append("Graph must start with at least one Input node.")

    if graph.number_of_nodes() and not output_nodes:
        errors.append("Graph must have at least one terminal Output node.")

    for node_id in ordered_nodes:
        node = node_lookup[node_id]
        layer_type = _node_type(node)
        spec = get_layer_spec(layer_type)
        if not spec:
            continue

        inbound_ids = list(graph.predecessors(node_id))
        inbound_shapes = [shapes[parent] for parent in inbound_ids if parent in shapes]
        inbound_count = len(inbound_ids)

        if inbound_count < spec.min_inputs:
            errors.append(f"{spec.label} node '{node_id}' expects at least {spec.min_inputs} input(s).")
        if spec.max_inputs is not None and inbound_count > spec.max_inputs:
            errors.append(f"{spec.label} node '{node_id}' expects at most {spec.max_inputs} input(s).")

        try:
            config = _node_config(node)
            output_shape = spec.output_shape(config, inbound_shapes)
            input_shapes_by_node[node_id] = inbound_shapes
            shapes[node_id] = output_shape
            params = int(spec.params(config, inbound_shapes, output_shape))
            parameter_counts[node_id] = params
            flops_by_node[node_id] = estimate_flops(layer_type, inbound_shapes, output_shape, params)
            memory_by_node[node_id] = memory_bytes(output_shape)
            errors.extend(validate_tensor_route(layer_type, node_id, inbound_shapes, output_shape))
        except Exception as exc:
            errors.append(f"Could not infer shape for node '{node_id}': {exc}")

    total_parameters = sum(parameter_counts.values())
    total_flops = sum(flops_by_node.values())
    total_memory_bytes = sum(memory_by_node.values())
    node_status = {node_id: status_for_node(node_id, errors, warnings) for node_id in node_lookup}
    node_summaries = {
        node_id: node_summary(
            _node_type(node_lookup[node_id]),
            shapes.get(node_id),
            parameter_counts.get(node_id, 0),
            flops_by_node.get(node_id, 0),
            memory_by_node.get(node_id, 0),
        )
        for node_id in node_lookup
    }
    node_lookup = {
        node_id: {
            **node,
            "layerType": _node_type(node),
            "config": _node_config(node),
            "shapeLabel": _shape_label(shapes[node_id]) if node_id in shapes else "?",
            "inputShapeLabels": [_shape_label(shape) for shape in input_shapes_by_node.get(node_id, [])],
            "parameters": parameter_counts.get(node_id, 0),
            "rank": len(shapes.get(node_id, ())),
            "flops": flops_by_node.get(node_id, 0),
            "memoryBytes": memory_by_node.get(node_id, 0),
            "status": node_status.get(node_id, "valid"),
        }
        for node_id, node in node_lookup.items()
    }

    return GraphAnalysis(
        graph=graph,
        ordered_nodes=ordered_nodes,
        node_lookup=node_lookup,
        shapes=shapes,
        parameter_counts=parameter_counts,
        input_shapes=input_shapes_by_node,
        flops=flops_by_node,
        memory_bytes=memory_by_node,
        node_status=node_status,
        node_summaries=node_summaries,
        total_parameters=total_parameters,
        total_flops=total_flops,
        total_memory_bytes=total_memory_bytes,
        warnings=warnings,
        errors=errors,
    )
