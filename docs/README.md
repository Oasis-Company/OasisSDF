# OasisSDF Documentation

Welcome to the OasisSDF documentation. This is your comprehensive guide to using the data-driven WebGPU SDF rendering engine.

## Table of Contents

### Getting Started
- [Getting Started Guide](./guides/getting-started.md) - Your first steps with OasisSDF
- [Project Structure](./PROJECT_STRUCTURE.md) - Understanding the codebase organization

### User Guides
- [Scene Management](./guides/scene-management.md) - Managing multiple scenes and transitions
- [Material System](./guides/material-system.md) - Working with materials and PBR
- [PBR Materials](./guides/pbr-materials.md) - Advanced physically-based rendering
- [SDF Primitives](./guides/sdf-primitives.md) - Available SDF shapes and usage
- [Lighting System](./guides/lighting-system.md) - Lighting setup and configuration
- [WebGPU Compatibility](./guides/webgpu-compatibility.md) - Browser support and fallbacks
- [Performance Optimization](./guides/performance.md) - Techniques for maximum performance
- [Testing](./guides/testing.md) - Unit testing and validation

### API Reference
- [Engine API](./api/Engine.md) - Core engine class documentation
- [Scene API](./api/Scene.md) - Scene management documentation
- [MaterialManager API](./api/MaterialManager.md) - Material management documentation
- [MaterialBuffer API](./api/MaterialBuffer.md) - Material buffer management
- [PBRMaterial API](./api/PBRMaterial.md) - PBR material class documentation

### Examples
- [Basic Material Example](../examples/material-basics.ts) - Basic material system usage
- [PBR Material Showcase](../examples/pbr-materials.ts) - PBR material presets
- [Scene Management Demo](../examples/scene-management.html) - Interactive scene management

## Quick Links

- **GitHub Repository**: [OasisSDF](https://github.com/oasiscompany/OasisSDF)
- **Issue Tracker**: [Report Issues](https://github.com/oasiscompany/OasisSDF/issues)
- **Discussions**: [Join Discussion](https://github.com/oasiscompany/OasisSDF/discussions)

## Key Features

- 🚀 **Data-Driven Architecture**: Static WGSL shaders with runtime buffer updates
- 📐 **16-Byte Alignment**: Strict memory alignment for WebGPU compatibility
- 🎨 **SDF Primitives**: Sphere, Box, Torus, Capsule, Cylinder, Cone
- 💡 **Lighting System**: Directional, Point, and Spot lights
- 🎭 **PBR Material System**: Physically Based Rendering with material presets
- 🎬 **Multi-Scene Support**: Create and switch between multiple scenes
- ⚡ **High Performance**: 10,000+ objects at 60 FPS
- 📦 **Zero Dependencies**: Core engine has no external dependencies
- 🔄 **Sparse Buffer Allocation**: Memory optimization for materials
- 🛠️ **Dynamic Buffer Resizing**: Automatic buffer management
- 🔍 **WebGPU Compatibility**: Browser support and fallback mechanisms

## Browser Support

OasisSDF requires WebGPU support:

- Chrome 113+
- Edge 113+
- Firefox Nightly (with flag)
- Safari (coming soon)

## Getting Help

If you need help:

1. Check the [Getting Started Guide](./guides/getting-started.md)
2. Review the [API Reference](./api/)
3. Look at [Example Projects](../examples/)
4. [Open an Issue](https://github.com/oasiscompany/OasisSDF/issues)
5. [Join the Discussion](https://github.com/oasiscompany/OasisSDF/discussions)

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](https://github.com/oasiscompany/OasisSDF/blob/main/CONTRIBUTING.md) for details.

## License

MIT License © 2026 Oasis Company
