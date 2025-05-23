import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js'; 
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Debug logging
console.log("Starting 3D portfolio initialization");

// Setup scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x111111);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
document.body.appendChild(renderer.domElement);

// Enable shadows for more realistic rendering but with optimized settings
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // Only update shadows when needed
renderer.shadowMap.needsUpdate = true; // Initial shadow map update

console.log("Renderer created and added to DOM");

// Enhanced orbit controls with better configuration
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 1.2;
controls.minDistance = 2;  // Prevent zooming in too close
controls.maxDistance = 15; // Prevent zooming out too far
controls.maxPolarAngle = Math.PI / 1.5; // Prevent going below the floor too much
controls.target.set(0, 0, 0); // Initial look target

const projectPositions = [
    { x: -2, y: -1, z: -2, rotation: Math.PI * 0.25, id: 0, model: 'cat' },
    { x: 2, y: 1, z: -2, rotation: Math.PI * 0.75, id: 1, model: 'cats' },
    { x: -2, y: -1, z: 2, rotation: Math.PI * 1.25, id: 2, model: 'maxwell' },
    { x: 2, y: -1, z: 2, rotation: Math.PI * 1.75, id: 3, model: 'oiia' },
    { x: 0, y: 0, z: 0, rotation: Math.PI * 1.0, id: 4, model: 'gesturalmixer' }
];

function createSky() {
    // Create an instance of Sky
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);
    
    // Much softer sun position parameters
    const sun = new THREE.Vector3();
    const effectController = {
        turbidity: 6,         // Increased haziness significantly (2 -> 6)
        rayleigh: 1,          // Increased scattering significantly (0.2 -> 1)
        mieCoefficient: 0.02, // Increased sun haziness (0.005 -> 0.02)
        mieDirectionalG: 0.4, // Decreased sun sharpness even more (0.7 -> 0.4)
        elevation: 10,        // Higher sun position (8 -> 25)
        azimuth: 50,         // Adjusted angle (180 -> 230)
    };
    
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
    
    // Calculate sun position
    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    
    uniforms['sunPosition'].value.copy(sun);
    
    // Remove previous directional lights
    scene.children.forEach(child => {
        if (child instanceof THREE.DirectionalLight) {
            scene.remove(child);
        }
    });
    
    // Create a much softer directional light with a more muted color
    const dirLight = new THREE.DirectionalLight(0xe0c8a0, 0.5); // Even warmer color and lower intensity
    dirLight.position.copy(sun).multiplyScalar(10);
    dirLight.castShadow = true;
    
    // Improve shadow quality
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    
    // Add a subtle shadow blur
    dirLight.shadow.radius = 3;
    
    scene.add(dirLight);
    
    // Remove previous hemisphere lights
    scene.children.forEach(child => {
        if (child instanceof THREE.HemisphereLight) {
            scene.remove(child);
        }
    });
    
    // Add very soft hemisphere light for ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xb8c8dd, 0x553322, 0.3); // Muted sky color, ground color, reduced intensity
    scene.add(hemiLight);
    
    console.log("Sky created with very soft lighting");

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft white light
    scene.add(ambientLight);
    

    // Add clouds
    addClouds();
    
    return { sky, dirLight, hemiLight };
}

// Function to create clouds in the sky
function addClouds() {
    // First remove any existing clouds
    scene.children.forEach(child => {
        if (child.name === 'cloud') {
            scene.remove(child);
        }
    });
    
    // Create cloud geometry and material
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        roughness: 1,
        metalness: 0
    });
    
    // Create several clouds at different positions
    for (let i = 0; i < 12; i++) {
        // Create a cloud group
        const cloudGroup = new THREE.Group();
        cloudGroup.name = 'cloud';
        
        // Random position around the scene
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 35; // Clouds at various distances
        const height = 10 + Math.random() * 8;  // Clouds at different heights
        
        cloudGroup.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Random rotation
        cloudGroup.rotation.y = Math.random() * Math.PI;
        
        // Create a random number of cloud puffs for each cloud
        const numPuffs = 3 + Math.floor(Math.random() * 5);
        
        for (let j = 0; j < numPuffs; j++) {
            // Create a fluffy cloud puff (flattened sphere)
            const puffSize = 2 + Math.random() * 3;
            const puffGeometry = new THREE.SphereGeometry(puffSize, 10, 8);
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            
            // Position puffs to form a cloud shape
            puff.position.set(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 1.8,
                (Math.random() - 0.5) * 4
            );
            
            // Flatten the puff a bit
            puff.scale.y = 0.7;
            
            // Add puff to cloud group
            cloudGroup.add(puff);
        }
        
        // Add the cloud to the scene
        scene.add(cloudGroup);
    }
    
    console.log("Added clouds to the scene");
}

