/**
 * ambient.wgsl
 * 
 * Ambient occlusion calculation for SDF scenes
 * Uses horizon-based ambient occlusion (HBAO) approximation
 */

/**
 * Calculate ambient occlusion
 */
fn calculate_ao(p: vec3<f32>, n: vec3<f32>) -> f32 {
  let kStep = 0.1;
  let kIterations = 5;
  
  var occlusion = 0.0;
  var scale = 1.0;
  
  for (var i: i32 = 1; i <= kIterations; i++) {
    let dist = f32(i) * kStep;
    let samplePos = p + n * dist;
    let h = get_scene_sdf(samplePos);
    
    occlusion += (dist - h) * scale;
    scale *= 0.5;
  }
  
  let ao = 1.0 - clamp(occlusion * 0.5, 0.0, 1.0);
  
  return ao * ao;
}

/**
 * Calculate bent normal
 */
fn calculate_bent_normal(p: vec3<f32>, n: vec3<f32>) -> vec3<f32> {
  var bentNormal = vec3<f32>(0.0);
  var totalWeight = 0.0;
  
  let sampleCount = 8;
  let kRadius = 0.5;
  
  for (var i: i32 = 0; i < sampleCount; i++) {
    let phi = f32(i) * 2.4;
    let cosTheta = 1.0 - (f32(i) + 0.5) / f32(sampleCount);
    let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    
    let sampleDir = vec3<f32>(
      cos(phi) * sinTheta,
      sin(phi) * sinTheta,
      cosTheta
    );
    
    let tangent = normalize(cross(n, vec3<f32>(0.0, 1.0, 0.0)));
    let bitangent = cross(n, tangent);
    let worldDir = normalize(
      tangent * sampleDir.x +
      bitangent * sampleDir.y +
      n * sampleDir.z
    );
    
    let samplePos = p + worldDir * kRadius;
    let dist = get_scene_sdf(samplePos);
    
    let weight = smoothstep(0.0, kRadius, dist);
    bentNormal += worldDir * weight;
    totalWeight += weight;
  }
  
  if (totalWeight > 0.0) {
    return normalize(bentNormal / totalWeight);
  }
  
  return n;
}
