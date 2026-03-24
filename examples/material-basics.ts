/**
 * Basic Material Example
 * 
 * Demonstrates the core functionality of the OasisSDF material system,
 * including material creation, application, updating, and lifecycle management.
 */

import { Engine, isWebGPUAvailable } from '../src/index.js';

// Performance monitoring variables
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

// Memory usage tracking
let initialMemory = performance.memory?.usedJSHeapSize || 0;

// Material IDs
let material1: number;
let material2: number;
let material3: number;

/**
 * Initialize the example
 */
async function init() {
  try {
    console.log('=== Basic Material Example ===');
    console.log('Initializing OasisSDF engine...');

    // Check WebGPU availability
    if (!isWebGPUAvailable()) {
      console.log('WebGPU is not available in this environment.');
      console.log('This example requires a WebGPU-enabled browser.');
      console.log('Please use Chrome 113+, Edge 113+, or Firefox Nightly.');
      console.log('\nDemonstrating material system functionality without rendering...');
      
      // Create a simplified material manager for demonstration
      const { MaterialManager } = await import('../src/engine/MaterialManager.js');
      const materialManager = new MaterialManager(100);
      
      // Demonstrate material creation
      console.log('\n=== Creating Materials ===');
      
      const material1 = materialManager.createMaterial({
        color: [0.8, 0.2, 0.2], // Red
        metallic: 0.0,
        roughness: 0.5
      });
      console.log('Created material 1 (Red):', material1);
      
      const material2 = materialManager.createMaterial({
        color: [0.8, 0.8, 0.8], // Silver
        metallic: 1.0,
        roughness: 0.2
      });
      console.log('Created material 2 (Metallic Silver):', material2);
      
      const material3 = materialManager.createMaterial({
        color: [0.0, 0.0, 0.0],
        emission: [1.0, 0.5, 0.0], // Orange glow
        emissionIntensity: 2.0
      });
      console.log('Created material 3 (Emissive Orange):', material3);
      
      console.log('Total materials created:', materialManager.getMaterialCount());
      
      // Demonstrate material updates
      console.log('\n=== Updating Materials ===');
      
      const time = Date.now() * 0.001;
      const newColor = [
        Math.sin(time * 0.5) * 0.5 + 0.5,
        Math.sin(time * 0.3) * 0.5 + 0.5,
        Math.sin(time * 0.7) * 0.5 + 0.5
      ];
      
      materialManager.updateMaterial(material1, { color: newColor });
      console.log('Updated material 1 color:', newColor.map(c => c.toFixed(2)));
      
      // Demonstrate material lifecycle management
      console.log('\n=== Material Lifecycle Management ===');
      
      // Reference material 1
      console.log('Referencing material 1...');
      materialManager.referenceMaterial(material1);
      const material1Instance = materialManager.getMaterialInstance(material1);
      console.log('Material 1 reference count:', material1Instance?.refCount || 0);
      
      // Release material 1 (should not destroy yet)
      console.log('Releasing material 1...');
      const destroyed1 = materialManager.releaseMaterial(material1);
      console.log('Material 1 destroyed:', destroyed1);
      const updatedMaterial1Instance = materialManager.getMaterialInstance(material1);
      console.log('Material 1 reference count:', updatedMaterial1Instance?.refCount || 0);
      
      // Create a temporary material and release it immediately
      console.log('\nCreating temporary material...');
      const tempMaterial = materialManager.createMaterial({ color: [0.5, 0.5, 0.5] });
      console.log('Temporary material created:', tempMaterial);
      console.log('Releasing temporary material...');
      const destroyedTemp = materialManager.releaseMaterial(tempMaterial);
      console.log('Temporary material destroyed:', destroyedTemp);
      
      console.log('\nTotal materials now:', materialManager.getMaterialCount());
      
      // Cleanup
      console.log('\n=== Cleaning Up ===');
      console.log('Releasing materials...');
      materialManager.releaseMaterial(material1);
      materialManager.releaseMaterial(material2);
      materialManager.releaseMaterial(material3);
      
      console.log('Materials released.');
      console.log('Total materials after cleanup:', materialManager.getMaterialCount());
      
      console.log('\n=== Example Completed ===');
      console.log('Material system functionality demonstrated successfully!');
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

    // Create materials
    createMaterials(engine);

    // Create objects and apply materials
    createObjects(engine);

    // Set up material updates
    setupMaterialUpdates(engine);

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
    console.error('Error initializing example:', error);
  }
}

/**
 * Create materials with different properties
 */
function createMaterials(engine: OasisSDF) {
  console.log('\n=== Creating Materials ===');

  // Create basic material with custom color
  material1 = engine.createMaterial({
    color: [0.8, 0.2, 0.2], // Red
    metallic: 0.0,
    roughness: 0.5
  });
  console.log('Created material 1 (Red):', material1);

  // Create metallic material
  material2 = engine.createMaterial({
    color: [0.8, 0.8, 0.8], // Silver
    metallic: 1.0,
    roughness: 0.2
  });
  console.log('Created material 2 (Metallic Silver):', material2);

  // Create emissive material
  material3 = engine.createMaterial({
    color: [0.0, 0.0, 0.0],
    emission: [1.0, 0.5, 0.0], // Orange glow
    emissionIntensity: 2.0
  });
  console.log('Created material 3 (Emissive Orange):', material3);

  console.log('Total materials created:', engine.getMaterialManager().getMaterialCount());
}

/**
 * Create objects and apply materials
 */
function createObjects(engine: OasisSDF) {
  console.log('\n=== Creating Objects ===');

  // Create box 1 with material 1
  const box1 = engine.createObject('box');
  box1.setPosition([-2, 0, 0]);
  box1.setMaterial(material1);
  console.log('Created box 1 with material 1 (Red) at position [-2, 0, 0]');

  // Create box 2 with material 2
  const box2 = engine.createObject('box');
  box2.setPosition([0, 0, 0]);
  box2.setMaterial(material2);
  console.log('Created box 2 with material 2 (Metallic Silver) at position [0, 0, 0]');

  // Create box 3 with material 3
  const box3 = engine.createObject('box');
  box3.setPosition([2, 0, 0]);
  box3.setMaterial(material3);
  console.log('Created box 3 with material 3 (Emissive Orange) at position [2, 0, 0]');

  console.log('Total objects created:', engine.getObjects().length);
}

/**
 * Set up material property updates
 */
function setupMaterialUpdates(engine: OasisSDF) {
  console.log('\n=== Setting Up Material Updates ===');
  console.log('Material 1 color will update dynamically every second');

  // Update material 1 color dynamically
  setInterval(() => {
    const time = Date.now() * 0.001;
    const newColor = [
      Math.sin(time * 0.5) * 0.5 + 0.5,
      Math.sin(time * 0.3) * 0.5 + 0.5,
      Math.sin(time * 0.7) * 0.5 + 0.5
    ];
    
    engine.updateMaterial(material1, { color: newColor });
    console.log('Updated material 1 color:', newColor.map(c => c.toFixed(2)));
  }, 1000);

  // Demonstrate material lifecycle management after 5 seconds
  setTimeout(() => {
    console.log('\n=== Material Lifecycle Management ===');
    
    // Reference material 1
    console.log('Referencing material 1...');
    engine.referenceMaterial(material1);
    const materialManager = engine.getMaterialManager();
    const material1Instance = materialManager.getMaterialInstance(material1);
    console.log('Material 1 reference count:', material1Instance?.refCount || 0);
    
    // Release material 1 (should not destroy yet)
    console.log('Releasing material 1...');
    const destroyed1 = engine.releaseMaterial(material1);
    console.log('Material 1 destroyed:', destroyed1);
    const updatedMaterial1Instance = materialManager.getMaterialInstance(material1);
    console.log('Material 1 reference count:', updatedMaterial1Instance?.refCount || 0);
    
    // Create a temporary material and release it immediately
    console.log('\nCreating temporary material...');
    const tempMaterial = engine.createMaterial({ color: [0.5, 0.5, 0.5] });
    console.log('Temporary material created:', tempMaterial);
    console.log('Releasing temporary material...');
    const destroyedTemp = engine.releaseMaterial(tempMaterial);
    console.log('Temporary material destroyed:', destroyedTemp);
    
    console.log('\nTotal materials now:', engine.getMaterialManager().getMaterialCount());
  }, 5000);
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
function cleanup(engine: OasisSDF) {
  console.log('\n=== Cleaning Up ===');
  
  // Release all materials
  console.log('Releasing materials...');
  engine.releaseMaterial(material1);
  engine.releaseMaterial(material2);
  engine.releaseMaterial(material3);
  
  console.log('Materials released.');
  console.log('Total materials after cleanup:', engine.getMaterialManager().getMaterialCount());
  
  // Destroy engine
  engine.destroy();
  console.log('Engine destroyed.');
  console.log('Example completed successfully!');
}

// Run the example
init();
