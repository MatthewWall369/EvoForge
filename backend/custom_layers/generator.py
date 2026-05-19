"""Visual custom layer code generation primitives."""

from __future__ import annotations

from typing import Any


SUPPORTED_OPS = {
    "add": "tf.add",
    "subtract": "tf.subtract",
    "multiply": "tf.multiply",
    "divide": "tf.divide",
    "concat": "tf.concat",
    "matmul": "tf.matmul",
    "cumsum": "tf.cumsum",
    "cumprod": "tf.math.cumprod",
    "mean": "tf.reduce_mean",
    "max": "tf.reduce_max",
    "softmax": "tf.nn.softmax",
    "softplus": "tf.nn.softplus",
    "reshape": "tf.reshape",
    "transpose": "tf.transpose",
    "gather": "tf.gather",
    "fft": "tf.signal.fft",
}


def generate_custom_layer(name: str, ops: list[dict[str, Any]]) -> str:
    class_name = "".join(part.capitalize() for part in name.replace("-", "_").split("_")) or "CustomLayer"
    lines = [
        "import tensorflow as tf",
        "",
        "",
        f"class {class_name}(tf.keras.layers.Layer):",
        "    def call(self, inputs):",
        "        x = inputs",
    ]
    for index, op in enumerate(ops):
        op_type = op.get("type")
        function_name = SUPPORTED_OPS.get(op_type)
        if not function_name:
            lines.append(f"        # Unsupported op skipped: {op_type}")
            continue
        kwargs = op.get("kwargs") or {}
        rendered_kwargs = ", ".join(f"{key}={value!r}" for key, value in kwargs.items())
        suffix = f", {rendered_kwargs}" if rendered_kwargs else ""
        lines.append(f"        x = {function_name}(x{suffix})  # op_{index}")
    lines.append("        return x")
    return "\n".join(lines)
