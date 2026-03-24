var ObjectState = /* @__PURE__ */ ((ObjectState2) => {
  ObjectState2[ObjectState2["FREE"] = 0] = "FREE";
  ObjectState2[ObjectState2["ACTIVE"] = 1] = "ACTIVE";
  ObjectState2[ObjectState2["DIRTY"] = 2] = "DIRTY";
  ObjectState2[ObjectState2["PENDING"] = 3] = "PENDING";
  return ObjectState2;
})(ObjectState || {});
var ObjectChangeFlags = /* @__PURE__ */ ((ObjectChangeFlags2) => {
  ObjectChangeFlags2[ObjectChangeFlags2["NONE"] = 0] = "NONE";
  ObjectChangeFlags2[ObjectChangeFlags2["TRANSFORM"] = 1] = "TRANSFORM";
  ObjectChangeFlags2[ObjectChangeFlags2["MATERIAL"] = 2] = "MATERIAL";
  ObjectChangeFlags2[ObjectChangeFlags2["VISIBILITY"] = 4] = "VISIBILITY";
  ObjectChangeFlags2[ObjectChangeFlags2["ALL"] = 7] = "ALL";
  return ObjectChangeFlags2;
})(ObjectChangeFlags || {});

var LightType = /* @__PURE__ */ ((LightType2) => {
  LightType2[LightType2["DIRECTIONAL"] = 0] = "DIRECTIONAL";
  LightType2[LightType2["POINT"] = 1] = "POINT";
  LightType2[LightType2["SPOT"] = 2] = "SPOT";
  return LightType2;
})(LightType || {});
const DefaultLights = {
  directional: () => ({
    type: 0 /* DIRECTIONAL */,
    direction: [0.5, -0.7, -0.3],
    color: [1, 1, 1],
    intensity: 1,
    castShadows: true,
    shadowSoftness: 16
  }),
  point: () => ({
    type: 1 /* POINT */,
    position: [0, 2, 0],
    color: [1, 1, 1],
    intensity: 1,
    castShadows: true,
    shadowSoftness: 16,
    range: 10
  }),
  spot: () => ({
    type: 2 /* SPOT */,
    position: [0, 3, 0],
    direction: [0, -1, 0],
    color: [1, 1, 1],
    intensity: 1.5,
    castShadows: true,
    shadowSoftness: 16,
    range: 15,
    innerConeAngle: Math.PI / 6,
    outerConeAngle: Math.PI / 4
  })
};

const BufferLayout = {
  /** Calculate byte size of SDFObjectData */
  objectSize: 64,
  /** Calculate byte size of MaterialData */
  materialSize: 64,
  /** Calculate byte size of CameraData */
  cameraSize: 80,
  /** Calculate byte size of UniformData */
  uniformSize: 48,
  /** Calculate byte size of LightData */
  lightSize: 80,
  /** Calculate total buffer size for objects */
  objectBufferSize: (count) => count * 64,
  /** Calculate total buffer size for materials */
  materialBufferSize: (count) => count * 64,
  /** Calculate total buffer size for lights */
  lightBufferSize: (count) => count * 80,
  /** Validate alignment (must be multiple of 16) */
  validateAlignment: (size) => size % 16 === 0
};
var SDFPrimitive = /* @__PURE__ */ ((SDFPrimitive2) => {
  SDFPrimitive2[SDFPrimitive2["Sphere"] = 1] = "Sphere";
  SDFPrimitive2[SDFPrimitive2["Box"] = 2] = "Box";
  SDFPrimitive2[SDFPrimitive2["Torus"] = 3] = "Torus";
  SDFPrimitive2[SDFPrimitive2["Capsule"] = 4] = "Capsule";
  SDFPrimitive2[SDFPrimitive2["Cylinder"] = 5] = "Cylinder";
  SDFPrimitive2[SDFPrimitive2["Cone"] = 6] = "Cone";
  return SDFPrimitive2;
})(SDFPrimitive || {});
class OasisSDFError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "OasisSDFError";
  }
}
class WebGPUError extends OasisSDFError {
  constructor(message) {
    super(message, "WEBGPU_ERROR");
  }
}
class BufferError extends OasisSDFError {
  constructor(message) {
    super(message, "BUFFER_ERROR");
  }
}
class ValidationError extends OasisSDFError {
  constructor(message) {
    super(message, "VALIDATION_ERROR");
  }
}
class PipelineError extends OasisSDFError {
  constructor(message) {
    super(message, "PIPELINE_ERROR");
  }
}
class EngineError extends OasisSDFError {
  constructor(message) {
    super(message, "ENGINE_ERROR");
  }
}

class DeviceManager {
  device = null;
  context = null;
  adapter = null;
  canvas = null;
  preferredFormat = "bgra8unorm";
  isInitialized = false;
  deviceLostPromise = null;
  deviceLostResolver = null;
  options;
  /**
   * Check if WebGPU is supported in current browser
   * @returns true if WebGPU is available
   */
  static isSupported() {
    if (typeof navigator === "undefined" || !navigator.gpu) {
      return false;
    }
    return true;
  }
  /**
   * Get detailed support information about WebGPU
   * @returns Promise resolving to support information
   */
  static async getSupportInfo() {
    if (!this.isSupported()) {
      return {
        supported: false,
        reason: "WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or Firefox Nightly."
      };
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          reason: "No GPU adapter available. Your device may not have a compatible GPU."
        };
      }
      const features = adapter.features;
      const limits = adapter.limits;
      return {
        supported: true,
        adapterInfo: await adapter.requestAdapterInfo(),
        features: Array.from(features),
        limits: {
          maxTextureDimension2D: limits.maxTextureDimension2D,
          maxBufferSize: limits.maxBufferSize,
          maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize
        }
      };
    } catch (error) {
      return {
        supported: false,
        reason: `Failed to query adapter: ${error}`
      };
    }
  }
  /**
   * Initialize WebGPU device and canvas context
   * @param canvas - Canvas element to configure
   * @param options - Optional configuration options
   * @throws WebGPUError if WebGPU is not supported or initialization fails
   */
  async initialize(canvas, options) {
    if (this.isInitialized) {
      console.warn("DeviceManager is already initialized. Call cleanup() first if you want to reinitialize.");
      return;
    }
    this.options = options;
    this.canvas = canvas;
    if (!DeviceManager.isSupported()) {
      const supportInfo = await DeviceManager.getSupportInfo();
      throw new WebGPUError(supportInfo.reason || "WebGPU is not supported");
    }
    try {
      await this.selectAdapter(options);
      this.validateAdapter(this.adapter);
      await this.createDevice(options);
      await this.configureCanvasContext(canvas, options);
      this.isInitialized = true;
      console.log("DeviceManager initialized successfully");
    } catch (error) {
      this.cleanup();
      if (error instanceof WebGPUError) {
        throw error;
      }
      throw new WebGPUError(`Failed to initialize DeviceManager: ${error}`);
    }
  }
  /**
   * Select the best GPU adapter
   * @param options - Configuration options
   * @throws WebGPUError if adapter selection fails
   */
  async selectAdapter(options) {
    const powerPreference = options?.powerPreference ?? "high-performance";
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference
    });
    if (!adapter) {
      throw new WebGPUError(
        "Failed to obtain GPU adapter. Your device may not support WebGPU or may not have a compatible GPU."
      );
    }
    this.adapter = adapter;
    const adapterInfo = await adapter.requestAdapterInfo();
    console.log(`WebGPU Adapter: ${adapterInfo.description || "Unknown"}`);
    console.log(`Vendor: ${adapterInfo.vendor || "Unknown"}`);
    console.log(`Architecture: ${adapterInfo.architecture || "Unknown"}`);
  }
  /**
   * Validate adapter meets minimum requirements
   * @param adapter - GPU adapter to validate
   * @throws WebGPUError if adapter does not meet requirements
   */
  validateAdapter(adapter) {
    const limits = adapter.limits;
    const minBufferSize = 128 * 1024 * 1024;
    const minStorageBufferBindingSize = 128 * 1024 * 1024;
    if (limits.maxBufferSize < minBufferSize) {
      throw new WebGPUError(
        `Adapter maxBufferSize (${limits.maxBufferSize}) is too small. Minimum required: ${minBufferSize} bytes (128MB)`
      );
    }
    if (limits.maxStorageBufferBindingSize < minStorageBufferBindingSize) {
      throw new WebGPUError(
        `Adapter maxStorageBufferBindingSize (${limits.maxStorageBufferBindingSize}) is too small. Minimum required: ${minStorageBufferBindingSize} bytes (128MB)`
      );
    }
    console.log("Adapter validation passed");
  }
  /**
   * Create GPU device with proper configuration
   * @param options - Configuration options
   * @throws WebGPUError if device creation fails
   */
  async createDevice(options) {
    if (!this.adapter) {
      throw new WebGPUError("Adapter not initialized");
    }
    const requiredFeatures = options?.requiredFeatures ?? [];
    const requiredLimits = options?.requiredLimits;
    const device = await this.adapter.requestDevice({
      requiredFeatures,
      requiredLimits
    });
    if (!device) {
      throw new WebGPUError("Failed to create GPU device");
    }
    this.device = device;
    device.lost.then((info) => {
      this.handleDeviceLoss(info);
    });
    console.log("GPU device created successfully");
  }
  /**
   * Configure canvas context with proper format
   * @param canvas - Canvas element to configure
   * @param options - Configuration options
   * @throws WebGPUError if context configuration fails
   */
  async configureCanvasContext(canvas, _options) {
    if (!this.device || !this.adapter) {
      throw new WebGPUError("Device or adapter not initialized");
    }
    const context = canvas.getContext("webgpu");
    if (!context) {
      throw new WebGPUError("Failed to get WebGPU context from canvas. Make sure the canvas is valid.");
    }
    this.context = context;
    this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: this.device,
      format: this.preferredFormat,
      alphaMode: "premultiplied",
      colorSpace: "srgb"
    });
    console.log(`Canvas configured with format: ${this.preferredFormat}`);
  }
  /**
   * Handle device loss event
   * @param info - Device loss information
   */
  handleDeviceLoss(info) {
    console.warn(`WebGPU device lost: ${info.message}`);
    this.isInitialized = false;
    if (this.deviceLostResolver) {
      this.deviceLostResolver();
      this.deviceLostResolver = null;
    }
    if (this.options?.onDeviceLost) {
      this.options.onDeviceLost(info);
    }
  }
  /**
   * Wait for device to be restored after loss
   * @returns Promise that resolves when device is restored
   * @throws WebGPUError if restoration fails
   */
  async waitForDeviceRestore() {
    if (this.isInitialized) {
      return;
    }
    if (!this.deviceLostPromise) {
      this.deviceLostPromise = new Promise((resolve) => {
        this.deviceLostResolver = resolve;
      });
    }
    await this.deviceLostPromise;
    try {
      await this.reinitialize();
    } catch (error) {
      throw new WebGPUError(`Failed to restore device: ${error}`);
    }
  }
  /**
   * Reinitialize device after loss
   * @throws WebGPUError if reinitialization fails
   */
  async reinitialize() {
    if (!this.canvas) {
      throw new WebGPUError("Canvas not available for reinitialization");
    }
    const savedCanvas = this.canvas;
    const savedOptions = this.options;
    this.cleanup();
    this.canvas = savedCanvas;
    this.options = savedOptions;
    await this.initialize(savedCanvas, savedOptions);
    if (this.options?.onDeviceRestored) {
      this.options.onDeviceRestored();
    }
  }
  /**
   * Get the initialized GPU device
   * @returns GPUDevice instance
   * @throws WebGPUError if device is not initialized
   */
  getDevice() {
    if (!this.device) {
      throw new WebGPUError("Device not initialized. Call initialize() first.");
    }
    return this.device;
  }
  /**
   * Get the configured canvas context
   * @returns GPUCanvasContext instance
   * @throws WebGPUError if context is not initialized
   */
  getContext() {
    if (!this.context) {
      throw new WebGPUError("Context not initialized. Call initialize() first.");
    }
    return this.context;
  }
  /**
   * Get the GPU adapter
   * @returns GPUAdapter instance
   * @throws WebGPUError if adapter is not initialized
   */
  getAdapter() {
    if (!this.adapter) {
      throw new WebGPUError("Adapter not initialized. Call initialize() first.");
    }
    return this.adapter;
  }
  /**
   * Get the preferred texture format
   * @returns Preferred GPUTextureFormat
   */
  getPreferredFormat() {
    return this.preferredFormat;
  }
  /**
   * Check if device manager is initialized
   * @returns true if initialized
   */
  isReady() {
    return this.isInitialized && this.device !== null && this.context !== null;
  }
  /**
   * Get memory usage information
   * @returns MemoryInfo object
   */
  getMemoryInfo() {
    return {
      used: 0,
      allocated: 0
    };
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      if (this.device) {
        this.device.destroy();
        this.device = null;
      }
    } catch (error) {
      console.warn("Error destroying device:", error);
    }
    this.context = null;
    this.adapter = null;
    this.canvas = null;
    this.isInitialized = false;
    this.deviceLostPromise = null;
    this.deviceLostResolver = null;
    console.log("DeviceManager cleaned up");
  }
}

