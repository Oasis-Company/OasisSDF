import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';
import type { ObjectConfig, MaterialData } from '../../../src/types/index.js';

describe('Cone Primitive', () => {
  describe('create', () => {
    it('should create cone primitive with default parameters', () => {
      const cone = Primitives.cone();
      
      expect(cone.type).toBe(SDFPrimitive.Cone);
      expect(cone.transform?.scale).toEqual([0.5, 1, 0.5]);
    });

    it('should create cone primitive with custom parameters', () => {
      const height = 2;
      const radius = 0.4;
      const cone = Primitives.cone(height, radius);
      
      expect(cone.type).toBe(SDFPrimitive.Cone);
      expect(cone.transform?.scale).toEqual([radius, height, radius]);
    });

    it('should override default parameters with config', () => {
      const cone = Primitives.cone(1, 0.5, {
        transform: {
          scale: [0.6, 1.2, 0.6],
          position: [1, 2, 3],
          rotation: [0.1, 0.2, 0.3]
        }
      });
      
      expect(cone.type).toBe(SDFPrimitive.Cone);
      expect(cone.transform?.scale).toEqual([0.6, 1.2, 0.6]);
      expect(cone.transform?.position).toEqual([1, 2, 3]);
      expect(cone.transform?.rotation).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('properties', () => {
    it('should set material properties', () => {
      const material: Partial<MaterialData> = {
        color: [0, 1, 0],
        metallic: 0.6,
        roughness: 0.4
      };
      
      const cone = Primitives.cone(1, 0.5, {
        material
      });
      
      expect(cone.material).toEqual(material);
    });

    it('should handle boundary cases', () => {
      // Test with zero radius
      const cone1 = Primitives.cone(1, 0);
      expect(cone1.transform?.scale).toEqual([0, 1, 0]);
      
      // Test with negative radius (should be handled by renderer)
      const cone2 = Primitives.cone(1, -0.1);
      expect(cone2.transform?.scale).toEqual([-0.1, 1, -0.1]);
      
      // Test with very small radius
      const cone3 = Primitives.cone(1, 0.001);
      expect(cone3.transform?.scale).toEqual([0.001, 1, 0.001]);
      
      // Test with zero height
      const cone4 = Primitives.cone(0, 0.1);
      expect(cone4.transform?.scale).toEqual([0.1, 0, 0.1]);
    });

    it('should preserve other config properties', () => {
      const cone = Primitives.cone(1, 0.5, {
        transform: {
          position: [1, 2, 3]
        },
        material: {
          color: [1, 0, 1]
        }
      });
      
      expect(cone.type).toBe(SDFPrimitive.Cone);
      expect(cone.transform?.position).toEqual([1, 2, 3]);
      expect(cone.material?.color).toEqual([1, 0, 1]);
    });
  });
});
