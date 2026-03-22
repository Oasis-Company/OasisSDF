/**
 * DeviceManager.test.ts
 * 
 * Unit tests for DeviceManager class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeviceManager, WebGPUError } from '../../src/engine/DeviceManager';

describe('DeviceManager', () => {
  let canvas: HTMLCanvasElement;
  let manager: DeviceManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    manager = new DeviceManager();
  });

  afterEach(() => {
    manager.cleanup();
  });

  describe('isSupported', () => {
    it('should return true when WebGPU is available', () => {
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        expect(DeviceManager.isSupported()).toBe(true);
      }
    });

    it('should return false when WebGPU is not available', () => {
      const originalGpu = (navigator as any).gpu;
      (navigator as any).gpu = undefined;

      expect(DeviceManager.isSupported()).toBe(false);

      (navigator as any).gpu = originalGpu;
    });

    it('should return false when navigator is undefined', () => {
      const originalNavigator = global.navigator;
      (global as any).navigator = undefined;

      expect(DeviceManager.isSupported()).toBe(false);

      (global as any).navigator = originalNavigator;
    });
  });

  describe('getSupportInfo', () => {
    it('should return unsupported info when WebGPU is not available', async () => {
      const originalGpu = (navigator as any).gpu;
      (navigator as any).gpu = undefined;

      const info = await DeviceManager.getSupportInfo();
      expect(info.supported).toBe(false);
      expect(info.reason).toContain('WebGPU is not supported');

      (navigator as any).gpu = originalGpu;
    });

    it('should return supported info when WebGPU is available', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const info = await DeviceManager.getSupportInfo();
      expect(info.supported).toBe(true);
      expect(info.adapterInfo).toBeDefined();
      expect(info.features).toBeDefined();
      expect(info.limits).toBeDefined();
    });

    it('should handle adapter request errors', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const originalRequestAdapter = navigator.gpu!.requestAdapter;
      (navigator.gpu as any).requestAdapter = vi.fn().mockRejectedValue(new Error('Test error'));

      const info = await DeviceManager.getSupportInfo();
      expect(info.supported).toBe(false);
      expect(info.reason).toContain('Failed to query adapter');

      (navigator.gpu as any).requestAdapter = originalRequestAdapter;
    });
  });

  describe('initialize', () => {
    it('should initialize successfully on supported browsers', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await expect(manager.initialize(canvas)).resolves.not.toThrow();
      expect(manager.isReady()).toBe(true);
    });

    it('should throw WebGPUError on unsupported browsers', async () => {
      const originalGpu = (navigator as any).gpu;
      (navigator as any).gpu = undefined;

      await expect(manager.initialize(canvas)).rejects.toThrow(WebGPUError);

      (navigator as any).gpu = originalGpu;
    });

    it('should configure canvas context', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const context = manager.getContext();
      expect(context).toBeDefined();
    });

    it('should get preferred format', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const format = manager.getPreferredFormat();
      expect(['bgra8unorm', 'rgba8unorm']).toContain(format);
    });

    it('should warn when already initialized', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await manager.initialize(canvas);
      await manager.initialize(canvas);

      expect(consoleSpy).toHaveBeenCalledWith('DeviceManager is already initialized. Call cleanup() first if you want to reinitialize.');

      consoleSpy.mockRestore();
    });

    it('should cleanup on initialization failure', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const originalRequestAdapter = navigator.gpu!.requestAdapter;
      (navigator.gpu as any).requestAdapter = vi.fn().mockRejectedValue(new Error('Test error'));

      await expect(manager.initialize(canvas)).rejects.toThrow(WebGPUError);
      expect(manager.isReady()).toBe(false);

      (navigator.gpu as any).requestAdapter = originalRequestAdapter;
    });
  });

  describe('getDevice', () => {
    it('should return GPU device after initialization', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const device = manager.getDevice();
      expect(device).toBeDefined();
    });

    it('should throw error when not initialized', () => {
      expect(() => manager.getDevice()).toThrow(WebGPUError);
      expect(() => manager.getDevice()).toThrow('Device not initialized');
    });
  });

  describe('getContext', () => {
    it('should return GPU context after initialization', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const context = manager.getContext();
      expect(context).toBeDefined();
    });

    it('should throw error when not initialized', () => {
      expect(() => manager.getContext()).toThrow(WebGPUError);
      expect(() => manager.getContext()).toThrow('Context not initialized');
    });
  });

  describe('getAdapter', () => {
    it('should return GPU adapter after initialization', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const adapter = manager.getAdapter();
      expect(adapter).toBeDefined();
    });

    it('should throw error when not initialized', () => {
      expect(() => manager.getAdapter()).toThrow(WebGPUError);
      expect(() => manager.getAdapter()).toThrow('Adapter not initialized');
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(manager.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      expect(manager.isReady()).toBe(true);
    });

    it('should return false after cleanup', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      manager.cleanup();
      expect(manager.isReady()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      manager.cleanup();

      expect(manager.isReady()).toBe(false);
      expect(() => manager.getDevice()).toThrow();
      expect(() => manager.getContext()).toThrow();
      expect(() => manager.getAdapter()).toThrow();
    });

    it('should handle multiple cleanup calls', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      manager.cleanup();
      manager.cleanup(); // Should not throw

      expect(manager.isReady()).toBe(false);
    });
  });

  describe('getMemoryInfo', () => {
    it('should return zero memory info when not initialized', () => {
      const info = manager.getMemoryInfo();
      expect(info.used).toBe(0);
      expect(info.allocated).toBe(0);
    });

    it('should return memory info when initialized', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      const info = manager.getMemoryInfo();
      expect(info).toBeDefined();
      expect(typeof info.used).toBe('number');
      expect(typeof info.allocated).toBe('number');
    });
  });

  describe('waitForDeviceRestore', () => {
    it('should resolve immediately if device is ready', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      await expect(manager.waitForDeviceRestore()).resolves.not.toThrow();
    });

    it('should wait for device restoration', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas);
      
      // Simulate device loss
      (manager as any).isInitialized = false;
      (manager as any).deviceLostPromise = null;

      // This should wait for restoration
      const restorePromise = manager.waitForDeviceRestore();
      
      // Trigger restoration
      (manager as any).deviceLostResolver?.();

      await expect(restorePromise).rejects.toThrow(); // Will fail because canvas is not available
    });
  });

  describe('options', () => {
    it('should accept power preference option', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas, {
        powerPreference: 'low-power'
      });

      expect(manager.isReady()).toBe(true);
    });

    it('should accept required features option', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      await manager.initialize(canvas, {
        requiredFeatures: []
      });

      expect(manager.isReady()).toBe(true);
    });

    it('should call onDeviceLost callback', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const onDeviceLost = vi.fn();
      await manager.initialize(canvas, { onDeviceLost });

      // Simulate device loss
      const mockInfo = { reason: 'destroyed', message: 'Device destroyed' } as GPUDeviceLostInfo;
      (manager as any).handleDeviceLoss(mockInfo);

      expect(onDeviceLost).toHaveBeenCalledWith(mockInfo);
    });

    it('should call onDeviceRestored callback', async () => {
      if (!DeviceManager.isSupported()) {
        return;
      }

      const onDeviceRestored = vi.fn();
      await manager.initialize(canvas, { onDeviceRestored });

      // Simulate device restoration
      (manager as any).options = { onDeviceRestored };
      await (manager as any).reinitialize();

      expect(onDeviceRestored).toHaveBeenCalled();
    });
  });
});