// Function to animate clouds
function animateClouds(deltaTime) {
    scene.children.forEach(child => {
        if (child.name === 'cloud') {
            // Move clouds slowly
            child.position.x += deltaTime * 0.2 * (0.5 - Math.random()); // Random drift
            child.position.z += deltaTime * 0.3 * (0.5 - Math.random()); // Random drift
            
            // Keep clouds within a certain range
            if (child.position.x > 50) child.position.x = -50;
            if (child.position.x < -50) child.position.x = 50;
            if (child.position.z > 50) child.position.z = -50;
            if (child.position.z < -50) child.position.z = 50;
        }
    });
}

function createGrassGround() {
    const oldFloor = scene.children.find(child => child.name === 'floor');
    if (oldFloor) {
        scene.remove(oldFloor);
    }
    
    // Load grass texture
    const textureLoader = new THREE.TextureLoader();
    
    const loadTexture = (url) => {
        return new Promise((resolve) => {
            textureLoader.load(url, (texture) => {
                resolve(texture);
            });
        });
    };
    
    const grassUrls = {
        diffuse: 'textures/grass/grass_diffuse.jpg',
        normal: 'textures/grass/grass_normal.jpg',
        roughness: 'textures/grass/grass_roughness.jpg',
        displacement: 'textures/grass/grass_displacementt.jpg'
    };
    
    // Create a placeholder textured ground initially
    const floorGeometry = new THREE.PlaneGeometry(100, 100, 32, 32);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x7cba3b, // A nice grass green as base color
        roughness: 0.8,
        metalness: 0.1
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);
    
    // Try to load textures asynchronously
    Promise.all([
        loadTexture(grassUrls.diffuse),
        loadTexture(grassUrls.normal),
        loadTexture(grassUrls.roughness),
        loadTexture(grassUrls.displacement)
    ]).then(([diffuseMap, normalMap, roughnessMap, displacementMap]) => {
        // Apply repeat settings to all textures
        [diffuseMap, normalMap, roughnessMap, displacementMap].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(20, 20);
        });
        
        // Update the material with the loaded textures
        floor.material.map = diffuseMap;
        floor.material.normalMap = normalMap;
        floor.material.roughnessMap = roughnessMap;
        floor.material.displacementMap = displacementMap;
        floor.material.displacementScale = 0.1;
        floor.material.needsUpdate = true;
        
        console.log("Grass textures loaded successfully");
    }).catch(error => {
        console.warn("Could not load grass textures:", error);
        console.log("Using basic green floor instead");
    });
    
    // Add some simple grass blades for realism near the camera
    addGrassBlades();
    
    return floor;
}

// Function to add some simple grass blades for added realism
function addGrassBlades() {
    // Use a simple plane geometry for grass blades
    const bladeWidth = 0.1;
    const bladeHeight = 0.5;
    const bladeGeometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight);
    
    // Create grass material with alpha transparency
    const bladeMaterial = new THREE.MeshStandardMaterial({
        color: 0x90c853,
        side: THREE.DoubleSide,
        alphaTest: 0.5
    });
    
    // We'll create a limited number of grass blades for performance
    const grassCount = 500;
    const grassRadius = 6; // Only add grass within this radius of center
    
    // Create and position grass blades
    for (let i = 0; i < grassCount; i++) {
        // Create grass blade
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        
        // Random position within a circle around the center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * grassRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Position at floor level
        blade.position.set(x, -0.9, z);
        
        // Random rotation
        blade.rotation.y = Math.random() * Math.PI;
        
        // Random slight tilt
        blade.rotation.x = Math.random() * 0.2;
        
        // Random scale variation
        const scale = 0.7 + Math.random() * 0.6;
        blade.scale.set(scale, scale, scale);
        
        scene.add(blade);
    }
    
    console.log("Added grass blade details");
}

