/**
 * raymarch.wgsl
 * 
 * Main raymarching shader for OasisSDF
 * Uses SDF primitives and operations to render 3D scenes
 */

// Import primitive and operation functions
#include "primitives.wgsl"
#include "operations.wgsl"

/**
 * Object data structure
 * Matches TypeScript interface SDFObjectData
 * Total size: 64 bytes (16-byte aligned)
 */
struct SDFObjectData {
  type: f32;          // 4 bytes
  padding0: vec3<f32>; // 12 bytes
  position: vec3<f32>; // 12 bytes
  padding1: f32;       // 4 bytes
  rotation: vec3<f32>; // 12 bytes
  padding2: f32;       // 4 bytes
  scale: vec3<f32>;    // 12 bytes
  padding3: f32;       // 4 bytes
};

/**
 * Material data structure
 * Matches TypeScript interface MaterialData
 * Total size: 48 bytes (16-byte aligned)
 */
struct MaterialData {
  color: vec3<f32>;    // 12 bytes
  padding0: f32;        // 4 bytes
  metallic: f32;        // 4 bytes
  roughness: f32;       // 4 bytes
  padding1: vec2<f32>;  // 8 bytes
};

/**
 * Uniform data structure
 * Matches TypeScript interface UniformData
 * Total size: 32 bytes (16-byte aligned)
 */
struct UniformData {
  time: f32;            // 4 bytes
  frame: f32;           // 4 bytes
  objectCount: f32;     // 4 bytes
  padding0: f32;        // 4 bytes
  resolution: vec2<f32>; // 8 bytes
  padding1: vec2<f32>;  // 8 bytes
};

/**
 * Camera data structure
 * Matches TypeScript interface CameraData
 * Total size: 80 bytes (16-byte aligned)
 */
struct CameraData {
  position: vec3<f32>;  // 12 bytes
  padding0: f32;        // 4 bytes
  target: vec3<f32>;    // 12 bytes
  padding1: f32;        // 4 bytes
  up: vec3<f32>;        // 12 bytes
  padding2: f32;        // 4 bytes
  fov: f32;             // 4 bytes
  near: f32;            // 4 bytes
  far: f32;             // 4 bytes
  padding3: f32;        // 4 bytes
};

// Storage buffers
@group(0) @binding(0) var<storage, read> objects: array<SDFObjectData>;
@group(0) @binding(1) var<storage, read> materials: array<MaterialData>;

// Uniform buffers
@group(1) @binding(0) var<uniform> uniforms: UniformData;
@group(1) @binding(1) var<uniform> camera: CameraData;

/**
 * Get SDF for a single object
 * @param p - Point to test
 * @param obj - Object data
 * @returns Signed distance
 */
fn get_object_sdf(p: vec3<f32>, obj: SDFObjectData) -> f32 {
  // Transform point to object space
  let p_local = (p - obj.position) / obj.scale;
  
  switch obj.type {
    case 1.0: // Sphere
      return sphere(p_local, 0.5);
    case 2.0: // Box
      return box(p_local, vec3<f32>(0.5));
    case 3.0: // Torus
      return torus(p_local, 0.3, 0.1);
    case 4.0: // Capsule
      return capsule(p_local, vec3<f32>(-0.3, 0.0, 0.0), vec3<f32>(0.3, 0.0, 0.0), 0.1);
    case 5.0: // Cylinder
      return cylinder(p_local, 1.0, 0.2);
    case 6.0: // Cone
      return cone(p_local, 0.6, 0.3);
    default:
      return 1e10;
  }
}

/**
 * Get SDF for the entire scene
 * @param p - Point to test
 * @returns Signed distance
 */
fn get_scene_sdf(p: vec3<f32>) -> f32 {
  var min_dist = 1e10;
  var object_count = i32(uniforms.objectCount);
  
  for (var i: i32 = 0; i < object_count; i++) {
    let obj = objects[i];
    let dist = get_object_sdf(p, obj);
    min_dist = min(min_dist, dist);
  }
  
  return min_dist;
}

/**
 * Calculate normal at a point
 * @param p - Point to calculate normal at
 * @returns Normal vector
 */
fn calculate_normal(p: vec3<f32>) -> vec3<f32> {
  let eps = 0.001;
  let d = get_scene_sdf(p);
  
  let nx = get_scene_sdf(p + vec3<f32>(eps, 0.0, 0.0)) - d;
  let ny = get_scene_sdf(p + vec3<f32>(0.0, eps, 0.0)) - d;
  let nz = get_scene_sdf(p + vec3<f32>(0.0, 0.0, eps)) - d;
  
  return normalize(vec3<f32>(nx, ny, nz));
}

/**
 * Raymarching algorithm
 * @param ro - Ray origin
 * @param rd - Ray direction
 * @param max_dist - Maximum distance to march
 * @returns Distance to closest surface
 */
fn raymarch(ro: vec3<f32>, rd: vec3<f32>, max_dist: f32) -> f32 {
  var t = 0.0;
  
  for (var i: i32 = 0; i < 100; i++) {
    let p = ro + rd * t;
    let d = get_scene_sdf(p);
    
    if (d < 0.001) {
      return t;
    }
    
    if (t > max_dist) {
      return -1.0;
    }
    
    t += d;
  }
  
  return -1.0;
}

/**
 * Generate ray direction from camera
 * @param uv - Screen UV coordinates
 * @returns Ray direction
 */
fn get_ray_direction(uv: vec2<f32>) -> vec3<f32> {
  let forward = normalize(camera.target - camera.position);
  let right = normalize(cross(forward, camera.up));
  let up = cross(right, forward);
  
  let fov = camera.fov;
  let aspect = uniforms.resolution.x / uniforms.resolution.y;
  
  let rd = normalize(
    forward +
    right * uv.x * fov * aspect +
    up * uv.y * fov
  );
  
  return rd;
}

/**
 * Main fragment shader
 * @param fragCoord - Fragment coordinates
 * @returns Fragment color
 */
@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // Calculate UV coordinates
  let uv = (
    fragCoord.xy - 0.5 * uniforms.resolution
  ) / min(uniforms.resolution.x, uniforms.resolution.y);
  
  // Get ray direction
  let ro = camera.position;
  let rd = get_ray_direction(uv);
  
  // Raymarch
  let t = raymarch(ro, rd, 100.0);
  
  if (t < 0.0) {
    // No hit, return background
    return vec4<f32>(0.1, 0.1, 0.15, 1.0);
  }
  
  // Calculate hit point
  let p = ro + rd * t;
  
  // Calculate normal
  let normal = calculate_normal(p);
  
  // Calculate lighting
  let light_dir = normalize(vec3<f32>(1.0, 1.0, -1.0));
  let diffuse = max(dot(normal, light_dir), 0.0);
  
  // Return color
  return vec4<f32>(diffuse, diffuse, diffuse, 1.0);
}
