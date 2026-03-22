/**
 * Core type definitions for OasisSDF
 * All structs follow 16-byte alignment protocol for WGSL compatibility
 */

/**
 * SDF Object Data Structure
 * Total size: 64 bytes (16-byte aligned)
 * Layout:
 * - type: 4 bytes
 * - padding0: 12 bytes (align to 16)
 * - position: 12 bytes
 * - padding1: 4 bytes (align to 16)
 * - rotation: 12 bytes
 * - padding2: 4 bytes (align to 16)
 * - scale: 12 bytes
 * - padding3: 4 bytes (align to 16)
 */
export interface SDFObjectData {
  /** Object type identifier (1=sphere, 2=box, etc.) */
  type: number;
  /** Position in 3D space (x, y, z) */
  position: [number, number, number];
  /** Rotation as Euler angles (x, y, z) */
  rotation: [number, number, number];
  /** Scale factors (x, y, z) */
  scale: [number, number, number];
}

/**
 * Material Data Structure
 * Total size: 48 bytes (16-byte aligned)
 * Layout:
 * - color: 12 bytes
 * - padding0: 4 bytes (align to 16)
 * - metallic: 4 bytes
 * - roughness: 4 bytes
 * - padding1: 8 bytes (align to 16)
 */
export interface MaterialData {
  /** RGB color values (0.0 - 1.0) */
  color: [number, number, number];
  /** Metallic factor (0.0 - 1.0) */
  metallic: number;
  /** Roughness factor (0.0 - 1.0) */
  roughness: number;
}

/**
 * Camera Data Structure
 * Total size: 80 bytes (16-byte aligned)
 * Layout:
 * - position: 12 bytes
 * - padding0: 4 bytes (align to 16)
 * - target: 12 bytes
 * - padding1: 4 bytes (align to 16)
 * - up: 12 bytes
 * - padding2: 4 bytes (align to 16)
 * - fov: 4 bytes
 * - near: 4 bytes
 * - far: 4 bytes
 * - padding3: 4 bytes (align to 16)
 */
export interface CameraData {
  /** Camera position in world space */
  position: [number, number, number];
  /** Look-at target position */
  target: [number, number, number];
  /** Up vector direction */
  up: [number, number, number];
  /** Field of view in radians */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
}

/**
 * Uniform Data Structure
 * Total size: 32 bytes (16-byte aligned)
 * Layout:
 * - time: 4 bytes
 * - frame: 4 bytes
 * - objectCount: 4 bytes
 * - padding0: 4 bytes (align to 16)
 * - resolution: 8 bytes
 * - padding1: 8 bytes (align to 16)
 */
export interface UniformData {
  /** Current time in seconds */
  time: number;
  /** Current frame number */
  frame: number;
  /** Number of active objects */
  objectCount: number;
  /** Canvas resolution (width, height) */
  resolution: [number, number];
}

/**
 * Engine Configuration
 */
export interface EngineConfig {
  /** Canvas element for rendering */
  canvas: HTMLCanvasElement;
  /** Maximum number of objects (default: 10000) */
  maxObjects?: number;
  /** Enable debug mode (default: false) */
  debug?: boolean;
  /** Background color (default: [0, 0, 0]) */
  backgroundColor?: [number, number, number];
}

/**
 * SDF Object Configuration
 */
export interface SDFObjectConfig {
  /** Object type (1=sphere, 2=box, etc.) */
  type: number;
  /** Position (default: [0, 0, 0]) */
  position?: [number, number, number];
  /** Rotation (default: [0, 0, 0]) */
  rotation?: [number, number, number];
  /** Scale (default: [1, 1, 1]) */
  scale?: [number, number, number];
  /** Material properties */
  material?: Partial<MaterialData>;
}

/**
 * Buffer Layout Utilities
 */
export const BufferLayout = {
  /** Calculate byte size of SDFObjectData */
  objectSize: 64,
  /** Calculate byte size of MaterialData */
  materialSize: 48,
  /** Calculate byte size of CameraData */
  cameraSize: 80,
  /** Calculate byte size of UniformData */
  uniformSize: 32,

  /** Calculate total buffer size for objects */
  objectBufferSize: (count: number): number => count * 64,

  /** Calculate total buffer size for materials */
  materialBufferSize: (count: number): number => count * 48,

  /** Validate alignment (must be multiple of 16) */
  validateAlignment: (size: number): boolean => size % 16 === 0
} as const;

/**
 * SDF Primitive Types
 */
export enum SDFPrimitive {
  Sphere = 1,
  Box = 2,
  Torus = 3,
  Capsule = 4,
  Cylinder = 5,
  Cone = 6
}

/**
 * Error Types
 */
export class OasisSDFError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OasisSDFError';
  }
}

export class WebGPUError extends OasisSDFError {
  constructor(message: string) {
    super(message, 'WEBGPU_ERROR');
  }
}

export class BufferError extends OasisSDFError {
  constructor(message: string) {
    super(message, 'BUFFER_ERROR');
  }
}

export class ValidationError extends OasisSDFError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class PipelineError extends OasisSDFError {
  constructor(message: string) {
    super(message, 'PIPELINE_ERROR');
  }
}

export class EngineError extends OasisSDFError {
  constructor(message: string) {
    super(message, 'ENGINE_ERROR');
  }
}
