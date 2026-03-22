/**
 * OasisSDF
 * 
 * High-performance, data-driven WebGPU SDF engine for the next generation web
 */

// Export types first
export * from './types/index.js';

// Export engines, excluding MemoryInfo which is already exported from types
export { Engine } from './engine/Engine.js';
export { DeviceManager, type DeviceManagerOptions, type WebGPUSupportInfo } from './engine/DeviceManager.js';
export { BufferManager } from './engine/BufferManager.js';
export { PipelineManager, type PipelineConfig } from './engine/PipelineManager.js';

// Export object management
export { SDFObject } from './objects/SDFObject.js';
export { ObjectPool } from './objects/ObjectPool.js';
export { ObjectManager } from './objects/ObjectManager.js';
export { Primitives } from './objects/Primitives.js';

// Export math utilities
export { Transform } from './math/Transform.js';
