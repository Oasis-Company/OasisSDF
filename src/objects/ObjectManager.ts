/**
 * ObjectManager.ts
 * 
 * Orchestrates object lifecycle and buffer synchronization
 * Bridges high-level object API with low-level buffer management
 */

import { SDFObject } from './SDFObject.js';
import { ObjectPool } from './ObjectPool.js';
import type { BufferManager } from '../engine/BufferManager.js';
import type {
  ObjectConfig,
  ObjectManagerStats
} from '../types/objects.js';
import {
  SDFPrimitive,
  ValidationError
} from '../types/index.js';

/**
 * ObjectManager orchestrates object lifecycle and buffer synchronization
 */
export class ObjectManager {
  private pool: ObjectPool;
  private bufferManager: BufferManager;
  
  private batchUpdates: boolean;
  private dirtyObjects: Set<SDFObject>;
  
  constructor(maxObjects: number, bufferManager: BufferManager) {
    this.pool = new ObjectPool(maxObjects);
    this.bufferManager = bufferManager;
    this.batchUpdates = false;
    this.dirtyObjects = new Set();
  }
  
  createObject(config: ObjectConfig): SDFObject {
    const object = this.pool.acquire(config);
    
    if (!object) {
      throw new ValidationError('Maximum object count reached');
    }
    
    if (!this.batchUpdates) {
      this.syncObject(object);
    } else {
      this.dirtyObjects.add(object);
    }
    
    return object;
  }
  
  createSphere(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Sphere,
      ...config
    });
  }
  
  createBox(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Box,
      ...config
    });
  }
  
  createTorus(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Torus,
      ...config
    });
  }
  
  createCapsule(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Capsule,
      ...config
    });
  }
  
  createCylinder(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Cylinder,
      ...config
    });
  }
  
  createCone(config: Partial<ObjectConfig> = {}): SDFObject {
    return this.createObject({
      type: SDFPrimitive.Cone,
      ...config
    });
  }
  
  destroyObject(object: SDFObject): void {
    this.pool.release(object);
    this.dirtyObjects.delete(object);
  }
  
  destroyAll(): void {
    this.pool.clear();
    this.dirtyObjects.clear();
  }
  
  syncObjects(): void {
    const startTime = performance.now();
    
    const dirty = this.pool.getDirtyObjects();
    
    if (dirty.length === 0) {
      return;
    }
    
    const objectData = dirty.map(obj => obj.toObjectData());
    const materialData = dirty.map(obj => obj.toMaterialData());
    
    const objectBuffer = this.bufferManager.getBuffer('objects');
    const materialBuffer = this.bufferManager.getBuffer('materials');
    
    if (objectBuffer && materialBuffer) {
      this.bufferManager.writeObjectBuffer(objectBuffer, objectData);
      this.bufferManager.writeMaterialBuffer(materialBuffer, materialData);
    }
    
    dirty.forEach(obj => obj.clearDirty());
    this.dirtyObjects.clear();
    
    this.lastSyncTime = performance.now() - startTime;
  }
  
  syncObject(object: SDFObject): void {
    if (!object.isDirty()) {
      return;
    }
    
    const objectBuffer = this.bufferManager.getBuffer('objects');
    const materialBuffer = this.bufferManager.getBuffer('materials');
    
    if (objectBuffer && materialBuffer) {
      const objectData = [object.toObjectData()];
      const materialData = [object.toMaterialData()];
      
      this.bufferManager.writeObjectBuffer(objectBuffer, objectData);
      this.bufferManager.writeMaterialBuffer(materialBuffer, materialData);
    }
    
    object.clearDirty();
  }
  
  setBatchUpdates(enabled: boolean): void {
    this.batchUpdates = enabled;
  }
  
  getObject(id: number): SDFObject | null {
    return this.pool.get(id);
  }
  
  getAllObjects(): SDFObject[] {
    return this.pool.getActiveObjects();
  }
  
  getObjectCount(): number {
    return this.pool.getActiveCount();
  }
  
  getStats(): ObjectManagerStats {
    return {
      totalObjects: this.pool.getMaxSize(),
      activeObjects: this.pool.getActiveCount(),
      dirtyObjects: this.pool.getDirtyObjects().length,
      freeSlots: this.pool.getFreeCount(),
      lastSyncTime: this.lastSyncTime
    };
  }
  
  private lastSyncTime: number = 0;
}