const GPUBufferUsage = {
  STORAGE: 8,
  COPY_DST: 4,
  UNIFORM: 1,
  MAP_WRITE: 2,
  COPY_SRC: 1
};
const GPUMapMode = {
  WRITE: 1
};
class BufferManager {
  device;
  buffers;
  stagingBuffers;
  memoryUsage;
  constructor(device) {
    this.device = device;
    this.buffers = /* @__PURE__ */ new Map();
    this.stagingBuffers = /* @__PURE__ */ new Map();
    this.memoryUsage = { used: 0, allocated: 0 };
  }
  createBuffer(name, size, usage) {
    this.validateAlignment(size);
    if (this.buffers.has(name)) {
      throw new BufferError(`Buffer '${name}' already exists`);
    }
    try {
      const buffer = this.device.createBuffer({
        size,
        usage,
        mappedAtCreation: false
      });
      this.buffers.set(name, buffer);
      this.memoryUsage.allocated += size;
      return buffer;
    } catch (error) {
      throw new BufferError(`Failed to create buffer '${name}': ${error}`);
    }
  }
  createStorageBuffer(name, size) {
    return this.createBuffer(
      name,
      size,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    );
  }
  createUniformBuffer(name, size) {
    return this.createBuffer(
      name,
      size,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );
  }
  createStagingBuffer(name, size) {
    try {
      const buffer = this.device.createBuffer({
        size,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: false
      });
      this.stagingBuffers.set(name, buffer);
      this.memoryUsage.allocated += size;
      return buffer;
    } catch (error) {
      throw new BufferError(`Failed to create staging buffer '${name}': ${error}`);
    }
  }
  writeBuffer(buffer, data, byteOffset = 0) {
    const dataSize = data.length * 4;
    this.validateBounds(buffer, byteOffset, dataSize);
    if (dataSize < 4096) {
      this.writeBufferDirect(buffer, data, byteOffset);
    } else {
      this.writeBufferViaStaging(buffer, data, byteOffset);
    }
    this.memoryUsage.used += dataSize;
  }
  writeBufferDirect(buffer, data, byteOffset = 0) {
    const dataSize = data.length * 4;
    const tempBuffer = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      tempBuffer[i] = data[i];
    }
    this.device.queue.writeBuffer(
      buffer,
      byteOffset,
      tempBuffer.buffer,
      0,
      dataSize
    );
  }
  async writeBufferViaStaging(buffer, data, byteOffset = 0) {
    const dataSize = data.length * 4;
    const stagingName = `staging_${buffer.label || "temp"}`;
    let stagingBuffer = this.stagingBuffers.get(stagingName);
    if (!stagingBuffer || stagingBuffer.size < dataSize) {
      if (stagingBuffer) {
        stagingBuffer.destroy();
      }
      stagingBuffer = this.createStagingBuffer(stagingName, dataSize);
    }
    const mapped = await stagingBuffer.mapAsync(GPUMapMode.WRITE);
    const view = new Float32Array(mapped);
    for (let i = 0; i < data.length; i++) {
      view[i] = data[i];
    }
    stagingBuffer.unmap();
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(
      stagingBuffer,
      0,
      buffer,
      byteOffset,
      dataSize
    );
    this.device.queue.submit([encoder.finish()]);
  }
  writeObjectBuffer(buffer, objects) {
    const totalSize = objects.length * 64;
    const data = new Float32Array(totalSize / 4);
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const offset = i * 16;
      data[offset] = obj.type;
      data[offset + 4] = obj.position[0];
      data[offset + 5] = obj.position[1];
      data[offset + 6] = obj.position[2];
      data[offset + 8] = obj.rotation[0];
      data[offset + 9] = obj.rotation[1];
      data[offset + 10] = obj.rotation[2];
      data[offset + 12] = obj.scale[0];
      data[offset + 13] = obj.scale[1];
      data[offset + 14] = obj.scale[2];
    }
    this.writeBuffer(buffer, Array.from(data));
  }
  writeMaterialBuffer(buffer, materials) {
    const totalSize = materials.length * 64;
    const data = new Float32Array(totalSize / 4);
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i];
      const offset = i * 16;
      data[offset + 0] = mat.color[0];
      data[offset + 1] = mat.color[1];
      data[offset + 2] = mat.color[2];
      data[offset + 4] = mat.metallic;
      data[offset + 5] = mat.roughness;
      data[offset + 6] = mat.reflectance;
      data[offset + 8] = mat.emission[0];
      data[offset + 9] = mat.emission[1];
      data[offset + 10] = mat.emission[2];
      data[offset + 11] = mat.emissionIntensity;
      data[offset + 12] = mat.ambientOcclusion;
    }
    this.writeBuffer(buffer, Array.from(data));
  }
  writeUniformBuffer(buffer, data) {
    const uniformArray = new Float32Array(12);
    uniformArray[0] = data.time;
    uniformArray[1] = data.frame;
    uniformArray[2] = data.objectCount;
    uniformArray[3] = data.lightCount;
    uniformArray[4] = data.resolution[0];
    uniformArray[5] = data.resolution[1];
    uniformArray[8] = data.ambientLight[0];
    uniformArray[9] = data.ambientLight[1];
    uniformArray[10] = data.ambientLight[2];
    this.writeBuffer(buffer, Array.from(uniformArray));
  }
  writeCameraBuffer(buffer, data) {
    const cameraArray = new Float32Array(20);
    cameraArray[0] = data.position[0];
    cameraArray[1] = data.position[1];
    cameraArray[2] = data.position[2];
    cameraArray[4] = data.target[0];
    cameraArray[5] = data.target[1];
    cameraArray[6] = data.target[2];
    cameraArray[8] = data.up[0];
    cameraArray[9] = data.up[1];
    cameraArray[10] = data.up[2];
    cameraArray[12] = data.fov;
    cameraArray[13] = data.near;
    cameraArray[14] = data.far;
    this.writeBuffer(buffer, Array.from(cameraArray));
  }
  writeLightBuffer(buffer, lights) {
    const totalSize = lights.length * 80;
    const data = new Float32Array(totalSize / 4);
    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const offset = i * 20;
      data[offset + 0] = light.type;
      data[offset + 1] = light.intensity;
      data[offset + 2] = light.castShadows;
      data[offset + 3] = light.shadowSoftness;
      data[offset + 4] = light.position[0];
      data[offset + 5] = light.position[1];
      data[offset + 6] = light.position[2];
      data[offset + 8] = light.direction[0];
      data[offset + 9] = light.direction[1];
      data[offset + 10] = light.direction[2];
      data[offset + 12] = light.color[0];
      data[offset + 13] = light.color[1];
      data[offset + 14] = light.color[2];
      data[offset + 16] = light.range;
      data[offset + 17] = light.innerConeAngle;
      data[offset + 18] = light.outerConeAngle;
    }
    this.writeBuffer(buffer, Array.from(data));
  }
  getBuffer(name) {
    return this.buffers.get(name);
  }
  destroyBuffer(name) {
    const buffer = this.buffers.get(name);
    if (buffer) {
      this.memoryUsage.allocated -= buffer.size;
      this.memoryUsage.used -= buffer.size;
      buffer.destroy();
      this.buffers.delete(name);
    }
    const stagingBuffer = this.stagingBuffers.get(name);
    if (stagingBuffer) {
      this.memoryUsage.allocated -= stagingBuffer.size;
      stagingBuffer.destroy();
      this.stagingBuffers.delete(name);
    }
  }
  destroyAll() {
    for (const [_name, buffer] of this.buffers) {
      buffer.destroy();
    }
    for (const [_name, buffer] of this.stagingBuffers) {
      buffer.destroy();
    }
    this.buffers.clear();
    this.stagingBuffers.clear();
    this.memoryUsage = { used: 0, allocated: 0 };
  }
  getMemoryInfo() {
    return { ...this.memoryUsage };
  }
  validateAlignment(size) {
    if (size % 16 !== 0) {
      throw new ValidationError(
        `Buffer size ${size} is not 16-byte aligned. Size must be a multiple of 16.`
      );
    }
  }
  validateBounds(buffer, offset, size) {
    if (offset + size > buffer.size) {
      throw new ValidationError(
        `Buffer write out of bounds. Buffer size: ${buffer.size}, Offset: ${offset}, Data size: ${size}`
      );
    }
  }
  cleanup() {
    try {
      this.destroyAll();
      console.log("BufferManager cleaned up");
    } catch (error) {
      console.warn("Error during BufferManager cleanup:", error);
    }
  }
}

