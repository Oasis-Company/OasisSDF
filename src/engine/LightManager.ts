/**
 * LightManager.ts
 * 
 * Manages light creation, updates, and lifecycle
 * Supports directional, point, and spot lights
 */

import type { LightData, LightConfig } from '../types/lights.js';
import { LightType } from '../types/lights.js';

export interface LightCreateInfo {
  type: LightType;
  position?: [number, number, number];
  direction?: [number, number, number];
  color?: [number, number, number];
  intensity?: number;
  range?: number;
  innerConeAngle?: number;
  outerConeAngle?: number;
  castShadows?: boolean;
  shadowSoftness?: number;
}

export class LightManager {
  private lights: Map<number, LightData> = new Map();
  private nextId: number = 0;
  private maxLights: number;
  private dirtyLights: Set<number> = new Set();

  constructor(maxLights: number = 8) {
    this.maxLights = maxLights;
  }

  createLight(config: LightCreateInfo): number | null {
    if (this.lights.size >= this.maxLights) {
      console.warn('LightManager: Maximum light count reached');
      return null;
    }

    const id = this.nextId++;
    
    const lightData: LightData = {
      type: config.type,
      position: config.position ?? [0, 0, 0],
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1.0,
      range: config.range ?? 10.0,
      innerConeAngle: config.innerConeAngle ?? 0.0,
      outerConeAngle: config.outerConeAngle ?? Math.PI / 4,
      castShadows: config.castShadows ? 1 : 0,
      shadowSoftness: config.shadowSoftness ?? 16.0,
    };

    this.lights.set(id, lightData);
    this.dirtyLights.add(id);

    return id;
  }

  createDirectionalLight(config: {
    direction?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    castShadows?: boolean;
    shadowSoftness?: number;
  } = {}): number | null {
    return this.createLight({
      type: LightType.DIRECTIONAL,
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1.0,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16.0,
    });
  }

  createPointLight(config: {
    position?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    range?: number;
    castShadows?: boolean;
    shadowSoftness?: number;
  } = {}): number | null {
    return this.createLight({
      type: LightType.POINT,
      position: config.position ?? [0, 0, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1.0,
      range: config.range ?? 10.0,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16.0,
    });
  }

  createSpotLight(config: {
    position?: [number, number, number];
    direction?: [number, number, number];
    color?: [number, number, number];
    intensity?: number;
    range?: number;
    innerConeAngle?: number;
    outerConeAngle?: number;
    castShadows?: boolean;
    shadowSoftness?: number;
  } = {}): number | null {
    return this.createLight({
      type: LightType.SPOT,
      position: config.position ?? [0, 0, 0],
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1.0,
      range: config.range ?? 10.0,
      innerConeAngle: config.innerConeAngle ?? 0.0,
      outerConeAngle: config.outerConeAngle ?? Math.PI / 4,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16.0,
    });
  }

  updateLight(id: number, updates: Partial<LightConfig>): boolean {
    const light = this.lights.get(id);
    if (!light) {
      return false;
    }

    if (updates.position !== undefined) {
      light.position = updates.position;
    }
    if (updates.direction !== undefined) {
      light.direction = updates.direction;
    }
    if (updates.color !== undefined) {
      light.color = updates.color;
    }
    if (updates.intensity !== undefined) {
      light.intensity = updates.intensity;
    }
    if (updates.range !== undefined) {
      light.range = updates.range;
    }
    if (updates.innerConeAngle !== undefined) {
      light.innerConeAngle = updates.innerConeAngle;
    }
    if (updates.outerConeAngle !== undefined) {
      light.outerConeAngle = updates.outerConeAngle;
    }
    if (updates.castShadows !== undefined) {
      light.castShadows = updates.castShadows ? 1 : 0;
    }
    if (updates.shadowSoftness !== undefined) {
      light.shadowSoftness = updates.shadowSoftness;
    }

    this.dirtyLights.add(id);
    return true;
  }

  removeLight(id: number): boolean {
    const deleted = this.lights.delete(id);
    if (deleted) {
      this.dirtyLights.delete(id);
    }
    return deleted;
  }

  getLight(id: number): LightData | null {
    return this.lights.get(id) ?? null;
  }

  getAllLights(): LightData[] {
    return Array.from(this.lights.values());
  }

  getLightCount(): number {
    return this.lights.size;
  }

  getDirtyLights(): number[] {
    return Array.from(this.dirtyLights);
  }

  clearDirtyFlags(): void {
    this.dirtyLights.clear();
  }

  isDirty(): boolean {
    return this.dirtyLights.size > 0;
  }

  getLightDataArray(): Float32Array {
    const lightCount = this.lights.size;
    const bufferSize = lightCount * 80;
    const buffer = new Float32Array(bufferSize / 4);

    let index = 0;
    for (const light of this.lights.values()) {
      const offset = index * 20;

      buffer[offset + 0] = light.type;
      buffer[offset + 1] = light.intensity;
      buffer[offset + 2] = light.castShadows;
      buffer[offset + 3] = light.shadowSoftness;

      buffer[offset + 4] = light.position[0];
      buffer[offset + 5] = light.position[1];
      buffer[offset + 6] = light.position[2];
      buffer[offset + 7] = 0;

      buffer[offset + 8] = light.direction[0];
      buffer[offset + 9] = light.direction[1];
      buffer[offset + 10] = light.direction[2];
      buffer[offset + 11] = 0;

      buffer[offset + 12] = light.color[0];
      buffer[offset + 13] = light.color[1];
      buffer[offset + 14] = light.color[2];
      buffer[offset + 15] = 0;

      buffer[offset + 16] = light.range;
      buffer[offset + 17] = light.innerConeAngle;
      buffer[offset + 18] = light.outerConeAngle;
      buffer[offset + 19] = 0;

      index++;
    }

    return buffer;
  }

  clear(): void {
    this.lights.clear();
    this.dirtyLights.clear();
    this.nextId = 0;
  }

  getMaxLights(): number {
    return this.maxLights;
  }
}
