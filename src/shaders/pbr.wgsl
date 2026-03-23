/**
 * pbr.wgsl
 * 
 * Physically Based Rendering (PBR) lighting functions
 * Implements Disney/Burley BRDF model
 */

const PI: f32 = 3.14159265359;

/**
 * Fresnel-Schlick approximation
 */
fn fresnel_schlick(cosTheta: f32, F0: f32) -> f32 {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

/**
 * GGX/Trowbridge-Reitz normal distribution function
 */
fn distribution_ggx(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
  let a = roughness * roughness;
  let a2 = a * a;
  let NdotH = max(dot(N, H), 0.0);
  let NdotH2 = NdotH * NdotH;
  
  let nom = a2;
  var denom = (NdotH2 * (a2 - 1.0) + 1.0);
  denom = PI * denom * denom;
  
  return nom / denom;
}

/**
 * Geometry function (Smith's method)
 */
fn geometry_smith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  
  let ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  let ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  
  return ggx1 * ggx2;
}

/**
 * Calculate PBR lighting for a single light
 */
fn calculate_pbr_lighting(
  N: vec3<f32>,
  V: vec3<f32>,
  L: vec3<f32>,
  lightColor: vec3<f32>,
  lightIntensity: f32,
  material: MaterialData
) -> vec3<f32> {
  let H = normalize(V + L);
  
  let F0 = mix(vec3<f32>(material.reflectance), material.color, material.metallic);
  
  let D = distribution_ggx(N, H, material.roughness);
  let G = geometry_smith(N, V, L, material.roughness);
  let F = fresnel_schlick(max(dot(H, V), 0.0), F0.r);
  
  let numerator = D * G * F;
  let NdotL = max(dot(N, L), 0.0);
  let denominator = 4.0 * max(dot(N, V), 0.0) * NdotL + 0.0001;
  let specular = numerator / denominator;
  
  let kS = F;
  var kD = vec3<f32>(1.0) - kS;
  kD *= 1.0 - material.metallic;
  
  let diffuse = kD * material.color / PI;
  
  let radiance = lightColor * lightIntensity;
  let Lo = (diffuse + specular) * radiance * NdotL;
  
  return Lo;
}

/**
 * Calculate full PBR shading
 */
fn calculate_pbr_shading(
  surfacePos: vec3<f32>,
  normal: vec3<f32>,
  viewDir: vec3<f32>,
  material: MaterialData,
  ao: f32
) -> vec3<f32> {
  var Lo = vec3<f32>(0.0);
  
  let lightCount = i32(uniforms.lightCount);
  
  for (var i: i32 = 0; i < lightCount; i++) {
    let light = lights[i];
    
    let lightInfo = evaluate_light(light, surfacePos);
    let lightDir = lightInfo.direction;
    let attenuation = lightInfo.attenuation;
    
    let shadow = calculate_shadow(surfacePos, light);
    
    let lighting = calculate_pbr_lighting(
      normal,
      viewDir,
      lightDir,
      light.color,
      light.intensity * attenuation * shadow,
      material
    );
    
    Lo += lighting;
  }
  
  let ambient = vec3<f32>(0.03) * material.color * ao;
  
  let emission = material.emission * material.emissionIntensity;
  
  var color = ambient + Lo + emission;
  
  color *= material.ambientOcclusion;
  
  return color;
}
