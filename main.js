import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Debug logging
console.log("Starting 3D portfolio initialization");

// Setup scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x111111);
document.body.appendChild(renderer.domElement);

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

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Add a point light that moves
const pointLight = new THREE.PointLight(0x4a5af8, 1, 15);
pointLight.position.set(0, 2, 0);
scene.add(pointLight);

const ambientLight = scene.children.find(child => child instanceof THREE.AmbientLight);
if (ambientLight) {
    ambientLight.intensity = 0.6; // Reduce ambient light slightly
}

const floorGeometry = new THREE.PlaneGeometry(20, 20, 1, 1);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x303030,
    roughness: 0.75,  
    metalness: 0.2,  
    envMapIntensity: 1.5, 
});


const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);


// Update project positions and reduce to 4 projects
const projectPositions = [
    { x: -2, y: -1, z: -2, rotation: Math.PI * 0.25, id: 0, model: 'cat' },
    { x: 2, y: -1, z: -2, rotation: Math.PI * 0.75, id: 1, model: 'cats' },
    { x: -2, y: -1, z: 2, rotation: Math.PI * 1.25, id: 2, model: 'maxwell' },
    { x: 2, y: -1, z: 2, rotation: Math.PI * 1.75, id: 3, model: 'oiia' }
];

// Array to store all model objects
const models = [];

// Define scale factors for each model type (adjust these as needed)
const modelScales = {
    'cat': 3.5,
    'cats': 0.1,
    'maxwell': 0.05,
    'oiia': 2.5
};

// Load each model for its specific project
function loadProjectModels() {
    console.log("Loading individual project models");
    const loader = new GLTFLoader();
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
                
                // Make all children interactive too
                gltf.scene.traverse(function(object) {
                    object.userData = {
                        projectId: position.id,
                        isInteractive: true
                    };
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
    // Create a simple stand-in with basic geometry
    const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
    
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
    
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0.8, 0.5);
    
    const earLeft = new THREE.Mesh(earGeometry, material);
    earLeft.position.set(-0.15, 1.05, 0.5);
    earLeft.rotation.x = -Math.PI / 4;
    
    const earRight = new THREE.Mesh(earGeometry, material);
    earRight.position.set(0.15, 1.05, 0.5);
    earRight.rotation.x = -Math.PI / 4;
    
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

// Setup raycaster for model interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Highlight interactive objects on hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    // Reset all objects
    document.body.style.cursor = 'default';
    
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
            break;
        }
    }
}


function onClick(event) {
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
            
            // Show the project info using the function from index.html
            if (window.showProject) {
                window.showProject(targetObj.userData.projectId);
            } else {
                console.error("showProject function not found in window object");
            }
            
            // Animate camera to focus on this model with better angle
            const modelPosition = new THREE.Vector3().copy(targetObj.position);
            
            // Calculate a position that's at an angle from the model
            // This avoids looking directly at the center
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
    moveCamera(3, 2, 5, 0, 0, 0);
    console.log("Camera reset to default position");
}

// Show all projects (top-down view)
function viewAllProjects() {
    moveCamera(0, 6, 0, 0, 0, 0);
    console.log("Camera moved to show all projects view");
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
    
    // Animate models (bobbing motion and continuous rotation)
    models.forEach((model, index) => {
        // Make models bob up and down slightly
        if (model.userData && model.userData.initialY !== undefined) {
            model.position.y = Math.sin(elapsedTime + index) * 0.1 + model.userData.initialY;
        } else {
            model.position.y = Math.sin(elapsedTime + index) * 0.1 - 0.9;
        }
        
        // Apply continuous rotation - use a fixed value for reliable rotation
        model.rotation.y += 0.005; // Small constant value for smooth rotation
    });
    
    // Animate the point light in a circular motion
    pointLight.position.x = Math.sin(elapsedTime * 0.5) * 5;
    pointLight.position.z = Math.cos(elapsedTime * 0.5) * 5;
    
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

console.log("3D portfolio initialization complete, animation loop started");
