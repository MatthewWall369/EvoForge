"""Tensor compatibility checks and lightweight cost estimates."""

from __future__ import annotations

from functools import reduce
from operator import mul
from typing import Any

Shape = tuple[int | None, ...]


def rank(shape: Shape | None) -> int:
    return len(shape or ())


def concrete_size(shape: Shape | None) -> int:
    dims = [value for value in (shape or ()) if isinstance(value, int) and value > 0]
    return reduce(mul, dims, 1) if dims else 0


def memory_bytes(shape: Shape | None, dtype_size: int = 4) -> int:
    return concrete_size(shape) * dtype_size


def estimate_flops(layer_type: str, input_shapes: list[Shape], output_shape: Shape, params: int) -> int:
    output_size = concrete_size(output_shape)
    if layer_type in {"dense", "output"}:
        input_dim = int((input_shapes[0][-1] if input_shapes and input_shapes[0] else 0) or 0)
        units = int((output_shape[-1] if output_shape else 0) or 0)
        return max(output_size * max(input_dim, 1) * max(units, 1), params * 2)
    if layer_type in {"conv1d", "conv2d"}:
        return max(output_size * max(params, 1), params)
    if layer_type in {"residual_add", "concatenate"}:
        return output_size
    return max(output_size, params)


def validate_tensor_route(layer_type: str, node_id: str, input_shapes: list[Shape], output_shape: Shape) -> list[str]:
    errors: list[str] = []
    if not input_shapes and layer_type != "input":
        return errors

    source = input_shapes[0] if input_shapes else ()
    source_rank = rank(source)

    if layer_type in {"dense", "output"} and source_rank < 2:
        errors.append(f"{layer_type} node '{node_id}' expects rank >= 2 but received rank {source_rank}.")
    if layer_type == "embedding" and source_rank < 2:
        errors.append(f"Embedding node '{node_id}' expects token ids with rank >= 2.")
    if layer_type == "conv1d" and source_rank != 3:
        errors.append(f"Conv1D node '{node_id}' requires a 3D tensor shaped (B, T, C/D).")
    if layer_type == "conv2d" and source_rank != 4:
        errors.append(f"Conv2D node '{node_id}' requires a 4D tensor shaped (B, H, W, C).")
    if layer_type == "flatten" and source_rank < 2:
        errors.append(f"Flatten node '{node_id}' expects rank >= 2.")
    if layer_type == "residual_add":
        expected = input_shapes[0]
        for shape in input_shapes[1:]:
            if shape != expected:
                errors.append(f"Residual Add node '{node_id}' requires matching input shapes, got {input_shapes}.")
                break
    if layer_type == "concatenate" and input_shapes:
        base_rank = rank(input_shapes[0])
        for shape in input_shapes[1:]:
            if rank(shape) != base_rank:
                errors.append(f"Concatenate node '{node_id}' requires equal tensor ranks, got {input_shapes}.")
                break
    if rank(output_shape) == 0:
        errors.append(f"Node '{node_id}' produced an unknown scalar shape.")
    return errors


def status_for_node(node_id: str, errors: list[str], warnings: list[str]) -> str:
    if any(node_id in message for message in errors):
        return "error"
    if any(node_id in message for message in warnings):
        return "warning"
    return "valid"


def human_bytes(value: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    size = float(value)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}"
        size /= 1024


def node_summary(layer_type: str, shape: Shape | None, params: int, flops: int, memory: int) -> dict[str, Any]:
    return {
        "layerType": layer_type,
        "rank": rank(shape),
        "parameters": params,
        "flops": flops,
        "memoryBytes": memory,
        "memoryLabel": human_bytes(memory),
    }
