import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from "https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js";
import Stats from 'https://unpkg.com/three@0.169.0/examples/jsm/libs/stats.module.js';


let controls;
let upstate = false;
let downstate = false;
let leftstate = false;
let rightstate = false;
let changed = false;
let player, fallbackCube;

// Set positions for Score and Health in JavaScript
document.getElementById('scoreContainer').style.position = 'absolute';
document.getElementById('scoreContainer').style.top = '10px';
document.getElementById('scoreContainer').style.left = '10px';
document.getElementById('scoreContainer').style.fontSize = '20px';
document.getElementById('scoreContainer').style.color = 'white';

document.getElementById('healthContainer').style.position = 'absolute';
document.getElementById('healthContainer').style.top = '10px';
document.getElementById('healthContainer').style.right = '10px';
document.getElementById('healthContainer').style.fontSize = '20px';
document.getElementById('healthContainer').style.color = 'white';

// Position buttons at the bottom center
document.getElementById('moveUpBtn').style.position = 'absolute';
document.getElementById('moveUpBtn').style.bottom = '10px';
document.getElementById('moveUpBtn').style.left = '50%';
document.getElementById('moveUpBtn').style.transform = 'translateX(-60px)';

document.getElementById('moveDownBtn').style.position = 'absolute';
document.getElementById('moveDownBtn').style.bottom = '10px';
document.getElementById('moveDownBtn').style.left = '50%';
document.getElementById('moveDownBtn').style.transform = 'translateX(10px)';

document.getElementById('moveLeftBtn').style.position = 'absolute';
document.getElementById('moveLeftBtn').style.bottom = '60px'; 
document.getElementById('moveLeftBtn').style.left = '50%';
document.getElementById('moveLeftBtn').style.transform = 'translateX(-60px)';

document.getElementById('moveRightBtn').style.position = 'absolute';
document.getElementById('moveRightBtn').style.bottom = '60px';
document.getElementById('moveRightBtn').style.left = '50%';
document.getElementById('moveRightBtn').style.transform = 'translateX(10px)';


// GLTF Loader for 3D Model
const loader = new GLTFLoader();
loader.setPath("resources/3dmodel/");
let mesh;
let clock = new THREE.Clock(); 

// Animation mixer
let mixer;

// add stats
let stats;
stats = new Stats();
document.body.appendChild( stats.dom );



// Scene and Camera Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Window resize handler
const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', onWindowResize);

// Floor Plane
const addPlane = (x, y, w, h, materialAspect) => {
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial(materialAspect);
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(x, y, 0);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
};

const texture = new THREE.TextureLoader().load("resources/image/goldpattern.png");
const materialAspectFloor = { map: texture, side: THREE.DoubleSide, transparent: true };
addPlane(0, -3.6, 30, 30, materialAspectFloor);

// Skybox function
const createSkybox = () => {
    const loader = new THREE.TextureLoader();
    loader.load("resources/image/galaxy.jpg", (texture) => {
        const sphereGeometry = new THREE.SphereGeometry(100, 60, 40);
        const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const skybox = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(skybox);
    });
};
createSkybox();

// Orbit Controls
controls = new OrbitControls(camera, renderer.domElement);

// Load the 3D model
loader.load(
    "low_poly_helicopter.glb", // Replace with actual filename within set path
    (gltf) => {
        player = gltf.scene; // Assign the loaded model to player
        player.scale.set(0.3, 0.3, 0.3); // Scale the model
        player.position.y = 1; // Position the model
        scene.add(player); // Add the model to the scene

        mixer = new THREE.AnimationMixer(player);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });

        // Remove the fallback cube if it exists
        if (fallbackCube) {
            scene.remove(fallbackCube);
        }
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error("Error loading model:", error);
        // Fallback Player Box if GLTF not loaded
        const geometry1 = new THREE.BoxGeometry(1, 1, 1);
        const material1 = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        fallbackCube = new THREE.Mesh(geometry1, material1);
        fallbackCube.position.y = 1;
        player = fallbackCube; // Assign fallback cube to player
        scene.add(player); // Add fallback model to the scene
    }
);

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
scene.add(ambientLight);

// Button Control Logic
window.moveUp = function() {
    upstate = true;
    downstate = false;
    leftstate = false;
    rightstate = false;
};

window.moveDown = function() {
    upstate = false;
    downstate = true;
    leftstate = false;
    rightstate = false;
};

window.moveLeft = function() {
    upstate = false;
    downstate = false;
    leftstate = true;
    rightstate = false;
};

window.moveRight = function() {
    upstate = false;
    downstate = false;
    leftstate = false;
    rightstate = true;
};

window.stopMovement = function() {
    upstate = false;
    downstate = false;
    leftstate = false;
    rightstate = false;
};

// Keyboard Control Logic
document.addEventListener('keydown', (event) => {
    if (event.key === 'w' || event.key === 'W') {
        upstate = true;
    }
    if (event.key === 's' || event.key === 'S') {
        downstate = true;
    }
    if (event.key === 'a' || event.key === 'A') {
        leftstate = true;
    }
    if (event.key === 'd' || event.key === 'D') {
        rightstate = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'W') {
        upstate = false;
    }
    if (event.key === 's' || event.key === 'S') {
        downstate = false;
    }
    if (event.key === 'a' || event.key === 'A') {
        leftstate = false; // Stop moving left
    }
    if (event.key === 'd' || event.key === 'D') {
        rightstate = false; // Stop moving right
    }
});


// Animation Objects
const cub1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
scene.add(cub1);

const group2 = new THREE.Group();
const cube2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
group2.add(cube2);
scene.add(group2);

// Animation Loop
function animate() {

    requestAnimationFrame( animate);
    stats.update(); // update stats

    if (player) {
        // Player movement logic
        if (upstate) {
            player.position.y += 0.02;
        } else if (downstate) {
            player.position.y -= 0.02;
        }
        // Left and right movement logic
        if (leftstate) {
            player.position.x -= 0.02; 
        } else if (rightstate) {
            player.position.x += 0.02;
        }

        // Change color condition
        if (player.material && player.position.y > 1 && !changed) {
            player.material.color.setHex(0xFFA500);
            changed = true;
        }
    }

    // Rotate cubes
    cub1.rotation.y += 0.02;
    group2.rotation.y += 0.01;
    group2.rotation.x += 0.01;

    // Update the animation mixer
    let delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    controls.update();
    renderer.render(scene, camera);
}

// Start the animation loop
renderer.setAnimationLoop(animate);
