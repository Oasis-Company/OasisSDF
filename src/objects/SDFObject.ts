/**
 * SDFObject.ts
 * 
 * Represents a single SDF primitive in the scene
 * Manages its own state and tracks changes for efficient updates
 */

import { vec3 } from 'gl-matrix';
import type {
  SDFObjectData,
  MaterialData,
  SDFPrimitive
} from '../types/index.js';
import {
  ObjectState,
  type ObjectConfig,
  ObjectChangeFlags
} from '../types/objects.js';

/**
 * SDFObject represents a single SDF primitive in the scene
 */
export class SDFObject {
  private id: number;
  private state: ObjectState;
  private changeFlags: ObjectChangeFlags;
  
  private position: vec3;
  private rotation: vec3;
  private scale: vec3;
  
  private material: MaterialData;
  
  private type: SDFPrimitive;
  private visible: boolean;
  
  constructor(id: number, config: ObjectConfig) {
    this.id = id;
    this.state = ObjectState.ACTIVE;
    this.changeFlags = ObjectChangeFlags.ALL;
    
    this.type = config.type;
    this.position = vec3.fromValues(...(config.transform?.position ?? [0, 0, 0]));
    this.rotation = vec3.fromValues(...(config.transform?.rotation ?? [0, 0, 0]));
    this.scale = vec3.fromValues(...(config.transform?.scale ?? [1, 1, 1]));
    
    this.material = {
      color: config.material?.color ?? [1, 1, 1],
      metallic: config.material?.metallic ?? 0.5,
      roughness: config.material?.roughness ?? 0.5
    };
    
    this.visible = config.visible ?? true;
  }
  
  getId(): number {
    return this.id;
  }
  
  setPosition(x: number, y: number, z: number): void {
    if (this.position[0] !== x || this.position[1] !== y || this.position[2] !== z) {
      vec3.set(this.position, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  
  setRotation(x: number, y: number, z: number): void {
    if (this.rotation[0] !== x || this.rotation[1] !== y || this.rotation[2] !== z) {
      vec3.set(this.rotation, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  
  setScale(x: number, y: number, z: number): void {
    if (this.scale[0] !== x || this.scale[1] !== y || this.scale[2] !== z) {
      vec3.set(this.scale, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  
  getColor(): [number, number, number] {
    return this.material.color;
  }
  
  setColor(r: number, g: number, b: number): void {
    if (this.material.color[0] !== r || this.material.color[1] !== g || this.material.color[2] !== b) {
      this.material.color = [r, g, b];
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  
  setMetallic(value: number): void {
    if (this.material.metallic !== value) {
      this.material.metallic = value;
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  
  setRoughness(value: number): void {
    if (this.material.roughness !== value) {
      this.material.roughness = value;
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  
  setVisible(visible: boolean): void {
    if (this.visible !== visible) {
      this.visible = visible;
      this.markDirty(ObjectChangeFlags.VISIBILITY);
    }
  }
  
  isVisible(): boolean {
    return this.visible;
  }
  
  getState(): ObjectState {
    return this.state;
  }
  
  setState(state: ObjectState): void {
    this.state = state;
  }
  
  isDirty(): boolean {
    return this.state === ObjectState.DIRTY || this.changeFlags !== ObjectChangeFlags.NONE;
  }
  
  getChangeFlags(): ObjectChangeFlags {
    return this.changeFlags;
  }
  
  clearDirty(): void {
    this.changeFlags = ObjectChangeFlags.NONE;
    if (this.state === ObjectState.DIRTY) {
      this.state = ObjectState.ACTIVE;
    }
  }
  
  markDirty(flags: ObjectChangeFlags): void {
    this.changeFlags |= flags;
    if (this.state === ObjectState.ACTIVE) {
      this.state = ObjectState.DIRTY;
    }
  }
  
  toObjectData(): SDFObjectData {
    return {
      type: this.type,
      position: [this.position[0], this.position[1], this.position[2]],
      rotation: [this.rotation[0], this.rotation[1], this.rotation[2]],
      scale: [this.scale[0], this.scale[1], this.scale[2]]
    };
  }
  
  toMaterialData(): MaterialData {
    return {
      color: this.material.color,
      metallic: this.material.metallic,
      roughness: this.material.roughness
    };
  }
  
  destroy(): void {
    this.state = ObjectState.FREE;
    this.changeFlags = ObjectChangeFlags.NONE;
  }
}
