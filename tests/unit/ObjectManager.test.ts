/**
 * ObjectManager.test.ts
 * 
 * Unit tests for ObjectManager class
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectManager } from '../../src/objects/ObjectManager.js';
import { SDFPrimitive } from '../../src/types/index.js';
import { ValidationError } from '../../src/types/index.js';

describe('ObjectManager', () => {
  let mockBufferManager: any;
  let manager: ObjectManager;

  beforeEach(() => {
    mockBufferManager = {
      getBuffer: vi.fn(() => ({})),
      writeObjectBuffer: vi.fn(),
      writeMaterialBuffer: vi.fn()
    };
    manager = new ObjectManager(10, mockBufferManager);
  });

  it('should create objects using factory methods', () => {
    const sphere = manager.createSphere();
    expect(sphere).not.toBeNull();
    
    const box = manager.createBox();
    expect(box).not.toBeNull();
    
    const torus = manager.createTorus();
    expect(torus).not.toBeNull();
    
    const capsule = manager.createCapsule();
    expect(capsule).not.toBeNull();
    
    const cylinder = manager.createCylinder();
    expect(cylinder).not.toBeNull();
    
    const cone = manager.createCone();
    expect(cone).not.toBeNull();
  });

  it('should sync dirty objects', () => {
    const sphere = manager.createSphere();
    sphere.setPosition(1, 2, 3);
    
    manager.syncObjects();
    
    expect(sphere.isDirty()).toBe(false);
    expect(mockBufferManager.writeObjectBuffer).toHaveBeenCalled();
    expect(mockBufferManager.writeMaterialBuffer).toHaveBeenCalled();
  });

  it('should enforce max object limit', () => {
    manager = new ObjectManager(2, mockBufferManager);
    
    manager.createSphere();
    manager.createSphere();
    
    expect(() => manager.createSphere()).toThrow('Maximum object count reached');
  });

  it('should destroy object', () => {
    const sphere = manager.createSphere();
    const id = sphere.getId();
    
    manager.destroyObject(sphere);
    
    expect(manager.getObject(id)).toBeNull();
    expect(manager.getObjectCount()).toBe(0);
  });

  it('should destroy all objects', () => {
    manager.createSphere();
    manager.createBox();
    manager.createTorus();
    
    manager.destroyAll();
    
    expect(manager.getObjectCount()).toBe(0);
  });

  it('should get object by id', () => {
    const sphere = manager.createSphere();
    const id = sphere.getId();
    
    const retrieved = manager.getObject(id);
    
    expect(retrieved).toBe(sphere);
  });

  it('should get all objects', () => {
    const sphere = manager.createSphere();
    const box = manager.createBox();
    
    const all = manager.getAllObjects();
    
    expect(all).toHaveLength(2);
    expect(all).toContain(sphere);
    expect(all).toContain(box);
  });

  it('should get object count', () => {
    expect(manager.getObjectCount()).toBe(0);
    
    manager.createSphere();
    manager.createBox();
    
    expect(manager.getObjectCount()).toBe(2);
  });

  it('should get stats', () => {
    manager.createSphere();
    manager.createBox();
    
    const stats = manager.getStats();
    
    expect(stats.totalObjects).toBe(10);
    expect(stats.activeObjects).toBe(2);
    expect(stats.freeSlots).toBe(8);
  });

  it('should set batch updates', () => {
    manager.setBatchUpdates(true);
    
    const sphere = manager.createSphere();
    sphere.setPosition(1, 2, 3);
    
    expect(mockBufferManager.writeObjectBuffer).not.toHaveBeenCalled();
    
    manager.syncObjects();
    
    expect(mockBufferManager.writeObjectBuffer).toHaveBeenCalled();
  });

  it('should sync single object', () => {
    const sphere = manager.createSphere();
    sphere.setPosition(1, 2, 3);
    
    manager.syncObject(sphere);
    
    expect(sphere.isDirty()).toBe(false);
    expect(mockBufferManager.writeObjectBuffer).toHaveBeenCalled();
  });
});
