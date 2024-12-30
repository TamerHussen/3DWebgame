// Imports
import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.169.0/examples/jsm/loaders/GLTFLoader.js';


let isAnimating = false; 

let enemyModel1;

let obstacle1, obstacle2;

let healModel;

// HTML Elements
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

// Resize screen
const resizeRendererToDisplaySize = (renderer, camera) => {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    return needResize;
};

const render = () => {
    if (resizeRendererToDisplaySize(renderer, camera)) {
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
};
render();

const adjustGraphicsForDevice = () => {
    if (window.innerWidth < 768) {
        renderer.setPixelRatio(1);
    } else {
        renderer.setPixelRatio(window.devicePixelRatio);
    }
};

window.addEventListener('resize', adjustGraphicsForDevice);
adjustGraphicsForDevice();


// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Audio files
const listener = new THREE.AudioListener();
camera.add(listener);

const drivingSound = new THREE.Audio(listener);
const crashSound = new THREE.Audio(listener);
const pickupSound = new THREE.Audio(listener);
const backgroundMusic = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('resources/audio/driving.wav', (buffer) => {
    drivingSound.setBuffer(buffer);
    drivingSound.setLoop(true);
    drivingSound.setVolume(0.15);
});
audioLoader.load('resources/audio/crash.mp4', (buffer) => {
    crashSound.setBuffer(buffer);
    crashSound.setLoop(false);
    crashSound.setVolume(0.7);
});
audioLoader.load('resources/audio/pickup.mp4', (buffer) => {
    pickupSound.setBuffer(buffer);
    pickupSound.setLoop(false);
    pickupSound.setVolume(0.7);
});
audioLoader.load('resources/audio/background.mp3', (buffer) => {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.3);
});


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
const obstacleGeometry = new THREE.BoxGeometry(3, 1, 3);
const EnemyGeometry = new THREE.BoxGeometry(3, 1, 3);
const orangeMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

const orangeCubes = [];
const redCubes = [];
const blackCubes = [];

const makeMaterialTransparent = (material) => {
    material.transparent = true;
    material.opacity = 0;
};

makeMaterialTransparent(orangeMaterial);
makeMaterialTransparent(redMaterial);
makeMaterialTransparent(blackMaterial);


const generateObstacles = (cubes, material, count) => {
    for (let i = 0; i < count; i++) {
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

const generateBlackObstacles = (cubes, material, count) => {
    for (let i = 0; i < count; i++) {
        const cube = new THREE.Mesh(EnemyGeometry, material);
        cube.position.set((Math.random() * 16) - 8, 0.5, -Math.random() * 500);
        scene.add(cube);
        cubes.push(cube);

        if (enemyModel1) {
            const enemyClone = enemyModel1.clone();
            enemyClone.position.set(0, 1, 0);
            cube.add(enemyClone);
        }
    }
};

// Generate obstacles
generateObstacles(orangeCubes, orangeMaterial, 1.5);
generateObstacles(redCubes, redMaterial, 1.5);
generateBlackObstacles(blackCubes, blackMaterial, 1.5);

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

// Cube Effects
const handleCollision = (cube, type) => {
    if (type === 'red') {
        crashSound.play();

        const originalSpeed = speed;
        speed = 0;
        setTimeout(() => {
            speed = originalSpeed;
        }, 1500);

        health -= 1;
        if (health <= 0) {
            triggerGameOver();
        } else {
            cube.position.z = -500;
        }
    } else if (type === 'orange') {
        pickupSound.play();
        if (health < maxHealth) {
            health += 1;
            updateHealthBar();
        }
        cube.position.z = -500;
    } else if (type === 'black') {
        crashSound.play();
        triggerGameOver();
    }
    updateHealthBar();
};

// Car Model
let car, mixer;
const loader = new GLTFLoader();
loader.load(
    'resources/3dmodel/Car.glb',
    (gltf) => {
        car = gltf.scene;
        car.scale.set(3, 3, 3);
        car.position.y = 0.25;
        car.rotation.y = 0;
        scene.add(car);

        mixer = new THREE.AnimationMixer(car);
        gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        checkLoadingComplete();
    },
    undefined,
    (error) => console.error('Error loading model:', error)
);

// Black Cube Enemy Model
loader.load(
    'resources/3dmodel/Enemy1.glb',
    (gltf) => {
        enemyModel1 = gltf.scene;
        enemyModel1.scale.set(4, 4, 4); 
        enemyModel1.rotation.y = Math.PI;
        console.log("Enemy model loaded");
    },
    undefined,
    (error) => console.error('Error loading enemy model:', error)
);

// Orange Cube Model
loader.load(
    'resources/3dmodel/Heal.glb',
    (gltf) => {
        healModel = gltf.scene;
        healModel.scale.set(3, 3, 3);
        console.log("heal model loaded");
    },
    undefined,
    (error) => console.error('Error loading heal model:', error)
);

// Red Cube Obstacle Model 1
loader.load(
    'resources/3dmodel/Cone.glb',
    (gltf) => {
        obstacle1 = gltf.scene;
        obstacle1.scale.set(4, 4, 4);
        console.log("Obstacle Model 1 loaded");
        updateRedCubes();
    },
    undefined,
    (error) => console.error('Error loading Obstacle model 1:', error)
);

// Red Cube Obstacle Model 2
loader.load(
    'resources/3dmodel/Bar.glb',
    (gltf) => {
        obstacle2 = gltf.scene;
        obstacle2.scale.set(5, 5, 5);
        obstacle2.rotation.y = Math.PI / 2;
        console.log("Obstacle Model 2 loaded");
        updateRedCubes();
    },
    undefined,
    (error) => console.error('Error loading Obstacle model 2:', error)
);

const updateRedCubes = () => {
    redCubes.forEach((cube) => {
        if (cube.children.length === 0) {
            const selectedModel = getRandomModel();
            if (selectedModel) {
                const modelClone = selectedModel.clone();
                modelClone.position.set(0, 0, 0);
                cube.add(modelClone);
            }
        }
    });
};

// Choose Random Model for Red Cube
const getRandomModel = () => {
    const models = [obstacle1, obstacle2];
    return models[Math.floor(Math.random() * models.length)];
};


// Gameplay Variables
let speed = 0, startTime = Date.now();
let score = 0;
const maxSpeed = 10.2, acceleration = 0.01, friction = 0.005;

let speedScale = 1;
const keys = {};

let health = 3;
const maxHealth = 3;

let touchStartX = 0;

// Input Handlers
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Touch screen
window.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
});

