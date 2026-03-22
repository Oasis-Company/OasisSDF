/**
 * Transform.ts
 * 
 * Transform utility class for 3D transformations
 * Provides matrix operations for position, rotation, scale
 */

import { vec3, mat4 } from 'gl-matrix';

/**
 * Transform utility class for 3D transformations
 */
export class Transform {
  private position: vec3;
  private rotation: vec3;
  private scale: vec3;
  private matrix: mat4;
  private matrixDirty: boolean;
  
  constructor() {
    this.position = vec3.create();
    this.rotation = vec3.create();
    this.scale = vec3.fromValues(1, 1, 1);
    this.matrix = mat4.create();
    this.matrixDirty = true;
  }
  
  getPosition(): vec3 {
    return vec3.clone(this.position);
  }
  
  getRotation(): vec3 {
    return vec3.clone(this.rotation);
  }
  
  getScale(): vec3 {
    return vec3.clone(this.scale);
  }
  
  getMatrix(): mat4 {
    this.updateMatrix();
    return mat4.clone(this.matrix);
  }
  
  setPosition(x: number, y: number, z: number): void {
    if (this.position[0] !== x || this.position[1] !== y || this.position[2] !== z) {
      vec3.set(this.position, x, y, z);
      this.matrixDirty = true;
    }
  }
  
  setRotation(x: number, y: number, z: number): void {
    if (this.rotation[0] !== x || this.rotation[1] !== y || this.rotation[2] !== z) {
      vec3.set(this.rotation, x, y, z);
      this.matrixDirty = true;
    }
  }
  
  setScale(x: number, y: number, z: number): void {
    if (this.scale[0] !== x || this.scale[1] !== y || this.scale[2] !== z) {
      vec3.set(this.scale, x, y, z);
      this.matrixDirty = true;
    }
  }
  
  translate(x: number, y: number, z: number): void {
    vec3.add(this.position, this.position, [x, y, z]);
    this.matrixDirty = true;
  }
  
  rotate(x: number, y: number, z: number): void {
    vec3.add(this.rotation, this.rotation, [x, y, z]);
    this.matrixDirty = true;
  }
  
  scaleBy(x: number, y: number, z: number): void {
    vec3.multiply(this.scale, this.scale, [x, y, z]);
    this.matrixDirty = true;
  }
  
  lookAt(target: vec3, _up: vec3 = vec3.fromValues(0, 1, 0)): void {
    const direction = vec3.create();
    vec3.subtract(direction, target, this.position);
    vec3.normalize(direction, direction);
    
    const yaw = Math.atan2(direction[0], direction[2]);
    const pitch = Math.asin(-direction[1]);
    
    this.rotation[0] = pitch;
    this.rotation[1] = yaw;
    this.rotation[2] = 0;
    
    this.matrixDirty = true;
  }
  
  updateMatrix(): void {
    if (!this.matrixDirty) return;
    
    mat4.identity(this.matrix);
    
    mat4.translate(this.matrix, this.matrix, this.position);
    mat4.rotateX(this.matrix, this.matrix, this.rotation[0]);
    mat4.rotateY(this.matrix, this.matrix, this.rotation[1]);
    mat4.rotateZ(this.matrix, this.matrix, this.rotation[2]);
    mat4.scale(this.matrix, this.matrix, this.scale);
    
    this.matrixDirty = false;
  }
  
  getInverseMatrix(): mat4 {
    this.updateMatrix();
    const inverse = mat4.create();
    mat4.invert(inverse, this.matrix);
    return inverse;
  }
  
  clone(): Transform {
    const transform = new Transform();
    transform.copyFrom(this);
    return transform;
  }
  
  copyFrom(other: Transform): void {
    vec3.copy(this.position, other.position);
    vec3.copy(this.rotation, other.rotation);
    vec3.copy(this.scale, other.scale);
    this.matrixDirty = true;
  }
  
  reset(): void {
    vec3.set(this.position, 0, 0, 0);
    vec3.set(this.rotation, 0, 0, 0);
    vec3.set(this.scale, 1, 1, 1);
    this.matrixDirty = true;
  }
}
