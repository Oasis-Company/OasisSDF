/**
 * BufferManager.test.ts
 * 
 * Unit tests for BufferManager class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BufferManager } from '../../src/engine/BufferManager';
import { DeviceManager } from '../../src/engine/DeviceManager';
import { BufferError, ValidationError } from '../../src/types/index.js';

describe('BufferManager', () => {
  let device: GPUDevice;
  let manager: BufferManager;
  let originalGpu: any;

  beforeEach(() => {
    originalGpu = (navigator as any).gpu;

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }

    if (DeviceManager.isSupported()) {
      const deviceManager = new DeviceManager();
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      deviceManager.initialize(canvas);
      device = deviceManager.getDevice();
      manager = new BufferManager(device);
    }
  });

  afterEach(() => {
    if (manager) {
      try {
        manager.cleanup();
      } catch (error) {
      }
    }

    if (originalGpu !== (navigator as any).gpu) {
      (navigator as any).gpu = originalGpu;
    }
  });

  describe('Buffer Creation', () => {
    it('should create storage buffer', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('test_storage', 64);
      expect(buffer).toBeDefined();
      expect(buffer.size).toBe(64);
      expect(buffer.usage).toBe(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    });

    it('should create uniform buffer', () => {
      if (!manager) return;

      const buffer = manager.createUniformBuffer('test_uniform', 32);
      expect(buffer).toBeDefined();
      expect(buffer.size).toBe(32);
      expect(buffer.usage).toBe(GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    });

    it('should create staging buffer', () => {
      if (!manager) return;

      const buffer = manager.createStagingBuffer('test_staging', 64);
      expect(buffer).toBeDefined();
      expect(buffer.size).toBe(64);
      expect(buffer.usage).toBe(GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC);
    });

    it('should throw error for duplicate buffer names', () => {
      if (!manager) return;

      manager.createStorageBuffer('duplicate', 64);
      expect(() => {
        manager.createStorageBuffer('duplicate', 64);
      }).toThrow(BufferError);
    });

    it('should throw error for invalid alignment', () => {
      if (!manager) return;

      expect(() => {
        manager.createStorageBuffer('invalid', 15);
      }).toThrow(ValidationError);
    });
  });

  describe('Buffer Write', () => {
    it('should write small data directly', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('small_write', 64);
      const data = [1.0, 2.0, 3.0, 4.0];

      expect(() => {
        manager.writeBuffer(buffer, data);
      }).not.toThrow();
    });

    it('should write large data via staging', async () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('large_write', 8192);
      const data = new Array(2048).fill(1.0);

      await expect(manager.writeBufferViaStaging(buffer, data)).resolves.not.toThrow();
    });

    it('should write object buffer with alignment', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('objects', 128);
      const objects = [
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
        manager.writeObjectBuffer(buffer, objects);
      }).not.toThrow();
    });

    it('should write material buffer with alignment', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('materials', 96);
      const materials = [
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
        manager.writeMaterialBuffer(buffer, materials);
      }).not.toThrow();
    });

    it('should write uniform buffer with alignment', () => {
      if (!manager) return;

      const buffer = manager.createUniformBuffer('uniforms', 32);
      const uniforms = {
        time: 1.5,
        frame: 100,
        objectCount: 10,
        resolution: [800, 600]
      };

      expect(() => {
        manager.writeUniformBuffer(buffer, uniforms);
      }).not.toThrow();
    });

    it('should write camera buffer with alignment', () => {
      if (!manager) return;

      const buffer = manager.createUniformBuffer('camera', 80);
      const camera = {
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: 1.57,
        near: 0.1,
        far: 100
      };

      expect(() => {
        manager.writeCameraBuffer(buffer, camera);
      }).not.toThrow();
    });
  });

  describe('Buffer Management', () => {
    it('should get existing buffer', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('get_test', 64);
      const retrieved = manager.getBuffer('get_test');

      expect(retrieved).toBe(buffer);
    });

    it('should return undefined for non-existent buffer', () => {
      if (!manager) return;

      const retrieved = manager.getBuffer('non_existent');
      expect(retrieved).toBeUndefined();
    });

    it('should destroy specific buffer', () => {
      if (!manager) return;

      manager.createStorageBuffer('destroy_test', 64);
      manager.destroyBuffer('destroy_test');

      const retrieved = manager.getBuffer('destroy_test');
      expect(retrieved).toBeUndefined();
    });

    it('should destroy all buffers', () => {
      if (!manager) return;

      manager.createStorageBuffer('destroy_all_1', 64);
      manager.createStorageBuffer('destroy_all_2', 64);
      manager.destroyAll();

      expect(manager.getBuffer('destroy_all_1')).toBeUndefined();
      expect(manager.getBuffer('destroy_all_2')).toBeUndefined();
    });
  });

  describe('Memory Tracking', () => {
    it('should track allocated memory', () => {
      if (!manager) return;

      manager.createStorageBuffer('mem_alloc_1', 64);
      manager.createStorageBuffer('mem_alloc_2', 32);

      const info = manager.getMemoryInfo();
      expect(info.allocated).toBe(96);
    });

    it('should track used memory', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('mem_used', 64);
      const data = [1.0, 2.0, 3.0, 4.0];

      manager.writeBuffer(buffer, data);

      const info = manager.getMemoryInfo();
      expect(info.used).toBeGreaterThan(0);
    });

    it('should update memory usage on writes', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('mem_update', 64);
      const data1 = [1.0, 2.0, 3.0, 4.0];
      const data2 = [5.0, 6.0, 7.0, 8.0];

      manager.writeBuffer(buffer, data1);
      const info1 = manager.getMemoryInfo();

      manager.writeBuffer(buffer, data2);
      const info2 = manager.getMemoryInfo();

      expect(info2.used).toBeGreaterThan(info1.used);
    });

    it('should reset memory on cleanup', () => {
      if (!manager) return;

      manager.createStorageBuffer('mem_cleanup', 64);
      manager.cleanup();

      const info = manager.getMemoryInfo();
      expect(info.used).toBe(0);
      expect(info.allocated).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should validate 16-byte alignment', () => {
      if (!manager) return;

      expect(() => {
        manager.validateAlignment(16);
      }).not.toThrow();

      expect(() => {
        manager.validateAlignment(32);
      }).not.toThrow();

      expect(() => {
        manager.validateAlignment(15);
      }).toThrow(ValidationError);
    });

    it('should reject non-aligned sizes', () => {
      if (!manager) return;

      expect(() => {
        manager.createStorageBuffer('non_aligned', 15);
      }).toThrow(ValidationError);
    });

    it('should validate buffer bounds', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('bounds_test', 64);

      expect(() => {
        manager.validateBounds(buffer, 0, 64);
      }).not.toThrow();

      expect(() => {
        manager.validateBounds(buffer, 0, 65);
      }).toThrow(ValidationError);
    });

    it('should reject out-of-bounds writes', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('oob_test', 64);
      const data = new Array(17).fill(1.0);

      expect(() => {
        manager.writeBuffer(buffer, data);
      }).toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    it('should handle buffer creation failures', () => {
      if (!manager) return;

      expect(() => {
        manager.createStorageBuffer('fail', -1);
      }).toThrow();
    });

    it('should handle write failures', () => {
      if (!manager) return;

      const buffer = manager.createStorageBuffer('write_fail', 64);
      const data = new Array(10000).fill(1.0);

      expect(() => {
        manager.writeBuffer(buffer, data);
      }).toThrow();
    });

    it('should handle cleanup errors', () => {
      if (!manager) return;

      expect(() => {
        manager.cleanup();
      }).not.toThrow();
    });
  });
});
