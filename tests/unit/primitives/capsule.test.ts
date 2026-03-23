import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';
import type { ObjectConfig, MaterialData } from '../../../src/types/index.js';

describe('Capsule Primitive', () => {
  describe('create', () => {
    it('should create capsule primitive with default parameters', () => {
      const capsule = Primitives.capsule();
      
      expect(capsule.type).toBe(SDFPrimitive.Capsule);
      expect(capsule.transform?.scale).toEqual([0.3, 1, 0.3]);
    });

    it('should create capsule primitive with custom parameters', () => {
      const height = 2;
      const radius = 0.4;
      const capsule = Primitives.capsule(height, radius);
      
      expect(capsule.type).toBe(SDFPrimitive.Capsule);
      expect(capsule.transform?.scale).toEqual([radius, height, radius]);
    });

    it('should override default parameters with config', () => {
      const capsule = Primitives.capsule(1, 0.3, {
        transform: {
          scale: [0.5, 1.5, 0.5],
          position: [1, 2, 3],
          rotation: [0.1, 0.2, 0.3]
        }
      });
      
      expect(capsule.type).toBe(SDFPrimitive.Capsule);
      expect(capsule.transform?.scale).toEqual([0.5, 1.5, 0.5]);
      expect(capsule.transform?.position).toEqual([1, 2, 3]);
      expect(capsule.transform?.rotation).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('properties', () => {
    it('should set material properties', () => {
      const material: Partial<MaterialData> = {
        color: [0, 1, 0],
        metallic: 0.6,
        roughness: 0.4
      };
      
      const capsule = Primitives.capsule(1, 0.3, {
        material
      });
      
      expect(capsule.material).toEqual(material);
    });

    it('should handle boundary cases', () => {
      // Test with zero radius
      const capsule1 = Primitives.capsule(1, 0);
      expect(capsule1.transform?.scale).toEqual([0, 1, 0]);
      
      // Test with negative radius (should be handled by renderer)
      const capsule2 = Primitives.capsule(1, -0.1);
      expect(capsule2.transform?.scale).toEqual([-0.1, 1, -0.1]);
      
      // Test with very small radius
      const capsule3 = Primitives.capsule(1, 0.001);
      expect(capsule3.transform?.scale).toEqual([0.001, 1, 0.001]);
      
      // Test with zero height
      const capsule4 = Primitives.capsule(0, 0.1);
      expect(capsule4.transform?.scale).toEqual([0.1, 0, 0.1]);
    });

    it('should preserve other config properties', () => {
      const capsule = Primitives.capsule(1, 0.3, {
        transform: {
          position: [1, 2, 3]
        },
        material: {
          color: [1, 0, 1]
        }
      });
      
      expect(capsule.type).toBe(SDFPrimitive.Capsule);
      expect(capsule.transform?.position).toEqual([1, 2, 3]);
      expect(capsule.material?.color).toEqual([1, 0, 1]);
    });
  });
});
