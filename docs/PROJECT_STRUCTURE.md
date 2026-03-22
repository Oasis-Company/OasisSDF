# Project Structure

This document describes the directory structure and organization of the OasisSDF project.

## Directory Layout

```
OasisSDF/
├── src/                    # Source code
│   ├── engine/            # Core engine components
│   ├── shaders/           # WGSL shader files
│   ├── types/             # TypeScript type definitions
│   ├── objects/           # Object management
│   ├── math/              # Math utilities
│   └── index.ts           # Main entry point
├── examples/              # Example applications
│   ├── basic/            # Basic examples
│   ├── shapes/           # Shape demonstrations
│   └── stress/           # Performance tests
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   └── guides/           # User guides
├── prepare/              # Planning and preparation documents
├── .trae/                # Development tool configuration
└── Configuration files   # package.json, tsconfig.json, etc.
```

## File Descriptions

### Source Code (`src/`)

#### Engine (`src/engine/`)
- `Engine.ts` - Main engine class, orchestrates rendering
- `DeviceManager.ts` - WebGPU device and context management
- `PipelineManager.ts` - Pipeline state management
- `BufferManager.ts` - Buffer allocation and mapping

#### Shaders (`src/shaders/`)
- `raymarch.wgsl` - Main raymarching shader
- `primitives.wgsl` - SDF primitive functions
- `operations.wgsl` - Boolean operation functions

#### Types (`src/types/`)
- `index.ts` - Core type definitions with 16-byte alignment

#### Objects (`src/objects/`)
- `SDFObject.ts` - Base object class
- `ObjectPool.ts` - Object pool management
- `Primitives.ts` - Primitive factory functions

#### Math (`src/math/`)
- `vec3.ts` - 3D vector operations
- `mat4.ts` - 4x4 matrix operations
- `utils.ts` - Math utilities

### Examples (`examples/`)

#### Basic (`examples/basic/`)
- `sphere.html` - Basic sphere rendering example

#### Shapes (`examples/shapes/`)
- `primitives.html` - All primitives demonstration

#### Stress (`examples/stress/`)
- `performance.html` - 10k objects performance test

### Tests (`tests/`)

#### Unit Tests (`tests/unit/`)
- `engine.test.ts` - Engine core tests
- `types.test.ts` - Type system tests
- `math.test.ts` - Math utilities tests

#### Integration Tests (`tests/integration/`)
- `rendering.test.ts` - Rendering integration tests

### Documentation (`docs/`)

#### API (`docs/api/`)
- `Engine.md` - Engine API documentation

#### Guides (`docs/guides/`)
- `getting-started.md` - Getting started guide
- `performance.md` - Performance optimization guide

## Configuration Files

- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript compiler configuration
- `vite.config.ts` - Vite build configuration
- `.gitignore` - Git ignore rules
- `.gitattributes` - Git attributes
- `LICENSE` - MIT License
- `README.md` - Project documentation

## Development Workflow

1. **Source Code**: All TypeScript code goes in `src/`
2. **Shaders**: WGSL shaders in `src/shaders/`
3. **Examples**: Demo applications in `examples/`
4. **Tests**: Unit and integration tests in `tests/`
5. **Documentation**: API docs and guides in `docs/`

## Build Process

```bash
# Development
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint

# Type check
npm run typecheck
```

## Memory Layout

All data structures follow strict 16-byte alignment:
- `SDFObjectData`: 64 bytes
- `MaterialData`: 48 bytes
- `CameraData`: 80 bytes
- `UniformData`: 32 bytes

This ensures perfect mapping between TypeScript and WGSL structs.
