import { describe, it, expect } from 'vitest';
import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';

describe('Box Primitive', () => {
  it('should create box primitive with default values', () => {
    const box = Primitives.box();
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.transform?.scale).toEqual([1, 1, 1]);
  });

  it('should create box primitive with custom dimensions', () => {
    const width = 2;
    const height = 3;
    const depth = 4;
    const box = Primitives.box(width, height, depth);
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.transform?.scale).toEqual([width, height, depth]);
  });

  it('should override transform properties', () => {
    const box = Primitives.box(1, 1, 1, {
      transform: {
        position: [1, 2, 3],
        rotation: [0.5, 0.5, 0.5],
        scale: [2, 2, 2]
      }
    });
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.transform?.position).toEqual([1, 2, 3]);
    expect(box.transform?.rotation).toEqual([0.5, 0.5, 0.5]);
    expect(box.transform?.scale).toEqual([2, 2, 2]);
  });

  it('should include material properties', () => {
    const material = {
      color: [1, 0, 0],
      metallic: 0.5,
      roughness: 0.2
    };
    
    const box = Primitives.box(1, 1, 1, {
      material
    });
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.material).toEqual(material);
  });

  it('should handle zero dimensions', () => {
    const box = Primitives.box(0, 0, 0);
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.transform?.scale).toEqual([0, 0, 0]);
  });

  it('should handle negative dimensions', () => {
    const box = Primitives.box(-1, -2, -3);
    
    expect(box.type).toBe(SDFPrimitive.Box);
    expect(box.transform?.scale).toEqual([-1, -2, -3]);
  });
});
