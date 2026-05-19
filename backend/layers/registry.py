"""Layer registry for EvoForge graph analysis and Keras code generation."""

from __future__ import annotations

from dataclasses import dataclass
from functools import reduce
from operator import mul
from typing import Any


Shape = tuple[int | None, ...]


@dataclass(frozen=True)
class LayerSpec:
    type: str
    label: str
    defaults: dict[str, Any]
    output_shape: Any
    code: Any
    params: Any = lambda config, input_shapes, output_shape: 0
    min_inputs: int = 1
    max_inputs: int | None = 1


def _as_tuple(value: Any) -> Shape:
    if isinstance(value, str):
        cleaned = value.replace("(", "").replace(")", "")
        return tuple(None if part.strip() in {"", "None", "B"} else int(part.strip()) for part in cleaned.split(",") if part.strip())
    if isinstance(value, list):
        return tuple(value)
    if isinstance(value, tuple):
        return value
    return (None,)


def _prod(values: Shape) -> int:
    known = [value for value in values if isinstance(value, int) and value > 0]
    return reduce(mul, known, 1) if known else 0


def _input_shape(config: dict[str, Any], _: list[Shape]) -> Shape:
    shape = _as_tuple(config.get("shape", [32]))
    return (None, *shape)


def _dense_shape(config: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    units = int(config.get("units", 64))
    source = input_shapes[0]
    if len(source) <= 2:
        return (source[0], units)
    return (*source[:-1], units)


def _dense_params(config: dict[str, Any], input_shapes: list[Shape], _: Shape) -> int:
    input_dim = input_shapes[0][-1] if input_shapes and input_shapes[0] else 0
    return (int(input_dim or 0) + 1) * int(config.get("units", 64))


def _embedding_shape(config: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    dim = int(config.get("dim", 128))
    source = input_shapes[0]
    return (*source, dim)


def _embedding_params(config: dict[str, Any], *_: Any) -> int:
    return int(config.get("vocab_size", 10000)) * int(config.get("dim", 128))


def _conv_shape(config: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    filters = int(config.get("filters", 32))
    source = input_shapes[0]
    if len(source) >= 4:
        return (*source[:-1], filters)
    if len(source) >= 3:
        return (*source[:-1], filters)
    return (source[0], filters)


def _conv_params(config: dict[str, Any], input_shapes: list[Shape], _: Shape) -> int:
    kernel = config.get("kernel_size", 3)
    if isinstance(kernel, list):
        kernel_area = _prod(tuple(kernel))
    else:
        kernel_area = int(kernel)
    channels = int(input_shapes[0][-1] or 0)
    filters = int(config.get("filters", 32))
    return (kernel_area * channels + 1) * filters


def _same_shape(_: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    return input_shapes[0] if input_shapes else (None,)


def _flatten_shape(_: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    source = input_shapes[0]
    return (source[0], _prod(source[1:]))


def _concat_shape(config: dict[str, Any], input_shapes: list[Shape]) -> Shape:
    axis = int(config.get("axis", -1))
    if not input_shapes:
        return (None,)
    base = list(input_shapes[0])
    normalized_axis = axis if axis >= 0 else len(base) + axis
    total = 0
    unknown = False
    for shape in input_shapes:
        value = shape[normalized_axis]
        if value is None:
            unknown = True
        else:
            total += int(value)
    base[normalized_axis] = None if unknown else total
    return tuple(base)


def _format_arg(value: Any) -> str:
    return repr(value)


def _layer_call(name: str, args: dict[str, Any], inbound: str) -> str:
    rendered = ", ".join(f"{key}={_format_arg(value)}" for key, value in args.items() if value not in (None, ""))
    return f"tf.keras.layers.{name}({rendered})({inbound})"


def _input_code(config: dict[str, Any], _: list[str]) -> str:
    shape = tuple(_as_tuple(config.get("shape", [32])))
    dtype = config.get("dtype", "float32")
    return f"tf.keras.Input(shape={shape!r}, dtype={dtype!r}, name={config.get('name', 'input')!r})"


def _dense_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("Dense", {"units": int(config.get("units", 64)), "activation": config.get("activation", "relu")}, inbound[0])


def _embedding_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("Embedding", {"input_dim": int(config.get("vocab_size", 10000)), "output_dim": int(config.get("dim", 128))}, inbound[0])


def _conv1d_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("Conv1D", {"filters": int(config.get("filters", 32)), "kernel_size": int(config.get("kernel_size", 3)), "activation": config.get("activation", "relu"), "padding": config.get("padding", "same")}, inbound[0])


def _conv2d_code(config: dict[str, Any], inbound: list[str]) -> str:
    kernel = config.get("kernel_size", [3, 3])
    return _layer_call("Conv2D", {"filters": int(config.get("filters", 32)), "kernel_size": kernel, "activation": config.get("activation", "relu"), "padding": config.get("padding", "same")}, inbound[0])


def _activation_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("Activation", {"activation": config.get("activation", "gelu")}, inbound[0])


def _dropout_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("Dropout", {"rate": float(config.get("rate", 0.1))}, inbound[0])


def _layernorm_code(config: dict[str, Any], inbound: list[str]) -> str:
    return _layer_call("LayerNormalization", {"epsilon": float(config.get("epsilon", 1e-5))}, inbound[0])


def _flatten_code(_: dict[str, Any], inbound: list[str]) -> str:
    return f"tf.keras.layers.Flatten()({inbound[0]})"


def _add_code(_: dict[str, Any], inbound: list[str]) -> str:
    return f"tf.keras.layers.Add()([{', '.join(inbound)}])"


def _concat_code(config: dict[str, Any], inbound: list[str]) -> str:
    return f"tf.keras.layers.Concatenate(axis={int(config.get('axis', -1))})([{', '.join(inbound)}])"


def _output_code(config: dict[str, Any], inbound: list[str]) -> str:
    units = config.get("units")
    if units in (None, "", 0):
        return inbound[0]
    return _layer_call("Dense", {"units": int(units), "activation": config.get("activation", "softmax")}, inbound[0])


def _custom_layer_code(config: dict[str, Any], inbound: list[str]) -> str:
    class_name = config.get("class_name") or "CustomLayer"
    return f"{class_name}()({inbound[0]})"


LAYER_REGISTRY: dict[str, LayerSpec] = {
    "input": LayerSpec("input", "Input", {"shape": [32], "dtype": "float32"}, _input_shape, _input_code, min_inputs=0, max_inputs=0),
    "dense": LayerSpec("dense", "Dense", {"units": 64, "activation": "relu"}, _dense_shape, _dense_code, _dense_params),
    "embedding": LayerSpec("embedding", "Embedding", {"vocab_size": 10000, "dim": 128}, _embedding_shape, _embedding_code, _embedding_params),
    "conv1d": LayerSpec("conv1d", "Conv1D", {"filters": 32, "kernel_size": 3, "activation": "relu", "padding": "same"}, _conv_shape, _conv1d_code, _conv_params),
    "conv2d": LayerSpec("conv2d", "Conv2D", {"filters": 32, "kernel_size": [3, 3], "activation": "relu", "padding": "same"}, _conv_shape, _conv2d_code, _conv_params),
    "layernorm": LayerSpec("layernorm", "LayerNorm", {"epsilon": 1e-5}, _same_shape, _layernorm_code),
    "dropout": LayerSpec("dropout", "Dropout", {"rate": 0.1}, _same_shape, _dropout_code),
    "activation": LayerSpec("activation", "Activation", {"activation": "gelu"}, _same_shape, _activation_code),
    "residual_add": LayerSpec("residual_add", "Residual Add", {}, _same_shape, _add_code, min_inputs=2, max_inputs=None),
    "concatenate": LayerSpec("concatenate", "Concatenate", {"axis": -1}, _concat_shape, _concat_code, min_inputs=2, max_inputs=None),
    "flatten": LayerSpec("flatten", "Flatten", {}, _flatten_shape, _flatten_code),
    "output": LayerSpec("output", "Output", {"units": 10, "activation": "softmax"}, _dense_shape, _output_code, _dense_params),
    "custom_layer": LayerSpec("custom_layer", "Custom Layer", {"class_name": "CustomLayer", "badge": "OP"}, _same_shape, _custom_layer_code),
    "deltamemory": LayerSpec("deltamemory", "DeltaMemory", {"class_name": "DeltaMemoryLayer", "badge": "DELTA"}, _same_shape, _custom_layer_code),
    "fftblock": LayerSpec("fftblock", "FFTBlock", {"class_name": "FFTBlock", "badge": "FFT"}, _same_shape, _custom_layer_code),
    "semanticfield": LayerSpec("semanticfield", "SemanticField", {"class_name": "SemanticFieldLayer", "badge": "SEM"}, _same_shape, _custom_layer_code),
    "reversibleroute": LayerSpec("reversibleroute", "ReversibleRoute", {"class_name": "ReversibleRouteLayer", "badge": "REV"}, _same_shape, _custom_layer_code),
    "morablock": LayerSpec("morablock", "MoraBlock", {"class_name": "MoraBlock", "badge": "MORA"}, _same_shape, _custom_layer_code),
    "cumsumfield": LayerSpec("cumsumfield", "CumsumField", {"class_name": "CumsumFieldLayer", "badge": "CSUM"}, _same_shape, _custom_layer_code),
    "alphaimportance": LayerSpec("alphaimportance", "AlphaImportance", {"class_name": "AlphaImportanceLayer", "badge": "ALPHA"}, _same_shape, _custom_layer_code),
    "fourierrouting": LayerSpec("fourierrouting", "FourierRouting", {"class_name": "FourierRoutingLayer", "badge": "FOURIER"}, _same_shape, _custom_layer_code),
    "trajectorymemory": LayerSpec("trajectorymemory", "TrajectoryMemory", {"class_name": "TrajectoryMemoryLayer", "badge": "TRAJ"}, _same_shape, _custom_layer_code),
}


def get_layer_spec(layer_type: str) -> LayerSpec | None:
    return LAYER_REGISTRY.get(layer_type)
