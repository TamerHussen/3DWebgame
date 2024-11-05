import * as THREE from 'three';

import { OrbitControls } from 'https://unpkg.com/three@0.169.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );


// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
scene.add( directionalLight );






const geometry = new THREE.CapsuleGeometry( 2, 2, 8, 16 )  // make capsule geometry
const geometry1 = new THREE.ConeGeometry( 10, 30, 64 );  // make Cone geometry
const geometry2 = new THREE.ConeGeometry( 20, 1, 50 );  // make Cone geometry
const geometry3 = new THREE.ConeGeometry( 40, 1, 50 );  // make Cone geometry
const geometry4 = new THREE.CapsuleGeometry( 20, 0, 8, 16 )  // make capsule geometry
const geometry5 = new THREE.CapsuleGeometry( 10, 1, 8, 16 )  // make capsule geometry
const geometry6 = new THREE.CapsuleGeometry( 10, 1, 9, 16 )  // make capsule geometry

const geometry7 = new THREE.CapsuleGeometry( 30, 1, 8, 16 )  // make capsule geometry
const geometry8 = new THREE.CapsuleGeometry( 30, 1, 9, 16 )  // make capsule geometry

const material = new THREE.MeshBasicMaterial( { color: 0xE62A3D } ); // make basic material
const material1 = new THREE.MeshBasicMaterial( { color: 0x0000ff } ); // make basic material
const material2= new THREE.MeshBasicMaterial( { color: 0x964b00 } ); // make basic material
const material3= new THREE.MeshBasicMaterial( { color: 0xffa500 } ); // make basic material
const material4= new THREE.MeshBasicMaterial( { color: 0x0000FF } ); // make basic material
const material5= new THREE.MeshBasicMaterial( { color: 0x00FF00 } ); // make basic material

const material6= new THREE.MeshBasicMaterial( { color: 0xFFFF00 } ); // make basic material
const material7= new THREE.MeshBasicMaterial( { color: 0xFFA500 } ); // make basic material

const capsule = new THREE.Mesh( geometry, material ); // makes mesh
const capsule1 = new THREE.Mesh( geometry, material );
const capsule2 = new THREE.Mesh( geometry, material );
const capsule3 = new THREE.Mesh( geometry, material );
const capsule4 = new THREE.Mesh( geometry4, material3 );
const capsule5 = new THREE.Mesh( geometry5, material4 );
const capsule6 = new THREE.Mesh( geometry6, material5 );

const capsule7 = new THREE.Mesh( geometry7, material6 );
const capsule8 = new THREE.Mesh( geometry8, material7 );

const Cone = new THREE.Mesh( geometry1, material1 );
const Cone1 = new THREE.Mesh( geometry2, material1 );
const Cone2 = new THREE.Mesh( geometry3, material2 );

//scene.add( capsule ); // add mesh to scene
//scene.add( capsule1 );
//scene.add( capsule2 );
//scene.add( capsule3 );
//scene.add( Cone );


capsule.position.x= 4;
capsule1.position.x= 6;
capsule2.position.x= 8;
capsule3.position.x= 10;
capsule4.position.x= 0;
capsule5.position.x= 0;
capsule6.position.x= -10;
Cone.position.x= 0;
Cone1.position.x= 0;
Cone2.position.x= 0;


capsule.position.y= 14;
capsule1.position.y= 7;
capsule2.position.y= 0;
capsule3.position.y= -7;
capsule4.position.y= 0;
capsule5.position.x= 0;
capsule6.position.x= 0;
Cone.position.y= 5;
Cone1.position.y= -8;
Cone2.position.y= 0;

capsule.rotation.z=Math.PI/8;
capsule1.rotation.z=Math.PI/6;
capsule2.rotation.z=Math.PI/4;
capsule3.rotation.z=Math.PI/2;
capsule4.position.z= 0;
capsule5.position.x= 0;
capsule6.position.x= 0;
Cone.rotation.z=0;
Cone1.position.z= 0;
Cone2.position.z= 0;

let group = new THREE.Group() // groups up mesh
group.add(capsule);
group.add(capsule1);
group.add(capsule2);
group.add(capsule3);
group.add(Cone);
group.add(Cone1)
scene.add(group);

let sun = new THREE.Group()
sun.add(capsule7);
sun.add(capsule8);
scene.add(sun)


let saturn = new THREE.Group()
saturn.add(Cone2);
saturn.add(capsule4);
scene.add(saturn)

let earth = new THREE.Group()
earth.add(capsule5);
earth.add(capsule6);
scene.add(earth)

earth.position.y = 0;
earth.position.x = 50;

saturn.position.y = 0;
saturn.position.x = 200;

// a function that will be called every time the window gets resized.
// It can get called a lot, so don't put any heavy computation in here!
const onWindowResize = () => {
 
    // set the aspect ratio to match the new browser window aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
 
    // update the camera's frustum
    camera.updateProjectionMatrix();
 
    // update the size of the renderer AND the canvas
    renderer.setSize(window.innerWidth, window.innerHeight);
 
}
 
window.addEventListener('resize', onWindowResize);

const addPlane =(x,y, w, h, materialaspect) => {
    //initialte the plan
    const geometry3 = new THREE.PlaneGeometry( w, h, 2 );
    const material3 = new THREE.MeshBasicMaterial( materialaspect );
   
    const plane = new THREE.Mesh( geometry3, material3 );
 
    plane.position.x  =x;
    plane.position.y = y;
    plane.rotation.x  = -Math.PI/2;
    scene.add( plane );
 
}
 
 
const texture  = new THREE.TextureLoader().load("resources\image\goldpattern.png");
const materialAspectFloor = {
    map:texture,
    side: THREE.DoubleSide,
    transparent:true
}

addPlane(0, -3.6, 30, 30, materialAspectFloor);


const createskybox = ()=>{
    let bgMesh;
   
    const loader = new THREE.TextureLoader();
    loader.load("resources/image/galaxy.jpg", function(texture){
        const sphereGeometry = new THREE.SphereGeometry( 500, 600, 400 );
        const sphereMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        })
 
        bgMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(bgMesh);
 
    })
   
}
 
createskybox();




let system = new THREE.Group()

system.add(saturn);
system.add(earth);
scene.add(system)


camera.position.z = 400; // change camera position



function animate() {

    

	//capsule.rotation.x += 0.15;
	//capsule.rotation.y += 0.15;
    //capsule.position.y += 0.05;

    //capsule1.rotation.x += 0.15;
	//capsule1.rotation.y -= 0.15;
    //capsule1.position.x += 0.05;

    //capsule2.rotation.x += 0.15;
	//capsule2.rotation.y += 0.15;
    //capsule2.position.y -= 0.05;

    //capsule3.rotation.x += 0.15;
	//capsule3.rotation.y += 0.15;
    //capsule3.position.x -= 0.05;  


	//Cone.rotation.y -= 0.15;

    group.rotation.y += 0.5;


    saturn.rotation.y += 1.05;

    earth.rotation.x += 0.01;

    system.rotation.y += 0.1;
    
    



	renderer.render( scene, camera );

}