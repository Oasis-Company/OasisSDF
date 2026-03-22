/**
 * Object Management Types
 * 
 * Core types for object lifecycle, state management, and configuration
 */

import type { MaterialData, SDFPrimitive } from './index.js';

/**
 * Object state enum
 */
export enum ObjectState {
  FREE = 0,
  ACTIVE = 1,
  DIRTY = 2,
  PENDING = 3
}

/**
 * Transform data
 * Total size: 48 bytes (16-byte aligned)
 */
export interface TransformData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

/**
 * Object configuration options
 */
export interface ObjectConfig {
  type: SDFPrimitive;
  transform?: Partial<TransformData>;
  material?: Partial<MaterialData>;
  visible?: boolean;
  castShadows?: boolean;
  receiveShadows?: boolean;
}

/**
 * Object change flags for dirty tracking
 */
export enum ObjectChangeFlags {
  NONE = 0,
  TRANSFORM = 1 << 0,
  MATERIAL = 1 << 1,
  VISIBILITY = 1 << 2,
  ALL = TRANSFORM | MATERIAL | VISIBILITY
}

/**
 * Object manager statistics
 */
export interface ObjectManagerStats {
  totalObjects: number;
  activeObjects: number;
  dirtyObjects: number;
  freeSlots: number;
  lastSyncTime: number;
}