const GPUShaderStage = {
  FRAGMENT: 16
};
class PipelineManager {
  device;
  pipeline;
  bindGroups;
  bindGroupLayouts;
  pipelineLayout;
  config;
  constructor(device, _bufferManager, config) {
    this.device = device;
    this.pipeline = null;
    this.bindGroups = /* @__PURE__ */ new Map();
    this.bindGroupLayouts = /* @__PURE__ */ new Map();
    this.pipelineLayout = null;
    this.config = {
      width: config.width,
      height: config.height,
      debug: config.debug || false,
      backgroundColor: config.backgroundColor || [0, 0, 0, 1]
    };
  }
  /**
   * Create shader module
   * @param source - Shader source code
   * @param type - Shader type
   * @returns Shader module
   */
  createShaderModule(source, type) {
    try {
      return this.device.createShaderModule({
        code: source
      });
    } catch (error) {
      throw new PipelineError(`Failed to create ${type} shader module: ${error}`);
    }
  }
  /**
   * Create bind group layouts
   */
  createBindGroupLayouts() {
    const storageLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage"
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage"
          }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "read-only-storage"
          }
        }
      ]
    });
    const uniformLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform"
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform"
          }
        }
      ]
    });
    this.bindGroupLayouts.set("storage", storageLayout);
    this.bindGroupLayouts.set("uniform", uniformLayout);
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [storageLayout, uniformLayout]
    });
  }
  /**
   * Create render pipeline
   * @param vertexShader - Vertex shader source
   * @param fragmentShader - Fragment shader source
   */
  async createPipeline(vertexShader, fragmentShader) {
    try {
      this.createBindGroupLayouts();
      const vertexModule = this.createShaderModule(vertexShader, "vertex");
      const fragmentModule = this.createShaderModule(fragmentShader, "fragment");
      this.pipeline = this.device.createRenderPipeline({
        layout: this.pipelineLayout,
        vertex: {
          module: vertexModule,
          entryPoint: "main",
          buffers: []
        },
        fragment: {
          module: fragmentModule,
          entryPoint: "main",
          targets: [
            {
              format: "bgra8unorm"
            }
          ]
        },
        primitive: {
          topology: "triangle-list"
        },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less"
        }
      });
    } catch (error) {
      throw new PipelineError(`Failed to create pipeline: ${error}`);
    }
  }
  /**
   * Create storage bind group
   * @param objectsBuffer - Objects buffer
   * @param materialsBuffer - Materials buffer
   * @param lightsBuffer - Lights buffer
   */
  createStorageBindGroup(objectsBuffer, materialsBuffer, lightsBuffer) {
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayouts.get("storage"),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: objectsBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: materialsBuffer
          }
        },
        {
          binding: 2,
          resource: {
            buffer: lightsBuffer
          }
        }
      ]
    });
    this.bindGroups.set("storage", bindGroup);
  }
  /**
   * Create uniform bind group
   * @param uniformBuffer - Uniform buffer
   * @param cameraBuffer - Camera buffer
   */
  createUniformBindGroup(uniformBuffer, cameraBuffer) {
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayouts.get("uniform"),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: cameraBuffer
          }
        }
      ]
    });
    this.bindGroups.set("uniform", bindGroup);
  }
  /**
   * Begin render pass
   * @param encoder - Command encoder
   * @param textureView - Texture view
   * @param depthTextureView - Depth texture view
   * @returns Render pass encoder
   */
  beginRenderPass(encoder, textureView, depthTextureView) {
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: this.config.backgroundColor,
          loadOp: "clear",
          storeOp: "store"
        }
      ],
      depthStencilAttachment: {
        view: depthTextureView,
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store"
      }
    });
    return renderPass;
  }
  /**
   * Draw fullscreen quad
   * @param renderPass - Render pass encoder
   */
  drawFullscreenQuad(renderPass) {
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroups.get("storage"));
    renderPass.setBindGroup(1, this.bindGroups.get("uniform"));
    renderPass.draw(6);
  }
  /**
   * Get pipeline
   * @returns Render pipeline
   */
  getPipeline() {
    if (!this.pipeline) {
      throw new ValidationError("Pipeline not created");
    }
    return this.pipeline;
  }
  /**
   * Get bind group
   * @param name - Bind group name
   * @returns Bind group
   */
  getBindGroup(name) {
    const bindGroup = this.bindGroups.get(name);
    if (!bindGroup) {
      throw new ValidationError(`Bind group '${name}' not found`);
    }
    return bindGroup;
  }
  /**
   * Resize pipeline
   * @param width - New width
   * @param height - New height
   */
  resize(width, height) {
    this.config.width = width;
    this.config.height = height;
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      if (this.pipeline) {
      }
      this.bindGroups.clear();
      this.bindGroupLayouts.clear();
      this.pipeline = null;
      this.pipelineLayout = null;
      console.log("PipelineManager cleaned up");
    } catch (error) {
      console.warn("Error during PipelineManager cleanup:", error);
    }
  }
}

class MaterialManager {
  materials = /* @__PURE__ */ new Map();
  materialIdToIndex = /* @__PURE__ */ new Map();
  freeSlots = [];
  nextMaterialId = 1;
  nextBufferIndex = 0;
  dirtyMaterials = /* @__PURE__ */ new Set();
  maxMaterials;
  /**
   * Create a new MaterialManager
   * @param maxMaterials Maximum number of materials to support
   */
  constructor(maxMaterials = 1e3) {
    this.maxMaterials = maxMaterials;
  }
  /**
   * Allocate a buffer slot for a new material
   * @returns Buffer index
   */
  allocateSlot() {
    if (this.freeSlots.length > 0) {
      return this.freeSlots.pop();
    }
    if (this.nextBufferIndex >= this.maxMaterials) {
      throw new ValidationError(`Maximum material capacity reached: ${this.maxMaterials}`);
    }
    return this.nextBufferIndex++;
  }
  /**
   * Release a buffer slot when material is destroyed
   * @param index Buffer index to release
   */
  releaseSlot(index) {
    this.freeSlots.push(index);
  }
  /**
   * Create a new material instance
   * @param materialData Material properties
   * @returns Material ID
   */
  createMaterial(materialData) {
    if (this.materials.size >= this.maxMaterials) {
      throw new ValidationError(`Maximum material count reached: ${this.maxMaterials}`);
    }
    const defaultMaterial = {
      color: [0.5, 0.5, 0.5],
      metallic: 0,
      roughness: 0.5,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0,
      ambientOcclusion: 1
    };
    const bufferIndex = this.allocateSlot();
    const material = {
      id: this.nextMaterialId++,
      data: {
        ...defaultMaterial,
        ...materialData
      },
      refCount: 1,
      isDirty: true,
      bufferIndex
    };
    this.materials.set(material.id, material);
    this.materialIdToIndex.set(material.id, bufferIndex);
    this.dirtyMaterials.add(material.id);
    return material.id;
  }
  /**
   * Get material data by ID
   * @param materialId Material ID
   * @returns Material data
   */
  getMaterial(materialId) {
    const material = this.materials.get(materialId);
    return material ? { ...material.data } : null;
  }
  /**
   * Update material properties
   * @param materialId Material ID
   * @param materialData Material properties to update
   */
  updateMaterial(materialId, materialData) {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }
    material.data = {
      ...material.data,
      ...materialData
    };
    material.isDirty = true;
    this.dirtyMaterials.add(materialId);
  }
  /**
   * Increment material reference count
   * @param materialId Material ID
   */
  referenceMaterial(materialId) {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }
    material.refCount++;
  }
  /**
   * Decrement material reference count and destroy if no references
   * @param materialId Material ID
   * @returns True if material was destroyed
   */
  releaseMaterial(materialId) {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }
    material.refCount--;
    if (material.refCount <= 0) {
      this.releaseSlot(material.bufferIndex);
      this.materials.delete(materialId);
      this.materialIdToIndex.delete(materialId);
      this.dirtyMaterials.delete(materialId);
      return true;
    }
    return false;
  }
  /**
   * Get all materials as an array for buffer writing
   * @returns Array of material data
   */
  getMaterialsForBuffer() {
    const materials = Array(this.nextBufferIndex).fill(null);
    for (const material of this.materials.values()) {
      materials[material.bufferIndex] = material.data;
    }
    return materials.filter((material) => material !== null);
  }
  /**
   * Get all materials as an array
   * @returns Array of material data
   */
  getAllMaterials() {
    return Array.from(this.materials.values()).map((material) => material.data);
  }
  /**
   * Get dirty materials that need to be updated in the buffer
   * @returns Set of material IDs
   */
  getDirtyMaterials() {
    return this.dirtyMaterials;
  }
  /**
   * Clear dirty flag for all materials
   */
  clearDirtyMaterials() {
    for (const id of this.dirtyMaterials) {
      const material = this.materials.get(id);
      if (material) {
        material.isDirty = false;
      }
    }
    this.dirtyMaterials.clear();
  }
  /**
   * Get current material count
   * @returns Number of active materials
   */
  getMaterialCount() {
    return this.materials.size;
  }
  /**
   * Get maximum material capacity
   * @returns Maximum number of materials
   */
  getMaxMaterials() {
    return this.maxMaterials;
  }
  /**
   * Check if material exists
   * @param materialId Material ID
   * @returns True if material exists
   */
  hasMaterial(materialId) {
    return this.materials.has(materialId);
  }
  /**
   * Get buffer index for a material
   * @param materialId Material ID
   * @returns Buffer index or -1 if not found
   */
  getBufferIndex(materialId) {
    return this.materialIdToIndex.get(materialId) || -1;
  }
  /**
   * Clear all materials
   */
  clear() {
    this.materials.clear();
    this.materialIdToIndex.clear();
    this.freeSlots = [];
    this.dirtyMaterials.clear();
    this.nextMaterialId = 1;
    this.nextBufferIndex = 0;
  }
  /**
   * Get material instance by ID (internal use only)
   * @param materialId Material ID
   * @returns Material instance or null
   */
  getMaterialInstance(materialId) {
    return this.materials.get(materialId) || null;
  }
}

