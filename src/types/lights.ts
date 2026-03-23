/**
 * Light System Types
 * 
 * Type definitions for light sources in the scene
 */

/**
 * Light type enum
 */
export enum LightType {
  DIRECTIONAL = 0,
  POINT = 1,
  SPOT = 2
}

/**
 * Light Data Structure
 * Total size: 80 bytes (16-byte aligned)
 * Layout:
 * - type: 4 bytes
 * - intensity: 4 bytes
 * - castShadows: 4 bytes
 * - shadowSoftness: 4 bytes (align to 16)
 * - position: 12 bytes
 * - padding0: 4 bytes (align to 16)
 * - direction: 12 bytes
 * - padding1: 4 bytes (align to 16)
 * - color: 12 bytes
 * - padding2: 4 bytes (align to 16)
 * - range: 4 bytes
 * - innerConeAngle: 4 bytes
 * - outerConeAngle: 4 bytes
 * - padding3: 4 bytes (align to 16)
 */
export interface LightData {
  /** Light type (0=directional, 1=point, 2=spot) */
  type: LightType;
  /** Light intensity multiplier */
  intensity: number;
  /** Whether this light casts shadows (0=false, 1=true) */
  castShadows: number;
  /** Shadow softness factor (higher = softer) */
  shadowSoftness: number;
  /** Position in world space (for point/spot lights) */
  position: [number, number, number];
  /** Direction vector (for directional/spot lights) */
  direction: [number, number, number];
  /** Light color (RGB) */
  color: [number, number, number];
  /** Maximum range for point/spot lights */
  range: number;
  /** Inner cone angle for spot lights (radians) */
  innerConeAngle: number;
  /** Outer cone angle for spot lights (radians) */
  outerConeAngle: number;
}

/**
 * Light Configuration
 */
export interface LightConfig {
  /** Light type */
  type: LightType;
  /** Position in world space (for point/spot lights) */
  position?: [number, number, number];
  /** Direction vector (for directional/spot lights) */
  direction?: [number, number, number];
  /** Light color (RGB) */
  color?: [number, number, number];
  /** Light intensity multiplier */
  intensity?: number;
  /** Whether this light casts shadows */
  castShadows?: boolean;
  /** Shadow softness factor */
  shadowSoftness?: number;
  /** Maximum range for point/spot lights */
  range?: number;
  /** Inner cone angle for spot lights (radians) */
  innerConeAngle?: number;
  /** Outer cone angle for spot lights (radians) */
  outerConeAngle?: number;
}

/**
 * Light creation info (alias for LightConfig)
 */
export type LightCreateInfo = LightConfig;

/**
 * Default light configurations
 */
export const DefaultLights = {
  directional: (): LightConfig => ({
    type: LightType.DIRECTIONAL,
    direction: [0.5, -0.7, -0.3],
    color: [1, 1, 1],
    intensity: 1.0,
    castShadows: true,
    shadowSoftness: 16.0
  }),
  
  point: (): LightConfig => ({
    type: LightType.POINT,
    position: [0, 2, 0],
    color: [1, 1, 1],
    intensity: 1.0,
    castShadows: true,
    shadowSoftness: 16.0,
    range: 10.0
  }),
  
  spot: (): LightConfig => ({
    type: LightType.SPOT,
    position: [0, 3, 0],
    direction: [0, -1, 0],
    color: [1, 1, 1],
    intensity: 1.5,
    castShadows: true,
    shadowSoftness: 16.0,
    range: 15.0,
    innerConeAngle: Math.PI / 6,
    outerConeAngle: Math.PI / 4
  })
};
