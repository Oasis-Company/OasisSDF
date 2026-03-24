/**
 * Browser Support Utilities
 * Detects WebGPU support and browser capabilities
 */

export interface BrowserInfo {
  /** Browser name */
  name: string;
  /** Browser version */
  version: string;
  /** Whether WebGPU is supported */
  webgpuSupported: boolean;
  /** Detailed feature support */
  features: {
    computeShaders: boolean;
    storageBuffers: boolean;
    depth24Stencil8: boolean;
    timestampQueries: boolean;
    float32Textures: boolean;
  };
}

export interface CompatibilityResult {
  supported: boolean;
  browser: BrowserInfo;
  missingFeatures: string[];
  recommendation: string;
}

/**
 * Browser Support Detection Class
 */
export class BrowserSupport {
  private static cachedInfo: BrowserInfo | null = null;

  /**
   * Detect browser information
   */
  static detect(): BrowserInfo {
    if (this.cachedInfo) {
      return this.cachedInfo;
    }

    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = 'unknown';

    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? (match[1] || 'unknown') : 'unknown';
    } else if (ua.includes('Edg')) {
      name = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? (match[1] || 'unknown') : 'unknown';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? (match[1] || 'unknown') : 'unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? (match[1] || 'unknown') : 'unknown';
    }

    const info: BrowserInfo = {
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
  static async isSupported(): Promise<boolean> {
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
  static async getMissingFeatures(): Promise<string[]> {
    const missing: string[] = [];

    if (!navigator.gpu) {
      missing.push('WebGPU API');
      return missing;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        missing.push('WebGPU Adapter');
        return missing;
      }

      // 检测 16 位着色器支持
      if (!adapter.features.has('shader-f16')) {
        missing.push('16-bit shader support');
      }
    } catch (error) {
      missing.push('WebGPU initialization failed');
    }

    return missing;
  }

  /**
   * Get browser recommendation
   */
  static getRecommendation(): string {
    const info = this.detect();

    const recommendations: Record<string, string> = {
      Chrome: 'Chrome 113+ is required for WebGPU support. Please update your browser.',
      Edge: 'Edge 113+ is required for WebGPU support. Please update your browser.',
      Firefox: 'Firefox WebGPU support is experimental. Enable it in about:config or use Chrome/Edge.',
      Safari: 'Safari WebGPU support is coming soon. Please use Chrome or Edge for now.',
      Unknown: 'Your browser may not support WebGPU. Please use Chrome 113+ or Edge 113+.'
    };

    const minVersions: Record<string, number> = {
      Chrome: 113,
      Edge: 113,
      Firefox: 120,
      Safari: 17
    };

    const minVersion = minVersions[info.name] || 0;
    const currentVersion = parseInt(info.version, 10);

    if (currentVersion < minVersion) {
      const recommendation = recommendations[info.name as keyof typeof recommendations];
      return (recommendation || recommendations.Unknown) as string;
    }

    if (!info.webgpuSupported) {
      return 'WebGPU is not enabled. Please check your browser settings.';
    }

    return 'Your browser supports WebGPU.';
  }

  /**
   * Check full compatibility
   */
  static async checkCompatibility(): Promise<CompatibilityResult> {
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
  static clearCache(): void {
    this.cachedInfo = null;
  }
}

/**
 * Quick check if WebGPU is available
 */
export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Get browser name
 */
export function getBrowserName(): string {
  return BrowserSupport.detect().name;
}

/**
 * Get browser version
 */
export function getBrowserVersion(): string {
  return BrowserSupport.detect().version;
}
