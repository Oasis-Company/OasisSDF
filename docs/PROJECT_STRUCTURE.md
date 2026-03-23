# Project Structure

This document describes the directory structure and organization of the OasisSDF project, a WebGPU-based signed distance field (SDF) rendering engine.

## Overview

OasisSDF is a high-performance real-time rendering engine built on WebGPU that uses signed distance functions (SDFs) for geometric representation. The engine follows a data-driven architecture with zero shader code generation at runtime.

## Directory Layout

```
OasisSDF/
├── src/                      # Source code
│   ├── engine/              # Core engine components
│   ├── scene/               # Scene management
│   ├── shaders/             # WGSL shader files
│   ├── types/               # TypeScript type definitions
│   ├── objects/             # Object management
│   ├── math/                # Math utilities
│   └── index.ts             # Main entry point
├── examples/                 # Example applications
│   ├── basic/               # Basic examples
│   └── scene-management.html # Scene management demo
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── docs/                    # Documentation
│   ├── api/                 # API documentation
│   └── PROJECT_STRUCTURE.md # This file
├── dist/                    # Built distribution files
├── .trae/                   # Development tool configuration
└── Configuration files      # package.json, tsconfig.json, etc.
```

## Source Code (`src/`)

### Engine (`src/engine/`)

Core components responsible for WebGPU initialization, rendering pipeline, and resource management.

| File | Description |
|------|-------------|
| `Engine.ts` | Main engine class that orchestrates rendering, manages scenes, and provides high-level API |
| `DeviceManager.ts` | WebGPU device and context management, adapter discovery, device loss handling |
| `PipelineManager.ts` | GPU pipeline state management, render pass configuration |
| `BufferManager.ts` | Buffer allocation, mapping, and data synchronization |
| `LightManager.ts` | Light data management, light type handling |

### Scene (`src/scene/`)

Scene management module for organizing 3D content.

| File | Description |
|------|-------------|
| `Scene.ts` | Scene class managing objects, lights, materials, and camera |
| `types.ts` | Scene-related type definitions (SceneConfig, SceneRenderData) |
| `index.ts` | Scene module exports |

### Shaders (`src/shaders/`)

WGSL shader files for SDF rendering. All shaders are static and use data-driven approaches.

| File | Description |
|------|-------------|
| `raymarch.wgsl` | Main raymarching kernel, ray generation, intersection logic |
| `primitives.wgsl` | SDF primitive functions (sphere, box, torus, etc.) |
| `operations.wgsl` | Boolean operations (union, intersection, subtraction) |
| `pbr.wgsl` | Physically based rendering calculations |
| `lights.wgsl` | Light computation functions |
| `shadows.wgsl` | Shadow calculation (soft shadows, ray-traced shadows) |
| `ambient.wgsl` | Ambient occlusion and ambient lighting |
| `vertex.wgsl` | Vertex shader for fullscreen quad rendering |

### Types (`src/types/`)

TypeScript type definitions with strict 16-byte alignment for WebGPU compatibility.

| File | Description |
|------|-------------|
| `index.ts` | Core type exports, SDFPrimitive enum |
| `objects.ts` | SDFObjectData, MaterialData type definitions |
| `lights.ts` | LightData, LightCreateInfo type definitions |

### Objects (`src/objects/`)

Object management system with pooling and lifecycle management.

| File | Description |
|------|-------------|
| `SDFObject.ts` | Base SDF object class |
| `ObjectPool.ts` | Object pooling for efficient memory management |
| `ObjectManager.ts` | Object lifecycle management, synchronization |
| `Primitives.ts` | Factory functions for creating primitive objects |

### Math (`src/math/`)

Mathematical utilities for 3D graphics.

| File | Description |
|------|-------------|
| `Transform.ts` | Transformation matrix calculations |

## Examples (`examples/`)

Demo applications showcasing engine features.

| File | Description |
|------|-------------|
| `basic/sphere.html` | Basic sphere rendering |
| `basic/objects.html` | Multiple primitive objects |
| `basic/pbr-demo.html` | PBR material demonstration |
| `scene-management.html` | Multi-scene management demo |

## Tests (`tests/`)

Comprehensive test suite ensuring code quality.

### Unit Tests (`tests/unit/`)

| File | Description |
|------|-------------|
| `Engine.test.ts` | Engine core functionality tests |
| `Scene.test.ts` | Scene management tests |
| `DeviceManager.test.ts` | WebGPU device tests |
| `BufferManager.test.ts` | Buffer management tests |
| `PipelineManager.test.ts` | Pipeline state tests |
| `LightManager.test.ts` | Light system tests |
| `ObjectManager.test.ts` | Object management tests |
| `ObjectPool.test.ts` | Object pooling tests |
| `SDFObject.test.ts` | SDF object tests |
| `Transform.test.ts` | Math transform tests |

### Integration Tests (`tests/integration/`)

| File | Description |
|------|-------------|
| `rendering.test.ts` | End-to-end rendering tests |
| `buffer-management.test.ts` | Buffer operations integration tests |

## Documentation (`docs/`)

### API Documentation (`docs/api/`)

| File | Description |
|------|-------------|
| `Engine.md` | Engine class API reference |
| `Scene.md` | Scene class API reference |

### Project Documentation

| File | Description |
|------|-------------|
| `PROJECT_STRUCTURE.md` | This file |

## Configuration Files

| File | Description |
|------|-------------|
| `package.json` | NPM package configuration, scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `vite.config.ts` | Vite build configuration |
| `vitest.config.ts` | Vitest test configuration |
| `.gitignore` | Git ignore rules |
| `LICENSE` | MIT License |

## Development Workflow

### Building

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run typecheck
```

## Memory Layout

All data structures follow strict 16-byte alignment rules for WebGPU compatibility:

| Type | Size | Fields |
|------|------|--------|
| `SDFObjectData` | 64 bytes | type, position, rotation, scale, padding |
| `MaterialData` | 48 bytes | color, roughness, metallic, padding |
| `CameraData` | 80 bytes | position, target, up, fov, near, far |
| `LightData` | 48 bytes | type, position/direction, color, intensity, padding |
| `UniformData` | 32 bytes | time, resolution, camera info |

## Architecture Principles

1. **Data-Driven, Not Code-Gen**: Static WGSL shaders with runtime buffer updates
2. **Zero Dependencies**: Core engine has no external runtime dependencies
3. **16-Byte Alignment**: All types strictly follow WebGPU alignment requirements
4. **Modular Design**: Each module is independent and testable
5. **Error Handling**: Comprehensive error handling with custom error types

## WebGPU Features

- Compute shaders for raymarching
- Storage buffers for object data
- Dynamic uniform updates
- Multi-pass rendering support
- Device loss recovery
- Memory pressure handling

## Performance Targets

- 1000+ objects at 60 FPS
- Sub-millisecond buffer updates
- Zero runtime shader compilation
- Efficient GPU memory usage
