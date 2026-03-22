/**
 * Transform.test.ts
 * 
 * Unit tests for Transform class
 */

import { describe, it, expect } from 'vitest';
import { Transform } from '../../src/math/Transform.js';
import { vec3 } from 'gl-matrix';

describe('Transform', () => {
  it('should create transform with default values', () => {
    const transform = new Transform();
    
    const position = transform.getPosition();
    const rotation = transform.getRotation();
    const scale = transform.getScale();
    
    expect(position[0]).toBe(0);
    expect(position[1]).toBe(0);
    expect(position[2]).toBe(0);
    expect(rotation[0]).toBe(0);
    expect(rotation[1]).toBe(0);
    expect(rotation[2]).toBe(0);
    expect(scale[0]).toBe(1);
    expect(scale[1]).toBe(1);
    expect(scale[2]).toBe(1);
  });

  it('should set position', () => {
    const transform = new Transform();
    transform.setPosition(1, 2, 3);
    
    const position = transform.getPosition();
    expect(position[0]).toBe(1);
    expect(position[1]).toBe(2);
    expect(position[2]).toBe(3);
  });

  it('should set rotation', () => {
    const transform = new Transform();
    transform.setRotation(0.5, 0.5, 0.5);
    
    const rotation = transform.getRotation();
    expect(rotation[0]).toBe(0.5);
    expect(rotation[1]).toBe(0.5);
    expect(rotation[2]).toBe(0.5);
  });

  it('should set scale', () => {
    const transform = new Transform();
    transform.setScale(2, 2, 2);
    
    const scale = transform.getScale();
    expect(scale[0]).toBe(2);
    expect(scale[1]).toBe(2);
    expect(scale[2]).toBe(2);
  });

  it('should translate', () => {
    const transform = new Transform();
    transform.translate(1, 2, 3);
    
    const position = transform.getPosition();
    expect(position[0]).toBe(1);
    expect(position[1]).toBe(2);
    expect(position[2]).toBe(3);
  });

  it('should rotate', () => {
    const transform = new Transform();
    transform.rotate(0.5, 0.5, 0.5);
    
    const rotation = transform.getRotation();
    expect(rotation[0]).toBe(0.5);
    expect(rotation[1]).toBe(0.5);
    expect(rotation[2]).toBe(0.5);
  });

  it('should scale by', () => {
    const transform = new Transform();
    transform.scaleBy(2, 2, 2);
    
    const scale = transform.getScale();
    expect(scale[0]).toBe(2);
    expect(scale[1]).toBe(2);
    expect(scale[2]).toBe(2);
  });

  it('should look at target', () => {
    const transform = new Transform();
    transform.setPosition(0, 0, 5);
    transform.lookAt(vec3.fromValues(0, 0, 0));
    
    const rotation = transform.getRotation();
    expect(rotation[1]).toBeCloseTo(Math.PI, 0.1);
    expect(rotation[0]).toBeCloseTo(0, 0.1);
  });

  it('should get matrix', () => {
    const transform = new Transform();
    transform.setPosition(1, 2, 3);
    
    const matrix = transform.getMatrix();
    expect(matrix).toBeDefined();
    expect(matrix.length).toBe(16);
  });

  it('should get inverse matrix', () => {
    const transform = new Transform();
    transform.setPosition(1, 2, 3);
    
    const matrix = transform.getMatrix();
    const inverse = transform.getInverseMatrix();
    
    expect(inverse).toBeDefined();
    expect(inverse.length).toBe(16);
  });

  it('should clone transform', () => {
    const transform = new Transform();
    transform.setPosition(1, 2, 3);
    transform.setRotation(0.5, 0.5, 0.5);
    transform.setScale(2, 2, 2);
    
    const clone = transform.clone();
    
    expect(clone.getPosition()).toEqual(transform.getPosition());
    expect(clone.getRotation()).toEqual(transform.getRotation());
    expect(clone.getScale()).toEqual(transform.getScale());
  });

  it('should copy from another transform', () => {
    const transform1 = new Transform();
    transform1.setPosition(1, 2, 3);
    transform1.setRotation(0.5, 0.5, 0.5);
    transform1.setScale(2, 2, 2);
    
    const transform2 = new Transform();
    transform2.copyFrom(transform1);
    
    expect(transform2.getPosition()).toEqual(transform1.getPosition());
    expect(transform2.getRotation()).toEqual(transform1.getRotation());
    expect(transform2.getScale()).toEqual(transform1.getScale());
  });

  it('should reset transform', () => {
    const transform = new Transform();
    transform.setPosition(1, 2, 3);
    transform.setRotation(0.5, 0.5, 0.5);
    transform.setScale(2, 2, 2);
    
    transform.reset();
    
    const position = transform.getPosition();
    const rotation = transform.getRotation();
    const scale = transform.getScale();
    
    expect(position[0]).toBe(0);
    expect(position[1]).toBe(0);
    expect(position[2]).toBe(0);
    expect(rotation[0]).toBe(0);
    expect(rotation[1]).toBe(0);
    expect(rotation[2]).toBe(0);
    expect(scale[0]).toBe(1);
    expect(scale[1]).toBe(1);
    expect(scale[2]).toBe(1);
  });
});
