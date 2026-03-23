/**
 * Matrix4.ts
 * 
 * 4x4 matrix implementation for 3D transformations
 * Column-major order (compatible with WebGPU)
 */

export class Matrix4 {
  /** 4x4 matrix data (column-major) */
  public data: Float32Array;

  /**
   * Create a new Matrix4
   * @param data Optional initial data (column-major)
   */
  constructor(data?: Float32Array) {
    this.data = data || new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Create identity matrix
   */
  static identity(): Matrix4 {
    return new Matrix4();
  }

  /**
   * Create translation matrix
   */
  static translation(x: number, y: number, z: number): Matrix4 {
    return new Matrix4(new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      x, y, z, 1
    ]));
  }

  /**
   * Create rotation matrix from Euler angles (X-Y-Z order)
   */
  static rotation(rx: number, ry: number, rz: number): Matrix4 {
    const cx = Math.cos(rx);
    const sx = Math.sin(rx);
    const cy = Math.cos(ry);
    const sy = Math.sin(ry);
    const cz = Math.cos(rz);
    const sz = Math.sin(rz);

    return new Matrix4(new Float32Array([
      cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz, 0,
      cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz, 0,
      -sy, sx * cy, cx * cy, 0,
      0, 0, 0, 1
    ]));
  }

  /**
   * Create scale matrix
   */
  static scale(x: number, y: number, z: number): Matrix4 {
    return new Matrix4(new Float32Array([
      x, 0, 0, 0,
      0, y, 0, 0,
      0, 0, z, 0,
      0, 0, 0, 1
    ]));
  }

  /**
   * Multiply two matrices
   */
  multiply(other: Matrix4): Matrix4 {
    const a = this.data;
    const b = other.data;
    const result = new Float32Array(16);

    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
    const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
    const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
    const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

    result[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
    result[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
    result[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
    result[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;

    result[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
    result[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
    result[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
    result[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;

    result[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
    result[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
    result[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
    result[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;

    result[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
    result[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
    result[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
    result[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;

    return new Matrix4(result);
  }

  /**
   * Calculate inverse matrix
   */
  inverse(): Matrix4 {
    const m = this.data;
    const result = new Float32Array(16);
    
    const det = m[0] * (m[5] * (m[10] * m[15] - m[11] * m[14]) - m[6] * (m[9] * m[15] - m[11] * m[13]) + m[7] * (m[9] * m[14] - m[10] * m[13]))
             - m[1] * (m[4] * (m[10] * m[15] - m[11] * m[14]) - m[6] * (m[8] * m[15] - m[11] * m[12]) + m[7] * (m[8] * m[14] - m[10] * m[12]))
             + m[2] * (m[4] * (m[9] * m[15] - m[11] * m[13]) - m[5] * (m[8] * m[15] - m[11] * m[12]) + m[7] * (m[8] * m[13] - m[9] * m[12]))
             - m[3] * (m[4] * (m[9] * m[14] - m[10] * m[13]) - m[5] * (m[8] * m[14] - m[10] * m[12]) + m[6] * (m[8] * m[13] - m[9] * m[12]));

    if (Math.abs(det) < 1e-10) {
      return Matrix4.identity();
    }

    const invDet = 1 / det;

    result[0] = (m[5] * (m[10] * m[15] - m[11] * m[14]) - m[6] * (m[9] * m[15] - m[11] * m[13]) + m[7] * (m[9] * m[14] - m[10] * m[13])) * invDet;
    result[1] = (m[2] * (m[9] * m[15] - m[11] * m[13]) - m[1] * (m[10] * m[15] - m[11] * m[14]) + m[3] * (m[10] * m[13] - m[9] * m[14])) * invDet;
    result[2] = (m[1] * (m[6] * m[15] - m[7] * m[14]) - m[2] * (m[5] * m[15] - m[7] * m[13]) + m[3] * (m[5] * m[14] - m[6] * m[13])) * invDet;
    result[3] = (m[2] * (m[5] * m[11] - m[7] * m[9]) - m[1] * (m[6] * m[11] - m[7] * m[10]) + m[3] * (m[6] * m[9] - m[5] * m[10])) * invDet;

    result[4] = (m[6] * (m[8] * m[15] - m[11] * m[12]) - m[4] * (m[10] * m[15] - m[11] * m[14]) - m[7] * (m[8] * m[14] - m[10] * m[12])) * invDet;
    result[5] = (m[0] * (m[10] * m[15] - m[11] * m[14]) - m[2] * (m[8] * m[15] - m[11] * m[12]) + m[3] * (m[8] * m[14] - m[10] * m[12])) * invDet;
    result[6] = (m[2] * (m[4] * m[15] - m[7] * m[12]) - m[0] * (m[6] * m[15] - m[7] * m[14]) - m[3] * (m[4] * m[14] - m[6] * m[12])) * invDet;
    result[7] = (m[0] * (m[7] * m[10] - m[6] * m[11]) - m[2] * (m[4] * m[11] - m[7] * m[8]) + m[3] * (m[4] * m[10] - m[6] * m[8])) * invDet;

    result[8] = (m[4] * (m[9] * m[15] - m[11] * m[13]) - m[5] * (m[8] * m[15] - m[11] * m[12]) + m[7] * (m[8] * m[13] - m[9] * m[12])) * invDet;
    result[9] = (m[1] * (m[8] * m[15] - m[11] * m[12]) - m[0] * (m[9] * m[15] - m[11] * m[13]) - m[3] * (m[8] * m[13] - m[9] * m[12])) * invDet;
    result[10] = (m[0] * (m[5] * m[15] - m[7] * m[13]) - m[1] * (m[4] * m[15] - m[7] * m[12]) + m[3] * (m[4] * m[13] - m[5] * m[12])) * invDet;
    result[11] = (m[1] * (m[7] * m[9] - m[5] * m[11]) - m[0] * (m[5] * m[10] - m[6] * m[9]) + m[3] * (m[4] * m[11] - m[7] * m[8])) * invDet;

    result[12] = (m[5] * (m[8] * m[14] - m[10] * m[12]) - m[4] * (m[9] * m[14] - m[10] * m[13]) - m[6] * (m[8] * m[13] - m[9] * m[12])) * invDet;
    result[13] = (m[0] * (m[9] * m[14] - m[10] * m[13]) - m[1] * (m[8] * m[14] - m[10] * m[12]) + m[2] * (m[8] * m[13] - m[9] * m[12])) * invDet;
    result[14] = (m[1] * (m[4] * m[14] - m[6] * m[12]) - m[0] * (m[5] * m[14] - m[6] * m[13]) - m[2] * (m[4] * m[13] - m[5] * m[12])) * invDet;
    result[15] = (m[0] * (m[6] * m[9] - m[5] * m[10]) - m[1] * (m[4] * m[10] - m[6] * m[8]) + m[2] * (m[4] * m[9] - m[5] * m[8])) * invDet;

    return new Matrix4(result);
  }

  /**
   * Transpose matrix
   */
  transpose(): Matrix4 {
    const m = this.data;
    return new Matrix4(new Float32Array([
      m[0], m[4], m[8], m[12],
      m[1], m[5], m[9], m[13],
      m[2], m[6], m[10], m[14],
      m[3], m[7], m[11], m[15]
    ]));
  }

  /**
   * Transform vector (ignores translation)
   */
  transformVector(v: [number, number, number]): [number, number, number] {
    const m = this.data;
    return [
      v[0] * m[0] + v[1] * m[4] + v[2] * m[8],
      v[0] * m[1] + v[1] * m[5] + v[2] * m[9],
      v[0] * m[2] + v[1] * m[6] + v[2] * m[10]
    ];
  }

  /**
   * Transform point (includes translation)
   */
  transformPoint(p: [number, number, number]): [number, number, number] {
    const m = this.data;
    return [
      p[0] * m[0] + p[1] * m[4] + p[2] * m[8] + m[12],
      p[0] * m[1] + p[1] * m[5] + p[2] * m[9] + m[13],
      p[0] * m[2] + p[1] * m[6] + p[2] * m[10] + m[14]
    ];
  }

  /**
   * Set matrix to identity
   */
  setIdentity(): void {
    this.data.set([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Clone matrix
   */
  clone(): Matrix4 {
    return new Matrix4(new Float32Array(this.data));
  }

  /**
   * Convert to array
   */
  toArray(): Float32Array {
    return new Float32Array(this.data);
  }
}
