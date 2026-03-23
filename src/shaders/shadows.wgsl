/**
 * shadows.wgsl
 * 
 * Soft shadow calculation for SDF scenes
 * Uses penumbra estimation for realistic shadow edges
 */

/**
 * Calculate soft shadow
 */
fn soft_shadow(
  ro: vec3<f32>,
  rd: vec3<f32>,
  mint: f32,
  maxt: f32,
  k: f32
) -> f32 {
  var res = 1.0;
  var t = mint;
  
  for (var i: i32 = 0; i < 32; i++) {
    let p = ro + rd * t;
    let h = get_scene_sdf(p);
    
    if (h < 0.001) {
      return 0.0;
    }
    
    let penumbra = clamp(k * h / t, 0.0, 1.0);
    res = min(res, penumbra);
    
    t += h;
    
    if (t > maxt) {
      break;
    }
  }
  
  return res * res;
}

/**
 * Calculate shadow for a light
 */
fn calculate_shadow(surfacePos: vec3<f32>, light: LightData) -> f32 {
  if (light.castShadows < 0.5) {
    return 1.0;
  }
  
  let lightInfo = evaluate_light(light, surfacePos);
  let lightDir = lightInfo.direction;
  let maxDist = lightInfo.distance > 0.0 ? light.range : 100.0;
  
  return soft_shadow(
    surfacePos + lightDir * 0.01,
    lightDir,
    0.01,
    maxDist,
    light.shadowSoftness
  );
}
