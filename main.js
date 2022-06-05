import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import { Raycaster } from 'three';

// GUI
const gui = new dat.GUI();

const world = {
  plane: {
    width: 140,
    height: 40,
    widthSegments: 80,
    heightSegments: 40,
  },
};

// scene
const scene = new THREE.Scene();

// camera
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

// renderer
// this creates a canvas element where the scene will be rendered (inserted into DOM)
const renderer = new THREE.WebGLRenderer();
// console.log(scene, camera, renderer);

// OrbitControls must be imported seperately import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const controls = new OrbitControls(camera, renderer.domElement);
// by default the camera (and objects) are generated in the center of the scene
camera.position.z = 20;

// dom insertion
// innerWidth automatically references window.innerWidth in any JS (don't need to explicitly call window object)
renderer.setSize(innerWidth, innerHeight);
// this will get the screen picel ration of the user's device and update the render accordingly
// results in smoother edges on high res screens
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// geometry
// const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
// const planeGeometry = new THREE.PlaneGeometry(140, 40, 80, 40);
const planeGeometry = new THREE.PlaneGeometry(
  world.plane.width,
  world.plane.height,
  world.plane.widthSegments,
  world.plane.heightSegments
);

// Geometry GUI / Change Handler

function planeChangeHandler() {
  planeMesh.geometry.dispose();
  planeMesh.geometry = new THREE.PlaneGeometry(
    world.plane.width,
    world.plane.height,
    world.plane.widthSegments,
    world.plane.heightSegments
  );
}

// TODO: when these sliders are used, code breaks b/c not updating 'ocean animation' section??
gui.add(world.plane, 'width', 1, 240).onChange(planeChangeHandler);
gui.add(world.plane, 'height', 1, 80).onChange(planeChangeHandler);
gui.add(world.plane, 'widthSegments', 1, 200).onChange(planeChangeHandler);
gui.add(world.plane, 'heightSegments', 1, 100).onChange(planeChangeHandler);

// // // material
// surface texture (normal map)
const textureLoader = new THREE.TextureLoader();
const normalTextture = textureLoader.load('/textures/NormalMap.png');

// const material = new THREE.MeshBasicMaterial({
const material = new THREE.MeshPhongMaterial({
  // const material = new THREE.MeshPhysicalMaterial({
  // unlike MeshBasic, MeshPhong requiers a light source
  // color: 0x50819a, // must remove this if defining vertices colors
  fog: true,
  side: THREE.DoubleSide,
  flatShading: THREE.FlatShading,
  vertexColors: true,
  // normalMap: normalTextture, // .MeshPhysicalMaterial
  // clearcoatNormalMap: true, // .MeshPhysicalMaterial
});

// mesh (combines geometry and material)
const planeMesh = new THREE.Mesh(planeGeometry, material);
scene.add(planeMesh);
planeMesh.rotateX(-1);
// this array in the Mesh object is what defines the vertices that create the object
// they are grouped in [x,y,z,x,y,z...] with each set of 3 defining a point
planeMesh.geometry.attributes.position.needsUpdate = true;

// VERTICES START POSITION RANDOMIZATION
// adding a property to the planeMesh object with its original position
planeMesh.geometry.attributes.position.originalPosition =
  planeMesh.geometry.attributes.position.array;
const { originalPosition } = planeMesh.geometry.attributes.position;
const planeMeshXYZArray = planeMesh.geometry.attributes.position.array;

const randomCosValues = []; // for use in waveTransformZ function
planeMesh.geometry.attributes.position.randomCosValues = randomCosValues;
console.log(planeMesh.geometry.attributes.position);

for (let i = 0; i < planeMeshXYZArray.length; i++) {
  if (i % 3 === 0) {
    const x = planeMeshXYZArray[i];
    const y = planeMeshXYZArray[i + 1];
    const z = planeMeshXYZArray[i + 2];

    planeMeshXYZArray[i] = x + Math.random(); // comment out to keep equal x spacing
    planeMeshXYZArray[i + 1] = y + Math.random(); // comment out to keep equal y spacing
    planeMeshXYZArray[i + 2] = z + Math.random();
  }

  randomCosValues.push(Math.random() * Math.PI);
}