window.addEventListener('touchmove', (event) => {
    const touchX = event.touches[0].clientX;
    const deltaX = touchX - touchStartX;
    if (Math.abs(deltaX) > 10) {
        if (deltaX > 0) {
            keys['right'] = true;
            keys['left'] = false;
        } else {
            keys['left'] = true;
            keys['right'] = false;
        }
    }
});

window.addEventListener('touchend', () => {
    keys['left'] = false;
    keys['right'] = false;
});

//Scale UI
const scaleUIForDevice = () => {
    const baseWidth = 1920;
    const baseFontSize = 24;
    const scale = window.innerWidth / baseWidth;

    document.documentElement.style.fontSize = `${baseFontSize * scale}px`;
};

window.addEventListener('resize', scaleUIForDevice);
scaleUIForDevice();


// UI Elements
const createUIElement = (style) => {
    const element = document.createElement('div');
    element.style.cssText = `${style}; font-size: 2vw;`;
    document.body.appendChild(element);
    return element;
};


const scoreElement = createUIElement("position: absolute; top: 10px; left: 10px; color: white; font-size: 24px; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;");
const timerElement = createUIElement("position: absolute; top: 10px; right: 10px; color: white; font-size: 24px; background: rgba(0, 0, 0, 0.7); padding: 10px; border-radius: 5px;");
const countdownElement = createUIElement("position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 48px; background: rgba(0, 0, 0, 0.7); padding: 20px; border-radius: 10px; display: none;");
const healthBarContainer = createUIElement("position: absolute; top: 20px; left: 50%; width: 100px; max-width: 150px; height: 10px; background: rgba(255, 0, 0, 0.3); border-radius: 5px; transform: translateX(-50%); box-sizing: border-box;");
const healthBar = createUIElement("position: absolute; top: 20px; left: 50%; width: 20px; height: 10px; background: rgba(0, 255, 0, 0.8); border-radius: 5px; transform: translateX(-50%); box-sizing: border-box;");

// Function for health bar
const updateHealthBar = () => {
    const healthPercentage = (health / maxHealth) * 50;
    healthBar.style.width = `${healthPercentage}%`;
};
updateHealthBar();

// Countdown timer
const startCountdown = (callback) => {
    let countdown = 3;
    countdownElement.style.display = 'block';
    countdownElement.innerText = countdown;

    const countdownRender = () => {
        if (!isAnimating) {
            renderer.render(scene, camera);
            requestAnimationFrame(countdownRender);
        }
    };
    countdownRender();

    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            countdownElement.innerText = countdown;
        } else {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            isAnimating = true;
            callback();
        }
    }, 1000);
};

// UI score and timer
const updateUI = () => {
    scoreElement.innerText = `Score: ${Math.floor((score) / 5)}`;
    timerElement.innerText = `Time: ${((Date.now() - startTime) / 1000).toFixed(2)}`;
};

