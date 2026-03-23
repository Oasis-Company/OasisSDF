/**
 * PBR Material Class
 * 
 * Implements Physically Based Rendering material properties and methods
 * for the OasisSDF engine.
 */

import type { MaterialData } from '../types/index.js';
import { ValidationError } from '../types/index.js';

/**
 * PBR Material Class
 * 
 * Manages PBR material properties with validation and helper methods
 */
export class PBRMaterial {
  private _color: [number, number, number];
  private _metallic: number;
  private _roughness: number;
  private _reflectance: number;
  private _emission: [number, number, number];
  private _emissionIntensity: number;
  private _ambientOcclusion: number;

  /**
   * Create a new PBRMaterial
   * @param materialData Initial material properties
   */
  constructor(materialData: Partial<MaterialData> = {}) {
    const defaultMaterial: MaterialData = {
      color: [0.5, 0.5, 0.5],
      metallic: 0.0,
      roughness: 0.5,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    };

    const data = { ...defaultMaterial, ...materialData };

    this._color = this.validateColor(data.color);
    this._metallic = this.validateRange(data.metallic, 0.0, 1.0);
    this._roughness = this.validateRange(data.roughness, 0.0, 1.0);
    this._reflectance = this.validateRange(data.reflectance, 0.0, 1.0);
    this._emission = this.validateColor(data.emission);
    this._emissionIntensity = this.validateRange(data.emissionIntensity, 0.0, Infinity);
    this._ambientOcclusion = this.validateRange(data.ambientOcclusion, 0.0, 1.0);
  }

  /**
   * Validate color vector
   * @param color Color vector to validate
   * @returns Validated color vector
   */
  private validateColor(color: [number, number, number]): [number, number, number] {
    if (!Array.isArray(color) || color.length !== 3) {
      throw new ValidationError('Color must be an array of 3 numbers');
    }

    const validatedColor = color.map(c => {
      if (typeof c !== 'number' || isNaN(c)) {
        throw new ValidationError('Color components must be numbers');
      }
      return Math.max(0.0, Math.min(1.0, c));
    }) as [number, number, number];

    return validatedColor;
  }