class MaterialBuffer {
  bufferManager;
  bufferName;
  maxMaterials;
  bufferSize;
  materialManager;
  targetUtilization = 0.7;
  minBufferSize = 100;
  maxBufferSize = 1e4;
  /**
   * Create a new MaterialBuffer
   * @param bufferManager BufferManager instance
   * @param maxMaterials Maximum number of materials
   * @param bufferName Buffer name for identification
   */
  constructor(bufferManager, maxMaterials = 1e3, bufferName = "materials") {
    this.bufferManager = bufferManager;
    this.bufferName = bufferName;
    this.maxMaterials = Math.max(maxMaterials, this.minBufferSize);
    this.bufferSize = BufferLayout.materialBufferSize(this.maxMaterials);
    this.materialManager = null;
    this.createBuffer();
  }
  /**
   * Set material manager
   * @param manager MaterialManager instance
   */
  setMaterialManager(manager) {
    this.materialManager = manager;
  }
  /**
   * Create the material buffer
   */
  createBuffer() {
    try {
      this.bufferManager.createStorageBuffer(this.bufferName, this.bufferSize);
    } catch (error) {
      throw new BufferError(`Failed to create material buffer: ${error}`);
    }
  }
  /**
   * Check if buffer needs resizing
   * @returns True if buffer needs resizing
   */
  shouldResize() {
    if (!this.materialManager) {
      return false;
    }
    const currentCount = this.materialManager.getMaterialCount();
    const utilization = currentCount / this.maxMaterials;
    return utilization > this.targetUtilization || utilization < this.targetUtilization / 2;
  }
  /**
   * Resize buffer if needed
   */
  resizeIfNeeded() {
    if (!this.materialManager || !this.shouldResize()) {
      return;
    }
    const currentCount = this.materialManager.getMaterialCount();
    let newSize = Math.max(this.minBufferSize, Math.ceil(currentCount / this.targetUtilization));
    newSize = Math.min(newSize, this.maxBufferSize);
    if (newSize !== this.maxMaterials) {
      this.resizeBuffer(newSize);
    }
  }
  /**
   * Update the buffer with all materials
   */
  update() {
    if (!this.materialManager) {
      return;
    }
    this.resizeIfNeeded();
    const buffer = this.getBuffer();
    if (!buffer) {
      throw new BufferError("Material buffer not found");
    }
    try {
      const materials = this.materialManager.getMaterialsForBuffer();
      this.bufferManager.writeMaterialBuffer(buffer, materials);
    } catch (error) {
      throw new BufferError(`Failed to update material buffer: ${error}`);
    }
  }
  /**
   * Update only dirty materials
   */
  updateDirtyMaterials() {
    if (!this.materialManager) {
      return;
    }
    const dirtyMaterials = this.materialManager.getDirtyMaterials();
    if (dirtyMaterials.size === 0) {
      return;
    }
    const buffer = this.getBuffer();
    if (!buffer) {
      throw new BufferError("Material buffer not found");
    }
    try {
      const materials = new Array(this.maxMaterials);
      for (const id of dirtyMaterials) {
        const material = this.materialManager.getMaterial(id);
        const bufferIndex = this.materialManager.getBufferIndex(id);
        if (material && bufferIndex >= 0 && bufferIndex < this.maxMaterials) {
          materials[bufferIndex] = material;
        }
      }
      this.bufferManager.writeMaterialBuffer(buffer, materials);
      this.materialManager.clearDirtyMaterials();
    } catch (error) {
      throw new BufferError(`Failed to update dirty materials: ${error}`);
    }
  }
  /**
   * Resize the material buffer
   * @param newMaxMaterials New maximum number of materials
   */
  resizeBuffer(newMaxMaterials) {
    if (newMaxMaterials <= 0) {
      throw new ValidationError("Maximum materials must be greater than 0");
    }
    if (newMaxMaterials === this.maxMaterials) {
      return;
    }
    const newBufferSize = BufferLayout.materialBufferSize(newMaxMaterials);
    try {
      this.bufferManager.destroyBuffer(this.bufferName);
      this.maxMaterials = newMaxMaterials;
      this.bufferSize = newBufferSize;
      this.createBuffer();
    } catch (error) {
      throw new BufferError(`Failed to resize material buffer: ${error}`);
    }
  }
  /**
   * Get the GPU buffer
   * @returns GPU buffer
   */
  getBuffer() {
    return this.bufferManager.getBuffer(this.bufferName);
  }
  /**
   * Get maximum material capacity
   * @returns Maximum number of materials
   */
  getMaxMaterials() {
    return this.maxMaterials;
  }
  /**
   * Get current buffer size in bytes
   * @returns Buffer size in bytes
   */
  getBufferSize() {
    return this.bufferSize;
  }
  /**
   * Destroy the material buffer
   */
  destroy() {
    try {
      this.bufferManager.destroyBuffer(this.bufferName);
    } catch (error) {
      console.warn("Error destroying material buffer:", error);
    }
  }
}

/**
 * Common utilities
 * @module glMatrix
 */

var ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create$1() {
  var out = new ARRAY_TYPE(16);
  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function clone$1(a) {
  var out = new ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4 | null} out, or null if source matrix is not invertible
 */
function invert(out, a) {
  var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32;

  // Calculate the determinant
  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) {
    return null;
  }
  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }
  return out;
}

/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function scale(out, a, v) {
  var x = v[0],
    y = v[1],
    z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  // Perform axis-specific matrix multiplication
  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
  var out = new ARRAY_TYPE(3);
  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }
  return out;
}

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
function clone(a) {
  var out = new ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;
  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }
  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
(function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;
    if (!stride) {
      stride = 3;
    }
    if (!offset) {
      offset = 0;
    }
    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }
    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }
    return a;
  };
})();

class SDFObject {
  id;
  state;
  changeFlags;
  position;
  rotation;
  scale;
  material;
  type;
  visible;
  constructor(id, config) {
    this.id = id;
    this.state = ObjectState.ACTIVE;
    this.changeFlags = ObjectChangeFlags.ALL;
    this.type = config.type;
    this.position = fromValues(...config.transform?.position ?? [0, 0, 0]);
    this.rotation = fromValues(...config.transform?.rotation ?? [0, 0, 0]);
    this.scale = fromValues(...config.transform?.scale ?? [1, 1, 1]);
    this.material = {
      color: config.material?.color ?? [1, 1, 1],
      metallic: config.material?.metallic ?? 0.5,
      roughness: config.material?.roughness ?? 0.5,
      reflectance: config.material?.reflectance ?? 0.5,
      emission: config.material?.emission ?? [0, 0, 0],
      emissionIntensity: config.material?.emissionIntensity ?? 0,
      ambientOcclusion: config.material?.ambientOcclusion ?? 1
    };
    this.visible = config.visible ?? true;
  }
  getId() {
    return this.id;
  }
  setPosition(x, y, z) {
    if (this.position[0] !== x || this.position[1] !== y || this.position[2] !== z) {
      set(this.position, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  setRotation(x, y, z) {
    if (this.rotation[0] !== x || this.rotation[1] !== y || this.rotation[2] !== z) {
      set(this.rotation, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  setScale(x, y, z) {
    if (this.scale[0] !== x || this.scale[1] !== y || this.scale[2] !== z) {
      set(this.scale, x, y, z);
      this.markDirty(ObjectChangeFlags.TRANSFORM);
    }
  }
  getColor() {
    return this.material.color;
  }
  setColor(r, g, b) {
    if (this.material.color[0] !== r || this.material.color[1] !== g || this.material.color[2] !== b) {
      this.material.color = [r, g, b];
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  setMetallic(value) {
    if (this.material.metallic !== value) {
      this.material.metallic = value;
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  setRoughness(value) {
    if (this.material.roughness !== value) {
      this.material.roughness = value;
      this.markDirty(ObjectChangeFlags.MATERIAL);
    }
  }
  setVisible(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      this.markDirty(ObjectChangeFlags.VISIBILITY);
    }
  }
  isVisible() {
    return this.visible;
  }
  getState() {
    return this.state;
  }
  setState(state) {
    this.state = state;
  }
  isDirty() {
    return this.state === ObjectState.DIRTY || this.changeFlags !== ObjectChangeFlags.NONE;
  }
  getChangeFlags() {
    return this.changeFlags;
  }
  clearDirty() {
    this.changeFlags = ObjectChangeFlags.NONE;
    if (this.state === ObjectState.DIRTY) {
      this.state = ObjectState.ACTIVE;
    }
  }
  markDirty(flags) {
    this.changeFlags |= flags;
    if (this.state === ObjectState.ACTIVE) {
      this.state = ObjectState.DIRTY;
    }
  }
  toObjectData() {
    return {
      type: this.type,
      position: [this.position[0], this.position[1], this.position[2]],
      rotation: [this.rotation[0], this.rotation[1], this.rotation[2]],
      scale: [this.scale[0], this.scale[1], this.scale[2]]
    };
  }
  toMaterialData() {
    return {
      color: this.material.color,
      metallic: this.material.metallic,
      roughness: this.material.roughness,
      reflectance: this.material.reflectance,
      emission: this.material.emission,
      emissionIntensity: this.material.emissionIntensity,
      ambientOcclusion: this.material.ambientOcclusion
    };
  }
  destroy() {
    this.state = ObjectState.FREE;
    this.changeFlags = ObjectChangeFlags.NONE;
  }
}

class ObjectPool {
  pool;
  freeList;
  activeCount;
  maxSize;
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.pool = new Array(maxSize).fill(null);
    this.freeList = [];
    this.activeCount = 0;
    for (let i = 0; i < maxSize; i++) {
      this.freeList.push(i);
    }
  }
  acquire(config) {
    if (this.freeList.length === 0) {
      return null;
    }
    const id = this.freeList.pop();
    const object = new SDFObject(id, config);
    this.pool[id] = object;
    this.activeCount++;
    return object;
  }
  release(object) {
    const id = object.getId();
    if (id < 0 || id >= this.maxSize) {
      throw new Error(`Invalid object ID: ${id}`);
    }
    if (this.pool[id] !== object) {
      throw new Error("Object does not belong to this pool");
    }
    object.destroy();
    this.pool[id] = null;
    this.freeList.push(id);
    this.activeCount--;
  }
  get(id) {
    if (id < 0 || id >= this.maxSize) {
      return null;
    }
    return this.pool[id] ?? null;
  }
  getActiveObjects() {
    const active = [];
    for (const obj of this.pool) {
      if (obj && obj.getState() !== 0) {
        active.push(obj);
      }
    }
    return active;
  }
  getDirtyObjects() {
    const dirty = [];
    for (const obj of this.pool) {
      if (obj && obj.isDirty()) {
        dirty.push(obj);
      }
    }
    return dirty;
  }
  getActiveCount() {
    return this.activeCount;
  }
  getFreeCount() {
    return this.freeList.length;
  }
  getMaxSize() {
    return this.maxSize;
  }
  forEach(callback) {
    for (const obj of this.pool) {
      if (obj && obj.getState() !== 0) {
        callback(obj);
      }
    }
  }
  forEachDirty(callback) {
    for (const obj of this.pool) {
      if (obj && obj.isDirty()) {
        callback(obj);
      }
    }
  }
  clear() {
    for (const obj of this.pool) {
      if (obj) {
        obj.destroy();
      }
    }
    this.pool.fill(null);
    this.freeList = [];
    this.activeCount = 0;
    for (let i = 0; i < this.maxSize; i++) {
      this.freeList.push(i);
    }
  }
}

class ObjectManager {
  pool;
  bufferManager;
  batchUpdates;
  dirtyObjects;
  constructor(maxObjects, bufferManager) {
    this.pool = new ObjectPool(maxObjects);
    this.bufferManager = bufferManager;
    this.batchUpdates = false;
    this.dirtyObjects = /* @__PURE__ */ new Set();
  }
  createObject(config) {
    const object = this.pool.acquire(config);
    if (!object) {
      throw new ValidationError("Maximum object count reached");
    }
    if (!this.batchUpdates) {
      this.syncObject(object);
    } else {
      this.dirtyObjects.add(object);
    }
    return object;
  }
  createSphere(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Sphere,
      ...config
    });
  }
  createBox(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Box,
      ...config
    });
  }
  createTorus(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Torus,
      ...config
    });
  }
  createCapsule(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Capsule,
      ...config
    });
  }
  createCylinder(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Cylinder,
      ...config
    });
  }
  createCone(config = {}) {
    return this.createObject({
      type: SDFPrimitive.Cone,
      ...config
    });
  }
  destroyObject(object) {
    this.pool.release(object);
    this.dirtyObjects.delete(object);
  }
  destroyAll() {
    this.pool.clear();
    this.dirtyObjects.clear();
  }
  syncObjects() {
    const startTime = performance.now();
    const dirty = this.pool.getDirtyObjects();
    if (dirty.length === 0) {
      return;
    }
    const objectData = dirty.map((obj) => obj.toObjectData());
    const materialData = dirty.map((obj) => obj.toMaterialData());
    const objectBuffer = this.bufferManager.getBuffer("objects");
    const materialBuffer = this.bufferManager.getBuffer("materials");
    if (objectBuffer && materialBuffer) {
      this.bufferManager.writeObjectBuffer(objectBuffer, objectData);
      this.bufferManager.writeMaterialBuffer(materialBuffer, materialData);
    }
    dirty.forEach((obj) => obj.clearDirty());
    this.dirtyObjects.clear();
    this.lastSyncTime = performance.now() - startTime;
  }
  syncObject(object) {
    if (!object.isDirty()) {
      return;
    }
    const objectBuffer = this.bufferManager.getBuffer("objects");
    const materialBuffer = this.bufferManager.getBuffer("materials");
    if (objectBuffer && materialBuffer) {
      const objectData = [object.toObjectData()];
      const materialData = [object.toMaterialData()];
      this.bufferManager.writeObjectBuffer(objectBuffer, objectData);
      this.bufferManager.writeMaterialBuffer(materialBuffer, materialData);
    }
    object.clearDirty();
  }
  setBatchUpdates(enabled) {
    this.batchUpdates = enabled;
  }
  getObject(id) {
    return this.pool.get(id);
  }
  getAllObjects() {
    return this.pool.getActiveObjects();
  }
  getObjectCount() {
    return this.pool.getActiveCount();
  }
  getStats() {
    return {
      totalObjects: this.pool.getMaxSize(),
      activeObjects: this.pool.getActiveCount(),
      dirtyObjects: this.pool.getDirtyObjects().length,
      freeSlots: this.pool.getFreeCount(),
      lastSyncTime: this.lastSyncTime
    };
  }
  lastSyncTime = 0;
}

