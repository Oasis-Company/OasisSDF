/**
 * primitives.wgsl
 * 
 * SDF (Signed Distance Function) primitive functions
 * Each function returns the signed distance from a point to the primitive
 */

/**
 * Sphere primitive
 * @param p - Point to test
 * @param radius - Sphere radius
 * @returns Signed distance
 */
fn sphere(p: vec3<f32>, radius: f32) -> f32 {
  return length(p) - radius;
}

/**
 * Box primitive
 * @param p - Point to test
 * @param size - Box size
 * @returns Signed distance
 */
fn box(p: vec3<f32>, size: vec3<f32>) -> f32 {
  let q = abs(p) - size;
  return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/**
 * Torus primitive
 * @param p - Point to test
 * @param radius - Torus radius
 * @param tube - Tube radius
 * @returns Signed distance
 */
fn torus(p: vec3<f32>, radius: f32, tube: f32) -> f32 {
  let q = vec2<f32>(length(p.xz) - radius, p.y);
  return length(q) - tube;
}

/**
 * Capsule primitive
 * @param p - Point to test
 * @param a - First endpoint
 * @param b - Second endpoint
 * @param radius - Capsule radius
 * @returns Signed distance
 */
fn capsule(p: vec3<f32>, a: vec3<f32>, b: vec3<f32>, radius: f32) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - radius;
}

/**
 * Cylinder primitive
 * @param p - Point to test
 * @param height - Cylinder height
 * @param radius - Cylinder radius
 * @returns Signed distance
 */
fn cylinder(p: vec3<f32>, height: f32, radius: f32) -> f32 {
  let d = abs(length(p.xz) - radius);
  let h = abs(p.y) - height * 0.5;
  return length(max(vec2<f32>(d, h), 0.0)) + min(max(d, h), 0.0);
}

/**
 * Cone primitive
 * @param p - Point to test
 * @param height - Cone height
 * @param radius - Cone base radius
 * @returns Signed distance
 */
fn cone(p: vec3<f32>, height: f32, radius: f32) -> f32 {
  let q = vec2<f32>(length(p.xz), p.y);
  let v = vec2<f32>(radius, -height);
  let w = vec2<f32>(length(v), 0.0);
  
  let vw = v / w.x;
  let qw = q / w.x;
  
  let a = w.x - qw.x * v.x - qw.y * v.y;
  let b = length(qw - vw * clamp(dot(qw, vw), 0.0, 1.0));
  
  return a * sign(a) + b * sign(min(a, 0.0));
}

/**
 * Plane primitive
 * @param p - Point to test
 * @param normal - Plane normal
 * @param distance - Distance from origin
 * @returns Signed distance
 */
fn plane(p: vec3<f32>, normal: vec3<f32>, distance: f32) -> f32 {
  return dot(p, normalize(normal)) + distance;
}
