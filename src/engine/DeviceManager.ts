/**
 * DeviceManager.ts
 * 
 * Manages WebGPU device, adapter, and canvas context
 * Handles device initialization, loss, and cleanup
 * 
 * @module DeviceManager
 */

import { WebGPUError } from '../types/index';

declare global {
  interface Navigator {
    gpu?: {
      requestAdapter: (options?: any) => Promise<any>;
      getPreferredCanvasFormat: () => string;
    };
  }
}

type GPUPowerPreference = 'low-power' | 'high-performance';
type GPUFeatureName = string;
type GPUSupportedLimits = Record<string, number>;
type GPUDeviceLostInfo = { reason: string; message: string };
type GPUDevice = any;
type GPUCanvasContext = any;
type GPUAdapter = any;
type GPUTextureFormat = string;
type GPUAdapterInfo = any;

/**
 * Configuration options for DeviceManager
 */
export interface DeviceManagerOptions {
  /**
   * Preferred power preference for adapter selection
   * @default 'high-performance'
   */
  powerPreference?: GPUPowerPreference;

  /**
   * Required features for the device
   * @default []
   */
  requiredFeatures?: GPUFeatureName[];

  /**
   * Required limits for the device
   * @default undefined (use adapter defaults)
   */
  requiredLimits?: Partial<GPUSupportedLimits>;

  /**
   * Callback for device loss events
   */
  onDeviceLost?: (info: GPUDeviceLostInfo) => void;

  /**
   * Callback for device restoration
   */
  onDeviceRestored?: () => void;
}

/**
 * Information about WebGPU support in the current browser
 */
export interface WebGPUSupportInfo {
  /** Whether WebGPU is supported */
  supported: boolean;
  /** Reason why WebGPU is not supported */
  reason?: string;
  /** Adapter information if supported */
  adapterInfo?: GPUAdapterInfo;
  /** Available features */
  features?: string[];
  /** Adapter limits */
  limits?: Partial<GPUSupportedLimits>;
}

/**
 * Memory usage information
 */
export interface MemoryInfo {
  /** Used memory in bytes */
  used: number;
  /** Allocated memory in bytes */
  allocated: number;
}

/**
 * Manages WebGPU device, adapter, and canvas context
 * Handles device initialization, loss, and cleanup
 */
export class DeviceManager {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private adapter: GPUAdapter | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private preferredFormat: GPUTextureFormat = 'bgra8unorm';
  private isInitialized: boolean = false;
  private deviceLostPromise: Promise<void> | null = null;
  private deviceLostResolver: (() => void) | null = null;
  private options: DeviceManagerOptions | undefined;

