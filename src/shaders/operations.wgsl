/**
 * operations.wgsl
 * 
 * SDF boolean operations
 * These functions combine multiple SDFs using boolean logic
 */

/**
 * Union operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @returns Minimum of the two values
 */
fn op_union(a: f32, b: f32) -> f32 {
  return min(a, b);
}

/**
 * Subtraction operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @returns a - b
 */
fn op_subtract(a: f32, b: f32) -> f32 {
  return max(a, -b);
}

/**
 * Intersection operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @returns Maximum of the two values
 */
fn op_intersect(a: f32, b: f32) -> f32 {
  return max(a, b);
}

/**
 * Smooth union operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @param k - Smoothness factor
 * @returns Smoothed minimum
 */
fn op_smooth_union(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/**
 * Smooth subtraction operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @param k - Smoothness factor
 * @returns Smoothed subtraction
 */
fn op_smooth_subtract(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 - 0.5 * (b + a) / k, 0.0, 1.0);
  return mix(-b, a, h) + k * h * (1.0 - h);
}

/**
 * Smooth intersection operation
 * @param a - First SDF value
 * @param b - Second SDF value
 * @param k - Smoothness factor
 * @returns Smoothed maximum
 */
fn op_smooth_intersect(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) + k * h * (1.0 - h);
}

/**
 * Round operation
 * @param d - SDF value
 * @param r - Radius
 * @returns Rounded SDF
 */
fn op_round(d: f32, r: f32) -> f32 {
  return d - r;
}

/**
 * Onion operation
 * @param d - SDF value
 * @param thickness - Shell thickness
 * @returns Onion-shaped SDF
 */
fn op_onion(d: f32, thickness: f32) -> f32 {
  return abs(d) - thickness;
}
