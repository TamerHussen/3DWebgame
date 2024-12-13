import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';

// Create a loading screen
const loadingScreen = document.createElement('div');
loadingScreen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #171133;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 48px;
    font-family: Arial;
    z-index: 1000;
`;
loadingScreen.innerText = "Starting game...";
document.body.appendChild(loadingScreen);

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);

// Asset loading tracker
let assetsToLoad = 2; // Number of assets to track
let assetsLoaded = 0;

function checkLoadingComplete() {
    assetsLoaded++;
    if (assetsLoaded >= assetsToLoad) {
        loadingScreen.style.display = 'none'; // Hide the loading screen
    }
}

// Load a skybox
const createSkybox = () => {
    const loader = new THREE.TextureLoader();
    loader.load(
        "resources/image/Forest.jpg",
        (texture) => {
            const sphereGeometry = new THREE.SphereGeometry(500, 64, 64);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
            });
            const skybox = new THREE.Mesh(sphereGeometry, sphereMaterial);
            skybox.rotation.y = Math.PI;
            scene.add(skybox);
            checkLoadingComplete(); // Mark as loaded
        },
        undefined,
        (error) => console.error("Error loading skybox texture:", error)
    );
};
createSkybox();

// Road and boundaries
const roadGeometry = new THREE.PlaneGeometry(20, 500);
const roadTexture = new THREE.TextureLoader().load(
    'resources/image/road.jpg',
    () => checkLoadingComplete(), // Mark road texture as loaded
    undefined,
    (error) => console.error("Error loading road texture:", error)
);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 50);

const roadMaterial = new THREE.MeshBasicMaterial({ map: roadTexture });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

let roadOffset = 0;

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
const orangeMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

const orangeCubes = [];
const redCubes = [];

function generateObstacles() {
    for (let i = 0; i < 5; i++) {
        const orangeCube = new THREE.Mesh(obstacleGeometry, orangeMaterial);
        orangeCube.position.set(
            (Math.random() * 16) - 8,
            0.5, -Math.random() * 500
        );
        scene.add(orangeCube);
        orangeCubes.push(orangeCube);

        const redCube = new THREE.Mesh(obstacleGeometry, redMaterial);
        redCube.position.set(
            (Math.random() * 16) - 8,
            0.5, -Math.random() * 500
        );
        scene.add(redCube);
        redCubes.push(redCube);
    }
}

generateObstacles();

function moveCubes(cubes) {
    cubes.forEach((cube) => {
        cube.position.z += speed;
        if (cube.position.z > 5) {
            cube.position.z = -500;
            cube.position.x = (Math.random() * 16) - 8;
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

        checkLoadingComplete(); // Mark car model as loaded
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

let lastCarPosition = { x: 0, z: 0 };
let stationaryStartTime = null;

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

    // Check for collisions with orange and red cubes
    orangeCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 1.5) {
            speed = Math.max(speed - 0.5, 0);
            cube.position.z = -500;
        }
    });

    redCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 1.5) {
            speed = 0;
            cube.position.z = -500;
        }
    });

    // Handle stationary state for score deduction
    if (car.position.x === lastCarPosition.x && car.position.z === lastCarPosition.z) {
        if (stationaryStartTime === null) {
            stationaryStartTime = Date.now();
        } else if (Date.now() - stationaryStartTime > 2000) {
            score -= 1;
        }
    } else {
        stationaryStartTime = null;
    }

    lastCarPosition = { x: car.position.x, z: car.position.z };

    // Update camera position relative to the stationary car
    camera.position.set(car.position.x, car.position.y + 5, car.position.z + 10);
    camera.lookAt(car.position);

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
    moveCubes(orangeCubes);
    moveCubes(redCubes);
    animateRoad();
    updateTimer();

    renderer.render(scene, camera);
}

animate();