  /**
   * Check if WebGPU is supported in current browser
   * @returns true if WebGPU is available
   */
  static isSupported(): boolean {
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      return false;
    }
    return true;
  }

  /**
   * Get detailed support information about WebGPU
   * @returns Promise resolving to support information
   */
  static async getSupportInfo(): Promise<WebGPUSupportInfo> {
    if (!this.isSupported()) {
      return {
        supported: false,
        reason: 'WebGPU is not supported in this browser. Please use Chrome 113+, Edge 113+, or Firefox Nightly.'
      };
    }

    try {
      const adapter = await navigator.gpu!.requestAdapter();
      if (!adapter) {
        return {
          supported: false,
          reason: 'No GPU adapter available. Your device may not have a compatible GPU.'
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
          maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
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
  async initialize(
    canvas: HTMLCanvasElement,
    options?: DeviceManagerOptions
  ): Promise<void> {
    if (this.isInitialized) {
      console.warn('DeviceManager is already initialized. Call cleanup() first if you want to reinitialize.');
      return;
    }

    this.options = options;
    this.canvas = canvas;

    // Step 1: Check browser support
    if (!DeviceManager.isSupported()) {
      const supportInfo = await DeviceManager.getSupportInfo();
      throw new WebGPUError(supportInfo.reason || 'WebGPU is not supported');
    }

    try {
      // Step 2: Select adapter
      await this.selectAdapter(options);

      // Step 3: Validate adapter
      this.validateAdapter(this.adapter!);

      // Step 4: Create device
      await this.createDevice(options);

      // Step 5: Configure canvas context
      await this.configureCanvasContext(canvas, options);

      this.isInitialized = true;
      console.log('DeviceManager initialized successfully');
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
  private async selectAdapter(options?: DeviceManagerOptions): Promise<void> {
    const powerPreference = options?.powerPreference ?? 'high-performance';

    const adapter = await navigator.gpu!.requestAdapter({
      powerPreference,
    });

    if (!adapter) {
      throw new WebGPUError(
        'Failed to obtain GPU adapter. Your device may not support WebGPU or may not have a compatible GPU.'
      );
    }

    this.adapter = adapter;

    const adapterInfo = await adapter.requestAdapterInfo();
    console.log(`WebGPU Adapter: ${adapterInfo.description || 'Unknown'}`);
    console.log(`Vendor: ${adapterInfo.vendor || 'Unknown'}`);
    console.log(`Architecture: ${adapterInfo.architecture || 'Unknown'}`);
  }

  /**
   * Validate adapter meets minimum requirements
   * @param adapter - GPU adapter to validate
   * @throws WebGPUError if adapter does not meet requirements
   */
  private validateAdapter(adapter: GPUAdapter): void {
    const limits = adapter.limits;

    // Minimum requirements for OasisSDF
    const minBufferSize = 128 * 1024 * 1024; // 128MB
    const minStorageBufferBindingSize = 128 * 1024 * 1024; // 128MB

    if (limits.maxBufferSize < minBufferSize) {
      throw new WebGPUError(
        `Adapter maxBufferSize (${limits.maxBufferSize}) is too small. ` +
        `Minimum required: ${minBufferSize} bytes (128MB)`
      );
    }

    if (limits.maxStorageBufferBindingSize < minStorageBufferBindingSize) {
      throw new WebGPUError(
        `Adapter maxStorageBufferBindingSize (${limits.maxStorageBufferBindingSize}) is too small. ` +
        `Minimum required: ${minStorageBufferBindingSize} bytes (128MB)`
      );
    }

    console.log('Adapter validation passed');
  }

  /**
   * Create GPU device with proper configuration
   * @param options - Configuration options
   * @throws WebGPUError if device creation fails
   */
  private async createDevice(options?: DeviceManagerOptions): Promise<void> {
    if (!this.adapter) {
      throw new WebGPUError('Adapter not initialized');
    }

    const requiredFeatures = options?.requiredFeatures ?? [];
    const requiredLimits = options?.requiredLimits;

    const device = await this.adapter.requestDevice({
      requiredFeatures,
      requiredLimits,
    });

    if (!device) {
      throw new WebGPUError('Failed to create GPU device');
    }

    this.device = device;

    // Handle device loss
    device.lost.then((info: GPUDeviceLostInfo) => {
      this.handleDeviceLoss(info);
    });

    console.log('GPU device created successfully');
  }

  /**
   * Configure canvas context with proper format
   * @param canvas - Canvas element to configure
   * @param options - Configuration options
   * @throws WebGPUError if context configuration fails
   */
  private async configureCanvasContext(
    canvas: HTMLCanvasElement,
    _options?: DeviceManagerOptions
  ): Promise<void> {
    if (!this.device || !this.adapter) {
      throw new WebGPUError('Device or adapter not initialized');
    }

    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    if (!context) {
      throw new WebGPUError('Failed to get WebGPU context from canvas. Make sure the canvas is valid.');
    }

    this.context = context;

    // Get preferred format from browser
    this.preferredFormat = navigator.gpu!.getPreferredCanvasFormat();

    // Configure context
    context.configure({
      device: this.device,
      format: this.preferredFormat,
      alphaMode: 'premultiplied',
      colorSpace: 'srgb',
    });

    console.log(`Canvas configured with format: ${this.preferredFormat}`);
  }

  /**
   * Handle device loss event
   * @param info - Device loss information
   */
  private handleDeviceLoss(info: GPUDeviceLostInfo): void {
    console.warn(`WebGPU device lost: ${info.message}`);
    this.isInitialized = false;

    // Resolve any waiting promises
    if (this.deviceLostResolver) {
      this.deviceLostResolver();
      this.deviceLostResolver = null;
    }

    // Call user callback if provided
    if (this.options?.onDeviceLost) {
      this.options.onDeviceLost(info);
    }
  }

  /**
   * Wait for device to be restored after loss
   * @returns Promise that resolves when device is restored
   * @throws WebGPUError if restoration fails
   */
  async waitForDeviceRestore(): Promise<void> {
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
  private async reinitialize(): Promise<void> {
    if (!this.canvas) {
      throw new WebGPUError('Canvas not available for reinitialization');
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
  getDevice(): GPUDevice {
    if (!this.device) {
      throw new WebGPUError('Device not initialized. Call initialize() first.');
    }
    return this.device;
  }

  /**
   * Get the configured canvas context
   * @returns GPUCanvasContext instance
   * @throws WebGPUError if context is not initialized
   */
  getContext(): GPUCanvasContext {
    if (!this.context) {
      throw new WebGPUError('Context not initialized. Call initialize() first.');
    }
    return this.context;
  }

  /**
   * Get the GPU adapter
   * @returns GPUAdapter instance
   * @throws WebGPUError if adapter is not initialized
   */
  getAdapter(): GPUAdapter {
    if (!this.adapter) {
      throw new WebGPUError('Adapter not initialized. Call initialize() first.');
    }
    return this.adapter;
  }

  /**
   * Get the preferred texture format
   * @returns Preferred GPUTextureFormat
   */
  getPreferredFormat(): GPUTextureFormat {
    return this.preferredFormat;
  }

  /**
   * Check if device manager is initialized
   * @returns true if initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.device !== null && this.context !== null;
  }

  /**
   * Get memory usage information
   * @returns MemoryInfo object
   */
  getMemoryInfo(): MemoryInfo {
    // WebGPU doesn't provide direct memory usage APIs
    // This is a placeholder for future implementation
    // TODO: Implement actual memory tracking in BufferManager
    // Returns zero values until memory tracking is implemented
    return {
      used: 0,
      allocated: 0,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      if (this.device) {
        this.device.destroy();
        this.device = null;
      }
    } catch (error) {
      console.warn('Error destroying device:', error);
    }

    this.context = null;
    this.adapter = null;
    this.canvas = null;
    this.isInitialized = false;
    this.deviceLostPromise = null;
    this.deviceLostResolver = null;

    console.log('DeviceManager cleaned up');
  }
}
