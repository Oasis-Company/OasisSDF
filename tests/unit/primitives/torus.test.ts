import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';
import type { ObjectConfig, MaterialData } from '../../../src/types/index.js';

describe('Torus Primitive', () => {
  describe('create', () => {
    it('should create torus primitive with default parameters', () => {
      const torus = Primitives.torus();
      
      expect(torus.type).toBe(SDFPrimitive.Torus);
      expect(torus.transform?.scale).toEqual([0.5, 0.2, 1]);
    });

    it('should create torus primitive with custom parameters', () => {
      const majorRadius = 2;
      const minorRadius = 0.5;
      const torus = Primitives.torus(majorRadius, minorRadius);
      
      expect(torus.type).toBe(SDFPrimitive.Torus);
      expect(torus.transform?.scale).toEqual([majorRadius, minorRadius, 1]);
    });

    it('should override default parameters with config', () => {
      const torus = Primitives.torus(1, 0.3, {
        transform: {
          scale: [1.5, 0.4, 1],
          position: [1, 2, 3],
          rotation: [0.1, 0.2, 0.3]
        }
      });
      
      expect(torus.type).toBe(SDFPrimitive.Torus);
      expect(torus.transform?.scale).toEqual([1.5, 0.4, 1]);
      expect(torus.transform?.position).toEqual([1, 2, 3]);
      expect(torus.transform?.rotation).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('properties', () => {
    it('should set material properties', () => {
      const material: Partial<MaterialData> = {
        color: [1, 0, 0],
        metallic: 0.8,
        roughness: 0.2
      };
      
      const torus = Primitives.torus(1, 0.3, {
        material
      });
      
      expect(torus.material).toEqual(material);
    });

    it('should handle boundary cases', () => {
      // Test with zero radius
      const torus1 = Primitives.torus(0, 0.1);
      expect(torus1.transform?.scale).toEqual([0, 0.1, 1]);
      
      // Test with negative radius (should be handled by renderer)
      const torus2 = Primitives.torus(-1, 0.1);
      expect(torus2.transform?.scale).toEqual([-1, 0.1, 1]);
      
      // Test with very small radius
      const torus3 = Primitives.torus(0.001, 0.001);
      expect(torus3.transform?.scale).toEqual([0.001, 0.001, 1]);
    });

    it('should preserve other config properties', () => {
      const torus = Primitives.torus(1, 0.3, {
        transform: {
          position: [1, 2, 3]
        },
        material: {
          color: [0, 1, 0]
        }
      });
      
      expect(torus.type).toBe(SDFPrimitive.Torus);
      expect(torus.transform?.position).toEqual([1, 2, 3]);
      expect(torus.material?.color).toEqual([0, 1, 0]);
    });
  });
});