// Movement Logic
const moveCar = () => {
    if (!car) return;

    if (!drivingSound.isPlaying && speed > 0.1) {
        drivingSound.play();
    }

    const elapsedTimeInSeconds = (Date.now() - startTime) / 1000;
    speedScale = 1 + elapsedTimeInSeconds * 0.05;
    const adjustedMaxSpeed = maxSpeed * speedScale;
    speed = Math.min(speed + acceleration * speedScale, adjustedMaxSpeed);
    speed *= 1 - friction;

    if (keys['ArrowLeft'] || keys['a'] || keys['left']) {
        car.position.x = Math.max(car.position.x - 0.3, -8);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['right']) {
        car.position.x = Math.min(car.position.x + 0.3, 8);
    }

    // Collision detection
    redCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 3) {
            handleCollision(cube, 'red');
        }
    });
    orangeCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 3) {
            handleCollision(cube, 'orange');
        }
    });
    blackCubes.forEach((cube) => {
        if (car.position.distanceTo(cube.position) < 3) {
            handleCollision(cube, 'black');
        }
    });

    score += speed * 10;

    camera.position.set(car.position.x, car.position.y + 5, car.position.z + 10);
    camera.lookAt(car.position);
};

// Save Score
const saveScore = () => {
    fetch('/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: Math.floor(score / 5) }),
    }).then(response => {
        if (!response.ok) {
            console.error('Failed to save score');
        }
    }).catch(err => console.error('Error:', err));
};


// Gameover trigger
const triggerGameOver = () => {
    cancelAnimationFrame(animate);
    isAnimating = false;
    
    drivingSound.stop();
    backgroundMusic.stop();

    gameOverScreen.style.display = 'flex';

    const finalScoreElement = document.getElementById('finalScore');
    finalScoreElement.innerText = `${Math.floor(score / 5)}`;

    saveScore();
};

// Animation Loop
const clock = new THREE.Clock();
const animate = () => {
    if (!isAnimating) return;
    const delta = clock.getDelta();
    requestAnimationFrame(animate);

    if (mixer) mixer.update(delta);

    blackCubes.forEach((cube) => {
        cube.position.z += speed;
        if (cube.position.z > 5) {
            cube.position.z = -500;
            cube.position.x = (Math.random() * 16) - 8;
        }
    });

    blackCubes.forEach((cube) => {
        if (cube.children.length === 0 && enemyModel1) {
            const enemyClone = enemyModel1.clone();
            enemyClone.position.set(0, 0, 0);
            cube.add(enemyClone);
        }
    });

    redCubes.forEach((cube) => {
        cube.position.z += speed;
        if (cube.position.z > 5) {
            cube.position.z = -500;
            cube.position.x = (Math.random() * 16) - 8;
    
            cube.children.forEach((child) => cube.remove(child));
 
            const selectedModel = getRandomModel();
            if (selectedModel) {
                const modelClone = selectedModel.clone();
                modelClone.position.set(0, 0, 0);
                cube.add(modelClone);
            }
        }
    });
    
    orangeCubes.forEach((cube) => {
        cube.position.z += speed;
        if (cube.position.z > 5) {
            cube.position.z = -500;
            cube.position.x = (Math.random() * 16) - 8;
        }
    });
    
    orangeCubes.forEach((cube) => {
        if (cube.children.length === 0 && healModel) {
            const healingClone = healModel.clone();
            healingClone.position.set(0, 1, 0); 
            cube.add(healingClone);
        }
        cube.children.forEach((child) => {
            child.rotation.y += 0.05;
        });
    });
    
    moveCar();
    animateRoad();
    updateUI();

    renderer.render(scene, camera);
};

// Load Score
const loadScore = () => {
    fetch('/get-score')
        .then(response => response.json())
        .then(data => {
            score = data.score || 0;
            console.log('Loaded score:', score);
        })
        .catch(err => console.error('Error loading score:', err));
};


// Start Button Handler
startButton.addEventListener('click', () => {
    startMenu.style.display = 'none';
    gameOverScreen.style.display = 'none';

    backgroundMusic.play();

    loadScore();

    startCountdown(() => {
        startTime = Date.now();
        speed = 0;
        score = 0;

        isAnimating = true;
        animate();
    });
});

// Restart Button Handler
restartButton.addEventListener('click', () => {
    startMenu.style.display = 'none';
    gameOverScreen.style.display = 'none';

    backgroundMusic.play();

    startCountdown(() => {
        startTime = Date.now();
        speed = 0;
        score = 0;

        health = maxHealth;
        updateHealthBar();

        if (car) {
            car.position.set(0, 0.25, 0);
        }

        [...orangeCubes, ...redCubes, ...blackCubes].forEach((cube) => {
            cube.position.set((Math.random() * 16) - 8, 0.5, -Math.random() * 500);
        });

        isAnimating = true;
        animate();
    });
});



