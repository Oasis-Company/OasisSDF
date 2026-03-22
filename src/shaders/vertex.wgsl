/**
 * vertex.wgsl
 * 
 * Vertex shader for fullscreen quad
 */

/**
 * Vertex output
 */
struct VertexOutput {
  @builtin(position) position: vec4<f32>;
};

/**
 * Main vertex shader
 * @returns Vertex output
 */
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  // Fullscreen quad vertices
  const vertices = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );
  
  let position = vertices[vertexIndex];
  
  return VertexOutput {
    position: vec4<f32>(position, 0.0, 1.0)
  };
}
