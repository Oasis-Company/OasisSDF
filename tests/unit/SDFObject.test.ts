/**
 * SDFObject.test.ts
 * 
 * Unit tests for SDFObject class
 */

import { describe, it, expect } from 'vitest';
import { SDFObject } from '../../src/objects/SDFObject.js';
import { ObjectState, ObjectChangeFlags } from '../../src/types/objects.js';
import { SDFPrimitive } from '../../src/types/index.js';

describe('SDFObject', () => {
  it('should create object with default values', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    
    expect(obj.getState()).toBe(ObjectState.ACTIVE);
    expect(obj.isDirty()).toBe(true);
    expect(obj.isVisible()).toBe(true);
  });

  it('should track transform changes', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    obj.clearDirty();
    
    obj.setPosition(1, 2, 3);
    
    expect(obj.isDirty()).toBe(true);
    expect(obj.getChangeFlags() & ObjectChangeFlags.TRANSFORM).toBeTruthy();
  });

  it('should not mark dirty if position unchanged', () => {
    const obj = new SDFObject(0, { 
      type: SDFPrimitive.Sphere,
      transform: { position: [1, 2, 3] }
    });
    obj.clearDirty();
    
    obj.setPosition(1, 2, 3);
    
    expect(obj.isDirty()).toBe(false);
  });

  it('should track material changes', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    obj.clearDirty();
    
    obj.setColor(0.5, 0.5, 0.5);
    
    expect(obj.isDirty()).toBe(true);
    expect(obj.getChangeFlags() & ObjectChangeFlags.MATERIAL).toBeTruthy();
  });

  it('should track visibility changes', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    obj.clearDirty();
    
    obj.setVisible(false);
    
    expect(obj.isDirty()).toBe(true);
    expect(obj.getChangeFlags() & ObjectChangeFlags.VISIBILITY).toBeTruthy();
  });

  it('should export correct data format', () => {
    const obj = new SDFObject(0, {
      type: SDFPrimitive.Sphere,
      transform: {
        position: [1, 2, 3],
        scale: [2, 2, 2]
      }
    });
    
    const data = obj.toObjectData();
    
    expect(data.type).toBe(SDFPrimitive.Sphere);
    expect(data.position).toEqual([1, 2, 3]);
    expect(data.scale).toEqual([2, 2, 2]);
  });

  it('should export material data', () => {
    const obj = new SDFObject(0, {
      type: SDFPrimitive.Sphere,
      material: {
        color: [0.5, 0.5, 0.5],
        metallic: 0.8,
        roughness: 0.2
      }
    });
    
    const material = obj.toMaterialData();
    
    expect(material.color).toEqual([0.5, 0.5, 0.5]);
    expect(material.metallic).toBe(0.8);
    expect(material.roughness).toBe(0.2);
  });

  it('should clear dirty flags', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    
    obj.clearDirty();
    
    expect(obj.isDirty()).toBe(false);
    expect(obj.getChangeFlags()).toBe(ObjectChangeFlags.NONE);
  });

  it('should destroy object', () => {
    const obj = new SDFObject(0, { type: SDFPrimitive.Sphere });
    
    obj.destroy();
    
    expect(obj.getState()).toBe(ObjectState.FREE);
    expect(obj.getChangeFlags()).toBe(ObjectChangeFlags.NONE);
  });

  it('should get id', () => {
    const obj = new SDFObject(42, { type: SDFPrimitive.Sphere });
    
    expect(obj.getId()).toBe(42);
  });
});
