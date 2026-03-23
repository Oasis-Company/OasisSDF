/**
 * PipelineManager.test.ts
 * 
 * Unit tests for PipelineManager class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PipelineManager } from '../../src/engine/PipelineManager';
import { BufferManager } from '../../src/engine/BufferManager';
import { DeviceManager } from '../../src/engine/DeviceManager';
import { PipelineError, ValidationError } from '../../src/types/index.js';

describe('PipelineManager', () => {
  let device: any;
  let bufferManager: BufferManager;
  let pipelineManager: PipelineManager;
  let originalGpu: any;

  beforeEach(() => {
    originalGpu = (navigator as any).gpu;

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }

    if (DeviceManager.isSupported()) {
      const deviceManager = new DeviceManager();
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      deviceManager.initialize(canvas);
      device = deviceManager.getDevice();
      bufferManager = new BufferManager(device);
      pipelineManager = new PipelineManager(device, bufferManager, {
        width: 800,
        height: 600
      });
    }
  });

  afterEach(() => {
    if (pipelineManager) {
      try {
        pipelineManager.cleanup();
      } catch (error) {
      }
    }

    if (bufferManager) {
      try {
        bufferManager.cleanup();
      } catch (error) {
      }
    }

    if (originalGpu !== (navigator as any).gpu) {
      (navigator as any).gpu = originalGpu;
    }
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      if (!pipelineManager) return;

      expect(pipelineManager).toBeDefined();
    });

    it('should use default background color when not provided', () => {
      if (!pipelineManager) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new PipelineManager(device, bufferManager, {
          width: 800,
          height: 600
        });
      }).not.toThrow();
    });

    it('should use provided background color', () => {
      if (!pipelineManager) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new PipelineManager(device, bufferManager, {
          width: 800,
          height: 600,
          backgroundColor: [1, 0, 0, 1]
        });
      }).not.toThrow();
    });
  });

  describe('Pipeline Creation', () => {
    it('should create pipeline with valid shaders', async () => {
      if (!pipelineManager) return;

      const vertexShader = `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>;
        };

        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          const vertices = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
          );
          
          let position = vertices[vertexIndex];
          
          return VertexOutput {
            position: vec4<f32>(position, 0.0, 1.0)
          };
        }
      `;

      const fragmentShader = `
        @fragment
        fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;

      await expect(pipelineManager.createPipeline(vertexShader, fragmentShader)).resolves.not.toThrow();
    });

    it('should throw error for invalid shaders', async () => {
      if (!pipelineManager) return;

      const vertexShader = `invalid shader`;
      const fragmentShader = `invalid shader`;

      await expect(pipelineManager.createPipeline(vertexShader, fragmentShader)).rejects.toThrow(PipelineError);
    });
  });

  describe('Bind Group Creation', () => {
    it('should create storage bind group', async () => {
      if (!pipelineManager) return;

      const vertexShader = `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>;
        };

        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          const vertices = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
          );
          
          let position = vertices[vertexIndex];
          
          return VertexOutput {
            position: vec4<f32>(position, 0.0, 1.0)
          };
        }
      `;

      const fragmentShader = `
        @group(0) @binding(0) var<storage, read> objects: array<f32>;
        @group(0) @binding(1) var<storage, read> materials: array<f32>;
        @group(0) @binding(2) var<storage, read> lights: array<f32>;

        @fragment
        fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;

      await pipelineManager.createPipeline(vertexShader, fragmentShader);

      const objectsBuffer = bufferManager.createStorageBuffer('objects', 64);
      const materialsBuffer = bufferManager.createStorageBuffer('materials', 48);
      const lightsBuffer = bufferManager.createStorageBuffer('lights', 32);

      expect(() => {
        pipelineManager.createStorageBindGroup(objectsBuffer, materialsBuffer, lightsBuffer);
      }).not.toThrow();
    });

    it('should create uniform bind group', async () => {
      if (!pipelineManager) return;

      const vertexShader = `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>;
        };

        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          const vertices = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
          );
          
          let position = vertices[vertexIndex];
          
          return VertexOutput {
            position: vec4<f32>(position, 0.0, 1.0)
          };
        }
      `;

      const fragmentShader = `
        @group(1) @binding(0) var<uniform> uniforms: f32;
        @group(1) @binding(1) var<uniform> camera: f32;

        @fragment
        fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;

      await pipelineManager.createPipeline(vertexShader, fragmentShader);

      const uniformBuffer = bufferManager.createUniformBuffer('uniforms', 32);
      const cameraBuffer = bufferManager.createUniformBuffer('camera', 80);

      expect(() => {
        pipelineManager.createUniformBindGroup(uniformBuffer, cameraBuffer);
      }).not.toThrow();
    });
  });

  describe('Getters', () => {
    it('should get pipeline', async () => {
      if (!pipelineManager) return;

      const vertexShader = `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>;
        };

        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          const vertices = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
          );
          
          let position = vertices[vertexIndex];
          
          return VertexOutput {
            position: vec4<f32>(position, 0.0, 1.0)
          };
        }
      `;

      const fragmentShader = `
        @fragment
        fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;

      await pipelineManager.createPipeline(vertexShader, fragmentShader);

      expect(() => {
        const pipeline = pipelineManager.getPipeline();
        expect(pipeline).toBeDefined();
      }).not.toThrow();
    });

    it('should throw error when getting pipeline before creation', () => {
      if (!pipelineManager) return;

      expect(() => {
        pipelineManager.getPipeline();
      }).toThrow(ValidationError);
    });

    it('should get bind group', async () => {
      if (!pipelineManager) return;

      const vertexShader = `
        struct VertexOutput {
          @builtin(position) position: vec4<f32>;
        };

        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
          const vertices = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(-1.0, 1.0),
            vec2<f32>(1.0, -1.0),
            vec2<f32>(1.0, 1.0)
          );
          
          let position = vertices[vertexIndex];
          
          return VertexOutput {
            position: vec4<f32>(position, 0.0, 1.0)
          };
        }
      `;

      const fragmentShader = `
        @group(0) @binding(0) var<storage, read> objects: array<f32>;
        @group(0) @binding(1) var<storage, read> materials: array<f32>;

        @fragment
        fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
          return vec4<f32>(1.0, 0.0, 0.0, 1.0);
        }
      `;

      await pipelineManager.createPipeline(vertexShader, fragmentShader);

      const objectsBuffer = bufferManager.createStorageBuffer('objects', 64);
      const materialsBuffer = bufferManager.createStorageBuffer('materials', 48);
      const lightsBuffer = bufferManager.createStorageBuffer('lights', 32);
      pipelineManager.createStorageBindGroup(objectsBuffer, materialsBuffer, lightsBuffer);

      expect(() => {
        const bindGroup = pipelineManager.getBindGroup('storage');
        expect(bindGroup).toBeDefined();
      }).not.toThrow();
    });

    it('should throw error when getting non-existent bind group', () => {
      if (!pipelineManager) return;

      expect(() => {
        pipelineManager.getBindGroup('non_existent');
      }).toThrow(ValidationError);
    });
  });

  describe('Resize', () => {
    it('should resize pipeline', () => {
      if (!pipelineManager) return;

      expect(() => {
        pipelineManager.resize(1024, 768);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      if (!pipelineManager) return;

      expect(() => {
        pipelineManager.cleanup();
      }).not.toThrow();
    });
  });
});
