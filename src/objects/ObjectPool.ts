/**
 * ObjectPool.ts
 * 
 * Manages a fixed-size pool of SDFObject instances
 * Minimizes memory allocations and GC pressure
 */

import { SDFObject } from './SDFObject.js';
import type { ObjectConfig } from '../types/objects.js';

/**
 * ObjectPool manages a fixed-size pool of SDFObject instances
 */
export class ObjectPool {
  private pool: Array<SDFObject | null>;
  private freeList: number[];
  private activeCount: number;
  private maxSize: number;
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.pool = new Array(maxSize).fill(null);
    this.freeList = [];
    this.activeCount = 0;
    
    for (let i = 0; i < maxSize; i++) {
      this.freeList.push(i);
    }
  }
  
  acquire(config: ObjectConfig): SDFObject | null {
    if (this.freeList.length === 0) {
      return null;
    }
    
    const id = this.freeList.pop()!;
    const object = new SDFObject(id, config);
    this.pool[id] = object;
    this.activeCount++;
    
    return object;
  }
  
  release(object: SDFObject): void {
    const id = object.getId();
    
    if (id < 0 || id >= this.maxSize) {
      throw new Error(`Invalid object ID: ${id}`);
    }
    
    if (this.pool[id] !== object) {
      throw new Error('Object does not belong to this pool');
    }
    
    object.destroy();
    this.pool[id] = null;
    this.freeList.push(id);
    this.activeCount--;
  }
  
  get(id: number): SDFObject | null {
    if (id < 0 || id >= this.maxSize) {
      return null;
    }
    return this.pool[id] ?? null;
  }
  
  getActiveObjects(): SDFObject[] {
    const active: SDFObject[] = [];
    
    for (const obj of this.pool) {
      if (obj && obj.getState() !== 0) {
        active.push(obj);
      }
    }
    
    return active;
  }
  
  getDirtyObjects(): SDFObject[] {
    const dirty: SDFObject[] = [];
    
    for (const obj of this.pool) {
      if (obj && obj.isDirty()) {
        dirty.push(obj);
      }
    }
    
    return dirty;
  }
  
  getActiveCount(): number {
    return this.activeCount;
  }
  
  getFreeCount(): number {
    return this.freeList.length;
  }
  
  getMaxSize(): number {
    return this.maxSize;
  }
  
  forEach(callback: (obj: SDFObject) => void): void {
    for (const obj of this.pool) {
      if (obj && obj.getState() !== 0) {
        callback(obj);
      }
    }
  }
  
  forEachDirty(callback: (obj: SDFObject) => void): void {
    for (const obj of this.pool) {
      if (obj && obj.isDirty()) {
        callback(obj);
      }
    }
  }
  
  clear(): void {
    for (const obj of this.pool) {
      if (obj) {
        obj.destroy();
      }
    }
    
    this.pool.fill(null);
    this.freeList = [];
    this.activeCount = 0;
    
    for (let i = 0; i < this.maxSize; i++) {
      this.freeList.push(i);
    }
  }
}
