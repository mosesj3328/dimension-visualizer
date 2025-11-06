import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

// 4D Hypersphere Geometry
const originalHyperspherePoints = [];
const numPoints = 2000;
const radius = 2;

for (let i = 0; i < numPoints; i++) {
    let x = THREE.MathUtils.randFloat(-1, 1);
    let y = THREE.MathUtils.randFloat(-1, 1);
    let z = THREE.MathUtils.randFloat(-1, 1);
    let w = THREE.MathUtils.randFloat(-1, 1);

    const length = Math.sqrt(x * x + y * y + z * z + w * w);

    x /= length;
    y /= length;
    z /= length;
    w /= length;

    originalHyperspherePoints.push(new THREE.Vector4(x * radius, y * radius, z * radius, w * radius));
}
const hyperspherePoints = originalHyperspherePoints.map(p => p.clone());

// Slicing Mode
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

const wSlider = document.getElementById('w-slider');

function updateSlice() {
    const w = parseFloat(wSlider.value);
    const sliceRadius = Math.sqrt(radius * radius - w * w);

    if (sliceRadius > 0) {
        sphere.scale.set(sliceRadius, sliceRadius, sliceRadius);
        sphere.visible = true;
    } else {
        sphere.visible = false;
    }
}

wSlider.addEventListener('input', updateSlice);

// Initial slice
updateSlice();

// Wireframe Mode
const wireframeGroup = new THREE.Group();
const pointsMaterial = new THREE.PointsMaterial({ color: 0x00ffff, size: 0.05 });
const linesMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5 });

const pointsGeometry = new THREE.BufferGeometry();
const linesGeometry = new THREE.BufferGeometry();

const points = new THREE.Points(pointsGeometry, pointsMaterial);
const lines = new THREE.LineSegments(linesGeometry, linesMaterial);

wireframeGroup.add(points);
wireframeGroup.add(lines);
wireframeGroup.visible = false;
scene.add(wireframeGroup);

const edges = [];
for (let i = 0; i < numPoints; i++) {
    for (let j = i + 1; j < numPoints; j++) {
        const p1 = originalHyperspherePoints[i];
        const p2 = originalHyperspherePoints[j];
        const dist = p1.distanceTo(p2);
        if (dist < 0.5) { // Threshold for connecting points
            edges.push(i, j);
        }
    }
}
linesGeometry.setIndex(edges);

function updateWireframe() {
    const projectedPoints = [];
    const projectionDistance = 4;

    for (const p of hyperspherePoints) {
        const w_proj = p.w;
        const scale = projectionDistance / (projectionDistance - w_proj);
        projectedPoints.push(p.x * scale, p.y * scale, p.z * scale);
    }

    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(projectedPoints, 3));
    linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(projectedPoints, 3));
}

updateWireframe();

// Mode Switching
const toggleButton = document.getElementById('toggle-mode');
let slicingMode = true;

toggleButton.addEventListener('click', () => {
    slicingMode = !slicingMode;
    sphere.visible = slicingMode;
    wireframeGroup.visible = !slicingMode;
    const wSliderGroup = document.getElementById('w-slider-group');
    if (slicingMode) {
        wSliderGroup.setAttribute("style", "display: inline-block;");
    } else {
        wSliderGroup.setAttribute("style", "display: none;");
    }
});

// 4D Rotations
const xwSlider = document.getElementById('xw-slider');
const ywSlider = document.getElementById('yw-slider');
const zwSlider = document.getElementById('zw-slider');

let xwAngle = 0;
let ywAngle = 0;
let zwAngle = 0;

function rotateHypersphere() {
    const cosXW = Math.cos(xwAngle);
    const sinXW = Math.sin(xwAngle);
    const cosYW = Math.cos(ywAngle);
    const sinYW = Math.sin(ywAngle);
    const cosZW = Math.cos(zwAngle);
    const sinZW = Math.sin(zwAngle);

    for (let i = 0; i < numPoints; i++) {
        const originalPoint = originalHyperspherePoints[i];
        const rotatedPoint = originalPoint.clone();

        // XW rotation
        let x = rotatedPoint.x;
        let w = rotatedPoint.w;
        rotatedPoint.x = x * cosXW - w * sinXW;
        rotatedPoint.w = x * sinXW + w * cosXW;

        // YW rotation
        let y = rotatedPoint.y;
        w = rotatedPoint.w;
        rotatedPoint.y = y * cosYW - w * sinYW;
        rotatedPoint.w = y * sinYW + w * cosYW;

        // ZW rotation
        let z = rotatedPoint.z;
        w = rotatedPoint.w;
        rotatedPoint.z = z * cosZW - w * sinZW;
        rotatedPoint.w = z * sinZW + w * cosZW;

        hyperspherePoints[i] = rotatedPoint;
    }

    updateWireframe();
    updateSlice();
}

xwSlider.addEventListener('input', () => {
    xwAngle = parseFloat(xwSlider.value);
    rotateHypersphere();
});

ywSlider.addEventListener('input', () => {
    ywAngle = parseFloat(ywSlider.value);
    rotateHypersphere();
});

zwSlider.addEventListener('input', () => {
    zwAngle = parseFloat(zwSlider.value);
    rotateHypersphere();
});


// Animation loop
function animate() {
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
}

animate();
