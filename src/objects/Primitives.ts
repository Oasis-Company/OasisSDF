/**
 * Primitives.ts
 * 
 * Factory functions for creating SDF primitives with sensible defaults
 */

import { SDFPrimitive } from '../types/index.js';
import type { ObjectConfig } from '../types/objects.js';

/**
 * Factory functions for creating SDF primitives with sensible defaults
 */
export const Primitives = {
  sphere(radius: number = 1, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Sphere,
      transform: {
        scale: [radius, radius, radius],
        ...config.transform
      },
      ...config
    };
  },
  
  box(width: number = 1, height: number = 1, depth: number = 1, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Box,
      transform: {
        scale: [width, height, depth],
        ...config.transform
      },
      ...config
    };
  },
  
  torus(majorRadius: number = 0.5, minorRadius: number = 0.2, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Torus,
      transform: {
        scale: [majorRadius, minorRadius, 1],
        ...config.transform
      },
      ...config
    };
  },
  
  capsule(height: number = 1, radius: number = 0.3, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Capsule,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  },
  
  cylinder(height: number = 1, radius: number = 0.5, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Cylinder,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  },
  
  cone(height: number = 1, radius: number = 0.5, config: Partial<ObjectConfig> = {}): ObjectConfig {
    return {
      type: SDFPrimitive.Cone,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  }
};
