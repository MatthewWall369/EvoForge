# EvoForge

EvoForge is an AI-assisted visual neural architecture laboratory for designing, inspecting, generating, and experimenting with TensorFlow/Keras models. It combines a React Flow graph editor, a Flask graph engine, automatic TensorFlow code generation, live shape inference, execution visualization, architecture mutation, and a research-oriented copilot interface.

The goal of EvoForge is to feel like a neural architecture operating system: a futuristic, interactive workspace where users can visually sculpt experimental AI systems and immediately understand their graph structure, tensor shapes, generated code, and research tradeoffs.

![EvoForge screenshot](assets/evoforge-ui.png)

## Highlights

- Visual node-based architecture editor powered by React Flow.
- Drag-and-drop neural layers with configurable parameters.
- Automatic graph validation, topological sorting, tensor shape inference, parameter counts, FLOP estimates, and memory estimates.
- TensorFlow/Keras Functional API code generation from graph JSON.
- Live code panel with copy/export support.
- Forward-pass and synthetic training endpoints.
- Animated tensor propagation through nodes and edges.
- AI Research Copilot with architecture suggestions, debug explanations, mutation ideas, and prompt-to-graph generation.
- Neural genome system for architecture identity, lineage, and mutation history.
- Tensor MRI panel for per-node tensor statistics such as entropy, sparsity, mean/std, variance, activation intensity, memory, and FLOPs.
- Custom tensor operation builder foundation for reusable custom layers.
- Architecture templates for Transformer-style, CNN, Autoencoder, Tiny Language Model, Mora, and RAG-style graphs.
- Experimental research layer library including DeltaMemory, FFTBlock, SemanticField, ReversibleRoute, MoraBlock, CumsumField, AlphaImportance, FourierRouting, and TrajectoryMemory.

## Technology Stack

Frontend:

- React
- Vite
- React Flow
- Zustand
- Axios
- TailwindCSS
- Lucide React

Backend:

- Flask
- Flask-CORS
- NetworkX
- TensorFlow/Keras
- NumPy

## Architecture

EvoForge is split into a modular frontend and backend.

```text
frontend/
  src/
    api/              API client functions
    components/       React UI panels, graph canvas, inspector, copilot
    data/             Layer catalog and architecture templates
    store/            Zustand graph/application state
    styles/           Global app styling

backend/
  app.py              Flask API entrypoint
  codegen/            TensorFlow/Keras code generation
  custom_layers/      Custom layer code generation primitives
  datasets/           Dataset descriptors
  evolution/          Architecture mutation tools
  graph/              Graph parsing and analysis
  layers/             Layer registry and shape/code rules
  research/           Copilot, genome, tensor statistics, prompt generation
  shape_inference/    Tensor compatibility checks and estimates
  training/           Forward-pass and synthetic training helpers
```

## Getting Started

Clone the repository and install dependencies.

```bash
git clone https://github.com/MatthewWall369/EvoForge.git
cd EvoForge
```

### Backend

```bash
pip install -r requirements.txt
python backend/app.py
```

The Flask API runs at:

```text
http://localhost:5000
```

TensorFlow is loaded lazily for execution endpoints, so graph validation and code generation can still be used in lighter environments.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

## Core Workflow

1. Choose an architecture template or drag layers from the palette.
2. Connect nodes visually on the graph canvas.
3. Edit layer parameters in the inspector.
4. Review live tensor shapes, parameter counts, warnings, and generated Keras code.
5. Use the AI Research Copilot for suggestions, debugging, or prompt-based graph generation.
6. Run Generate, Forward, Train, or Mutate to animate execution and explore alternatives.
7. Bookmark experiments and compare neural genomes over time.

## API Reference

Health and metadata:

- `GET /health`
- `GET /layers`
- `GET /datasets`

Model generation and execution:

- `POST /generate_model`
- `POST /forward_pass`
- `POST /train`

Custom layers and evolution:

- `POST /custom_layers/generate`
- `POST /evolve/mutate`

Research copilot:

- `POST /copilot/analyze`
- `POST /copilot/generate_architecture`

## Example Graph Payload

```json
{
  "nodes": [
    {
      "id": "input_1",
      "type": "evoNode",
      "data": {
        "label": "Input",
        "layerType": "input",
        "config": {
          "shape": [32],
          "dtype": "float32"
        }
      }
    }
  ],
  "edges": []
}
```

## Generated Code

EvoForge generates TensorFlow/Keras Functional API code from the visual graph.

```python
import tensorflow as tf


def build_model():
    inputs = tf.keras.Input(shape=(32,), dtype='float32', name='input')
    dense_1 = tf.keras.layers.Dense(units=128, activation='gelu')(inputs)
    output_1 = tf.keras.layers.Dense(units=10, activation='softmax')(dense_1)
    model = tf.keras.Model(inputs=inputs, outputs=output_1, name='EvoForgeModel')
    return model
```

## Screenshots

Place screenshots in the `assets/` directory and reference them in Markdown:

![EvoForge screenshot](assets/evoforge-ui.png)

Commit screenshots with:

```bash
git add assets README.md
git commit -m "Add project screenshots"
git push
```

## Roadmap

- PyTorch export.
- ONNX export.
- HuggingFace export.
- Persistent experiment database.
- Real dataset loaders for TinyShakespeare, TinyStories, and benchmark suites.
- Streaming training logs.
- Rich activation heatmaps from real forward-pass instrumentation.
- Plugin system for external layers and exporters.
- Cloud and distributed training support.
- Collaborative architecture editing.
- Architecture marketplace and model cards.

## Development Notes

The backend is intentionally registry-driven. Layer behavior, shape inference, parameter estimation, and code generation are centralized in the layer registry so new layer types can be added without rewriting the editor.

The research copilot is currently a deterministic local heuristic system. It is designed to be replaceable with a future LLM-backed research assistant while preserving the same frontend API and UI contracts.
