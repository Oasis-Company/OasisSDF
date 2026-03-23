/**
 * TransformHierarchy.ts
 * 
 * Hierarchical transform management system
 * Handles parent-child relationships and world matrix calculations
 */

import type { TransformData } from '../types/objects.js';
import { Matrix4 } from './Matrix4.js';

export class TransformHierarchy {
  /** Root transforms */
  private roots: Array<TransformData & {
    parent?: TransformData;
    children?: TransformData[];
    localMatrix?: Float32Array;
    worldMatrix?: Float32Array;
    isDirty?: boolean;
  }>;

  /**
   * Create a new TransformHierarchy
   */
  constructor() {
    this.roots = [];
  }

  /**
   * Add child to parent
   */
  addChild(parent: TransformData, child: TransformData): void {
    // Ensure parent has children array
    if (!('children' in parent)) {
      (parent as any).children = [];
    }

    // Ensure child has parent reference
    (child as any).parent = parent;

    // Add child to parent's children
    (parent as any).children.push(child);

    // Mark parent as dirty
    this.markDirty(parent);

    // If parent is not in roots and has no parent, add to roots
    if (!('parent' in parent) || !parent.parent) {
      if (!this.roots.includes(parent as any)) {
        this.roots.push(parent as any);
      }
    }
  }

  /**
   * Remove child from parent
   */
  removeChild(parent: TransformData, child: TransformData): void {
    if ('children' in parent) {
      const index = parent.children!.indexOf(child);
      if (index > -1) {
        parent.children!.splice(index, 1);
        (child as any).parent = undefined;
        this.markDirty(parent);

        // If child has children, add them to roots
        if ('children' in child && child.children!.length > 0) {
          child.children!.forEach((grandchild) => {
            this.roots.push(grandchild as any);
          });
        }
      }
    }
  }

  /**
   * Update all transforms in hierarchy
   */
  update(): void {
    this.roots.forEach((root) => {
      this.updateTransform(root);
    });
  }

  /**
   * Force update of all transforms
   */
  forceUpdate(): void {
    this.roots.forEach((root) => {
      this.forceUpdateTransform(root);
    });
  }

  /**
   * Force update transform and its children
   */
  private forceUpdateTransform(transform: TransformData & {
    parent?: TransformData;
    children?: TransformData[];
    localMatrix?: Float32Array;
    worldMatrix?: Float32Array;
    isDirty?: boolean;
  }): void {
    // Calculate local matrix
    const translation = Matrix4.translation(
      transform.position[0],
      transform.position[1],
      transform.position[2]
    );
    
    const rotation = Matrix4.rotation(
      transform.rotation[0],
      transform.rotation[1],
      transform.rotation[2]
    );
    
    const scale = Matrix4.scale(
      transform.scale[0],
      transform.scale[1],
      transform.scale[2]
    );

    // Compose local matrix: T * R * S
    const localMatrix = translation.multiply(rotation).multiply(scale);
    transform.localMatrix = localMatrix.toArray();
    transform.isDirty = false;

    // Calculate world matrix
    if (transform.parent) {
      const parentWorldMatrix = this.getWorldMatrix(transform.parent);
      const localMatrix = new Matrix4(transform.localMatrix);
      const worldMatrix = new Matrix4(parentWorldMatrix).multiply(localMatrix);
      transform.worldMatrix = worldMatrix.toArray();
    } else {
      // Root transform, world matrix is local matrix
      transform.worldMatrix = transform.localMatrix;
    }

    // Update children
    if (transform.children) {
      transform.children.forEach((child) => {
        this.forceUpdateTransform(child as any);
      });
    }
  }

  /**
   * Update transform and its children
   */
  private updateTransform(transform: TransformData & {
    parent?: TransformData;
    children?: TransformData[];
    localMatrix?: Float32Array;
    worldMatrix?: Float32Array;
    isDirty?: boolean;
  }): void {
    if (transform.isDirty || !transform.localMatrix) {
      // Calculate local matrix
      const translation = Matrix4.translation(
        transform.position[0],
        transform.position[1],
        transform.position[2]
      );
      
      const rotation = Matrix4.rotation(
        transform.rotation[0],
        transform.rotation[1],
        transform.rotation[2]
      );
      
      const scale = Matrix4.scale(
        transform.scale[0],
        transform.scale[1],
        transform.scale[2]
      );

      // Compose local matrix: T * R * S
      const localMatrix = translation.multiply(rotation).multiply(scale);
      transform.localMatrix = localMatrix.toArray();
      transform.isDirty = false;
    }

    // Calculate world matrix
    if (transform.parent) {
      const parentWorldMatrix = this.getWorldMatrix(transform.parent);
      const localMatrix = new Matrix4(transform.localMatrix);
      const worldMatrix = new Matrix4(parentWorldMatrix).multiply(localMatrix);
      transform.worldMatrix = worldMatrix.toArray();
    } else {
      // Root transform, world matrix is local matrix
      transform.worldMatrix = transform.localMatrix;
    }

    // Update children
    if (transform.children) {
      transform.children.forEach((child) => {
        this.updateTransform(child as any);
      });
    }
  }

  /**
   * Get world matrix for transform
   */
  getWorldMatrix(transform: TransformData): Float32Array {
    const transformWithData = transform as TransformData & {
      parent?: TransformData;
      worldMatrix?: Float32Array;
      isDirty?: boolean;
    };

    // Check if transform or any parent is dirty
    let current: TransformData | undefined = transform;
    let isDirty = transformWithData.isDirty || !transformWithData.worldMatrix;
    
    while (!isDirty && current) {
      const currentWithData = current as TransformData & {
        parent?: TransformData;
        isDirty?: boolean;
      };
      isDirty = currentWithData.isDirty || !currentWithData.worldMatrix;
      current = currentWithData.parent;
    }

    if (isDirty) {
      this.forceUpdate();
    }

    return transformWithData.worldMatrix!;
  }

  /**
   * Convert local position to world space
   */
  localToWorld(transform: TransformData, localPos: [number, number, number]): [number, number, number] {
    const worldMatrix = new Matrix4(this.getWorldMatrix(transform));
    return worldMatrix.transformPoint(localPos);
  }

  /**
   * Convert world position to local space
   */
  worldToLocal(transform: TransformData, worldPos: [number, number, number]): [number, number, number] {
    const worldMatrix = new Matrix4(this.getWorldMatrix(transform));
    const inverseMatrix = worldMatrix.inverse();
    return inverseMatrix.transformPoint(worldPos);
  }

  /**
   * Mark transform and its children as dirty
   */
  private markDirty(transform: TransformData): void {
    const transformWithData = transform as TransformData & {
      children?: TransformData[];
      isDirty?: boolean;
    };

    transformWithData.isDirty = true;

    // Mark children as dirty
    if (transformWithData.children) {
      transformWithData.children.forEach((child) => {
        this.markDirty(child);
      });
    }
  }

  /**
   * Get all transforms in hierarchy
   */
  getAllTransforms(): TransformData[] {
    const transforms: TransformData[] = [];

    const collectTransforms = (transform: TransformData & {
      children?: TransformData[];
    }) => {
      transforms.push(transform);
      if (transform.children) {
        transform.children.forEach(collectTransforms);
      }
    };

    this.roots.forEach(collectTransforms);
    return transforms;
  }

  /**
   * Clear hierarchy
   */
  clear(): void {
    this.roots = [];
  }
}
