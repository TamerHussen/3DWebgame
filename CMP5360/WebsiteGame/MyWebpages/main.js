// Imports
import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';


let isAnimating = false; 

// HTML Elements
const loadingScreen = document.getElementById('loadingScreen');
const startMenu = document.getElementById('startMenu');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(light);

// Event Listeners
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Asset Loading Tracker
let assetsToLoad = 2;
let assetsLoaded = 0;
const checkLoadingComplete = () => {
    assetsLoaded++;
    if (assetsLoaded >= assetsToLoad) {
        loadingScreen.style.display = 'none';
    }
};

// Skybox
const createSkybox = () => {
    const loader = new THREE.TextureLoader();
    loader.load(
        'resources/image/Forest.jpg',
        (texture) => {
            const skyboxGeometry = new THREE.SphereGeometry(500, 64, 64);
            const skyboxMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
            });
            const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
            skybox.rotation.y = Math.PI;
            scene.add(skybox);
            checkLoadingComplete();
        },
        undefined,
        (error) => console.error('Error loading skybox texture:', error)
    );
};
createSkybox();

// Road
const roadTexture = new THREE.TextureLoader().load(
    'resources/image/road.jpg',
    checkLoadingComplete,
    undefined,
    (error) => console.error('Error loading road texture:', error)
);
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 50);

const roadGeometry = new THREE.PlaneGeometry(20, 500);
const roadMaterial = new THREE.MeshBasicMaterial({ map: roadTexture });
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.rotation.x = -Math.PI / 2;
scene.add(road);

let roadOffset = 0;
const animateRoad = () => {
    roadOffset += speed * 0.1;
    roadTexture.offset.y = roadOffset % 1;
};

// Boundaries
const boundaryMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, wireframe: true });
const createBoundary = (x) => {
    const boundary = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 500), boundaryMaterial);
    boundary.position.set(x, 0.5, 0);
    scene.add(boundary);
};
createBoundary(-10);
createBoundary(10);

// Obstacles
const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const orangeMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const orangeCubes = [];
const redCubes = [];
const blackCubes = [];

const generateObstacles = (cubes, material, count) => {
    for (let i = 0; i < count; i++) {
        // Ensure the material is correctly assigned
        if (!material) {
            console.error("Material is undefined. Skipping cube creation.");
            continue;
        }
        const cube = new THREE.Mesh(obstacleGeometry, material);
        cube.position.set((Math.random() * 16) - 8, 0.5, -Math.random() * 500);
        scene.add(cube);
        cubes.push(cube);
    }
};

// Generate initial obstacles
generateObstacles(orangeCubes, orangeMaterial, 4);
generateObstacles(redCubes, redMaterial, 4);
generateObstacles(blackCubes, blackMaterial, 3);

let elapsedTime = 0;
const spawnRate = 10000;
const initialSpawnTime = Date.now();

const moveCubes = (cubes, material) => {
    cubes.forEach((cube) => {
        cube.position.z += speed;
        if (cube.position.z > 5) {
            cube.position.z = -500;
            cube.position.x = (Math.random() * 16) - 8;
        }
    });

    const currentTime = Date.now();
    elapsedTime = currentTime - initialSpawnTime;

    const newCubesCount = Math.floor(elapsedTime / spawnRate) - cubes.length + 4;
    if (newCubesCount > 0 && material) {
        generateObstacles(cubes, material, newCubesCount);
    }
};



// Car Model
let car, mixer;
const loader = new GLTFLoader();
loader.load(
    'resources/3dmodel/TestCar.glb',
    (gltf) => {
        car = gltf.scene;
        car.scale.set(0.2, 0.2, 0.2);
        car.position.y = 0.25;
        car.rotation.y = Math.PI;
        scene.add(car);

        mixer = new THREE.AnimationMixer(car);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        checkLoadingComplete();
    },
    undefined,
    (error) => console.error('Error loading model:', error)
);

// Gameplay Variables
let speed = 0, score = 0, startTime = Date.now();
const maxSpeed = 10.2, acceleration = 0.01, friction = 0.005;
const keys = {};

// Input Handlers
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// UI Elements
const createUIElement = (style) => {
    const element = document.createElement('div');
    element.style.cssText = style;
    document.body.appendChild(element);
    return element;
};

const scoreElement = createUIElement("position: absolute; top: 10px; left: 10px; color: white; font-size: 24px; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;");
const timerElement = createUIElement("position: absolute; top: 10px; right: 10px; color: white; font-size: 24px; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;");

const updateUI = () => {
    scoreElement.innerText = `Score: ${Math.floor(score)}`;
    timerElement.innerText = `Time: ${((Date.now() - startTime) / 1000).toFixed(2)}`;
};

// Movement Logic
const moveCar = () => {
    if (!car) return;

    if (keys['ArrowUp'] || keys['w']) speed = Math.min(speed + acceleration, maxSpeed);
    if (keys['ArrowDown'] || keys['s']) speed = Math.max(speed - acceleration, 0);
    speed *= 1 - friction;

    if (keys['ArrowLeft'] || keys['a']) car.position.x = Math.max(car.position.x - 0.3, -8);
    if (keys['ArrowRight'] || keys['d']) car.position.x = Math.min(car.position.x + 0.3, 8);

    [orangeCubes, redCubes].forEach((cubes, idx) => {
        cubes.forEach((cube) => {
            if (car.position.distanceTo(cube.position) < 1.5) {
                speed = idx === 0 ? Math.max(speed - 0.5, 0) : 0;
                cube.position.z = -500;
            }
        });
    });

    score += speed * 10;

    camera.position.set(car.position.x, car.position.y + 5, car.position.z + 10);
    camera.lookAt(car.position);
};

const checkBlackCubeCollision = () => {
    blackCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 1.5) {
            cancelAnimationFrame(animate);
            isAnimating = false;
            document.getElementById('gameOverScreen').style.display = 'flex';
        }
    });
};

// Animation Loop
const clock = new THREE.Clock();
const animate = () => {
    if (!isAnimating) return;
    const delta = clock.getDelta();
    requestAnimationFrame(animate);

    if (mixer) mixer.update(delta);
    moveCar();
    moveCubes(orangeCubes);
    moveCubes(redCubes);
    moveCubes(blackCubes);
    animateRoad();
    updateUI();
    checkBlackCubeCollision();

    renderer.render(scene, camera);
};

// Start Button Handler
startButton.addEventListener('click', () => {
    startMenu.style.display = 'none';
    loadingScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    startTime = Date.now();
    speed = 0;
    score = 0;

    isAnimating = true;
    animate();
});


// Restart Button Handler
restartButton.addEventListener('click', () => {

    startMenu.style.display = 'none';
    loadingScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';

    startTime = Date.now();
    speed = 0;
    score = 0;

    if (car) {
        car.position.set(0, 0.25, 0);
        car.rotation.y = Math.PI;
    }

    [...orangeCubes, ...redCubes, ...blackCubes].forEach((cube) => {
        cube.position.set((Math.random() * 16) - 8, 0.5, -Math.random() * 500);
    });

    isAnimating = true;
    animate();
});

