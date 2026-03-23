/**
 * lights.wgsl
 * 
 * Light system for OasisSDF
 * Supports directional, point, and spot lights
 */

const LIGHT_TYPE_DIRECTIONAL: f32 = 0.0;
const LIGHT_TYPE_POINT: f32 = 1.0;
const LIGHT_TYPE_SPOT: f32 = 2.0;

/**
 * Light data structure
 * Total size: 80 bytes (16-byte aligned)
 */
struct LightData {
  type: f32;              // 4 bytes
  intensity: f32;         // 4 bytes
  castShadows: f32;       // 4 bytes
  shadowSoftness: f32;    // 4 bytes
  
  position: vec3<f32>;    // 12 bytes
  padding0: f32;          // 4 bytes
  
  direction: vec3<f32>;   // 12 bytes
  padding1: f32;          // 4 bytes
  
  color: vec3<f32>;       // 12 bytes
  padding2: f32;          // 4 bytes
  
  range: f32;             // 4 bytes
  innerConeAngle: f32;    // 4 bytes
  outerConeAngle: f32;    // 4 bytes
  padding3: f32;          // 4 bytes
};

/**
 * Light evaluation result
 */
struct LightEvalResult {
  direction: vec3<f32>;
  attenuation: f32;
  distance: f32;
}

/**
 * Calculate light direction and attenuation
 */
fn evaluate_light(light: LightData, surfacePos: vec3<f32>) -> LightEvalResult {
  var result: LightEvalResult;
  result.direction = vec3<f32>(0.0);
  result.attenuation = 1.0;
  result.distance = 0.0;
  
  if (light.type == LIGHT_TYPE_DIRECTIONAL) {
    result.direction = -normalize(light.direction);
    result.attenuation = 1.0;
    result.distance = 1000.0;
  } else if (light.type == LIGHT_TYPE_POINT) {
    let toLight = light.position - surfacePos;
    result.distance = length(toLight);
    result.direction = toLight / result.distance;
    
    let range = light.range;
    let distFactor = result.distance / range;
    result.attenuation = 1.0 - clamp(distFactor * distFactor, 0.0, 1.0);
  } else if (light.type == LIGHT_TYPE_SPOT) {
    let toLight = light.position - surfacePos;
    result.distance = length(toLight);
    result.direction = toLight / result.distance;
    
    let spotAngle = acos(dot(-result.direction, normalize(light.direction)));
    let innerAngle = light.innerConeAngle;
    let outerAngle = light.outerConeAngle;
    let coneFactor = (spotAngle - innerAngle) / (outerAngle - innerAngle);
    let coneAttenuation = 1.0 - clamp(coneFactor, 0.0, 1.0);
    
    let range = light.range;
    let distFactor = result.distance / range;
    let distAttenuation = 1.0 - clamp(distFactor * distFactor, 0.0, 1.0);
    
    result.attenuation = coneAttenuation * distAttenuation;
  }
  
  return result;
}
