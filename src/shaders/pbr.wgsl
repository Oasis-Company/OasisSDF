/**
 * pbr.wgsl
 * 
 * Physically Based Rendering (PBR) lighting functions
 * Implements Disney/Burley BRDF model with extended features
 */

const PI: f32 = 3.14159265359;
const EPSILON: f32 = 0.0001;

/**
 * Fresnel-Schlick approximation with roughness correction
 */
fn fresnel_schlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
  return F0 + (max(vec3<f32>(1.0 - 0.04), F0) - F0) * pow(1.0 - cosTheta, 5.0);
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
 * Schlick-GGX geometry function
 */
fn geometry_schlick_ggx(NdotV: f32, roughness: f32) -> f32 {
  let r = roughness + 1.0;
  let k = (r * r) / 8.0;
  
  return NdotV / (NdotV * (1.0 - k) + k);
}

/**
 * Smith's method for geometry function
 */
fn geometry_smith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
  let NdotV = max(dot(N, V), 0.0);
  let NdotL = max(dot(N, L), 0.0);
  let ggx1 = geometry_schlick_ggx(NdotV, roughness);
  let ggx2 = geometry_schlick_ggx(NdotL, roughness);
  
  return ggx1 * ggx2;
}

/**
 * Calculate BRDF (Bidirectional Reflectance Distribution Function)
 */
fn calculate_brdf(
  N: vec3<f32>,
  V: vec3<f32>,
  L: vec3<f32>,
  material: MaterialData
) -> vec3<f32> {
  let H = normalize(V + L);
  
  let F0 = mix(vec3<f32>(material.reflectance), material.color, material.metallic);
  
  let D = distribution_ggx(N, H, material.roughness);
  let G = geometry_smith(N, V, L, material.roughness);
  let F = fresnel_schlick(max(dot(H, V), 0.0), F0);
  
  let numerator = D * G * F;
  let NdotL = max(dot(N, L), 0.0);
  let NdotV = max(dot(N, V), 0.0);
  let denominator = 4.0 * NdotV * NdotL + EPSILON;
  let specular = numerator / denominator;
  
  let kS = F;
  var kD = vec3<f32>(1.0) - kS;
  kD *= 1.0 - material.metallic;
  
  let diffuse = kD * material.color / PI;
  
  return diffuse + specular;
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
  let brdf = calculate_brdf(N, V, L, material);
  let NdotL = max(dot(N, L), 0.0);
  let radiance = lightColor * lightIntensity;
  
  return brdf * radiance * NdotL;
}

/**
 * Calculate ambient lighting with environment occlusion
 */
fn calculate_ambient(
  material: MaterialData,
  ao: f32
) -> vec3<f32> {
  let ambientColor = uniforms.ambientLight;
  let ambient = ambientColor * material.color * material.ambientOcclusion * ao;
  return ambient;
}

/**
 * Calculate emission lighting
 */
fn calculate_emission(
  material: MaterialData
) -> vec3<f32> {
  return material.emission * material.emissionIntensity;
}

/**
 * Apply tone mapping (ACES approximation)
 */
fn tone_map(color: vec3<f32>) -> vec3<f32> {
  let a = 2.51;
  let b = 0.03;
  let c = 2.43;
  let d = 0.59;
  let e = 0.14;
  
  return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
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
  
  let ambient = calculate_ambient(material, ao);
  let emission = calculate_emission(material);
  
  var color = ambient + Lo + emission;
  
  // Apply tone mapping
  color = tone_map(color);
  
  return color;
}

/**
 * Calculate material properties from material ID
 */
fn get_material(materialId: i32) -> MaterialData {
  if (materialId < 0 || materialId >= materials.length) {
    // Return default material if ID is out of bounds
    return MaterialData(
      vec3<f32>(0.5, 0.5, 0.5), // color
      0.0, // metallic
      0.5, // roughness
      0.04, // reflectance
      vec3<f32>(0.0, 0.0, 0.0), // emission
      0.0, // emissionIntensity
      1.0 // ambientOcclusion
    );
  }
  
  return materials[materialId];
}
