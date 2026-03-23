/**
 * LightManager.test.ts
 * 
 * Unit tests for LightManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LightManager } from '../../src/engine/LightManager.js';
import { LightType } from '../../src/types/lights.js';

describe('LightManager', () => {
  let lightManager: LightManager;

  beforeEach(() => {
    lightManager = new LightManager(8);
  });

  describe('createLight', () => {
    it('should create a directional light', () => {
      const id = lightManager.createDirectionalLight({
        direction: [0, -1, 0],
        color: [1, 1, 1],
        intensity: 1.0
      });

      expect(id).toBe(0);
      expect(lightManager.getLightCount()).toBe(1);

      const light = lightManager.getLight(id!);
      expect(light).not.toBeNull();
      expect(light!.type).toBe(LightType.DIRECTIONAL);
      expect(light!.direction).toEqual([0, -1, 0]);
      expect(light!.color).toEqual([1, 1, 1]);
      expect(light!.intensity).toBe(1.0);
    });

    it('should create a point light', () => {
      const id = lightManager.createPointLight({
        position: [0, 5, 0],
        color: [1, 0, 0],
        intensity: 2.0,
        range: 10.0
      });

      expect(id).toBe(0);
      expect(lightManager.getLightCount()).toBe(1);

      const light = lightManager.getLight(id!);
      expect(light).not.toBeNull();
      expect(light!.type).toBe(LightType.POINT);
      expect(light!.position).toEqual([0, 5, 0]);
      expect(light!.color).toEqual([1, 0, 0]);
      expect(light!.intensity).toBe(2.0);
      expect(light!.range).toBe(10.0);
    });

    it('should create a spot light', () => {
      const id = lightManager.createSpotLight({
        position: [0, 5, 0],
        direction: [0, -1, 0],
        color: [0, 1, 0],
        intensity: 1.5,
        innerConeAngle: 0.1,
        outerConeAngle: 0.5
      });

      expect(id).toBe(0);
      expect(lightManager.getLightCount()).toBe(1);

      const light = lightManager.getLight(id!);
      expect(light).not.toBeNull();
      expect(light!.type).toBe(LightType.SPOT);
      expect(light!.position).toEqual([0, 5, 0]);
      expect(light!.direction).toEqual([0, -1, 0]);
      expect(light!.innerConeAngle).toBe(0.1);
      expect(light!.outerConeAngle).toBe(0.5);
    });

    it('should return null when max lights reached', () => {
      const smallManager = new LightManager(2);

      smallManager.createDirectionalLight();
      smallManager.createPointLight();
      const id = smallManager.createSpotLight();

      expect(id).toBeNull();
      expect(smallManager.getLightCount()).toBe(2);
    });
  });

  describe('updateLight', () => {
    it('should update light properties', () => {
      const id = lightManager.createPointLight({
        position: [0, 0, 0],
        intensity: 1.0
      });

      const updated = lightManager.updateLight(id!, {
        position: [1, 2, 3],
        intensity: 2.0
      });

      expect(updated).toBe(true);

      const light = lightManager.getLight(id!);
      expect(light!.position).toEqual([1, 2, 3]);
      expect(light!.intensity).toBe(2.0);
    });

    it('should return false for invalid light id', () => {
      const updated = lightManager.updateLight(999, {
        intensity: 2.0
      });

      expect(updated).toBe(false);
    });
  });

  describe('removeLight', () => {
    it('should remove a light', () => {
      const id = lightManager.createDirectionalLight();
      expect(lightManager.getLightCount()).toBe(1);

      const removed = lightManager.removeLight(id!);
      expect(removed).toBe(true);
      expect(lightManager.getLightCount()).toBe(0);
    });

    it('should return false for invalid light id', () => {
      const removed = lightManager.removeLight(999);
      expect(removed).toBe(false);
    });
  });

  describe('getLightDataArray', () => {
    it('should return correct buffer data', () => {
      lightManager.createDirectionalLight({
        direction: [0, -1, 0],
        color: [1, 1, 1],
        intensity: 1.0
      });

      const data = lightManager.getLightDataArray();

      expect(data.length).toBe(20);
      expect(data[0]).toBe(LightType.DIRECTIONAL);
      expect(data[1]).toBe(1.0);
    });

    it('should return empty array for no lights', () => {
      const data = lightManager.getLightDataArray();
      expect(data.length).toBe(0);
    });
  });

  describe('dirty tracking', () => {
    it('should track dirty lights', () => {
      const id = lightManager.createDirectionalLight();
      expect(lightManager.isDirty()).toBe(true);
      expect(lightManager.getDirtyLights()).toContain(id);

      lightManager.clearDirtyFlags();
      expect(lightManager.isDirty()).toBe(false);
      expect(lightManager.getDirtyLights().length).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all lights', () => {
      lightManager.createDirectionalLight();
      lightManager.createPointLight();
      lightManager.createSpotLight();

      expect(lightManager.getLightCount()).toBe(3);

      lightManager.clear();

      expect(lightManager.getLightCount()).toBe(0);
      expect(lightManager.isDirty()).toBe(false);
    });
  });
});