class LightManager {
  lights = /* @__PURE__ */ new Map();
  nextId = 0;
  maxLights;
  dirtyLights = /* @__PURE__ */ new Set();
  constructor(maxLights = 8) {
    this.maxLights = maxLights;
  }
  createLight(config) {
    if (this.lights.size >= this.maxLights) {
      console.warn("LightManager: Maximum light count reached");
      return null;
    }
    const id = this.nextId++;
    const lightData = {
      type: config.type,
      position: config.position ?? [0, 0, 0],
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1,
      range: config.range ?? 10,
      innerConeAngle: config.innerConeAngle ?? 0,
      outerConeAngle: config.outerConeAngle ?? Math.PI / 4,
      castShadows: config.castShadows ? 1 : 0,
      shadowSoftness: config.shadowSoftness ?? 16
    };
    this.lights.set(id, lightData);
    this.dirtyLights.add(id);
    return id;
  }
  createDirectionalLight(config = {}) {
    return this.createLight({
      type: LightType.DIRECTIONAL,
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16
    });
  }
  createPointLight(config = {}) {
    return this.createLight({
      type: LightType.POINT,
      position: config.position ?? [0, 0, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1,
      range: config.range ?? 10,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16
    });
  }
  createSpotLight(config = {}) {
    return this.createLight({
      type: LightType.SPOT,
      position: config.position ?? [0, 0, 0],
      direction: config.direction ?? [0, -1, 0],
      color: config.color ?? [1, 1, 1],
      intensity: config.intensity ?? 1,
      range: config.range ?? 10,
      innerConeAngle: config.innerConeAngle ?? 0,
      outerConeAngle: config.outerConeAngle ?? Math.PI / 4,
      castShadows: config.castShadows ?? true,
      shadowSoftness: config.shadowSoftness ?? 16
    });
  }
  updateLight(id, updates) {
    const light = this.lights.get(id);
    if (!light) {
      return false;
    }
    if (updates.position !== void 0) {
      light.position = updates.position;
    }
    if (updates.direction !== void 0) {
      light.direction = updates.direction;
    }
    if (updates.color !== void 0) {
      light.color = updates.color;
    }
    if (updates.intensity !== void 0) {
      light.intensity = updates.intensity;
    }
    if (updates.range !== void 0) {
      light.range = updates.range;
    }
    if (updates.innerConeAngle !== void 0) {
      light.innerConeAngle = updates.innerConeAngle;
    }
    if (updates.outerConeAngle !== void 0) {
      light.outerConeAngle = updates.outerConeAngle;
    }
    if (updates.castShadows !== void 0) {
      light.castShadows = updates.castShadows ? 1 : 0;
    }
    if (updates.shadowSoftness !== void 0) {
      light.shadowSoftness = updates.shadowSoftness;
    }
    this.dirtyLights.add(id);
    return true;
  }
  removeLight(id) {
    const deleted = this.lights.delete(id);
    if (deleted) {
      this.dirtyLights.delete(id);
    }
    return deleted;
  }
  getLight(id) {
    return this.lights.get(id) ?? null;
  }
  getAllLights() {
    return Array.from(this.lights.values());
  }
  getLightCount() {
    return this.lights.size;
  }
  getDirtyLights() {
    return Array.from(this.dirtyLights);
  }
  clearDirtyFlags() {
    this.dirtyLights.clear();
  }
  isDirty() {
    return this.dirtyLights.size > 0;
  }
  getLightDataArray() {
    const lightCount = this.lights.size;
    const bufferSize = lightCount * 80;
    const buffer = new Float32Array(bufferSize / 4);
    let index = 0;
    for (const light of this.lights.values()) {
      const offset = index * 20;
      buffer[offset + 0] = light.type;
      buffer[offset + 1] = light.intensity;
      buffer[offset + 2] = light.castShadows;
      buffer[offset + 3] = light.shadowSoftness;
      buffer[offset + 4] = light.position[0];
      buffer[offset + 5] = light.position[1];
      buffer[offset + 6] = light.position[2];
      buffer[offset + 7] = 0;
      buffer[offset + 8] = light.direction[0];
      buffer[offset + 9] = light.direction[1];
      buffer[offset + 10] = light.direction[2];
      buffer[offset + 11] = 0;
      buffer[offset + 12] = light.color[0];
      buffer[offset + 13] = light.color[1];
      buffer[offset + 14] = light.color[2];
      buffer[offset + 15] = 0;
      buffer[offset + 16] = light.range;
      buffer[offset + 17] = light.innerConeAngle;
      buffer[offset + 18] = light.outerConeAngle;
      buffer[offset + 19] = 0;
      index++;
    }
    return buffer;
  }
  clear() {
    this.lights.clear();
    this.dirtyLights.clear();
    this.nextId = 0;
  }
  getMaxLights() {
    return this.maxLights;
  }
}

class Scene {
  config;
  objects;
  materials;
  lights;
  camera;
  ambientLight;
  objectManager;
  lightManager;
  dirty;
  /**
   * Create a new scene
   * @param config - Scene configuration
   */
  constructor(config = {}) {
    this.config = {
      maxObjects: config.maxObjects || 1e4,
      maxLights: config.maxLights || 8,
      camera: config.camera,
      ambientLight: config.ambientLight
    };
    this.objects = [];
    this.materials = [];
    this.lights = [];
    this.camera = config.camera || {
      position: [0, 0, 5],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: 1.57,
      // 90 degrees in radians
      near: 0.1,
      far: 100
    };
    this.ambientLight = config.ambientLight || [0.03, 0.03, 0.03];
    this.objectManager = null;
    this.lightManager = new LightManager(this.config.maxLights);
    this.dirty = false;
  }
  /**
   * Initialize scene with object manager
   * @param objectManager - Object manager instance
   */
  initialize(objectManager) {
    this.objectManager = objectManager;
  }
  /**
   * Add object to scene
   * @param object - SDF object data
   * @param material - Material data (optional)
   * @returns Object index
   */
  addObject(object, material) {
    if (this.objects.length >= this.config.maxObjects) {
      throw new ValidationError("Maximum object count reached");
    }
    this.objects.push(object);
    this.materials.push(material || {
      color: [1, 1, 1],
      metallic: 0.5,
      roughness: 0.5,
      reflectance: 0.5,
      emission: [0, 0, 0],
      emissionIntensity: 0,
      ambientOcclusion: 1
    });
    this.dirty = true;
    return this.objects.length - 1;
  }
  /**
   * Remove object from scene
   * @param index - Object index
   */
  removeObject(index) {
    if (index < 0 || index >= this.objects.length) {
      throw new ValidationError("Invalid object index");
    }
    this.objects.splice(index, 1);
    this.materials.splice(index, 1);
    this.dirty = true;
  }
  /**
   * Update object data
   * @param index - Object index
   * @param object - New object data
   */
  updateObject(index, object) {
    if (index < 0 || index >= this.objects.length) {
      throw new ValidationError("Invalid object index");
    }
    this.objects[index] = object;
    this.dirty = true;
  }
  /**
   * Update material data
   * @param index - Object index
   * @param material - New material data
   */
  updateMaterial(index, material) {
    if (index < 0 || index >= this.materials.length) {
      throw new ValidationError("Invalid object index");
    }
    this.materials[index] = material;
    this.dirty = true;
  }
  /**
   * Add light to scene
   * @param config - Light configuration
   * @returns Light ID or null if failed
   */
  addLight(config) {
    const id = this.lightManager.createLight(config);
    if (id !== null) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return id;
  }
  /**
   * Remove light from scene
   * @param id - Light ID
   * @returns Whether light was removed
   */
  removeLight(id) {
    const removed = this.lightManager.removeLight(id);
    if (removed) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return removed;
  }
  /**
   * Update light data
   * @param id - Light ID
   * @param updates - Light updates
   * @returns Whether light was updated
   */
  updateLight(id, updates) {
    const updated = this.lightManager.updateLight(id, updates);
    if (updated) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return updated;
  }
  /**
   * Update camera data
   * @param camera - Camera updates
   */
  updateCamera(camera) {
    this.camera = { ...this.camera, ...camera };
    this.dirty = true;
  }
  /**
   * Set ambient light
   * @param ambientLight - Ambient light color
   */
  setAmbientLight(ambientLight) {
    this.ambientLight = ambientLight;
    this.dirty = true;
  }
  /**
   * Get objects
   * @returns Objects array
   */
  getObjects() {
    return [...this.objects];
  }
  /**
   * Get materials
   * @returns Materials array
   */
  getMaterials() {
    return [...this.materials];
  }
  /**
   * Get lights
   * @returns Lights array
   */
  getLights() {
    return [...this.lights];
  }
  /**
   * Get camera data
   * @returns Camera data
   */
  getCamera() {
    return { ...this.camera };
  }
  /**
   * Get ambient light
   * @returns Ambient light color
   */
  getAmbientLight() {
    return [...this.ambientLight];
  }
  /**
   * Get object count
   * @returns Object count
   */
  getObjectCount() {
    return this.objects.length;
  }
  /**
   * Get light count
   * @returns Light count
   */
  getLightCount() {
    return this.lights.length;
  }
  /**
   * Get light manager
   * @returns Light manager
   */
  getLightManager() {
    return this.lightManager;
  }
  /**
   * Get object manager
   * @returns Object manager or null
   */
  getObjectManager() {
    return this.objectManager;
  }
  /**
   * Check if scene is dirty
   * @returns Whether scene is dirty
   */
  isDirty() {
    return this.dirty;
  }
  /**
   * Clear dirty flag
   */
  clearDirtyFlag() {
    this.dirty = false;
  }
  /**
   * Get render data
   * @returns Scene render data
   */
  getRenderData() {
    return {
      objects: this.objects,
      materials: this.materials,
      lights: this.lights,
      camera: this.camera,
      objectCount: this.objects.length,
      lightCount: this.lights.length,
      ambientLight: this.ambientLight
    };
  }
  /**
   * Update scene
   * @param _deltaTime - Time since last frame
   */
  update(_deltaTime) {
    if (this.objectManager) {
      this.objectManager.syncObjects();
    }
    this.clearDirtyFlag();
  }
  /**
   * Clear scene
   */
  clear() {
    this.objects = [];
    this.materials = [];
    this.lights = [];
    this.lightManager.clear();
    this.dirty = true;
  }
  /**
   * Destroy scene
   */
  destroy() {
    this.clear();
    if (this.objectManager) {
      this.objectManager.destroyAll();
    }
  }
}

const GPUTextureUsage = {
  DEPTH_ATTACHMENT: 128
};
class Engine {
  config;
  deviceManager;
  bufferManager;
  pipelineManager;
  materialManager;
  materialBuffer;
  objectManager;
  scenes;
  activeScene;
  defaultSceneName;
  uniformData;
  animationId;
  frame;
  constructor(config) {
    this.config = {
      canvas: config.canvas,
      maxObjects: config.maxObjects || 1e4,
      debug: config.debug || false,
      backgroundColor: config.backgroundColor || [0, 0, 0]
    };
    this.deviceManager = new DeviceManager();
    this.scenes = /* @__PURE__ */ new Map();
    this.defaultSceneName = "default";
    const defaultScene = new Scene({
      maxObjects: this.config.maxObjects,
      maxLights: 8
    });
    this.scenes.set(this.defaultSceneName, defaultScene);
    this.activeScene = defaultScene;
    this.uniformData = {
      time: 0,
      frame: 0,
      objectCount: 0,
      lightCount: 0,
      resolution: [
        this.config.canvas.width,
        this.config.canvas.height
      ],
      ambientLight: [0.03, 0.03, 0.03]
    };
    this.animationId = null;
    this.frame = 0;
  }
  /**
   * Initialize engine
   */
  async initialize() {
    try {
      await this.deviceManager.initialize(this.config.canvas);
      const device = this.deviceManager.getDevice();
      this.bufferManager = new BufferManager(device);
      this.materialManager = new MaterialManager(this.config.maxObjects);
      this.materialBuffer = new MaterialBuffer(this.bufferManager, this.config.maxObjects);
      this.materialBuffer.setMaterialManager(this.materialManager);
      this.pipelineManager = new PipelineManager(device, this.bufferManager, {
        width: this.config.canvas.width,
        height: this.config.canvas.height,
        debug: this.config.debug,
        backgroundColor: [...this.config.backgroundColor, 1]
      });
      const vertexShader = await this.loadShader("src/shaders/vertex.wgsl");
      const fragmentShader = await this.loadShader("src/shaders/raymarch.wgsl");
      await this.pipelineManager.createPipeline(vertexShader, fragmentShader);
      this.createBuffers();
      this.objectManager = new ObjectManager(
        this.config.maxObjects,
        this.bufferManager
      );
      this.activeScene.initialize(this.objectManager);
      console.log("OasisSDF Engine initialized successfully");
    } catch (error) {
      throw new EngineError(`Failed to initialize engine: ${error}`);
    }
  }
  /**
   * Load shader file
   * @param path - Shader file path
   * @returns Shader source code
   */
  async loadShader(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new EngineError(`Failed to load shader: ${path}`);
      }
      return await response.text();
    } catch (error) {
      throw new EngineError(`Error loading shader ${path}: ${error}`);
    }
  }
  /**
   * Create buffers
   */
  createBuffers() {
    const maxObjects = this.config.maxObjects;
    const maxLights = 8;
    const objectBuffer = this.bufferManager.createStorageBuffer(
      "objects",
      maxObjects * 64
      // 64 bytes per object
    );
    const materialBuffer = this.materialBuffer.getBuffer();
    const lightBuffer = this.bufferManager.createStorageBuffer(
      "lights",
      maxLights * 80
      // 80 bytes per light
    );
    const uniformBuffer = this.bufferManager.createUniformBuffer(
      "uniforms",
      48
      // 48 bytes
    );
    const cameraBuffer = this.bufferManager.createUniformBuffer(
      "camera",
      80
      // 80 bytes
    );
    this.pipelineManager.createStorageBindGroup(objectBuffer, materialBuffer, lightBuffer);
    this.pipelineManager.createUniformBindGroup(uniformBuffer, cameraBuffer);
  }
  /**
   * Add object to active scene
   * @param object - SDF object data or object config
   * @returns Object index
   */
  addObject(object) {
    let sdfObject;
    if ("transform" in object) {
      sdfObject = {
        type: object.type,
        position: object.transform?.position || [0, 0, 0],
        rotation: object.transform?.rotation || [0, 0, 0],
        scale: object.transform?.scale || [1, 1, 1]
      };
    } else {
      sdfObject = object;
    }
    const index = this.activeScene.addObject(sdfObject);
    this.uniformData.objectCount = this.activeScene.getObjectCount();
    this.updateBuffers();
    return index;
  }
  /**
   * Remove object from active scene
   * @param index - Object index
   */
  removeObject(index) {
    this.activeScene.removeObject(index);
    this.uniformData.objectCount = this.activeScene.getObjectCount();
    this.updateBuffers();
  }
  /**
   * Update object data in active scene
   * @param index - Object index
   * @param object - New object data
   */
  updateObject(index, object) {
    this.activeScene.updateObject(index, object);
    this.updateBuffers();
  }
  /**
   * Update camera data in active scene
   * @param camera - New camera data
   */
  updateCamera(camera) {
    this.activeScene.updateCamera(camera);
    this.updateBuffers();
  }
  /**
   * Add light to active scene
   */
  addLight(config) {
    const id = this.activeScene.addLight(config);
    if (id !== null) {
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }
    return id;
  }
  /**
   * Remove light from active scene
   */
  removeLight(id) {
    const removed = this.activeScene.removeLight(id);
    if (removed) {
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }
    return removed;
  }
  /**
   * Update light data in active scene
   */
  updateLight(id, updates) {
    const updated = this.activeScene.updateLight(id, updates);
    if (updated) {
      this.updateBuffers();
    }
    return updated;
  }
  /**
   * Get light manager from active scene
   */
  getLightManager() {
    return this.activeScene.getLightManager();
  }
  /**
   * Create a new material
   * @param material - Material data
   * @returns Material ID
   */
  createMaterial(material) {
    return this.materialManager.createMaterial(material);
  }
  /**
   * Update an existing material
   * @param id - Material ID
   * @param material - Material data
   */
  updateMaterial(id, material) {
    this.materialManager.updateMaterial(id, material);
  }
  /**
   * Get material by ID
   * @param id - Material ID
   * @returns Material data or null
   */
  getMaterial(id) {
    return this.materialManager.getMaterial(id);
  }
  /**
   * Release material (decrement ref count and destroy if no references)
   * @param id - Material ID
   * @returns Whether material was destroyed
   */
  releaseMaterial(id) {
    return this.materialManager.releaseMaterial(id);
  }
  /**
   * Reference a material (increment ref count)
   * @param id - Material ID
   */
  referenceMaterial(id) {
    this.materialManager.referenceMaterial(id);
  }
  /**
   * Get material manager
   * @returns Material manager
   */
  getMaterialManager() {
    return this.materialManager;
  }
  /**
   * Get material buffer
   * @returns Material buffer
   */
  getMaterialBuffer() {
    return this.materialBuffer;
  }
  /**
   * Update buffers with current data
   */
  updateBuffers() {
    const renderData = this.activeScene.getRenderData();
    const objectBuffer = this.bufferManager.getBuffer("objects");
    if (objectBuffer) {
      this.bufferManager.writeObjectBuffer(objectBuffer, renderData.objects);
    }
    if (this.materialBuffer) {
      this.materialBuffer.update();
    }
    const lightBuffer = this.bufferManager.getBuffer("lights");
    if (lightBuffer) {
      this.bufferManager.writeLightBuffer(lightBuffer, renderData.lights);
    }
    const uniformBuffer = this.bufferManager.getBuffer("uniforms");
    if (uniformBuffer) {
      this.uniformData.ambientLight = renderData.ambientLight;
      this.bufferManager.writeUniformBuffer(uniformBuffer, this.uniformData);
    }
    const cameraBuffer = this.bufferManager.getBuffer("camera");
    if (cameraBuffer) {
      this.bufferManager.writeCameraBuffer(cameraBuffer, renderData.camera);
    }
  }
  /**
   * Render frame
   * @param deltaTime - Time since last frame
   */
  render(deltaTime) {
    const device = this.deviceManager.getDevice();
    const context = this.deviceManager.getContext();
    this.uniformData.time += deltaTime;
    this.uniformData.frame = this.frame++;
    this.activeScene.update(deltaTime);
    this.updateBuffers();
    const texture = context.getCurrentTexture();
    const textureView = texture.createView();
    const depthTexture = device.createTexture({
      size: [this.config.canvas.width, this.config.canvas.height, 1],
      format: "depth24plus",
      usage: GPUTextureUsage.DEPTH_ATTACHMENT
    });
    const depthTextureView = depthTexture.createView();
    const encoder = device.createCommandEncoder();
    const renderPass = this.pipelineManager.beginRenderPass(
      encoder,
      textureView,
      depthTextureView
    );
    this.pipelineManager.drawFullscreenQuad(renderPass);
    renderPass.end();
    device.queue.submit([encoder.finish()]);
    depthTexture.destroy();
  }
  /**
   * Start animation loop
   */
  start() {
    if (this.animationId) {
      return;
    }
    let lastTime = performance.now();
    const animate = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1e3;
      lastTime = currentTime;
      this.render(deltaTime);
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }
  /**
   * Stop animation loop
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  /**
   * Resize canvas
   * @param width - New width
   * @param height - New height
   */
  resize(width, height) {
    this.config.canvas.width = width;
    this.config.canvas.height = height;
    this.uniformData.resolution = [width, height];
    this.pipelineManager.resize(width, height);
    this.updateBuffers();
  }
  /**
   * Get device manager
   * @returns Device manager
   */
  getDeviceManager() {
    return this.deviceManager;
  }
  /**
   * Get buffer manager
   * @returns Buffer manager
   */
  getBufferManager() {
    return this.bufferManager;
  }
  /**
   * Get pipeline manager
   * @returns Pipeline manager
   */
  getPipelineManager() {
    return this.pipelineManager;
  }
  /**
   * Get object manager
   * @returns Object manager
   */
  getObjectManager() {
    return this.objectManager;
  }
  /**
   * Get objects from active scene
   * @returns Objects array
   */
  getObjects() {
    return this.activeScene.getObjects();
  }
  /**
   * Get camera data from active scene
   * @returns Camera data
   */
  getCamera() {
    return this.activeScene.getCamera();
  }
  /**
   * Create a new scene
   * @param name - Scene name
   * @param config - Scene configuration
   * @returns Created scene
   */
  createScene(name, config = {}) {
    if (this.scenes.has(name)) {
      throw new ValidationError(`Scene with name "${name}" already exists`);
    }
    const scene = new Scene({
      maxObjects: config.maxObjects || this.config.maxObjects,
      maxLights: config.maxLights || 8,
      ...config
    });
    if (this.objectManager) {
      scene.initialize(this.objectManager);
    }
    this.scenes.set(name, scene);
    return scene;
  }
  /**
   * Set active scene
   * @param name - Scene name
   * @returns Whether scene was set successfully
   */
  setActiveScene(name) {
    const scene = this.scenes.get(name);
    if (!scene) {
      return false;
    }
    this.activeScene = scene;
    this.uniformData.objectCount = scene.getObjectCount();
    this.uniformData.lightCount = scene.getLightCount();
    this.updateBuffers();
    return true;
  }
  /**
   * Get active scene
   * @returns Active scene
   */
  getActiveScene() {
    return this.activeScene;
  }
  /**
   * Get scene by name
   * @param name - Scene name
   * @returns Scene or null
   */
  getScene(name) {
    return this.scenes.get(name) || null;
  }
  /**
   * Remove scene
   * @param name - Scene name
   * @returns Whether scene was removed
   */
  removeScene(name) {
    if (name === this.defaultSceneName) {
      throw new ValidationError("Cannot remove default scene");
    }
    const scene = this.scenes.get(name);
    if (!scene) {
      return false;
    }
    scene.destroy();
    this.scenes.delete(name);
    if (this.activeScene === scene) {
      this.activeScene = this.scenes.get(this.defaultSceneName);
      this.uniformData.objectCount = this.activeScene.getObjectCount();
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }
    return true;
  }
  /**
   * Get all scenes
   * @returns Map of scenes
   */
  getScenes() {
    return new Map(this.scenes);
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      this.stop();
      for (const [, scene] of this.scenes) {
        scene.destroy();
      }
      this.scenes.clear();
      if (this.objectManager) {
        this.objectManager.destroyAll();
      }
      if (this.pipelineManager) {
        this.pipelineManager.cleanup();
      }
      if (this.materialBuffer) {
        this.materialBuffer.destroy();
      }
      if (this.bufferManager) {
        this.bufferManager.cleanup();
      }
      this.deviceManager.cleanup();
      console.log("OasisSDF Engine cleaned up");
    } catch (error) {
      console.warn("Error during engine cleanup:", error);
    }
  }
}

