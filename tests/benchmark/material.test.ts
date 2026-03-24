/**
 * Material System Performance Benchmarks
 * 
 * Measures performance of material creation, updates, and buffer synchronization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MaterialManager } from '../../src/engine/MaterialManager';
import { PBRMaterial } from '../../src/objects/PBRMaterial';
import { BufferManager } from '../../src/engine/BufferManager';
import { MaterialBuffer } from '../../src/engine/MaterialBuffer';
import { DeviceManager } from '../../src/engine/DeviceManager';

// Mock device for testing
class MockDevice {
  createBuffer() {
    return {
      destroy: () => {}
    };
  }
}

class MockBufferManager extends BufferManager {
  constructor() {
    super(new MockDevice() as any);
  }

  createStorageBuffer(name: string, size: number) {
    return { name, size };
  }

  writeMaterialBuffer(buffer: any, materials: any[]) {
    // Simulate buffer write
  }

  getBuffer(name: string) {
    return { name };
  }

  destroyBuffer(name: string) {
    // Simulate buffer destruction
  }
}

describe('Material System Performance Benchmarks', () => {
  let materialManager: MaterialManager;
  let bufferManager: MockBufferManager;
  let materialBuffer: MaterialBuffer;
  let startTime: number;

  beforeEach(() => {
    materialManager = new MaterialManager(10000);
    bufferManager = new MockBufferManager();
    materialBuffer = new MaterialBuffer(bufferManager, 10000);
    materialBuffer.setMaterialManager(materialManager);
  });

  afterEach(() => {
    materialManager.clear();
  });

  function measureTime<T>(fn: () => T): { result: T; time: number } {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, time: end - start };
  }

  it('should benchmark material creation performance', () => {
    const count = 1000;
    const materialIds: number[] = [];

    const { time } = measureTime(() => {
      for (let i = 0; i < count; i++) {
        const materialId = materialManager.createMaterial({
          color: [Math.random(), Math.random(), Math.random()],
          metallic: Math.random(),
          roughness: Math.random(),
          reflectance: 0.04,
          emission: [0, 0, 0],
          emissionIntensity: 0,
          ambientOcclusion: 1
        });
        materialIds.push(materialId);
      }
    });

    console.log(`Created ${count} materials in ${time.toFixed(2)}ms`);
    console.log(`Average creation time: ${(time / count).toFixed(4)}ms per material`);
    
    expect(materialManager.getMaterialCount()).toBe(count);
    expect(time).toBeLessThan(1000); // Should take less than 1 second
  });

  it('should benchmark material update performance', () => {
    // Create initial materials
    const count = 500;
    const materialIds: number[] = [];

    for (let i = 0; i < count; i++) {
      const materialId = materialManager.createMaterial({
        color: [0.5, 0.5, 0.5],
        metallic: 0.0,
        roughness: 0.5
      });
      materialIds.push(materialId);
    }

    // Benchmark updates
    const { time } = measureTime(() => {
      for (const materialId of materialIds) {
        materialManager.updateMaterial(materialId, {
          color: [Math.random(), Math.random(), Math.random()],
          metallic: Math.random(),
          roughness: Math.random()
        });
      }
    });

    console.log(`Updated ${count} materials in ${time.toFixed(2)}ms`);
    console.log(`Average update time: ${(time / count).toFixed(4)}ms per material`);
    
    expect(time).toBeLessThan(500); // Should take less than 500ms
  });

  it('should benchmark buffer synchronization performance', () => {
    // Create materials
    const count = 1000;

    for (let i = 0; i < count; i++) {
      materialManager.createMaterial({
        color: [Math.random(), Math.random(), Math.random()],
        metallic: Math.random(),
        roughness: Math.random()
      });
    }

    // Benchmark buffer update
    const { time } = measureTime(() => {
      materialBuffer.update();
    });

    console.log(`Synced ${count} materials to buffer in ${time.toFixed(2)}ms`);
    console.log(`Average sync time: ${(time / count).toFixed(4)}ms per material`);
    
    expect(time).toBeLessThan(200); // Should take less than 200ms
  });

  it('should benchmark PBRMaterial instantiation', () => {
    const count = 500;
    const materials: PBRMaterial[] = [];

    const { time } = measureTime(() => {
      for (let i = 0; i < count; i++) {
        const material = new PBRMaterial({
          color: [Math.random(), Math.random(), Math.random()],
          metallic: Math.random(),
          roughness: Math.random()
        });
        materials.push(material);
      }
    });

    console.log(`Created ${count} PBRMaterial instances in ${time.toFixed(2)}ms`);
    console.log(`Average instantiation time: ${(time / count).toFixed(4)}ms per material`);
    
    expect(materials.length).toBe(count);
    expect(time).toBeLessThan(500); // Should take less than 500ms
  });

  it('should benchmark material reference counting', () => {
    const count = 1000;
    const materialIds: number[] = [];

    // Create materials
    for (let i = 0; i < count; i++) {
      const materialId = materialManager.createMaterial({
        color: [0.5, 0.5, 0.5],
        metallic: 0.0,
        roughness: 0.5
      });
      materialIds.push(materialId);
    }

    // Benchmark reference operations
    const { time } = measureTime(() => {
      // Add references
      for (const materialId of materialIds) {
        materialManager.referenceMaterial(materialId);
      }
      
      // Release references
      for (const materialId of materialIds) {
        materialManager.releaseMaterial(materialId);
      }
    });

    console.log(`Performed reference operations on ${count} materials in ${time.toFixed(2)}ms`);
    console.log(`Average reference operation time: ${(time / (count * 2)).toFixed(4)}ms per operation`);
    
    expect(materialManager.getMaterialCount()).toBe(count);
    expect(time).toBeLessThan(100); // Should take less than 100ms
  });

  it('should benchmark material destruction', () => {
    const count = 1000;
    const materialIds: number[] = [];

    // Create materials
    for (let i = 0; i < count; i++) {
      const materialId = materialManager.createMaterial({
        color: [0.5, 0.5, 0.5],
        metallic: 0.0,
        roughness: 0.5
      });
      materialIds.push(materialId);
    }

    // Benchmark destruction
    const { time } = measureTime(() => {
      for (const materialId of materialIds) {
        materialManager.releaseMaterial(materialId);
      }
    });

    console.log(`Destroyed ${count} materials in ${time.toFixed(2)}ms`);
    console.log(`Average destruction time: ${(time / count).toFixed(4)}ms per material`);
    
    expect(materialManager.getMaterialCount()).toBe(0);
    expect(time).toBeLessThan(100); // Should take less than 100ms
  });
});
