import type { SDFObjectData, MaterialData, CameraData } from '../types/index.js';
import type { LightData } from '../types/lights.js';

/**
 * Scene configuration
 */
export interface SceneConfig {
  /** Maximum number of objects */
  maxObjects?: number;
  /** Maximum number of lights */
  maxLights?: number;
  /** Initial camera data */
  camera?: CameraData;
  /** Ambient light color */
  ambientLight?: [number, number, number];
}

/**
 * Scene render data
 */
export interface SceneRenderData {
  /** Objects data */
  objects: SDFObjectData[];
  /** Materials data */
  materials: MaterialData[];
  /** Lights data */
  lights: LightData[];
  /** Camera data */
  camera: CameraData;
  /** Object count */
  objectCount: number;
  /** Light count */
  lightCount: number;
  /** Ambient light */
  ambientLight: [number, number, number];
}

/**
 * Scene options for engine integration
 */
export interface SceneOptions {
  /** Whether the scene is active */
  active?: boolean;
  /** Whether to enable debug mode */
  debug?: boolean;
}
