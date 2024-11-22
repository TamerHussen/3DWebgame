import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);

// Load a skybox
const createSkybox = () => {
    const loader = new THREE.TextureLoader();
    loader.load("resources/image/Forest.jpg", (texture) => {
        const sphereGeometry = new THREE.SphereGeometry(500, 500, 500);
        const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
        const skybox = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(skybox);
    });
};
createSkybox();

// Road and boundaries
const roadGeometry = new THREE.PlaneGeometry(20, 200);
const roadMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

const boundaryGeometry = new THREE.BoxGeometry(1, 1, 200);
const boundaryMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });

const leftBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
const rightBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);

leftBoundary.position.set(-10, 0.5, 0);
rightBoundary.position.set(10, 0.5, 0);
scene.add(leftBoundary, rightBoundary);

// GLTF Loader for car model
const loader = new GLTFLoader();
let car, mixer;
loader.load(
    "resources/3dmodel/TestCar.glb", // Replace with the actual model path
    (gltf) => {
        car = gltf.scene;
        car.scale.set(0.2, 0.2, 0.2);
        car.position.y = 0.25;
        scene.add(car);

        mixer = new THREE.AnimationMixer(car);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });
    },
    (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    (error) => console.error("Error loading model:", error)
);

// Movement variables and logic
let speed = 0;
const maxSpeed = 0.2;
const acceleration = 0.01;
const friction = 0.005;
const keys = {};
let score = 0; // Initialize score
let previousZ = 0; // Track previous Z position of the car
let startTime = Date.now(); // Timer start time

window.addEventListener('keyup', (e) => (keys[e.key] = false));
window.addEventListener('keydown', (e) => (keys[e.key] = true));

// Scoreboard and Timer UI
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.style.fontFamily = 'Arial, sans-serif';
scoreElement.style.padding = '10px';
scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent background for scoreboard
scoreElement.style.borderRadius = '5px';
scoreElement.innerText = 'Score: 0';
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.position = 'absolute';
timerElement.style.top = '10px';
timerElement.style.right = '10px'; // Positioning timer on the top-right corner
timerElement.style.color = 'white';
timerElement.style.fontSize = '24px';
timerElement.style.fontFamily = 'Arial, sans-serif';
timerElement.style.padding = '10px';
timerElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent background for timer
timerElement.style.borderRadius = '5px';
timerElement.innerText = 'Time: 0.00';
document.body.appendChild(timerElement);

function moveCar() {
    if (!car) return;

    // Forward and backward movement
    if (keys['ArrowUp']) speed = Math.min(speed - acceleration, -maxSpeed);
    if (keys['ArrowDown']) speed = Math.max(speed + acceleration, maxSpeed);

    if (keys['w']) speed = Math.min(speed - acceleration, -maxSpeed);
    if (keys['s']) speed = Math.max(speed + acceleration, maxSpeed);

    // Apply friction
    speed *= 1 - friction;

    // Left and right rotation
    if (keys['ArrowLeft']) car.rotation.y += 0.05;
    if (keys['ArrowRight']) car.rotation.y -= 0.05;

    if (keys['a']) car.rotation.y += 0.05;
    if (keys['d']) car.rotation.y -= 0.05;

    // Move the car
    car.position.z -= speed * Math.cos(car.rotation.y);
    car.position.x -= speed * Math.sin(car.rotation.y);

    // Boundary checks
    if (car.position.x < -9 || car.position.x > 9) {
        speed = 0; // Stop car if it hits the boundary
    }

    // Update camera to follow the car
    camera.position.x = car.position.x - 10 * Math.sin(car.rotation.y);
    camera.position.z = car.position.z - 10 * Math.cos(car.rotation.y);
    camera.lookAt(car.position);

    // Check if the car is moving forward or backward and update score accordingly
    if (car.position.z < previousZ) {
        // Car is moving backward, lose points
        score -= Math.abs(speed) * 0.1; // Deduct points when moving backward
    } else {
        // Car is moving forward, gain points
        score += Math.abs(speed) * 0.1; // Increment points when moving forward
    }

    // Store the current Z position as previous for the next frame
    previousZ = car.position.z;

    // Update score UI
    scoreElement.innerText = `Score: ${Math.floor(score)}`;
}

// Timer update
function updateTimer() {
    const elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds
    timerElement.innerText = `Time: ${elapsedTime.toFixed(2)}`;
}

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);

    // Update mixer for car animations
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    moveCar();
    updateTimer(); // Update timer every frame

    renderer.render(scene, camera);
}

animate();

