/**
 * buffer-management.test.ts
 * 
 * Integration tests for buffer management system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DeviceManager } from '../../src/engine/DeviceManager';
import { BufferManager } from '../../src/engine/BufferManager';
import type { SDFObjectData, MaterialData, UniformData, CameraData } from '../../src/types/index.js';

describe('Buffer Management Integration', () => {
  let deviceManager: DeviceManager;
  let bufferManager: BufferManager;
  let canvas: HTMLCanvasElement;
  let originalGpu: any;

  beforeEach(async () => {
    originalGpu = (navigator as any).gpu;

    if (typeof document !== 'undefined' && DeviceManager.isSupported()) {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      deviceManager = new DeviceManager();
      await deviceManager.initialize(canvas);

      const device = deviceManager.getDevice();
      bufferManager = new BufferManager(device);
    }
  });

  afterEach(() => {
    if (bufferManager) {
      try {
        bufferManager.cleanup();
      } catch (error) {
      }
    }

    if (deviceManager) {
      try {
        deviceManager.cleanup();
      } catch (error) {
      }
    }

    if (originalGpu !== (navigator as any).gpu) {
      (navigator as any).gpu = originalGpu;
    }
  });

  describe('End-to-End Buffer Workflow', () => {
    it('should create and write object buffer', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('objects', 128);
      const objects: SDFObjectData[] = [
        {
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        {
          type: 1,
          position: [1, 2, 3],
          rotation: [0.5, 0.5, 0.5],
          scale: [2, 2, 2]
        }
      ];

      expect(() => {
        bufferManager.writeObjectBuffer(buffer, objects);
      }).not.toThrow();

      const info = bufferManager.getMemoryInfo();
      expect(info.allocated).toBeGreaterThan(0);
      expect(info.used).toBeGreaterThan(0);
    });

    it('should create and write material buffer', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('materials', 96);
      const materials: MaterialData[] = [
        {
          color: [1, 0, 0],
          metallic: 0.5,
          roughness: 0.5
        },
        {
          color: [0, 1, 0],
          metallic: 0.8,
          roughness: 0.2
        }
      ];

      expect(() => {
        bufferManager.writeMaterialBuffer(buffer, materials);
      }).not.toThrow();

      const info = bufferManager.getMemoryInfo();
      expect(info.allocated).toBeGreaterThan(0);
    });

    it('should create and write uniform buffer', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createUniformBuffer('uniforms', 32);
      const uniforms: UniformData = {
        time: 1.5,
        frame: 100,
        objectCount: 10,
        resolution: [800, 600]
      };

      expect(() => {
        bufferManager.writeUniformBuffer(buffer, uniforms);
      }).not.toThrow();
    });

    it('should create and write camera buffer', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createUniformBuffer('camera', 80);
      const camera: CameraData = {
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: 1.57,
        near: 0.1,
        far: 100
      };

      expect(() => {
        bufferManager.writeCameraBuffer(buffer, camera);
      }).not.toThrow();
    });

    it('should update object data', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('update_objects', 128);
      const objects1: SDFObjectData[] = [
        {
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      ];

      bufferManager.writeObjectBuffer(buffer, objects1);
      const info1 = bufferManager.getMemoryInfo();

      const objects2: SDFObjectData[] = [
        {
          type: 1,
          position: [1, 1, 1],
          rotation: [0.5, 0.5, 0.5],
          scale: [2, 2, 2]
        }
      ];

      bufferManager.writeObjectBuffer(buffer, objects2);
      const info2 = bufferManager.getMemoryInfo();

      expect(info2.used).toBeGreaterThan(info1.used);
    });

    it('should handle multiple buffer types', () => {
      if (!bufferManager) return;

      const objectBuffer = bufferManager.createStorageBuffer('multi_objects', 128);
      const materialBuffer = bufferManager.createStorageBuffer('multi_materials', 96);
      const uniformBuffer = bufferManager.createUniformBuffer('multi_uniforms', 32);
      const cameraBuffer = bufferManager.createUniformBuffer('multi_camera', 80);

      const objects: SDFObjectData[] = [
        {
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      ];

      const materials: MaterialData[] = [
        {
          color: [1, 0, 0],
          metallic: 0.5,
          roughness: 0.5
        }
      ];

      const uniforms: UniformData = {
        time: 1.5,
        frame: 100,
        objectCount: 1,
        resolution: [800, 600]
      };

      const camera: CameraData = {
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: 1.57,
        near: 0.1,
        far: 100
      };

      expect(() => {
        bufferManager.writeObjectBuffer(objectBuffer, objects);
        bufferManager.writeMaterialBuffer(materialBuffer, materials);
        bufferManager.writeUniformBuffer(uniformBuffer, uniforms);
        bufferManager.writeCameraBuffer(cameraBuffer, camera);
      }).not.toThrow();

      const info = bufferManager.getMemoryInfo();
      expect(info.allocated).toBe(336);
    });
  });

  describe('Performance Tests', () => {
    it('should create buffers quickly', () => {
      if (!bufferManager) return;

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        bufferManager.createStorageBuffer(`perf_${i}`, 64);
      }
      const end = performance.now();

      const duration = end - start;
      expect(duration).toBeLessThan(100);
    });

    it('should write small data quickly', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('perf_small', 64);
      const data = [1.0, 2.0, 3.0, 4.0];

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        bufferManager.writeBuffer(buffer, data);
      }
      const end = performance.now();

      const duration = end - start;
      expect(duration).toBeLessThan(100);
    });

    it('should write large data efficiently', async () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('perf_large', 8192);
      const data = new Array(2048).fill(1.0);

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await bufferManager.writeBufferViaStaging(buffer, data);
      }
      const end = performance.now();

      const duration = end - start;
      expect(duration).toBeLessThan(500);
    });

    it('should have minimal memory overhead', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('overhead', 64);
      const data = [1.0, 2.0, 3.0, 4.0];

      bufferManager.writeBuffer(buffer, data);

      const info = bufferManager.getMemoryInfo();
      const overhead = (info.used - 16) / info.used;

      expect(overhead).toBeLessThan(0.05);
    });
  });

  describe('Stress Tests', () => {
    it('should create many buffers', () => {
      if (!bufferManager) return;

      const count = 1000;
      for (let i = 0; i < count; i++) {
        bufferManager.createStorageBuffer(`stress_${i}`, 64);
      }

      const info = bufferManager.getMemoryInfo();
      expect(info.allocated).toBe(count * 64);
    });

    it('should write many objects', () => {
      if (!bufferManager) return;

      const count = 10000;
      const buffer = bufferManager.createStorageBuffer('stress_objects', count * 64);
      const objects: SDFObjectData[] = [];

      for (let i = 0; i < count; i++) {
        objects.push({
          type: 1,
          position: [i % 10, (i / 10) % 10, (i / 100) % 10],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        });
      }

      expect(() => {
        bufferManager.writeObjectBuffer(buffer, objects);
      }).not.toThrow();
    });

    it('should handle rapid buffer updates', () => {
      if (!bufferManager) return;

      const buffer = bufferManager.createStorageBuffer('rapid_updates', 64);
      const objects: SDFObjectData[] = [
        {
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      ];

      for (let i = 0; i < 1000; i++) {
        objects[0].position[0] = i % 10;
        bufferManager.writeObjectBuffer(buffer, objects);
      }

      const info = bufferManager.getMemoryInfo();
      expect(info.used).toBeGreaterThan(0);
    });

    it('should not leak memory', () => {
      if (!bufferManager) return;

      const initialInfo = bufferManager.getMemoryInfo();

      for (let i = 0; i < 100; i++) {
        const buffer = bufferManager.createStorageBuffer(`leak_test_${i}`, 64);
        bufferManager.destroyBuffer(`leak_test_${i}`);
      }

      const finalInfo = bufferManager.getMemoryInfo();
      expect(finalInfo.allocated).toBe(initialInfo.allocated);
      expect(finalInfo.used).toBe(initialInfo.used);
    });

    it('should handle buffer recreation', () => {
      if (!bufferManager) return;

      const name = 'recreate_test';

      for (let i = 0; i < 100; i++) {
        const buffer = bufferManager.createStorageBuffer(name, 64);
        bufferManager.destroyBuffer(name);
      }

      const buffer = bufferManager.createStorageBuffer(name, 64);
      expect(buffer).toBeDefined();
    });
  });
});