function addEnvironmentalElements() {
    // Add a few rocks scattered around
    const rockGeometry = new THREE.DodecahedronGeometry(0.5, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        roughness: 0.9,
        metalness: 0.2
    });
    
    // Add a few rocks around the scene
    for (let i = 0; i < 10; i++) {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        // Random position around the perimeter
        const angle = Math.random() * Math.PI * 2;
        const radius = 7 + Math.random() * 5; // Place rocks toward the edges
        rock.position.set(
            Math.cos(angle) * radius,
            -0.9 + Math.random() * 0.2, // Vary height slightly
            Math.sin(angle) * radius
        );
        
        // Random rotation and scale
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        const scale = 0.3 + Math.random() * 0.4;
        rock.scale.set(scale, scale * 0.7, scale);
        
        rock.castShadow = true;
        rock.receiveShadow = true;
        
        scene.add(rock);
    }
    
    console.log("Added environmental elements");
}

function createSimpleLightbulbs() {
    // Remove any existing lightbulbs first
    scene.children.forEach(child => {
      if (child.name === 'lightbulb') {
        scene.remove(child);
      }
    });
    
    // Create a lightbulb for each project
    projectPositions.forEach(position => {
      // Create lightbulb group
      const lightbulb = new THREE.Group();
      lightbulb.name = 'lightbulb';
      
      // Create bulb geometry (sphere)
      const bulbGeometry = new THREE.SphereGeometry(0.13, 16, 16);
      const bulbMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.9
      });
      
      const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
      
      // Create base (small cylinder)
      const baseGeometry = new THREE.CylinderGeometry(0.05, 0.11, 0.11, 20);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.8,
        roughness: 0.2
      });
      
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = -0.15;
      
      // Add light source
      const light = new THREE.PointLight(0xffffcc, 1, 4);
      light.position.y = 0;
      
      // Add all parts to the lightbulb group
      lightbulb.add(bulb, base, light);
      
      // Position directly above the project at a fixed height
      lightbulb.position.set(position.x, 2.5, position.z);
      lightbulb.userData = {
        active: false
      };
      
      // Add to scene (initially hidden)
      lightbulb.visible = false;
      scene.add(lightbulb);
    });
  }
  
  function showLightbulbs() {
    console.log("Showing lightbulbs");
    
    scene.children.forEach(child => {
      if (child.name === 'lightbulb') {
        // Make visible and set position
        child.visible = true;
        child.position.y = 1; // Fixed position above the cats
        child.userData.active = true;
        
        // Reset light intensity
        const light = child.children.find(obj => obj instanceof THREE.PointLight);
        if (light) {
          light.intensity = 1;
        }
        
        // Reset bulb material
        const bulb = child.children.find(obj => obj.isMesh && obj.geometry instanceof THREE.SphereGeometry);
        if (bulb && bulb.material) {
          bulb.material.emissiveIntensity = 0.8;
          bulb.material.opacity = 0.9;
        }
      }
    });
    
    
   // Set timer to fade out lightbulbs after 5 seconds
   setTimeout(() => {
    console.log("Timer triggered - starting lightbulb fadeout");
    scene.children.forEach(child => {
      if (child.name === 'lightbulb') {
        child.visible = false;
      }
    });
  }, 5000);
}

  

// STEP 4: CREATE COMPLETE ENVIRONMENT
function createEnvironment() {
    // Create sky with clouds
    const { sky, dirLight, hemiLight } = createSky();
    
    // Create grass ground
    const floor = createGrassGround();
    
    // Add environmental elements
    addEnvironmentalElements();
    
    
    console.log("Environment created successfully");
}

// Lighting - Add point light for models
const pointLight = new THREE.PointLight(0x8a9af8, 0.5, 15); // Reduced intensity and bluer color
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

// Create the environment after setting up basic scene components
createEnvironment();

// Array to store all model objects
const models = [];

// Define scale factors for each model type (adjust these as needed)
const modelScales = {
    'cat': 3.5,
    'cats': 0.1,
    'maxwell': 0.05,
    'oiia': 2.5,
    'gesturalmixer': 3.0  // Reduced scale factor for gesturalmixer model
};