const Primitives = {
  sphere(radius = 1, config = {}) {
    return {
      type: SDFPrimitive.Sphere,
      transform: {
        scale: [radius, radius, radius],
        ...config.transform
      },
      ...config
    };
  },
  box(width = 1, height = 1, depth = 1, config = {}) {
    return {
      type: SDFPrimitive.Box,
      transform: {
        scale: [width, height, depth],
        ...config.transform
      },
      ...config
    };
  },
  torus(majorRadius = 0.5, minorRadius = 0.2, config = {}) {
    return {
      type: SDFPrimitive.Torus,
      transform: {
        scale: [majorRadius, minorRadius, 1],
        ...config.transform
      },
      ...config
    };
  },
  capsule(height = 1, radius = 0.3, config = {}) {
    return {
      type: SDFPrimitive.Capsule,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  },
  cylinder(height = 1, radius = 0.5, config = {}) {
    return {
      type: SDFPrimitive.Cylinder,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  },
  cone(height = 1, radius = 0.5, config = {}) {
    return {
      type: SDFPrimitive.Cone,
      transform: {
        scale: [radius, height, radius],
        ...config.transform
      },
      ...config
    };
  }
};

class Transform {
  position;
  rotation;
  scale;
  matrix;
  matrixDirty;
  constructor() {
    this.position = create();
    this.rotation = create();
    this.scale = fromValues(1, 1, 1);
    this.matrix = create$1();
    this.matrixDirty = true;
  }
  getPosition() {
    return clone(this.position);
  }
  getRotation() {
    return clone(this.rotation);
  }
  getScale() {
    return clone(this.scale);
  }
  getMatrix() {
    this.updateMatrix();
    return clone$1(this.matrix);
  }
  setPosition(x, y, z) {
    if (this.position[0] !== x || this.position[1] !== y || this.position[2] !== z) {
      set(this.position, x, y, z);
      this.matrixDirty = true;
    }
  }
  setRotation(x, y, z) {
    if (this.rotation[0] !== x || this.rotation[1] !== y || this.rotation[2] !== z) {
      set(this.rotation, x, y, z);
      this.matrixDirty = true;
    }
  }
  setScale(x, y, z) {
    if (this.scale[0] !== x || this.scale[1] !== y || this.scale[2] !== z) {
      set(this.scale, x, y, z);
      this.matrixDirty = true;
    }
  }
  translate(x, y, z) {
    add(this.position, this.position, [x, y, z]);
    this.matrixDirty = true;
  }
  rotate(x, y, z) {
    add(this.rotation, this.rotation, [x, y, z]);
    this.matrixDirty = true;
  }
  scaleBy(x, y, z) {
    multiply(this.scale, this.scale, [x, y, z]);
    this.matrixDirty = true;
  }
  lookAt(target, _up = fromValues(0, 1, 0)) {
    const direction = create();
    subtract(direction, target, this.position);
    normalize(direction, direction);
    const yaw = Math.atan2(direction[0], direction[2]);
    const pitch = Math.asin(-direction[1]);
    this.rotation[0] = pitch;
    this.rotation[1] = yaw;
    this.rotation[2] = 0;
    this.matrixDirty = true;
  }
  updateMatrix() {
    if (!this.matrixDirty) return;
    identity(this.matrix);
    translate(this.matrix, this.matrix, this.position);
    rotateX(this.matrix, this.matrix, this.rotation[0]);
    rotateY(this.matrix, this.matrix, this.rotation[1]);
    rotateZ(this.matrix, this.matrix, this.rotation[2]);
    scale(this.matrix, this.matrix, this.scale);
    this.matrixDirty = false;
  }
  getInverseMatrix() {
    this.updateMatrix();
    const inverse = create$1();
    invert(inverse, this.matrix);
    return inverse;
  }
  clone() {
    const transform = new Transform();
    transform.copyFrom(this);
    return transform;
  }
  copyFrom(other) {
    copy(this.position, other.position);
    copy(this.rotation, other.rotation);
    copy(this.scale, other.scale);
    this.matrixDirty = true;
  }
  reset() {
    set(this.position, 0, 0, 0);
    set(this.rotation, 0, 0, 0);
    set(this.scale, 1, 1, 1);
    this.matrixDirty = true;
  }
}

class PerformanceProfiler {
  metrics = [];
  config;
  lastFrameTime = 0;
  frameCount = 0;
  lastFpsUpdate = 0;
  currentFps = 0;
  frameTimes = [];
  isRunning = false;
  startTime = 0;
  constructor(config = {}) {
    this.config = {
      enableGPUTiming: config.enableGPUTiming ?? false,
      sampleInterval: config.sampleInterval ?? 1e3,
      maxMetrics: config.maxMetrics ?? 1e4,
      trackMemory: config.trackMemory ?? true
    };
  }
  start() {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastFpsUpdate = this.startTime;
    this.frameCount = 0;
    this.currentFps = 0;
    this.frameTimes = [];
    this.metrics = [];
  }
  stop() {
    this.isRunning = false;
  }
  recordFrame(objectCount = 0) {
    if (!this.isRunning) {
      return;
    }
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= this.config.sampleInterval) {
      this.currentFps = this.frameCount / elapsed * 1e3;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    const metrics = {
      fps: this.currentFps,
      frameTime,
      memoryUsage: this.getMemoryUsage(),
      objectCount,
      timestamp: now
    };
    this.metrics.push(metrics);
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics.shift();
    }
  }
  getCurrentFPS() {
    return this.currentFps;
  }
  getCurrentFrameTime() {
    if (this.frameTimes.length === 0) {
      return 0;
    }
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }
  getMemoryUsage() {
    if (!this.config.trackMemory) {
      return 0;
    }
    const memory = performance.memory;
    if (memory) {
      return memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }
  getMetrics() {
    return [...this.metrics];
  }
  getStatistics() {
    if (this.metrics.length === 0) {
      return {
        avgFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        avgFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        avgMemoryUsage: 0,
        peakMemoryUsage: 0,
        totalFrames: 0,
        duration: 0
      };
    }
    const fpsValues = this.metrics.map((m) => m.fps).filter((f) => f > 0);
    const frameTimes = this.metrics.map((m) => m.frameTime);
    const memoryValues = this.metrics.map((m) => m.memoryUsage);
    return {
      avgFPS: fpsValues.length > 0 ? fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length : 0,
      minFPS: fpsValues.length > 0 ? Math.min(...fpsValues) : 0,
      maxFPS: fpsValues.length > 0 ? Math.max(...fpsValues) : 0,
      avgFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      minFrameTime: Math.min(...frameTimes),
      maxFrameTime: Math.max(...frameTimes),
      avgMemoryUsage: memoryValues.length > 0 ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length : 0,
      peakMemoryUsage: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      totalFrames: this.metrics.length,
      duration: performance.now() - this.startTime
    };
  }
  getAverageFPS() {
    return this.getStatistics().avgFPS;
  }
  getAverageFrameTime() {
    return this.getStatistics().avgFrameTime;
  }
  exportToJSON() {
    return JSON.stringify({
      config: this.config,
      statistics: this.getStatistics(),
      metrics: this.metrics
    }, null, 2);
  }
  exportToCSV() {
    const headers = "timestamp,fps,frameTime,memoryUsage,objectCount\n";
    const rows = this.metrics.map(
      (m) => `${m.timestamp},${m.fps},${m.frameTime},${m.memoryUsage},${m.objectCount}`
    ).join("\n");
    return headers + rows;
  }
  generateReport() {
    const stats = this.getStatistics();
    return `# Performance Report

## Summary
- **Duration**: ${(stats.duration / 1e3).toFixed(2)} seconds
- **Total Frames**: ${stats.totalFrames}

## FPS
- **Average**: ${stats.avgFPS.toFixed(1)}
- **Min**: ${stats.minFPS.toFixed(1)}
- **Max**: ${stats.maxFPS.toFixed(1)}

## Frame Time
- **Average**: ${stats.avgFrameTime.toFixed(2)} ms
- **Min**: ${stats.minFrameTime.toFixed(2)} ms
- **Max**: ${stats.maxFrameTime.toFixed(2)} ms

## Memory Usage
- **Average**: ${stats.avgMemoryUsage.toFixed(2)} MB
- **Peak**: ${stats.peakMemoryUsage.toFixed(2)} MB

## Performance Targets
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| FPS | >60 | ${stats.avgFPS.toFixed(1)} | ${stats.avgFPS >= 60 ? "✅ Pass" : "❌ Fail"} |
| Frame Time | <16ms | ${stats.avgFrameTime.toFixed(2)}ms | ${stats.avgFrameTime < 16 ? "✅ Pass" : "❌ Fail"} |
`;
  }
  reset() {
    this.metrics = [];
    this.frameTimes = [];
    this.frameCount = 0;
    this.currentFps = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastFpsUpdate = this.startTime;
  }
  isActive() {
    return this.isRunning;
  }
}

class MemoryProfiler {
  snapshots = [];
  bufferAllocations = /* @__PURE__ */ new Map();
  config;
  peakGPUMemory = 0;
  peakJSHeap = 0;
  totalAllocations = 0;
  totalDeallocations = 0;
  constructor(config = {}) {
    this.config = {
      trackGPUBuffers: config.trackGPUBuffers ?? true,
      trackJSHeap: config.trackJSHeap ?? true,
      snapshotInterval: config.snapshotInterval ?? 1e3,
      maxSnapshots: config.maxSnapshots ?? 1e3
    };
  }
  /**
   * Record a buffer allocation
   */
  recordBufferAllocation(id, size, usage = 0) {
    if (!this.config.trackGPUBuffers) {
      return;
    }
    const allocation = {
      id,
      size,
      usage,
      createdAt: performance.now(),
      active: true
    };
    this.bufferAllocations.set(id, allocation);
    this.totalAllocations++;
    const currentGPU = this.getTotalGPUMemory();
    if (currentGPU > this.peakGPUMemory) {
      this.peakGPUMemory = currentGPU;
    }
  }
  /**
   * Record a buffer deallocation
   */
  recordBufferDeallocation(id) {
    if (!this.config.trackGPUBuffers) {
      return;
    }
    const allocation = this.bufferAllocations.get(id);
    if (allocation) {
      allocation.active = false;
      this.totalDeallocations++;
    }
  }
  /**
   * Take a memory snapshot
   */
  takeSnapshot(objectCount = 0, sceneCount = 0) {
    const snapshot = {
      timestamp: performance.now(),
      gpuBuffers: this.getTotalGPUMemory(),
      objectCount,
      sceneCount,
      jsHeapSize: this.getJSHeapSize(),
      jsHeapLimit: this.getJSHeapLimit()
    };
    this.snapshots.push(snapshot);
    if (snapshot.jsHeapSize > this.peakJSHeap) {
      this.peakJSHeap = snapshot.jsHeapSize;
    }
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }
    return snapshot;
  }
  /**
   * Get total GPU memory usage in MB
   */
  getTotalGPUMemory() {
    let total = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        total += allocation.size;
      }
    }
    return total / (1024 * 1024);
  }
  /**
   * Get JavaScript heap size in MB
   */
  getJSHeapSize() {
    if (!this.config.trackJSHeap) {
      return 0;
    }
    const memory = performance.memory;
    if (memory) {
      return memory.usedJSHeapSize / (1024 * 1024);
    }
    return 0;
  }
  /**
   * Get JavaScript heap limit in MB
   */
  getJSHeapLimit() {
    if (!this.config.trackJSHeap) {
      return 0;
    }
    const memory = performance.memory;
    if (memory) {
      return memory.jsHeapSizeLimit / (1024 * 1024);
    }
    return 0;
  }
  /**
   * Get all snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }
  /**
   * Get memory statistics
   */
  getStatistics() {
    const currentGPU = this.getTotalGPUMemory();
    const currentJSHeap = this.getJSHeapSize();
    let activeBufferCount = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        activeBufferCount++;
      }
    }
    return {
      currentGPUMemory: currentGPU,
      peakGPUMemory: this.peakGPUMemory,
      currentJSHeap,
      peakJSHeap: this.peakJSHeap,
      activeBufferCount,
      totalAllocations: this.totalAllocations,
      totalDeallocations: this.totalDeallocations,
      potentialLeak: this.detectMemoryLeak()
    };
  }
  /**
   * Detect potential memory leaks
   */
  detectMemoryLeak() {
    if (this.snapshots.length < 3) {
      return false;
    }
    const recentSnapshots = this.snapshots.slice(-10);
    let increasingCount = 0;
    for (let i = 1; i < recentSnapshots.length; i++) {
      if (recentSnapshots[i].jsHeapSize > recentSnapshots[i - 1].jsHeapSize) {
        increasingCount++;
      }
    }
    const threshold = recentSnapshots.length * 0.7;
    return increasingCount >= threshold;
  }
  /**
   * Get peak memory usage
   */
  getPeakMemoryUsage() {
    return Math.max(this.peakGPUMemory, this.peakJSHeap);
  }
  /**
   * Get active buffer count
   */
  getActiveBufferCount() {
    let count = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        count++;
      }
    }
    return count;
  }
  /**
   * Get buffer allocation details
   */
  getBufferAllocations() {
    return Array.from(this.bufferAllocations.values());
  }
  /**
   * Export to JSON
   */
  exportToJSON() {
    return JSON.stringify({
      config: this.config,
      statistics: this.getStatistics(),
      snapshots: this.snapshots,
      bufferAllocations: Array.from(this.bufferAllocations.values())
    }, null, 2);
  }
  /**
   * Generate markdown report
   */
  generateReport() {
    const stats = this.getStatistics();
    return `# Memory Profile Report

## Summary
- **Current GPU Memory**: ${stats.currentGPUMemory.toFixed(2)} MB
- **Peak GPU Memory**: ${stats.peakGPUMemory.toFixed(2)} MB
- **Current JS Heap**: ${stats.currentJSHeap.toFixed(2)} MB
- **Peak JS Heap**: ${stats.peakJSHeap.toFixed(2)} MB

## Buffer Statistics
- **Active Buffers**: ${stats.activeBufferCount}
- **Total Allocations**: ${stats.totalAllocations}
- **Total Deallocations**: ${stats.totalDeallocations}

## Memory Leak Detection
- **Potential Leak**: ${stats.potentialLeak ? "⚠️ Yes" : "✅ No"}

## Memory Targets
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| GPU Memory | <10MB | ${stats.currentGPUMemory.toFixed(2)}MB | ${stats.currentGPUMemory < 10 ? "✅ Pass" : "❌ Fail"} |
| JS Heap | <10MB | ${stats.currentJSHeap.toFixed(2)}MB | ${stats.currentJSHeap < 10 ? "✅ Pass" : "❌ Fail"} |
`;
  }
  /**
   * Reset the profiler
   */
  reset() {
    this.snapshots = [];
    this.bufferAllocations.clear();
    this.peakGPUMemory = 0;
    this.peakJSHeap = 0;
    this.totalAllocations = 0;
    this.totalDeallocations = 0;
  }
  /**
   * Check if memory tracking is available
   */
  static isMemoryTrackingAvailable() {
    return typeof performance.memory !== "undefined";
  }
}

