import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';
import type { ObjectConfig, MaterialData } from '../../../src/types/index.js';

describe('Cylinder Primitive', () => {
  describe('create', () => {
    it('should create cylinder primitive with default parameters', () => {
      const cylinder = Primitives.cylinder();
      
      expect(cylinder.type).toBe(SDFPrimitive.Cylinder);
      expect(cylinder.transform?.scale).toEqual([0.5, 1, 0.5]);
    });

    it('should create cylinder primitive with custom parameters', () => {
      const height = 2;
      const radius = 0.4;
      const cylinder = Primitives.cylinder(height, radius);
      
      expect(cylinder.type).toBe(SDFPrimitive.Cylinder);
      expect(cylinder.transform?.scale).toEqual([radius, height, radius]);
    });

    it('should override default parameters with config', () => {
      const cylinder = Primitives.cylinder(1, 0.5, {
        transform: {
          scale: [0.6, 1.2, 0.6],
          position: [1, 2, 3],
          rotation: [0.1, 0.2, 0.3]
        }
      });
      
      expect(cylinder.type).toBe(SDFPrimitive.Cylinder);
      expect(cylinder.transform?.scale).toEqual([0.6, 1.2, 0.6]);
      expect(cylinder.transform?.position).toEqual([1, 2, 3]);
      expect(cylinder.transform?.rotation).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('properties', () => {
    it('should set material properties', () => {
      const material: Partial<MaterialData> = {
        color: [0, 1, 0],
        metallic: 0.6,
        roughness: 0.4
      };
      
      const cylinder = Primitives.cylinder(1, 0.5, {
        material
      });
      
      expect(cylinder.material).toEqual(material);
    });

    it('should handle boundary cases', () => {
      // Test with zero radius
      const cylinder1 = Primitives.cylinder(1, 0);
      expect(cylinder1.transform?.scale).toEqual([0, 1, 0]);
      
      // Test with negative radius (should be handled by renderer)
      const cylinder2 = Primitives.cylinder(1, -0.1);
      expect(cylinder2.transform?.scale).toEqual([-0.1, 1, -0.1]);
      
      // Test with very small radius
      const cylinder3 = Primitives.cylinder(1, 0.001);
      expect(cylinder3.transform?.scale).toEqual([0.001, 1, 0.001]);
      
      // Test with zero height
      const cylinder4 = Primitives.cylinder(0, 0.1);
      expect(cylinder4.transform?.scale).toEqual([0.1, 0, 0.1]);
    });

    it('should preserve other config properties', () => {
      const cylinder = Primitives.cylinder(1, 0.5, {
        transform: {
          position: [1, 2, 3]
        },
        material: {
          color: [1, 0, 1]
        }
      });
      
      expect(cylinder.type).toBe(SDFPrimitive.Cylinder);
      expect(cylinder.transform?.position).toEqual([1, 2, 3]);
      expect(cylinder.material?.color).toEqual([1, 0, 1]);
    });
  });
});
