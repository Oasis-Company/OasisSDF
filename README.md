🌊 OasisSDF

The Data-Driven WebGPU SDF Engine for the Next Generation Web.

Reject Recompilation. Say Goodbye to Draw Call Bottlenecks.

Built for Procedural Generation, Massive Dynamic Scenes, and Ultra-Lightweight Interactions. The next-generation core for Web 3D.

[!\[License\](https://img.shields.io/badge/license-MIT-blue.svg null)](https://opensource.org/licenses/MIT)
[!\[WebGPU\](https://img.shields.io/badge/WebGPU-Native-orange.svg null)](https://gpuweb.github.io/gpuweb/)
[!\[Bundle Size\](https://img.shields.io/badge/size-%3C40kb-green.svg null)](https://bundlephobia.com/)
[!\[Performance\](https://img.shields.io/badge/fps-60%2B@10k\_objs-red.svg null)](https://oasissdf.dev/performance)

## 🚀 Why Choose OasisSDF?

In 2026, traditional mesh-based rendering engines still struggle with CPU-side Draw Call overhead and shader recompilation delays when handling tens of thousands of dynamic objects or real-time deformation effects.

OasisSDF changes the game.

We don't load models; we compute shapes. By leveraging a completely static WGSL shader architecture and highly optimized Storage Buffers, we shift the entire burden of geometry generation to GPU parallel computing.

## ⚡ Core Advantages at a Glance

| Feature                | Traditional Engines (Three.js/Babylon)         | OasisSDF                                  |
| ---------------------- | ---------------------------------------------- | ----------------------------------------- |
| Rendering Architecture | Mesh + Draw Call / Instancing                  | Raymarching + Single Draw Call            |
| Shape Blending/Boolean | Extremely difficult, expensive compute         | Native support, zero extra cost           |
| Dynamic Object Limit   | \~1,000 (CPU-bound updates)                    | 10,000+ (Pure GPU-driven)                 |
| Shader Compilation     | Frequent recompilation based on material/light | Fully static, zero runtime compilation    |
| Core Bundle Size       | 500KB - 2MB+                                   | < 40KB                                    |
| Ideal Use Cases        | General 3D display, Games                      | Generative Art, SciVis, Massive Particles |

## 🔥 Key Features

### 1. 🧬 Pure Data-Driven Architecture

- All object states (position, rotation, scale, material params) reside in StorageBuffers.
- Zero Shader Concatenation: Strictly no runtime WGSL code generation.
- Frame-Perfect Updates: CPU only updates buffer data; GPU responds instantly with no pipeline stalls.

### 2. 📐 Strict Memory Alignment Protocol

- Our proprietary 16-byte aligned memory model ensures perfect mapping between TypeScript interfaces and WGSL structs.
- Eliminates implicit padding errors.
- Maximizes GPU memory bandwidth utilization.
- Provides compile-time type checking and runtime assertion protection.

### 3. 🎨 Infinite Procedural Capabilities

Leveraging the mathematical nature of Signed Distance Fields (SDF):

- Infinite Resolution: Scale indefinitely without aliasing or polygon limits.
- Natural Blending: Smooth transitions between objects (Metaballs) are default behavior, not a special effect.
- Real-time Boolean Ops: Union, Intersection, Difference achieved with a single line of code.

### 4. 📦 Ultra-Lightweight Footprint

- Zero external dependencies.
- Core engine compresses to under 40KB.
- Perfectly suited for mobile devices and low-bandwidth environments.

## 🖥️ Quick Start

### Installation

```bash
npm install oasissdf
# or
yarn add oasissdf
```

### Hello Sphere (5 Lines of Code)

```typescript
import { Engine, SDFObject } from 'oasissdf';

const engine = new Engine({ canvas: document.getElementById('gl') });

// Define a sphere: type=1, pos=(0,0,-5), radius=1.0
const sphere = new SDFObject({ type: 1, pos: [0, 0, -5], radius: 1.0 });

engine.addObject(sphere);
engine.render(); // 60FPS Raymarching Render
```

## Architecture Overview

```mermaid
graph LR
    A[JS Application] -->|Write Data| B(Storage Buffer)
    B -->|GPU Read Only| C{Static WGSL Kernel}
    C -->|Raymarching Loop| D[Frame Buffer]
    D --> E[Screen]
    
    style C fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    
    subgraph "OasisSDF Core"
    B
    C
    end
    
    note right of C: Immutable Static Code<br/>Supports 10,000+ Object Traversal
```

## 🗺️ Roadmap

- **Phase 1: Core Proof** - Static shader architecture verified, single sphere rendered.
- **Phase 2: Shape Library** - Built-in primitives (Box, Torus, Capsule) & Transform System.
- **Phase 3: Stress Test** - Optimize buffer mapping strategies, break the 10,000 object barrier.
- **Phase 4: Developer Experience** - High-level API wrappers, debugging tools, and documentation.
- **Phase 5: Ecosystem** - React/Vue component support, Three.js hybrid rendering plugin.

## 👤 Author & Maintenance

- **Author**: ceaserzhao
- **Organization**: Oasis Company
- **Contact**: <contact@oasiscompany.dev>

OasisSDF is built by the team at Oasis Company, pushing the boundaries of what's possible in the browser.

## 🤝 Contributing

OasisSDF is looking for developers passionate about WebGPU, Computer Graphics, and High-Performance Computing.

If you are tired of Draw Call limits and want to explore the edge of browser graphics, join us!

- 📄 [Read Contribution Guidelines](https://github.com/oasiscompany/OasisSDF/blob/main/CONTRIBUTING.md)
- 🐛 [Report Issues](https://github.com/oasiscompany/OasisSDF/issues)
- 💬 [Join Discussion](https://github.com/oasiscompany/OasisSDF/discussions)

## 📜 License

MIT License © 2026 Oasis Company.

Built for the open web, powered by math.
