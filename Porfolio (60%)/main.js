import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

/* ===================== ESCENA ===================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x636768);

/* ===================== CÁMARA ===================== */
const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2, 6);

/* ===================== RENDERER ===================== */
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(renderer.domElement);

/* ===================== POSTPROCESS ===================== */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 5;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 1.5;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0xffffff);
composer.addPass(outlinePass);

/* ===================== ILUMINACIÓN ===================== */
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 15, 5);
dirLight.castShadow = true;
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 2.0);
backLight.position.set(-5, 10, -5);
scene.add(backLight);

/* ===================== CONTROLES FPS ===================== */
const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) controls.lock();
});

/* ===================== MOVIMIENTO ===================== */
const keys = {};
const moveSpeed = 0.025;

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

/* ===================== CROSSHAIR ===================== */
const crosshair = document.createElement("div");
Object.assign(crosshair.style, {
  position: "fixed",
  top: "50%",
  left: "50%",
  width: "8px",
  height: "8px",
  background: "white",
  borderRadius: "50%",
  transform: "translate(-50%, -50%)",
  pointerEvents: "none",
  zIndex: 1000,
  transition: "0.15s ease"
});
document.body.appendChild(crosshair);

/* ===================== OBJETOS ===================== */
const clickableObjects = ["B1","B2","B3","B4","B5","B6","B7","CloudSword","EnmaSword","PSVita"];

const objectInfo = {
  B1:{title:"Bola del dragón de 1 estrella",description:"Primera esfera de Dragon Ball.\nModelo inspirado en el anime."},
  B2:{title:"Bola del dragón de 2 estrellas",description:"Segunda esfera de Dragon Ball.\nModelo inspirado en el anime."},
  B3:{title:"Bola del dragón de 3 estrellas",description:"Tercera esfera de Dragon Ball.\nModelo inspirado en el anime."},
  B4:{title:"Bola del dragón de 4 estrellas",description:"Cuarta esfera de Dragon Ball.\nModelo inspirado en el anime. \nLa más icónica."},
  B5:{title:"Bola del dragón de 5 estrellas",description:"Quinta esfera de Dragon Ball.\nModelo inspirado en el anime."},
  B6:{title:"Bola del dragón de 6 estrellas",description:"Sexta esfera de Dragon Ball.\nModelo inspirado en el anime."},
  B7:{title:"Bola del dragón de 7 estrellas",description:"Séptima esfera de Dragon Ball.\nModelo inspirado en el anime."},
  CloudSword:{title:"Espada de Cloud",description:"Fan art Final Fantasy VII."},
  EnmaSword:{title:"Enma: Katana de Oden-sama",description:"Fan art One Piece."},
  PSVita:{title:"PS Vita",description:"Consola portátil de Sony."}
};

/* ===================== CARGA GLTF ===================== */
const loader = new GLTFLoader();
loader.load("MiHabitaciónPorfolio(Prueba4).glb", gltf => {
  scene.add(gltf.scene);
  gltf.scene.traverse(child => {
    if (child.isMesh && clickableObjects.includes(child.name)) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
});

/* ===================== UI INFO ===================== */
const infoDiv = document.createElement("div");
Object.assign(infoDiv.style, {
  position:"absolute",
  top:"20px",
  right:"20px",
  maxWidth:"300px",
  padding:"15px",
  background:"rgba(0,0,0,0.75)",
  color:"white",
  borderRadius:"8px",
  display:"none",
  whiteSpace:"pre-line"
});
document.body.appendChild(infoDiv);

/* ===================== RAYCAST + TOGGLE ===================== */
const raycaster = new THREE.Raycaster();
let selectedObject = null;

renderer.domElement.addEventListener("mousedown", e => {
  if (e.button !== 0 || !controls.isLocked) return;

  raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  if (!hits.length) return;

  let obj = hits[0].object;
  while (obj && !clickableObjects.includes(obj.name)) obj = obj.parent;
  if (!obj) return;

  if (selectedObject === obj) {
    infoDiv.style.display = "none";
    selectedObject = null;
  } else {
    selectedObject = obj;
    const data = objectInfo[obj.name];
    infoDiv.innerHTML = `<h2>${data.title}</h2><p>${data.description}</p>`;
    infoDiv.style.display = "block";
  }
});

/* ===================== LOOP ===================== */
function animate() {
  requestAnimationFrame(animate);

  if (controls.isLocked) {
    if (keys.w) controls.moveForward(moveSpeed);
    if (keys.s) controls.moveForward(-moveSpeed);
    if (keys.a) controls.moveRight(-moveSpeed);
    if (keys.d) controls.moveRight(moveSpeed);
    if (keys[" "]) controls.getObject().position.y += moveSpeed;
    if (keys.shift) controls.getObject().position.y -= moveSpeed;
    controls.getObject().position.y = Math.max(1.5, controls.getObject().position.y);
  }

  raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
  const hits = raycaster.intersectObjects(scene.children, true);

  let hovered = null;
  if (hits.length) {
    let o = hits[0].object;
    while (o && !clickableObjects.includes(o.name)) o = o.parent;
    if (o) hovered = o;
  }

  outlinePass.selectedObjects = hovered ? [hovered] : [];
  crosshair.style.background = hovered ? "red" : "white";
  crosshair.style.transform = hovered
    ? "translate(-50%, -50%) scale(1.4)"
    : "translate(-50%, -50%) scale(1)";

  composer.render();
}
animate();

/* ===================== RESIZE ===================== */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});