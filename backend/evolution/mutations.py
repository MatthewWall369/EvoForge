"""Architecture mutation primitives for future EvoForge evolution workflows."""

from __future__ import annotations

import copy
import random
from typing import Any


ACTIVATIONS = ["relu", "gelu", "tanh", "sigmoid", "softmax", "linear"]


def mutate_architecture(payload: dict[str, Any]) -> dict[str, Any]:
    nodes = copy.deepcopy(payload.get("nodes", []))
    edges = copy.deepcopy(payload.get("edges", []))
    if not nodes:
        return {"nodes": nodes, "edges": edges, "mutation": "noop_empty_graph"}

    node = random.choice(nodes)
    config = node.setdefault("data", {}).setdefault("config", {})
    if "units" in config:
        config["units"] = max(1, int(config["units"]) + random.choice([-32, -16, 16, 32]))
        mutation = "mutate_units"
    elif "activation" in config:
        config["activation"] = random.choice(ACTIVATIONS)
        mutation = "mutate_activation"
    else:
        config["dropoutSeed"] = random.randint(1, 9999)
        mutation = "tag_node"

    return {"nodes": nodes, "edges": edges, "mutation": mutation}