  /**
   * Validate value range
   * @param value Value to validate
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @returns Validated value
   */
  private validateRange(value: number, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError('Value must be a number');
    }
    if (value < min || value > max) {
      throw new ValidationError(`Value must be between ${min} and ${max}`);
    }
    return value;
  }

  /**
   * Get material color
   */
  get color(): [number, number, number] {
    return [...this._color] as [number, number, number];
  }

  /**
   * Set material color
   */
  set color(value: [number, number, number]) {
    this._color = this.validateColor(value);
  }

  /**
   * Get metallic factor
   */
  get metallic(): number {
    return this._metallic;
  }

  /**
   * Set metallic factor
   */
  set metallic(value: number) {
    this._metallic = this.validateRange(value, 0.0, 1.0);
  }

  /**
   * Get roughness factor
   */
  get roughness(): number {
    return this._roughness;
  }

  /**
   * Set roughness factor
   */
  set roughness(value: number) {
    this._roughness = this.validateRange(value, 0.0, 1.0);
  }

  /**
   * Get reflectance factor
   */
  get reflectance(): number {
    return this._reflectance;
  }

  /**
   * Set reflectance factor
   */
  set reflectance(value: number) {
    this._reflectance = this.validateRange(value, 0.0, 1.0);
  }

  /**
   * Get emission color
   */
  get emission(): [number, number, number] {
    return [...this._emission] as [number, number, number];
  }

  /**
   * Set emission color
   */
  set emission(value: [number, number, number]) {
    this._emission = this.validateColor(value);
  }

  /**
   * Get emission intensity
   */
  get emissionIntensity(): number {
    return this._emissionIntensity;
  }

  /**
   * Set emission intensity
   */
  set emissionIntensity(value: number) {
    this._emissionIntensity = this.validateRange(value, 0.0, Infinity);
  }

  /**
   * Get ambient occlusion factor
   */
  get ambientOcclusion(): number {
    return this._ambientOcclusion;
  }

  /**
   * Set ambient occlusion factor
   */
  set ambientOcclusion(value: number) {
    this._ambientOcclusion = this.validateRange(value, 0.0, 1.0);
  }

  /**
   * Get all material properties as MaterialData
   * @returns MaterialData object
   */
  toData(): MaterialData {
    return {
      color: this._color,
      metallic: this._metallic,
      roughness: this._roughness,
      reflectance: this._reflectance,
      emission: this._emission,
      emissionIntensity: this._emissionIntensity,
      ambientOcclusion: this._ambientOcclusion
    };
  }

  /**
   * Update material properties
   * @param materialData Material properties to update
   */
  update(materialData: Partial<MaterialData>): void {
    if (materialData.color !== undefined) {
      this.color = materialData.color;
    }
    if (materialData.metallic !== undefined) {
      this.metallic = materialData.metallic;
    }
    if (materialData.roughness !== undefined) {
      this.roughness = materialData.roughness;
    }
    if (materialData.reflectance !== undefined) {
      this.reflectance = materialData.reflectance;
    }
    if (materialData.emission !== undefined) {
      this.emission = materialData.emission;
    }
    if (materialData.emissionIntensity !== undefined) {
      this.emissionIntensity = materialData.emissionIntensity;
    }
    if (materialData.ambientOcclusion !== undefined) {
      this.ambientOcclusion = materialData.ambientOcclusion;
    }
  }

  /**
   * Clone this material
   * @returns New PBRMaterial instance with the same properties
   */
  clone(): PBRMaterial {
    return new PBRMaterial(this.toData());
  }

  /**
   * Copy properties from another material
   * @param other Other PBRMaterial instance
   */
  copy(other: PBRMaterial): void {
    this.color = other.color;
    this.metallic = other.metallic;
    this.roughness = other.roughness;
    this.reflectance = other.reflectance;
    this.emission = other.emission;
    this.emissionIntensity = other.emissionIntensity;
    this.ambientOcclusion = other.ambientOcclusion;
  }

  /**
   * Create a metallic material preset
   * @param color Material color
   * @param metallic Metallic factor
   * @param roughness Roughness factor
   * @returns PBRMaterial instance
   */
  static createMetallic(color: [number, number, number], metallic: number = 1.0, roughness: number = 0.2): PBRMaterial {
    return new PBRMaterial({
      color,
      metallic,
      roughness,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    });
  }

  /**
   * Create a dielectric material preset
   * @param color Material color
   * @param roughness Roughness factor
   * @returns PBRMaterial instance
   */
  static createDielectric(color: [number, number, number], roughness: number = 0.5): PBRMaterial {
    return new PBRMaterial({
      color,
      metallic: 0.0,
      roughness,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    });
  }

  /**
   * Create an emissive material preset
   * @param color Emission color
   * @param intensity Emission intensity
   * @returns PBRMaterial instance
   */
  static createEmissive(color: [number, number, number], intensity: number = 1.0): PBRMaterial {
    return new PBRMaterial({
      color: [0, 0, 0],
      metallic: 0.0,
      roughness: 0.5,
      reflectance: 0.04,
      emission: color,
      emissionIntensity: intensity,
      ambientOcclusion: 1.0
    });
  }

  /**
   * Create a plastic material preset
   * @param color Material color
   * @returns PBRMaterial instance
   */
  static createPlastic(color: [number, number, number]): PBRMaterial {
    return new PBRMaterial({
      color,
      metallic: 0.0,
      roughness: 0.8,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    });
  }

  /**
   * Create a glass material preset
   * @param color Glass color
   * @returns PBRMaterial instance
   */
  static createGlass(color: [number, number, number] = [1, 1, 1]): PBRMaterial {
    return new PBRMaterial({
      color,
      metallic: 0.0,
      roughness: 0.0,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    });
  }
}