// OCEAN ANIMATION
// TODO: needs to be updated with GUI
const zDirectionArr = [];
planeMeshXYZArray.map((_, i) =>
  Math.random() > 0.499 ? zDirectionArr.push(true) : zDirectionArr.push(false)
);

// use waveTransformZ OR transformZ
let frame = 0;
function waveTransformZ() {
  frame += 0.01;
  for (let i = 0; i < planeMeshXYZArray.length; i++) {
    // const x = planeMeshXYZArray[i];
    // const y = planeMeshXYZArray[i + 1];
    // const z = planeMeshXYZArray[i + 2];
    planeMeshXYZArray[i] =
      originalPosition[i] + Math.cos(frame + randomCosValues[i]) * 0.002;
    planeMeshXYZArray[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomCosValues[i]) * 0.002;
    planeMeshXYZArray[i + 2] =
      originalPosition[i + 2] + Math.cos(frame + randomCosValues[i]) * 0.002;
  }
}

function transformZ() {
  for (let i = 0; i < planeMeshXYZArray.length; i += 3) {
    // const x = planeMeshXYZArray[i];
    // const y = planeMeshXYZArray[i + 1];
    const z = planeMeshXYZArray[i + 2];
    const positive = Math.random() > 0.5 && true;
    planeMeshXYZArray[i + 2] = positive ? z + Math.random() : z - Math.random();

    //TODO: consider using sin / cos here for more wave-like appearance
    // max height/depth
    const MAX = 0.7;
    if (z >= MAX) zDirectionArr[i] = false;
    if (z <= -MAX) zDirectionArr[i] = true;

    // speed of ripple
    const SPEED = 0.016;
    if (zDirectionArr[i]) planeMeshXYZArray[i + 2] = z + Math.random() * SPEED;
    if (!zDirectionArr[i]) planeMeshXYZArray[i + 2] = z - Math.random() * SPEED;
  }
}

// COLOR ATTRIBUTE RANDOMIZER
// can add color attribute to a vertices array
// [R,G,B] from 0 - 1 (rather than 0 - 255)
// the last number indicates to Three how many datapoints are being passed (3 for arr.length === 3)
// this array must be as long as the vertices array
// if defining color this way, must remove color attribute from original material options object

// const colors = [];
// for (let i = 0; i < planeMeshXYZArray.length; i++) {
//   colors.push(1, 1, 0);
// }
// TODO: needs to be updated with GUI
const randomColors = Array.from({ length: planeMeshXYZArray.length }, () =>
  Math.random()
);
// console.log('colors', colors);

planeMesh.geometry.setAttribute(
  'color',
  new THREE.BufferAttribute(
    // new Float32Array(new Array(planeMeshXYZArray.length).fill(Math.random()))
    new Float32Array(randomColors),
    3
  )
);

// lighting
// Light 1
const pointLight1Color = 0xefadae;

const pointLight1 = new THREE.PointLight(pointLight1Color, 0.1);
pointLight1.position.x = -1.3;
pointLight1.position.y = 7;
pointLight1.position.z = -8.6;
pointLight1.intensity = 1.3;
scene.add(pointLight1);

// GUI Light 1
const light1 = gui.addFolder('Light 1');
const light1Color = {
  color: pointLight1Color, // starting color for light slider (can set to value or variable)
};

light1.addColor(light1Color, 'color').onChange(() => {
  [pointLight1.color.set(light1Color.color)];
});

// grouped folder items are called on the folder variable they are to be organized into
light1.add(pointLight1.position, 'y').min(-10).max(10).step(0.01);
light1.add(pointLight1.position, 'x').min(-10).max(10).step(0.01);
light1.add(pointLight1.position, 'z').min(-100).max(100).step(0.01);
light1.add(pointLight1, 'intensity').min(0).max(10).step(0.01);

const pointLightHelper = new THREE.PointLightHelper(pointLight1, 0.5);
scene.add(pointLightHelper);

// Back Light 1
const backLight1 = new THREE.DirectionalLight(0xffffff, 1);
backLight1.position.set(0, 0, 1);
scene.add(backLight1);