class BrowserSupport {
  static cachedInfo = null;
  /**
   * Detect browser information
   */
  static detect() {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }
    const ua = navigator.userAgent;
    let name = "Unknown";
    let version = "unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) {
      name = "Chrome";
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] || "unknown" : "unknown";
    } else if (ua.includes("Edg")) {
      name = "Edge";
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? match[1] || "unknown" : "unknown";
    } else if (ua.includes("Firefox")) {
      name = "Firefox";
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] || "unknown" : "unknown";
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
      name = "Safari";
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] || "unknown" : "unknown";
    }
    const info = {
      name,
      version,
      webgpuSupported: false,
      features: {
        computeShaders: false,
        storageBuffers: false,
        depth24Stencil8: false,
        timestampQueries: false,
        float32Textures: false
      }
    };
    this.cachedInfo = info;
    return info;
  }
  /**
   * Check if WebGPU is supported
   */
  static async isSupported() {
    if (!navigator.gpu) {
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return false;
      }
      const device = await adapter.requestDevice();
      if (!device) {
        return false;
      }
      device.destroy();
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get list of missing features
   */
  static async getMissingFeatures() {
    const missing = [];
    if (!navigator.gpu) {
      missing.push("WebGPU API");
      return missing;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        missing.push("WebGPU Adapter");
        return missing;
      }
      if (!adapter.features.has("shader-f16")) {
        missing.push("16-bit shader support");
      }
    } catch (error) {
      missing.push("WebGPU initialization failed");
    }
    return missing;
  }
  /**
   * Get browser recommendation
   */
  static getRecommendation() {
    const info = this.detect();
    const recommendations = {
      Chrome: "Chrome 113+ is required for WebGPU support. Please update your browser.",
      Edge: "Edge 113+ is required for WebGPU support. Please update your browser.",
      Firefox: "Firefox WebGPU support is experimental. Enable it in about:config or use Chrome/Edge.",
      Safari: "Safari WebGPU support is coming soon. Please use Chrome or Edge for now.",
      Unknown: "Your browser may not support WebGPU. Please use Chrome 113+ or Edge 113+."
    };
    const minVersions = {
      Chrome: 113,
      Edge: 113,
      Firefox: 120,
      Safari: 17
    };
    const minVersion = minVersions[info.name] || 0;
    const currentVersion = parseInt(info.version, 10);
    if (currentVersion < minVersion) {
      const recommendation = recommendations[info.name];
      return recommendation || recommendations.Unknown;
    }
    if (!info.webgpuSupported) {
      return "WebGPU is not enabled. Please check your browser settings.";
    }
    return "Your browser supports WebGPU.";
  }
  /**
   * Check full compatibility
   */
  static async checkCompatibility() {
    const browser = this.detect();
    browser.webgpuSupported = await this.isSupported();
    const missingFeatures = await this.getMissingFeatures();
    const recommendation = this.getRecommendation();
    return {
      supported: browser.webgpuSupported && missingFeatures.length === 0,
      browser,
      missingFeatures,
      recommendation
    };
  }
  /**
   * Clear cached info (for testing)
   */
  static clearCache() {
    this.cachedInfo = null;
  }
}
function isWebGPUAvailable() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}
function getBrowserName() {
  return BrowserSupport.detect().name;
}
function getBrowserVersion() {
  return BrowserSupport.detect().version;
}

export { BrowserSupport, BufferError, BufferLayout, BufferManager, DefaultLights, DeviceManager, Engine, EngineError, LightManager, LightType, MemoryProfiler, OasisSDFError, ObjectChangeFlags, ObjectManager, ObjectPool, ObjectState, PerformanceProfiler, PipelineError, PipelineManager, Primitives, SDFObject, SDFPrimitive, Scene, Transform, ValidationError, WebGPUError, getBrowserName, getBrowserVersion, isWebGPUAvailable };
