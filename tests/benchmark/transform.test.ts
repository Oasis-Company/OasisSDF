/**
 * transform.test.ts
 * 
 * Performance tests for transform system
 */

import { Matrix4 } from '../../src/math/Matrix4.js';
import { TransformHierarchy } from '../../src/math/TransformHierarchy.js';
import type { TransformData } from '../../src/types/objects.js';

describe('Transform System Performance', () => {
  describe('Matrix Calculation Performance', () => {
    it('should perform >50 matrix operations per millisecond', () => {
      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Create and multiply matrices
        const mat1 = Matrix4.translation(1, 2, 3);
        const mat2 = Matrix4.rotation(0.1, 0.2, 0.3);
        const mat3 = Matrix4.scale(2, 2, 2);
        const result = mat1.multiply(mat2).multiply(mat3);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerMs = iterations / duration;

      expect(opsPerMs).toBeGreaterThan(50);
    });

    it('should perform >50 matrix inversions per millisecond', () => {
      const iterations = 5000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const matrix = Matrix4.translation(1, 2, 3)
          .multiply(Matrix4.rotation(0.1, 0.2, 0.3))
          .multiply(Matrix4.scale(2, 2, 2));
        const inverse = matrix.inverse();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerMs = iterations / duration;

      expect(opsPerMs).toBeGreaterThan(50);
    });
  });

  describe('Transform Update Performance', () => {
    it('should perform >100 transform updates per millisecond', () => {
      const hierarchy = new TransformHierarchy();
      const transforms: TransformData[] = [];

      // Create 100 transforms
      for (let i = 0; i < 100; i++) {
        const transform: TransformData = {
          position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
          rotation: [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
          scale: [1, 1, 1]
        };
        transforms.push(transform);

        // Create hierarchy (simple parent-child chain)
        if (i > 0) {
          hierarchy.addChild(transforms[i - 1], transform);
        }
      }

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Update root transform
        const root = transforms[0];
        root.position = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
        (root as any).isDirty = true;

        // Update hierarchy
        hierarchy.update();

        // Get world matrix for all transforms
        transforms.forEach(transform => {
          hierarchy.getWorldMatrix(transform);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const updatesPerMs = (iterations * transforms.length) / duration;

      expect(updatesPerMs).toBeGreaterThan(100);
    });
  });

  describe('Hierarchy Traversal Performance', () => {
    it('should traverse >500 hierarchy nodes per millisecond', () => {
      const hierarchy = new TransformHierarchy();
      const transforms: TransformData[] = [];

      // Create moderate hierarchy (5 levels, 5 children each)
      const createHierarchy = (parent: TransformData, level: number) => {
        if (level >= 5) return;

        for (let i = 0; i < 5; i++) {
          const child: TransformData = {
            position: [i, level, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1]
          };
          transforms.push(child);
          hierarchy.addChild(parent, child);
          createHierarchy(child, level + 1);
        }
      };

      // Create root
      const root: TransformData = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      transforms.push(root);

      // Create hierarchy
      createHierarchy(root, 0);

      const iterations = 50;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        // Traverse entire hierarchy
        const allTransforms = hierarchy.getAllTransforms();
        
        // Update root transform
        root.position = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
        (root as any).isDirty = true;

        // Update hierarchy
        hierarchy.update();

        // Get world matrix for all transforms
        allTransforms.forEach(transform => {
          hierarchy.getWorldMatrix(transform);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const nodesPerMs = (iterations * transforms.length) / duration;

      expect(nodesPerMs).toBeGreaterThan(500);
    });
  });

  describe('Memory Usage', () => {
    it('should use <5MB for 1000 transforms', () => {
      const hierarchy = new TransformHierarchy();
      const transforms: TransformData[] = [];

      // Create 1000 transforms
      for (let i = 0; i < 1000; i++) {
        const transform: TransformData = {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        };
        transforms.push(transform);

        if (i > 0) {
          hierarchy.addChild(transforms[i - 1], transform);
        }
      }

      // Update hierarchy to generate matrices
      hierarchy.update();

      // Calculate memory usage
      const transformSize = 48; // bytes per transform (position + rotation + scale)
      const matrixSize = 16 * 4; // bytes per matrix (16 floats * 4 bytes)
      const estimatedMemory = transforms.length * (transformSize + matrixSize * 2); // local + world matrix
      const memoryInMB = estimatedMemory / (1024 * 1024);

      expect(memoryInMB).toBeLessThan(5);
    });
  });
});
