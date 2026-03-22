/**
 * ObjectPool.test.ts
 * 
 * Unit tests for ObjectPool class
 */

import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../../src/objects/ObjectPool.js';
import { SDFPrimitive } from '../../src/types/index.js';

describe('ObjectPool', () => {
  it('should acquire and release objects', () => {
    const pool = new ObjectPool(10);
    
    const obj1 = pool.acquire({ type: SDFPrimitive.Sphere });
    expect(obj1).not.toBeNull();
    expect(pool.getActiveCount()).toBe(1);
    
    pool.release(obj1!);
    expect(pool.getActiveCount()).toBe(0);
    expect(pool.getFreeCount()).toBe(10);
  });

  it('should return null when pool is exhausted', () => {
    const pool = new ObjectPool(2);
    
    pool.acquire({ type: SDFPrimitive.Sphere });
    pool.acquire({ type: SDFPrimitive.Sphere });
    const obj3 = pool.acquire({ type: SDFPrimitive.Sphere });
    
    expect(obj3).toBeNull();
  });

  it('should track dirty objects', () => {
    const pool = new ObjectPool(10);
    const obj = pool.acquire({ type: SDFPrimitive.Sphere })!;
    
    obj.clearDirty();
    obj.setPosition(1, 0, 0);
    
    const dirty = pool.getDirtyObjects();
    expect(dirty).toContain(obj);
  });

  it('should get active objects', () => {
    const pool = new ObjectPool(10);
    
    const obj1 = pool.acquire({ type: SDFPrimitive.Sphere });
    const obj2 = pool.acquire({ type: SDFPrimitive.Box });
    
    const active = pool.getActiveObjects();
    expect(active).toHaveLength(2);
    expect(active).toContain(obj1);
    expect(active).toContain(obj2);
  });

  it('should get object by id', () => {
    const pool = new ObjectPool(10);
    const obj = pool.acquire({ type: SDFPrimitive.Sphere })!;
    
    const retrieved = pool.get(obj.getId());
    expect(retrieved).toBe(obj);
  });

  it('should return null for invalid id', () => {
    const pool = new ObjectPool(10);
    
    const retrieved = pool.get(999);
    expect(retrieved).toBeNull();
  });

  it('should iterate over active objects', () => {
    const pool = new ObjectPool(10);
    const obj1 = pool.acquire({ type: SDFPrimitive.Sphere });
    const obj2 = pool.acquire({ type: SDFPrimitive.Box });
    
    let count = 0;
    pool.forEach(() => count++);
    
    expect(count).toBe(2);
  });

  it('should iterate over dirty objects', () => {
    const pool = new ObjectPool(10);
    const obj1 = pool.acquire({ type: SDFPrimitive.Sphere });
    const obj2 = pool.acquire({ type: SDFPrimitive.Box });
    
    obj1.clearDirty();
    obj2.clearDirty();
    obj1.setPosition(1, 0, 0);
    
    let count = 0;
    pool.forEachDirty(() => count++);
    
    expect(count).toBe(1);
  });

  it('should clear all objects', () => {
    const pool = new ObjectPool(10);
    
    pool.acquire({ type: SDFPrimitive.Sphere });
    pool.acquire({ type: SDFPrimitive.Box });
    pool.acquire({ type: SDFPrimitive.Torus });
    
    pool.clear();
    
    expect(pool.getActiveCount()).toBe(0);
    expect(pool.getFreeCount()).toBe(10);
  });

  it('should throw error when releasing invalid object', () => {
    const pool = new ObjectPool(10);
    const obj = pool.acquire({ type: SDFPrimitive.Sphere })!;
    
    pool.release(obj);
    
    expect(() => pool.release(obj)).toThrow('Object does not belong to this pool');
  });

  it('should throw error for invalid object id', () => {
    const pool = new ObjectPool(10);
    
    expect(() => pool.release({ getId: () => 999 } as any)).toThrow('Invalid object ID');
  });

  it('should get max size', () => {
    const pool = new ObjectPool(42);
    
    expect(pool.getMaxSize()).toBe(42);
  });
});
