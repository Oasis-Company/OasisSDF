/**
 * raymarch.wgsl
 * 
 * Main raymarching shader for OasisSDF
 * Uses SDF primitives and operations to render 3D scenes
 * Implements PBR lighting with soft shadows and ambient occlusion
 */

// Import shader modules
#include "primitives.wgsl"
#include "operations.wgsl"
#include "lights.wgsl"
#include "shadows.wgsl"
#include "ambient.wgsl"
#include "pbr.wgsl"

/**
 * Object data structure
 * Matches TypeScript interface SDFObjectData
 * Total size: 64 bytes (16-byte aligned)
 */
struct SDFObjectData {
  type: f32;           // 4 bytes
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
 * Total size: 64 bytes (16-byte aligned)
 */
struct MaterialData {
  color: vec3<f32>;         // 12 bytes
  padding0: f32;            // 4 bytes
  metallic: f32;            // 4 bytes
  roughness: f32;           // 4 bytes
  reflectance: f32;         // 4 bytes
  padding1: f32;            // 4 bytes
  emission: vec3<f32>;      // 12 bytes
  emissionIntensity: f32;   // 4 bytes
  ambientOcclusion: f32;    // 4 bytes
  padding2: vec3<f32>;      // 12 bytes
};

/**
 * Uniform data structure
 * Matches TypeScript interface UniformData
 * Total size: 48 bytes (16-byte aligned)
 */
struct UniformData {
  time: f32;            // 4 bytes
  frame: f32;           // 4 bytes
  objectCount: f32;     // 4 bytes
  lightCount: f32;      // 4 bytes
  resolution: vec2<f32>; // 8 bytes
  padding0: vec2<f32>;  // 8 bytes
  ambientLight: vec3<f32>; // 12 bytes
  padding1: f32;        // 4 bytes
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
@group(0) @binding(2) var<storage, read> lights: array<LightData>;

// Uniform buffers
@group(1) @binding(0) var<uniform> uniforms: UniformData;
@group(1) @binding(1) var<uniform> camera: CameraData;

/**
 * Get SDF for a single object
 */
fn get_object_sdf(p: vec3<f32>, obj: SDFObjectData) -> f32 {
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
 * Get SDF for the entire scene and return closest material index
 */
struct SceneResult {
  dist: f32;
  materialIndex: i32;
};

fn get_scene_result(p: vec3<f32>) -> SceneResult {
  var min_dist = 1e10;
  var materialIndex = 0;
  let object_count = i32(uniforms.objectCount);
  
  for (var i: i32 = 0; i < object_count; i++) {
    let obj = objects[i];
    let dist = get_object_sdf(p, obj);
    
    if (dist < min_dist) {
      min_dist = dist;
      materialIndex = i;
    }
  }
  
  return SceneResult(min_dist, materialIndex);
}

/**
 * Get SDF for the entire scene
 */
fn get_scene_sdf(p: vec3<f32>) -> f32 {
  return get_scene_result(p).dist;
}

/**
 * Get material index for closest object at point
 */
fn get_material_index(p: vec3<f32>) -> i32 {
  return get_scene_result(p).materialIndex;
}

/**
 * Calculate normal at a point (optimized with forward differences)
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
 * Raymarching algorithm (optimized with adaptive step size)
 */
fn raymarch(ro: vec3<f32>, rd: vec3<f32>, max_dist: f32) -> f32 {
  var t = 0.0;
  var i: i32 = 0;
  const max_iterations = 100;
  const min_distance = 0.001;
  
  while (i < max_iterations) {
    let p = ro + rd * t;
    let d = get_scene_sdf(p);
    
    if (d < min_distance) {
      return t;
    }
    
    if (t > max_dist) {
      return -1.0;
    }
    
    // Adaptive step size with safety margin
    t += d * 0.9;
    i++;
  }
  
  return -1.0;
}

/**
 * Generate ray direction from camera
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
 * Main fragment shader (optimized)
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
    // No hit, return background with gradient
    let bgColor = mix(
      vec3<f32>(0.1, 0.1, 0.15),
      vec3<f32>(0.05, 0.05, 0.1),
      uv.y * 0.5 + 0.5
    );
    return vec4<f32>(bgColor, 1.0);
  }
  
  // Calculate hit point and normal
  let p = ro + rd * t;
  let normal = calculate_normal(p);
  let viewDir = -rd;
  
  // Get material (using combined scene result)
  let sceneResult = get_scene_result(p);
  let material = materials[sceneResult.materialIndex];
  
  // Calculate ambient occlusion
  let ao = calculate_ao(p, normal);
  
  // Calculate PBR shading
  let color = calculate_pbr_shading(p, normal, viewDir, material, ao);
  
  // Tone mapping (ACES approximation) and gamma correction
  let mappedColor = color / (color + vec3<f32>(1.0));
  let finalColor = pow(mappedColor, vec3<f32>(1.0 / 2.2));
  
  return vec4<f32>(finalColor, 1.0);
}