// Load each model for its specific project
function loadProjectModels() {
    console.log("Loading individual project models");
    const loader = new GLTFLoader();
    // Add meshopt decoder support
    loader.setMeshoptDecoder(MeshoptDecoder);
    let loadedCount = 0;
    
    // Function to update the loading progress
    function updateProgress() {
        loadedCount++;
        const percent = (loadedCount / projectPositions.length) * 100;
        console.log(`Overall loading progress: ${percent.toFixed(2)}%`);
        
        const progressBar = document.getElementById('progress');
        if (progressBar) {
            progressBar.style.width = percent + '%';
        }
        
        // Hide loading screen when all models are loaded
        if (loadedCount >= projectPositions.length) {
            console.log("All models loaded successfully");
            const loadingScreen = document.querySelector('.loading');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }
    }
    
    // Load each model
    projectPositions.forEach((position) => {
        const modelPath = `models/${position.model}/scene.gltf`;
        console.log(`Loading model: ${modelPath} for project ${position.id}`);
        
        loader.load(
            modelPath,
            function(gltf) {
                console.log(`Model loaded successfully: ${modelPath}`);
                
                // Get the scale for this model type
                const scale = modelScales[position.model];
                gltf.scene.scale.set(scale, scale, scale);
                
                // Position and rotate the model
                gltf.scene.position.set(position.x, position.y, position.z);
                gltf.scene.rotation.y = position.rotation;
                
                // Store initial Y position for bobbing animation
                gltf.scene.userData = {
                    projectId: position.id,
                    isInteractive: true,
                    initialY: position.y
                };
                
                // Make all children interactive too and optimize meshes
                gltf.scene.traverse(function(object) {
                    object.userData = {
                        projectId: position.id,
                        isInteractive: true
                    };
                    
                    // Enable shadows for all objects
                    if (object.isMesh) {
                        object.castShadow = true;
                        object.receiveShadow = true;
                        
                        // Optimize geometry if it has a lot of vertices
                        if (object.geometry && object.geometry.attributes.position && 
                            object.geometry.attributes.position.count > 5000) {
                            object.geometry.attributes.position.usage = THREE.StaticDrawUsage;
                            object.geometry.attributes.normal.usage = THREE.StaticDrawUsage;
                            if (object.geometry.attributes.uv) {
                                object.geometry.attributes.uv.usage = THREE.StaticDrawUsage;
                            }
                        }
                        
                        // Optimize materials
                        if (object.material) {
                            // Use medium precision for shaders
                            object.material.precision = 'mediump';
                            
                            // Disable unnecessary features for better performance
                            if (!object.material.map) {
                                object.material.flatShading = true;
                            }
                        }
                    }
                });
                
                scene.add(gltf.scene);
                models.push(gltf.scene);
                console.log(`Added model for project ${position.id}`);
                
                updateProgress();
            },
            function(xhr) {
                // Progress for this specific model
                const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
                console.log(`${modelPath}: ${percent}% loaded`);
            },
            function(error) {
                console.error(`Error loading model ${modelPath}:`, error);
                console.log(`Creating fallback for project ${position.id}`);
                
                // Create a fallback for this specific project
                createFallbackModel(position);
                updateProgress();
            }
        );
    });
}

// Function to create a fallback model for a specific project
function createFallbackModel(position) {
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
    
    // Choose a color based on project ID
    const colors = [
        0xf7d6aa, // Light orange
        0x5b5b5b, // Gray
        0x000000, // Black
        0xffffff  // White
    ];
    const color = colors[position.id % colors.length];
    const material = new THREE.MeshStandardMaterial({ color: color });
    
    // Create model group
    const modelGroup = new THREE.Group();
    
    // Create body parts
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.set(0, 0.5, 0);
    body.castShadow = true;
    
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0.8, 0.5);
    head.castShadow = true;
    
    const earLeft = new THREE.Mesh(earGeometry, material);
    earLeft.position.set(-0.15, 1.05, 0.5);
    earLeft.rotation.x = -Math.PI / 4;
    earLeft.castShadow = true;
    
    const earRight = new THREE.Mesh(earGeometry, material);
    earRight.position.set(0.15, 1.05, 0.5);
    earRight.rotation.x = -Math.PI / 4;
    earRight.castShadow = true;
    
    // Add all parts to the group
    modelGroup.add(body, head, earLeft, earRight);
    
    // Position and rotate
    modelGroup.position.set(position.x, position.y, position.z);
    modelGroup.rotation.y = position.rotation;
    
    // Store initial Y position for bobbing animation
    modelGroup.userData = {
        projectId: position.id,
        isInteractive: true,
        initialY: position.y
    };
    
    scene.add(modelGroup);
    models.push(modelGroup);
    console.log(`Created fallback model for project ${position.id}`);
    
}

