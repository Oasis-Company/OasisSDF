/**
 * Transform.test.ts
 * 
 * Unit tests for transform system
 */

import { Matrix4 } from '../../src/math/Matrix4.js';
import { TransformHierarchy } from '../../src/math/TransformHierarchy.js';
import type { TransformData } from '../../src/types/objects.js';

describe('Transform System', () => {
  describe('Matrix4', () => {
    it('should create identity matrix', () => {
      const matrix = Matrix4.identity();
      expect(matrix.data).toEqual(new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]));
    });

    it('should create translation matrix', () => {
      const matrix = Matrix4.translation(1, 2, 3);
      expect(matrix.data[12]).toBe(1);
      expect(matrix.data[13]).toBe(2);
      expect(matrix.data[14]).toBe(3);
    });

    it('should create rotation matrix', () => {
      const matrix = Matrix4.rotation(Math.PI / 2, 0, 0);
      // Check if rotation around X-axis is correct
      expect(matrix.data[5]).toBeCloseTo(0);
      expect(matrix.data[6]).toBeCloseTo(-1);
      expect(matrix.data[9]).toBeCloseTo(1);
      expect(matrix.data[10]).toBeCloseTo(0);
    });

    it('should create scale matrix', () => {
      const matrix = Matrix4.scale(2, 3, 4);
      expect(matrix.data[0]).toBe(2);
      expect(matrix.data[5]).toBe(3);
      expect(matrix.data[10]).toBe(4);
    });

    it('should multiply matrices', () => {
      const mat1 = Matrix4.translation(1, 2, 3);
      const mat2 = Matrix4.scale(2, 2, 2);
      const result = mat1.multiply(mat2);
      expect(result.data[12]).toBe(1);
      expect(result.data[13]).toBe(2);
      expect(result.data[14]).toBe(3);
      expect(result.data[0]).toBe(2);
      expect(result.data[5]).toBe(2);
      expect(result.data[10]).toBe(2);
    });

    it('should transform point', () => {
      const matrix = Matrix4.translation(1, 2, 3);
      const point = [1, 1, 1];
      const result = matrix.transformPoint(point);
      expect(result).toEqual([2, 3, 4]);
    });

    it('should transform vector', () => {
      const matrix = Matrix4.scale(2, 2, 2);
      const vector = [1, 1, 1];
      const result = matrix.transformVector(vector);
      expect(result).toEqual([2, 2, 2]);
    });

    it('should calculate inverse matrix', () => {
      const matrix = Matrix4.translation(1, 2, 3);
      const inverse = matrix.inverse();
      const point = [1, 1, 1];
      const transformed = matrix.transformPoint(point);
      const inversed = inverse.transformPoint(transformed);
      expect(inversed).toEqual(point);
    });
  });

  describe('TransformHierarchy', () => {
    it('should create transform with parent-child relationship', () => {
      const hierarchy = new TransformHierarchy();
      
      const parent: TransformData = {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const child: TransformData = {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(parent, child);
      
      const worldPos = hierarchy.localToWorld(child, [0, 0, 0]);
      expect(worldPos).toEqual([1, 3, 3]);
    });

    it('should convert local to world space', () => {
      const hierarchy = new TransformHierarchy();
      
      const parent: TransformData = {
        position: [10, 20, 30],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const child: TransformData = {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(parent, child);
      
      const worldPos = hierarchy.localToWorld(child, [2, 3, 4]);
      expect(worldPos).toEqual([13, 25, 37]);
    });

    it('should convert world to local space', () => {
      const hierarchy = new TransformHierarchy();
      
      const parent: TransformData = {
        position: [10, 20, 30],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const child: TransformData = {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(parent, child);
      
      const localPos = hierarchy.worldToLocal(child, [13, 25, 37]);
      expect(localPos).toEqual([2, 3, 4]);
    });

    it('should handle transform composition', () => {
      const hierarchy = new TransformHierarchy();
      
      const parent: TransformData = {
        position: [1, 0, 0],
        rotation: [0, Math.PI / 2, 0], // 90 degrees around Y
        scale: [2, 2, 2]
      };
      
      const child: TransformData = {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(parent, child);
      
      const worldPos = hierarchy.localToWorld(child, [0, 0, 0]);
      // Parent translation + rotated child position * scale
      expect(worldPos[0]).toBeCloseTo(1);
      expect(worldPos[1]).toBeCloseTo(0);
      expect(worldPos[2]).toBeCloseTo(2);
    });

    it('should handle dirty flag system', () => {
      const hierarchy = new TransformHierarchy();
      
      const parent: TransformData = {
        position: [1, 2, 3],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const child: TransformData = {
        position: [0, 1, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(parent, child);
      
      // Get initial world position
      const initialPos = hierarchy.localToWorld(child, [0, 0, 0]);
      expect(initialPos).toEqual([1, 3, 3]);
      
      // Update parent position
      parent.position = [2, 3, 4];
      (parent as any).isDirty = true;
      
      // Get updated world position
      const updatedPos = hierarchy.localToWorld(child, [0, 0, 0]);
      expect(updatedPos).toEqual([2, 4, 4]);
    });

    it('should handle complex hierarchy', () => {
      const hierarchy = new TransformHierarchy();
      
      const grandparent: TransformData = {
        position: [10, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const parent: TransformData = {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      const child: TransformData = {
        position: [0.5, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      hierarchy.addChild(grandparent, parent);
      hierarchy.addChild(parent, child);
      
      const worldPos = hierarchy.localToWorld(child, [0, 0, 0]);
      expect(worldPos).toEqual([11.5, 0, 0]);
    });
  });
});