const backLightHelper1 = new THREE.PointLightHelper(backLight1, 0.5);
scene.add(backLightHelper1);

// Raycaster

const ray = new Raycaster();

// Mouse Move Event Listener

const mouse = {
  x: undefined,
  y: undefined,
};

function mouseMoveHandler(event) {
  // in threejs the coords 0,0 are at the centre of the scene (for the browser they are top left of window)
  // need to convert mouse coords to threejs standard
  mouse.x = (event.clientX / innerWidth - 0.5) * 2;
  mouse.y = (event.clientY / innerHeight - 0.5) * -2; // -y is at the bottom of the canvas for 3js
  console.log(mouse.x, mouse.y);
}

addEventListener('mousemove', mouseMoveHandler);

// function transformZ(xyzArr) {
//   for (let i = 0; i < xyzArr.length; i += 3) {
//     const x = xyzArr[i];
//     const y = xyzArr[i + 1];
//     const z = xyzArr[i + 2];

//     z > 1.8
//       ? (xyzArr[i + 2] = z + Math.random())
//       : (xyzArr[i + 2] = z - Math.random());
//     console.log(z);
//   }
// }

// const clock = new THREE.Clock();

function animate() {
  // const time = clock.getElapsedTime();

  // this will intentionally create a callback loop
  requestAnimationFrame(animate);

  // transformZ(planeMeshXYZArray);
  waveTransformZ();
  // planeMesh.geometry.attributes.position.array = planeMeshXYZArray;

  // needs to be called within the animation loop to call the rerender
  planeMesh.geometry.attributes.position.needsUpdate = true;

  ray.setFromCamera(mouse, camera);

  // setX()
  // setX(vertice, number); setX = Red, setY = Green, setZ = Blue
  // getting where/when mouse is intersecting the geometry passed to intersectObject
  const intersections = ray.intersectObject(planeMesh); // single object in an array

  // intersections[0]
  //   ? console.log(intersections[0]?.object.geometry.attributes.color)
  //   : '';

  if (intersections[0]) {
    const { color } = intersections[0].object.geometry.attributes;
    const { face } = intersections[0];
    //vertice 1 (a)
    color.setX(face.a, 1);
    color.setY(face.a, 1);
    color.setZ(face.a, 1);
    //vertice 2 (b)
    color.setX(face.b, 1);
    color.setY(face.b, 1);
    color.setZ(face.b, 1);
    //vertice 3 (c)
    color.setX(face.c, 1);
    color.setY(face.c, 1);
    color.setZ(face.c, 1);
    color.needsUpdate = true;

    const initialColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };
    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };
    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      onUpdate: () => {
        // color.setX(face.a, initialColor.r);
        // color.setY(face.a, initialColor.g);
        // color.setZ(face.a, initialColor.b);
        // //vertice 2 (b)
        // color.setX(face.b, initialColor.r);
        // color.setY(face.b, initialColor.g);
        // color.setZ(face.b, initialColor.b);
        // //vertice 3 (c)
        // color.setX(face.c, initialColor.r);
        // color.setY(face.c, initialColor.g);
        // color.setZ(face.c, initialColor.b);
        color.setX(face.a, hoverColor.r);
        color.setY(face.a, hoverColor.g);
        color.setZ(face.a, hoverColor.b);
        //vertice 2 (b)
        color.setX(face.b, hoverColor.r);
        color.setY(face.b, hoverColor.g);
        color.setZ(face.b, hoverColor.b);
        //vertice 3 (c)
        color.setX(face.c, hoverColor.r);
        color.setY(face.c, hoverColor.g);
        color.setZ(face.c, hoverColor.b);
        color.needsUpdate = true;
      },
    });
  }

  // console.log(intersections[0].object.geometry.attributes.color);
  // intersections[0].face will give the current hovered face
  // the intersections[] object has a face: property that lists the vertice GROUPING the make the face
  // face: {a: 3, b: 12, c: 4}
  // two vertices will always be adjacent; third could be calculated from plane size

  // must be called after the objects in the scene have been created
  renderer.render(scene, camera);
}

animate();

// renderer.render(scene, camera);