// Start loading models
loadProjectModels();

createSimpleLightbulbs();

// Setup raycaster for model interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Check if ANY section is currently active - if so, don't change cursor
    if (document.getElementById('project-info').classList.contains('active') || 
        document.getElementById('about-section').classList.contains('active') || 
        document.getElementById('contact-section').classList.contains('active')) {
        return; // Exit the function immediately, preventing cursor changes
    }
    
    // Highlight interactive objects on hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Reset cursor to default first
    document.body.style.cursor = 'default';
    
    // Only change to pointer if we actually intersect with an interactive object
    let foundInteractive = false;
    
    // Check for interactive objects
    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        let targetObj = object;
        
        // Find parent with userData if exists
        while (targetObj && !targetObj.userData?.isInteractive) {
            targetObj = targetObj.parent;
        }
        
        if (targetObj && targetObj.userData?.isInteractive) {
            document.body.style.cursor = 'pointer';
            foundInteractive = true;
            break;
        }
    }
    
    // If we didn't find any interactive objects, make sure cursor is default
    if (!foundInteractive) {
        document.body.style.cursor = 'default';
    }
}

function onClick(event) {
    // Check if we just closed a container
    if (window.justClosedContainer) {
        return; // Skip processing this click
    }
    
if (document.getElementById('project-info').classList.contains('active') || 
        document.getElementById('about-section').classList.contains('active') || 
        document.getElementById('contact-section').classList.contains('active')) {
        return; // Exit the function immediately, preventing any model interaction
    }
    
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Check for clicks on models
    for (let i = 0; i < intersects.length; i++) {
        const object = intersects[i].object;
        
        // Find the parent object with userData if available
        let targetObj = object;
        while (targetObj && !targetObj.userData?.isInteractive) {
            targetObj = targetObj.parent;
        }
        
        if (targetObj && targetObj.userData?.isInteractive) {
            console.log("Clicked on interactive object with project ID:", targetObj.userData.projectId);

            if (window.showProject) {
                window.showProject(targetObj.userData.projectId);
            } else {
                console.error("showProject function not found in window object");
            }
            
            // Animate camera to focus on this model with better angle
            const modelPosition = new THREE.Vector3().copy(targetObj.position);
            
            // Calculate a position that's at an angle from the model
            const angle = Math.random() * Math.PI; // Random angle around the model
            const radius = 2.5; // Distance from model
            const cameraX = modelPosition.x + Math.cos(angle) * radius;
            const cameraZ = modelPosition.z + Math.sin(angle) * radius;
            
            moveCamera(
                cameraX, 
                modelPosition.y + 1.5, 
                cameraZ,
                modelPosition.x, modelPosition.y, modelPosition.z
            );
            
            break;
        }
    }
}

// Enhanced camera animation
let targetCameraPosition = new THREE.Vector3(3, 2, 5);
let targetLookAt = new THREE.Vector3(0, 0, 0);
const cameraAnimationSpeed = 0.05;
let cameraAnimating = false;

function moveCamera(x, y, z, lookX, lookY, lookZ) {
    targetCameraPosition.set(x, y, z);
    targetLookAt.set(lookX, lookY, lookZ);
    cameraAnimating = true;
    
    // Update controls target to match new look target
    // This allows smooth transitions between orbit controls and programmatic camera movement
    controls.target.set(lookX, lookY, lookZ);
}

// Reset camera to default position
function resetCamera() {
    console.log("Resetting camera to default position");
    moveCamera(3, 2, 5, 0, 0, 0);

}

// Show all projects (top-down view)
// Modify your viewAllProjects function in main.js
function viewAllProjects() {
    // Move camera to home position instead
    moveCamera(3, 2, 5, 0, 0, 0);
    
    // Show lightbulbs
    showLightbulbs();
    
    console.log("Moved to home view with lightbulbs");
  }

// Expose functions to be called from HTML
window.resetCamera = resetCamera;
window.viewAllProjects = viewAllProjects;

