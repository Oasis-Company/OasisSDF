/**
 * PBR Material Showcase
 * 
 * Demonstrates different PBR (Physically Based Rendering) material types,
 * including metallic, rough, emissive, and glass materials, with interactive controls
 * to adjust material properties.
 */

import { Engine, isWebGPUAvailable } from '../src/index.js';

// Performance monitoring variables
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

// Memory usage tracking
let initialMemory = performance.memory?.usedJSHeapSize || 0;

// Material presets
const materialPresets = {
  gold: {
    name: 'Gold',
    properties: {
      color: [0.8, 0.6, 0.2],
      metallic: 1.0,
      roughness: 0.1
    }
  },
  silver: {
    name: 'Silver',
    properties: {
      color: [0.8, 0.8, 0.8],
      metallic: 1.0,
      roughness: 0.2
    }
  },
  rust: {
    name: 'Rust',
    properties: {
      color: [0.6, 0.3, 0.1],
      metallic: 0.7,
      roughness: 0.8
    }
  },
  plastic: {
    name: 'Plastic',
    properties: {
      color: [0.2, 0.6, 0.8],
      metallic: 0.0,
      roughness: 0.1
    }
  },
  rubber: {
    name: 'Rubber',
    properties: {
      color: [0.2, 0.2, 0.2],
      metallic: 0.0,
      roughness: 0.9
    }
  },
  neon: {
    name: 'Neon',
    properties: {
      color: [0.0, 0.0, 0.0],
      emission: [0.2, 1.0, 0.2],
      emissionIntensity: 3.0
    }
  },
  glass: {
    name: 'Glass',
    properties: {
      color: [0.9, 0.9, 1.0],
      metallic: 0.0,
      roughness: 0.0,
      reflectance: 0.04,
      transmission: 1.0,
      ior: 1.5
    }
  },
  jade: {
    name: 'Jade',
    properties: {
      color: [0.0, 0.8, 0.6],
      metallic: 0.0,
      roughness: 0.0,
      reflectance: 0.04,
      transmission: 0.5,
      ior: 1.6
    }
  }
};

/**
 * Initialize the PBR material showcase
 */
async function init() {
  try {
    console.log('=== PBR Material Showcase ===');
    console.log('Initializing OasisSDF engine...');

    // Check WebGPU availability
    if (!isWebGPUAvailable()) {
      console.log('WebGPU is not available in this environment.');
      console.log('This showcase requires a WebGPU-enabled browser.');
      console.log('Please use Chrome 113+, Edge 113+, or Firefox Nightly.');
      console.log('\nDemonstrating PBR material functionality without rendering...');
      
      // Create a simplified material manager for demonstration
      const { MaterialManager } = await import('../src/engine/MaterialManager.js');
      const materialManager = new MaterialManager(100);
      
      // Demonstrate PBR material creation
      console.log('\n=== Creating PBR Materials ===');
      
      const materials: number[] = [];
      
      // Create materials for each preset
      for (const [key, preset] of Object.entries(materialPresets)) {
        const materialId = materialManager.createMaterial(preset.properties);
        materials.push(materialId);
        console.log(`Created ${preset.name} material:`, materialId);
        console.log('  Properties:', JSON.stringify(preset.properties, null, 2));
      }
      
      console.log('\nTotal PBR materials created:', materialManager.getMaterialCount());
      
      // Demonstrate material property adjustments
      console.log('\n=== Adjusting Material Properties ===');
      
      // Adjust roughness for gold material
      console.log('Adjusting roughness for Gold material...');
      materialManager.updateMaterial(materials[0], { roughness: 0.5 });
      const updatedGold = materialManager.getMaterial(materials[0]);
      console.log('Updated Gold material roughness:', updatedGold?.roughness);
      
      // Adjust emission for neon material
      console.log('\nAdjusting emission for Neon material...');
      materialManager.updateMaterial(materials[5], { 
        emission: [1.0, 0.2, 0.2],
        emissionIntensity: 4.0 
      });
      const updatedNeon = materialManager.getMaterial(materials[5]);
      console.log('Updated Neon material emission:', updatedNeon?.emission);
      console.log('Updated Neon material emission intensity:', updatedNeon?.emissionIntensity);
      
      // Demonstrate material lifecycle
      console.log('\n=== Material Lifecycle Management ===');
      
      // Reference and release materials
      console.log('Referencing Gold material...');
      materialManager.referenceMaterial(materials[0]);
      const goldInstance = materialManager.getMaterialInstance(materials[0]);
      console.log('Gold material reference count:', goldInstance?.refCount || 0);
      
      console.log('Releasing Gold material...');
      const destroyed = materialManager.releaseMaterial(materials[0]);
      console.log('Gold material destroyed:', destroyed);
      const updatedGoldInstance = materialManager.getMaterialInstance(materials[0]);
      console.log('Gold material reference count after release:', updatedGoldInstance?.refCount || 0);
      
      // Cleanup
      console.log('\n=== Cleaning Up ===');
      console.log('Releasing all materials...');
      for (const materialId of materials) {
        materialManager.releaseMaterial(materialId);
      }
      
      console.log('Materials released.');
      console.log('Total materials after cleanup:', materialManager.getMaterialCount());
      
      console.log('\n=== PBR Material Showcase Completed ===');
      console.log('PBR material functionality demonstrated successfully!');
      console.log('\nAvailable material presets:');
      for (const [key, preset] of Object.entries(materialPresets)) {
        console.log(`- ${preset.name}: ${key}`);
      }
      
      return;
    }

    // Create mock canvas for Node.js environment
    const mockCanvas = {
      width: 800,
      height: 600,
      getContext: () => ({
        getCurrentTexture: () => ({
          createView: () => ({})
        })
      })
    };

    // Create engine instance
    const engine = new Engine({
      canvas: mockCanvas as any
    });

    // Initialize engine
    await engine.initialize();
    console.log('Engine initialized successfully!');

    // Create PBR materials
    createPBRMaterials(engine);

    // Create objects and apply materials
    createObjects(engine);

    // Set up performance monitoring
    setInterval(monitorPerformance, 1000);

    // Run animation loop
    console.log('Starting animation loop...');
    engine.start();

    // Handle cleanup
    process.on('SIGINT', () => {
      cleanup(engine);
      process.exit(0);
    });

  } catch (error) {
    console.error('Error initializing PBR material showcase:', error);
  }
}

