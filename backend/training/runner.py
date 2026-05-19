"""Execution helpers for EvoForge models.

These functions are intentionally small and isolated so the app can later swap
in queued workers, distributed training, PyTorch export, or streamed logs.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from codegen.keras_codegen import generate_keras_code
from graph.engine import analyze_graph


def _build_model(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]):
    import tensorflow as tf  # Imported lazily so codegen can work without loading TF at startup.

    analysis = analyze_graph(nodes, edges)
    if not analysis.valid:
        raise ValueError("; ".join(analysis.errors))

    namespace: dict[str, Any] = {"tf": tf}
    exec(generate_keras_code(analysis), namespace)
    return namespace["build_model"](), analysis


def run_forward_pass(payload: dict[str, Any]) -> dict[str, Any]:
    model, analysis = _build_model(payload.get("nodes", []), payload.get("edges", []))
    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]
    batch_shape = [2 if dim is None else dim for dim in input_shape]
    sample = np.random.random(batch_shape).astype("float32")
    output = model(sample, training=False)
    return {
        "outputShape": list(output.shape),
        "outputMean": float(np.mean(output.numpy())),
        "outputStd": float(np.std(output.numpy())),
        "totalParameters": analysis.total_parameters,
        "activeNodes": analysis.ordered_nodes,
    }


def train_synthetic(payload: dict[str, Any]) -> dict[str, Any]:
    import tensorflow as tf

    epochs = int(payload.get("epochs", 3))
    batch_size = int(payload.get("batchSize", 16))
    model, analysis = _build_model(payload.get("nodes", []), payload.get("edges", []))
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])

    input_shape = model.input_shape
    output_shape = model.output_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]
    if isinstance(output_shape, list):
        output_shape = output_shape[0]

    x_shape = [batch_size * 4 if index == 0 else (1 if dim is None else dim) for index, dim in enumerate(input_shape)]
    y_shape = [batch_size * 4 if index == 0 else (1 if dim is None else dim) for index, dim in enumerate(output_shape)]
    x = np.random.random(x_shape).astype("float32")
    y = np.random.random(y_shape).astype("float32")

    history = model.fit(x, y, epochs=epochs, batch_size=batch_size, verbose=0)
    metrics = {name: [float(value) for value in values] for name, values in history.history.items()}
    return {
        "metrics": metrics,
        "logs": [f"epoch {index + 1}/{epochs}: loss={metrics['loss'][index]:.4f}" for index in range(epochs)],
        "totalParameters": analysis.total_parameters,
        "tensorflowVersion": tf.__version__,
    }
