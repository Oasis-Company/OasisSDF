/**
 * Browser Compatibility Tests
 * Tests for browser detection and feature support
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BrowserSupport,
  isWebGPUAvailable,
  getBrowserName,
  getBrowserVersion
} from '../../src/utils/BrowserSupport.js';

describe('Browser Compatibility', () => {
  beforeEach(() => {
    BrowserSupport.clearCache();
  });

  afterEach(() => {
    BrowserSupport.clearCache();
  });

  describe('BrowserSupport.detect', () => {
    it('should detect browser information', () => {
      const info = BrowserSupport.detect();
      
      expect(info).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.version).toBeDefined();
      expect(typeof info.webgpuSupported).toBe('boolean');
    });

    it('should cache browser info', () => {
      const info1 = BrowserSupport.detect();
      const info2 = BrowserSupport.detect();
      
      expect(info1).toBe(info2);
    });

    it('should clear cache correctly', () => {
      BrowserSupport.detect();
      BrowserSupport.clearCache();
      
      const info = BrowserSupport.detect();
      expect(info).toBeDefined();
    });
  });

  describe('BrowserSupport.isSupported', () => {
    it('should return boolean for WebGPU support', async () => {
      const supported = await BrowserSupport.isSupported();
      
      expect(typeof supported).toBe('boolean');
    });

    it('should return false when gpu is not available', async () => {
      const originalGPU = navigator.gpu;
      (navigator as any).gpu = undefined;
      
      BrowserSupport.clearCache();
      const supported = await BrowserSupport.isSupported();
      
      expect(supported).toBe(false);
      
      (navigator as any).gpu = originalGPU;
    });
  });

  describe('BrowserSupport.getMissingFeatures', () => {
    it('should return array of missing features', async () => {
      const missing = await BrowserSupport.getMissingFeatures();
      
      expect(Array.isArray(missing)).toBe(true);
    });

    it('should detect missing WebGPU API', async () => {
      const originalGPU = navigator.gpu;
      (navigator as any).gpu = undefined;
      
      BrowserSupport.clearCache();
      const missing = await BrowserSupport.getMissingFeatures();
      
      expect(missing).toContain('WebGPU API');
      
      (navigator as any).gpu = originalGPU;
    });
  });

  describe('BrowserSupport.getRecommendation', () => {
    it('should return a recommendation string', () => {
      const recommendation = BrowserSupport.getRecommendation();
      
      expect(typeof recommendation).toBe('string');
      expect(recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('BrowserSupport.checkCompatibility', () => {
    it('should return compatibility result', async () => {
      const result = await BrowserSupport.checkCompatibility();
      
      expect(result).toBeDefined();
      expect(typeof result.supported).toBe('boolean');
      expect(result.browser).toBeDefined();
      expect(Array.isArray(result.missingFeatures)).toBe(true);
      expect(typeof result.recommendation).toBe('string');
    });
  });

  describe('Helper functions', () => {
    it('isWebGPUAvailable should return boolean', () => {
      const available = isWebGPUAvailable();
      
      expect(typeof available).toBe('boolean');
    });

    it('getBrowserName should return string', () => {
      const name = getBrowserName();
      
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('getBrowserVersion should return string', () => {
      const version = getBrowserVersion();
      
      expect(typeof version).toBe('string');
    });
  });

  describe('Browser-specific detection', () => {
    it('should handle Chrome user agent', () => {
      const originalUA = navigator.userAgent;
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true
      });
      
      BrowserSupport.clearCache();
      const info = BrowserSupport.detect();
      
      expect(info.name).toBe('Chrome');
      expect(info.version).toBe('120');
      
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should handle Edge user agent', () => {
      const originalUA = navigator.userAgent;
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        configurable: true
      });
      
      BrowserSupport.clearCache();
      const info = BrowserSupport.detect();
      
      expect(info.name).toBe('Edge');
      expect(info.version).toBe('120');
      
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should handle Firefox user agent', () => {
      const originalUA = navigator.userAgent;
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        configurable: true
      });
      
      BrowserSupport.clearCache();
      const info = BrowserSupport.detect();
      
      expect(info.name).toBe('Firefox');
      expect(info.version).toBe('120');
      
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should handle Safari user agent', () => {
      const originalUA = navigator.userAgent;
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        configurable: true
      });
      
      BrowserSupport.clearCache();
      const info = BrowserSupport.detect();
      
      expect(info.name).toBe('Safari');
      expect(info.version).toBe('17');
      
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should handle unknown browser', () => {
      const originalUA = navigator.userAgent;
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Unknown Browser/1.0',
        configurable: true
      });
      
      BrowserSupport.clearCache();
      const info = BrowserSupport.detect();
      
      expect(info.name).toBe('Unknown');
      expect(info.version).toBe('unknown');
      
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });
  });

  describe('Feature detection', () => {
    it('should initialize features object', () => {
      const info = BrowserSupport.detect();
      
      expect(info.features).toBeDefined();
      expect(typeof info.features.computeShaders).toBe('boolean');
      expect(typeof info.features.storageBuffers).toBe('boolean');
      expect(typeof info.features.depth24Stencil8).toBe('boolean');
      expect(typeof info.features.timestampQueries).toBe('boolean');
      expect(typeof info.features.float32Textures).toBe('boolean');
    });
  });
});