/**
 * Create PBR materials with different properties
 */
function createPBRMaterials(engine: any) {
  console.log('\n=== Creating PBR Materials ===');

  const materials: number[] = [];
  
  // Create materials for each preset
  for (const [key, preset] of Object.entries(materialPresets)) {
    const materialId = engine.createMaterial(preset.properties);
    materials.push(materialId);
    console.log(`Created ${preset.name} material:`, materialId);
    console.log('  Properties:', JSON.stringify(preset.properties, null, 2));
  }

  console.log('\nTotal PBR materials created:', engine.getMaterialManager().getMaterialCount());
  
  // Store materials for later use
  (global as any).pbrMaterials = materials;
  (global as any).materialPresets = materialPresets;
}

/**
 * Create objects and apply materials
 */
function createObjects(engine: any) {
  console.log('\n=== Creating Objects ===');

  const materials = (global as any).pbrMaterials;
  if (!materials) {
    console.error('Materials not found');
    return;
  }

  // Create objects with different shapes
  const shapes = ['box', 'sphere', 'torus', 'cylinder', 'capsule'];
  const positions = [
    [-4, 0, 0],
    [-2, 0, 0],
    [0, 0, 0],
    [2, 0, 0],
    [4, 0, 0]
  ];

  const objects: any[] = [];
  
  // Create objects and apply materials
  for (let i = 0; i < Math.min(shapes.length, positions.length, materials.length); i++) {
    const shape = shapes[i];
    const position = positions[i];
    const materialId = materials[i];
    
    const object = engine.createObject(shape);
    object.setPosition(position);
    object.setMaterial(materialId);
    
    objects.push(object);
    console.log(`Created ${shape} at position ${position} with material ${i + 1}`);
  }

  console.log('\nTotal objects created:', engine.getObjects().length);
  
  // Store objects for later use
  (global as any).pbrObjects = objects;
}

/**
 * Monitor performance metrics
 */
function monitorPerformance() {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;
  
  if (elapsed >= 1000) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;
    
    const currentMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryUsed = ((currentMemory - initialMemory) / 1024 / 1024).toFixed(2);
    
    console.log(`\n=== Performance Metrics ===`);
    console.log(`FPS: ${fps}`);
    console.log(`Memory used: ${memoryUsed} MB`);
  }
}

/**
 * Cleanup resources
 */
function cleanup(engine: any) {
  console.log('\n=== Cleaning Up ===');
  
  // Release all materials
  console.log('Releasing materials...');
  const materials = (global as any).pbrMaterials;
  if (materials) {
    for (const materialId of materials) {
      engine.releaseMaterial(materialId);
    }
  }
  
  console.log('Materials released.');
  console.log('Total materials after cleanup:', engine.getMaterialManager().getMaterialCount());
  
  // Destroy engine
  engine.destroy();
  console.log('Engine destroyed.');
  console.log('PBR material showcase completed successfully!');
}

// Run the showcase
init();
