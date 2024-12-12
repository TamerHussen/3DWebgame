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
        const sphereGeometry = new THREE.SphereGeometry(500, 64, 64);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
        });
        const skybox = new THREE.Mesh(sphereGeometry, sphereMaterial);
        skybox.rotation.y = Math.PI;
        scene.add(skybox);
    });
};
createSkybox();

// Road and boundaries
const roadGeometry = new THREE.PlaneGeometry(20, 500);
const roadTexture = new THREE.TextureLoader().load('resources/image/road.jpg');
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 50);

const roadMaterial = new THREE.MeshBasicMaterial({ map: roadTexture });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

let roadOffset = 0; // Offset for texture movement

function animateRoad() {
    roadOffset += speed * 0.1;
    roadTexture.offset.y = roadOffset % 1; // Loop the texture
}

// Boundaries
const boundaryGeometry = new THREE.BoxGeometry(1, 1, 500);
const boundaryMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });

const leftBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
const rightBoundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);

leftBoundary.position.set(-10, 0.5, 0);
rightBoundary.position.set(10, 0.5, 0);
scene.add(leftBoundary, rightBoundary);

// Obstacles
const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
const obstacles = [];

// generate the obstacles on the road
function generateObstacles() {
    for (let i = 0; i < 10; i++) {
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            (Math.random() * 16) - 8,
            0.5, -Math.random() * 500
        );
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

generateObstacles();

function moveObstacles() {
    obstacles.forEach((obstacle) => {
        obstacle.position.z += speed;
        if (obstacle.position.z > 5) {
            obstacle.position.z = -500;
            obstacle.position.x = (Math.random() * 16) - 8;
        }
    });
}

// GLTF Loader for car model
const loader = new GLTFLoader();
let car, mixer;
loader.load(
    "resources/3dmodel/TestCar.glb",
    (gltf) => {
        car = gltf.scene;
        car.scale.set(0.2, 0.2, 0.2);
        car.position.y = 0.25;
        car.rotation.y = Math.PI;
        scene.add(car);

        mixer = new THREE.AnimationMixer(car);
        gltf.animations.forEach((clip) => {
            mixer.clipAction(clip).play();
        });
    },
    undefined,
    (error) => console.error("Error loading model:", error)
);

// Movement variables and logic
let speed = 0;
const maxSpeed = 10.2;
const acceleration = 0.01;
const friction = 0.005;
const keys = {};
let score = 0;
let startTime = Date.now();

window.addEventListener('keyup', (e) => (keys[e.key] = false));
window.addEventListener('keydown', (e) => (keys[e.key] = true));

// Scoreboard and Timer UI
const scoreElement = document.createElement('div');
scoreElement.style.cssText = "position: absolute; top: 10px; left: 10px; color: white; font-size: 24px; font-family: Arial; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;";
scoreElement.innerText = 'Score: 0';
document.body.appendChild(scoreElement);

const timerElement = document.createElement('div');
timerElement.style.cssText = "position: absolute; top: 10px; right: 10px; color: white; font-size: 24px; font-family: Arial; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;";
timerElement.innerText = 'Time: 0.00';
document.body.appendChild(timerElement);

function moveCar() {
    if (!car) return;

    // Adjust speed based on key presses
    if (keys['ArrowUp'] || keys['w']) speed = Math.min(speed + acceleration, maxSpeed);
    if (keys['ArrowDown'] || keys['s']) speed = Math.max(speed - acceleration, 0);

    speed *= 1 - friction; // Apply friction

    // Move car side to side
    if (keys['ArrowLeft'] || keys['a']) car.position.x = Math.max(car.position.x - 0.3, -8);
    if (keys['ArrowRight'] || keys['d']) car.position.x = Math.min(car.position.x + 0.3, 8);

    // Simulate forward motion by moving obstacles and road
    obstacles.forEach((obstacle) => {
        obstacle.position.z += speed;
        if (obstacle.position.z > 5) {
            obstacle.position.z = -500;
            obstacle.position.x = (Math.random() * 16) - 8;
        }
    });

    // Update camera position relative to the stationary car
    camera.position.set(car.position.x, car.position.y + 5, car.position.z + 10);
    camera.lookAt(car.position);

    // Check for collisions with obstacles
    obstacles.forEach((obstacle) => {
        if (car.position.distanceTo(obstacle.position) < 1.5) {
            speed = Math.max(speed - 0.05, 0); // Slow down on collision
        }
    });

    // Update score
    score += speed * 10;
    scoreElement.innerText = `Score: ${Math.floor(score)}`;
}


function updateTimer() {
    const elapsedTime = (Date.now() - startTime) / 1000;
    timerElement.innerText = `Time: ${elapsedTime.toFixed(2)}`;
}

// Animation loop
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    moveCar();
    moveObstacles();
    animateRoad();
    updateTimer();

    renderer.render(scene, camera);
}

animate();