// Initialize clock for animations
const clock = new THREE.Clock();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = clock.getDelta(); // Get time between frames for smoother rotation
    
    // Update orbit controls
    controls.update();
    
    // Use requestAnimationFrame's timing for smoother animations
    const now = performance.now() * 0.001; // Convert to seconds
    
    // Animate models (bobbing motion only)
    models.forEach((model, index) => {
        // Skip if model is not visible or not properly initialized
        if (!model || !model.visible) return;
        
        // Make models bob up and down slightly
        if (model.userData && model.userData.initialY !== undefined) {
            model.position.y = Math.sin(now + index) * 0.1 + model.userData.initialY;
        } else {
            model.position.y = Math.sin(now + index) * 0.1 - 0.9;
        }
        
        // No rotation - models will only bob up and down
    });
    
    // Animate the point light in a circular motion
    pointLight.position.x = Math.sin(now * 0.5) * 5;
    pointLight.position.z = Math.cos(now * 0.5) * 5;
    
    // Animate grass blades slightly - optimize by only processing visible blades
    scene.children.forEach(child => {
        // Find all grass blade meshes by their material color
        if (child.isMesh && 
            child.visible &&
            child.material && 
            child.material.color && 
            child.material.color.getHex() === 0x90c853) {
            // Apply subtle swaying motion
            child.rotation.x = Math.sin(now * 0.5 + child.position.x) * 0.05 + 0.1;
            child.rotation.z = Math.cos(now * 0.5 + child.position.z) * 0.05;
        }
    });
    
    // Animate clouds
    animateClouds(deltaTime);
    
    // Camera smooth transitions (only when animating)
    if (cameraAnimating) {
        // Lerp camera position
        camera.position.lerp(targetCameraPosition, cameraAnimationSpeed);
        
        // Calculate the direction to look at
        const currentDirection = new THREE.Vector3();
        camera.getWorldDirection(currentDirection);
        
        const targetDirection = new THREE.Vector3()
            .subVectors(targetLookAt, camera.position)
            .normalize();
        
        // Check if we're close enough to target to end animation
        const positionDistance = camera.position.distanceTo(targetCameraPosition);
        const lookDistance = currentDirection.angleTo(targetDirection);
        
        if (positionDistance < 0.1 && lookDistance < 0.05) {
            cameraAnimating = false;
        }
    }
    
    // Render
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

// Add event listeners
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);

// Resize handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Disable the original onMouseMove function
window.removeEventListener('mousemove', onMouseMove);

// Completely rewrite the cursor handling approach
function setupCursorHandling() {
    console.log("Setting up improved cursor handling");
    
    // Get the canvas element
    const canvas = renderer.domElement;
    
    // Force the default cursor on the canvas
    canvas.style.cursor = 'default';
    
    // Add our own mouse move handler directly to the canvas
    canvas.addEventListener('mousemove', (event) => {
      // Default to normal cursor
      canvas.style.cursor = 'default';
      
      // Skip if any panels are open
      if (document.getElementById('project-info').classList.contains('active') || 
          document.getElementById('about-section').classList.contains('active') || 
          document.getElementById('contact-section').classList.contains('active')) {
        return;
      }
      
      // Calculate normalized mouse coordinates for raycasting
      const rect = canvas.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / canvas.height) * 2 + 1;
      
      // Set up temporary vector for raycasting
      const tempMouse = new THREE.Vector2(mouseX, mouseY);
      
      // Use raycaster with our temporary mouse position
      raycaster.setFromCamera(tempMouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Check for intersections with interactive objects
      let hoveredInteractive = false;
      
      for (let i = 0; i < intersects.length; i++) {
        let obj = intersects[i].object;
        
        // Traverse up to find interactive parent
        while (obj && !obj.userData?.isInteractive) {
          obj = obj.parent;
        }
        
        // If found interactive object, change cursor and exit loop
        if (obj && obj.userData?.isInteractive) {
          canvas.style.cursor = 'pointer';
          hoveredInteractive = true;
          break;
        }
      }
      
      // If no interactive objects found, ensure cursor is default
      if (!hoveredInteractive) {
        canvas.style.cursor = 'default';
      }
    });
    
    // Also update the global mouse position for other functions
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / canvas.height) * 2 + 1;
    });
    
    console.log("Cursor handling setup complete");
}
  
// Call this function after the renderer is initialized
setupCursorHandling();
  
console.log("3D portfolio initialization complete, animation loop started");
