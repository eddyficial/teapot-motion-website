import * as THREE from "three";
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type TeapotMode = "idle" | "pouring" | "steam" | "still" | "error";

interface SceneOptions {
  reducedMotion: boolean;
  onReady: () => void;
  onError: () => void;
}

interface TeapotScene {
  setMode: (mode: TeapotMode) => void;
  setReducedMotion: (value: boolean) => void;
  destroy: () => void;
}

type Particle = {
  mesh: THREE.Mesh;
  seed: number;
  base: THREE.Vector3;
};

type TextureSet = {
  color: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
};

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createCanvas(size = 512): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function textureFromCanvas(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.7, 1.3);
  texture.needsUpdate = true;
  return texture;
}

function applyMaxAnisotropy(
  renderer: THREE.WebGLRenderer,
  textures: THREE.Texture[],
): void {
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  textures.forEach((texture) => {
    texture.anisotropy = anisotropy;
  });
}

function createPorcelainTextures(renderer: THREE.WebGLRenderer): TextureSet {
  const random = seededRandom(4817);
  const colorCanvas = createCanvas();
  const roughnessCanvas = createCanvas();
  const bumpCanvas = createCanvas();
  const color = colorCanvas.getContext("2d");
  const roughness = roughnessCanvas.getContext("2d");
  const bump = bumpCanvas.getContext("2d");

  if (!color || !roughness || !bump) {
    throw new Error("Canvas texture context unavailable");
  }

  color.fillStyle = "#f7eddb";
  color.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
  color.globalCompositeOperation = "multiply";
  for (let i = 0; i < 360; i += 1) {
    const x = random() * colorCanvas.width;
    const y = random() * colorCanvas.height;
    const radius = 12 + random() * 44;
    const warm = 220 + Math.floor(random() * 25);
    color.fillStyle = `rgba(${warm}, ${204 + Math.floor(random() * 18)}, ${170 + Math.floor(random() * 20)}, ${0.018 + random() * 0.025})`;
    color.beginPath();
    color.ellipse(x, y, radius, radius * (0.4 + random() * 0.7), random() * Math.PI, 0, Math.PI * 2);
    color.fill();
  }
  color.globalCompositeOperation = "screen";
  for (let i = 0; i < 70; i += 1) {
    const x = random() * colorCanvas.width;
    color.fillStyle = `rgba(255, 255, 245, ${0.025 + random() * 0.04})`;
    color.fillRect(x, 0, 2 + random() * 5, colorCanvas.height);
  }

  roughness.fillStyle = "#9c9a93";
  roughness.fillRect(0, 0, roughnessCanvas.width, roughnessCanvas.height);
  for (let i = 0; i < 520; i += 1) {
    const value = 118 + Math.floor(random() * 86);
    roughness.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.05 + random() * 0.08})`;
    roughness.fillRect(
      random() * roughnessCanvas.width,
      random() * roughnessCanvas.height,
      12 + random() * 68,
      1 + random() * 5,
    );
  }

  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
  bump.lineCap = "round";
  for (let i = 0; i < 260; i += 1) {
    const startX = random() * bumpCanvas.width;
    const startY = random() * bumpCanvas.height;
    bump.beginPath();
    bump.moveTo(startX, startY);
    for (let segment = 0; segment < 3; segment += 1) {
      bump.lineTo(
        startX + (random() - 0.5) * 74,
        startY + (random() - 0.5) * 34,
      );
    }
    const value = 86 + Math.floor(random() * 95);
    bump.strokeStyle = `rgba(${value}, ${value}, ${value}, ${0.045 + random() * 0.04})`;
    bump.lineWidth = 0.55 + random() * 1.2;
    bump.stroke();
  }

  const textures = {
    color: textureFromCanvas(colorCanvas, THREE.SRGBColorSpace),
    roughness: textureFromCanvas(roughnessCanvas),
    bump: textureFromCanvas(bumpCanvas),
  };
  applyMaxAnisotropy(renderer, Object.values(textures));
  return textures;
}

function createWoodTextures(renderer: THREE.WebGLRenderer): TextureSet {
  const random = seededRandom(8721);
  const colorCanvas = createCanvas();
  const roughnessCanvas = createCanvas();
  const bumpCanvas = createCanvas();
  const color = colorCanvas.getContext("2d");
  const roughness = roughnessCanvas.getContext("2d");
  const bump = bumpCanvas.getContext("2d");

  if (!color || !roughness || !bump) {
    throw new Error("Canvas texture context unavailable");
  }

  const gradient = color.createLinearGradient(0, 0, colorCanvas.width, colorCanvas.height);
  gradient.addColorStop(0, "#2d241d");
  gradient.addColorStop(0.55, "#594234");
  gradient.addColorStop(1, "#221c17");
  color.fillStyle = gradient;
  color.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
  color.lineCap = "round";
  for (let y = -8; y < colorCanvas.height + 8; y += 6) {
    color.beginPath();
    for (let x = 0; x <= colorCanvas.width; x += 22) {
      const wave = Math.sin((x + y * 0.8) * 0.025) * 7 + (random() - 0.5) * 8;
      if (x === 0) {
        color.moveTo(x, y + wave);
      } else {
        color.lineTo(x, y + wave);
      }
    }
    color.strokeStyle = `rgba(194, 148, 104, ${0.035 + random() * 0.035})`;
    color.lineWidth = 1 + random() * 2.5;
    color.stroke();
  }

  roughness.fillStyle = "#8d857b";
  roughness.fillRect(0, 0, roughnessCanvas.width, roughnessCanvas.height);
  bump.fillStyle = "#7f7f7f";
  bump.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
  for (let y = 0; y < bumpCanvas.height; y += 5) {
    const value = 96 + Math.floor(random() * 62);
    roughness.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.08 + random() * 0.08})`;
    roughness.fillRect(0, y, roughnessCanvas.width, 2);
    bump.fillStyle = `rgba(${value}, ${value}, ${value}, ${0.05 + random() * 0.08})`;
    bump.fillRect(0, y + Math.sin(y * 0.1) * 3, bumpCanvas.width, 1);
  }

  const textures = {
    color: textureFromCanvas(colorCanvas, THREE.SRGBColorSpace),
    roughness: textureFromCanvas(roughnessCanvas),
    bump: textureFromCanvas(bumpCanvas),
  };
  textures.color.repeat.set(1.2, 1);
  textures.roughness.repeat.set(1.2, 1);
  textures.bump.repeat.set(1.2, 1);
  applyMaxAnisotropy(renderer, Object.values(textures));
  return textures;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = createCanvas(256);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas texture context unavailable");

  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 126);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.26)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createTeapotScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
): TeapotScene {
  let reducedMotion = options.reducedMotion;
  let mode: TeapotMode = reducedMotion ? "still" : "idle";
  let animationId = 0;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.0, 8.6);
  camera.lookAt(0, 0.05, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environment = pmrem.fromScene(roomEnvironment, 0.035);
  scene.environment = environment.texture;

  const root = new THREE.Group();
  root.rotation.x = -0.04;
  scene.add(root);

  const porcelainTextures = createPorcelainTextures(renderer);
  const woodTextures = createWoodTextures(renderer);
  const contactShadowTexture = createContactShadowTexture();

  const porcelain = new THREE.MeshPhysicalMaterial({
    color: 0xfff1d7,
    map: porcelainTextures.color,
    roughnessMap: porcelainTextures.roughness,
    bumpMap: porcelainTextures.bump,
    bumpScale: 0.018,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: 0.88,
    clearcoatRoughness: 0.13,
    ior: 1.46,
    reflectivity: 0.52,
    sheen: 0.1,
    sheenColor: new THREE.Color(0xffd6aa),
    envMapIntensity: 1.05,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc59a4d,
    roughness: 0.2,
    metalness: 0.62,
  });
  const tea = new THREE.MeshStandardMaterial({
    color: 0x7e9a62,
    roughness: 0.38,
    transparent: true,
    opacity: 0.76,
  });
  const steamMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8fbf5,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: woodTextures.color,
    roughnessMap: woodTextures.roughness,
    bumpMap: woodTextures.bump,
    bumpScale: 0.045,
    roughness: 0.62,
    metalness: 0.02,
  });
  const porcelainShadow = new THREE.MeshBasicMaterial({
    color: 0x4a3928,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });

  const teapotGroup = new THREE.Group();
  teapotGroup.rotation.y = -0.58;
  teapotGroup.position.y = -0.05;
  root.add(teapotGroup);

  const teapotGeometry = new TeapotGeometry(1.28, 40, true, true, true, true, true);
  teapotGeometry.computeVertexNormals();
  const teapot = new THREE.Mesh(teapotGeometry, porcelain);
  teapot.castShadow = true;
  teapot.receiveShadow = true;
  teapotGroup.add(teapot);

  const lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 18), brass);
  lidKnob.position.set(0, 1.09, 0);
  lidKnob.scale.set(1, 0.7, 1);
  lidKnob.castShadow = true;
  teapotGroup.add(lidKnob);

  const lidBand = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.014, 12, 96), brass);
  lidBand.position.set(0, 0.76, 0);
  lidBand.rotation.x = Math.PI / 2;
  teapotGroup.add(lidBand);

  const lidSeam = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 8, 128), porcelainShadow);
  lidSeam.position.set(0, 0.73, 0);
  lidSeam.rotation.x = Math.PI / 2;
  teapotGroup.add(lidSeam);

  const footRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.018, 12, 96), brass);
  footRing.position.set(0, -0.77, 0);
  footRing.rotation.x = Math.PI / 2;
  teapotGroup.add(footRing);

  const table = new THREE.Mesh(new THREE.PlaneGeometry(58, 32, 1, 1), tableMaterial);
  table.position.set(0, -1.18, 0.35);
  table.rotation.x = -Math.PI / 2;
  table.castShadow = false;
  table.receiveShadow = true;
  root.add(table);

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.66, 1.86, 0.06, 128),
    new THREE.MeshStandardMaterial({
      color: 0xf5ead7,
      map: porcelainTextures.color,
      roughnessMap: porcelainTextures.roughness,
      bumpMap: porcelainTextures.bump,
      bumpScale: 0.01,
      roughness: 0.44,
      metalness: 0,
      envMapIntensity: 0.7,
    }),
  );
  saucer.position.set(0, -0.93, 0.02);
  saucer.receiveShadow = true;
  root.add(saucer);

  const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.026, 12, 128), porcelain);
  saucerRim.position.set(0, -0.865, 0.02);
  saucerRim.rotation.x = Math.PI / 2;
  saucerRim.receiveShadow = true;
  root.add(saucerRim);

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65, 1.08),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      map: contactShadowTexture,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );
  contactShadow.position.set(-0.04, -0.845, 0.06);
  contactShadow.rotation.x = -Math.PI / 2;
  root.add(contactShadow);

  const pourCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(1.52, 0.18, 0.16),
    new THREE.Vector3(2.05, -0.02, 0.2),
    new THREE.Vector3(2.0, -0.55, 0.12),
    new THREE.Vector3(1.55, -0.95, 0.06),
  );
  const pour = new THREE.Mesh(new THREE.TubeGeometry(pourCurve, 52, 0.028, 12, false), tea);
  pour.visible = false;
  teapotGroup.add(pour);

  const steamParticles: Particle[] = [];
  const steamGeometry = new THREE.SphereGeometry(0.052, 18, 12);
  for (let i = 0; i < 30; i += 1) {
    const seed = i * 0.39;
    const particle = new THREE.Mesh(steamGeometry, steamMaterial.clone());
    const base = new THREE.Vector3(
      Math.sin(seed * 3.9) * 0.24,
      1.12 + (i % 9) * 0.14,
      Math.cos(seed * 2.7) * 0.12,
    );
    particle.position.copy(base);
    particle.scale.setScalar(0.46 + (i % 6) * 0.075);
    teapotGroup.add(particle);
    steamParticles.push({ mesh: particle, seed, base });
  }

  scene.add(new THREE.HemisphereLight(0xffefe0, 0x18251e, 0.82));
  const key = new THREE.DirectionalLight(0xffd8ad, 3.15);
  key.position.set(4.3, 5.8, 4.7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 14;
  scene.add(key);
  const fill = new THREE.PointLight(0x9fbd8c, 3.1, 8.5);
  fill.position.set(-3.2, 1.5, 3.2);
  scene.add(fill);
  const rimGlow = new THREE.PointLight(0xffc87c, 2.8, 5);
  rimGlow.position.set(2.0, 2.1, 2.6);
  scene.add(rimGlow);

  const pointer = new THREE.Vector2(0, 0);
  function onPointerMove(event: PointerEvent): void {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  }
  window.addEventListener("pointermove", onPointerMove);

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const compact = camera.aspect < 0.65;
    const narrow = camera.aspect >= 0.65 && camera.aspect < 1;
    const sceneScale = compact ? 0.52 : narrow ? 0.68 : 0.86;
    root.scale.setScalar(sceneScale);
    root.position.y = compact ? -0.1 : narrow ? -0.12 : -0.04;
    camera.position.z = compact ? 9.8 : narrow ? 9.2 : 8.7;
    camera.lookAt(0, 0.02, 0);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  function animate(): void {
    const elapsed = clock.getElapsedTime();
    const isStill = reducedMotion || mode === "still";

    const targetY = isStill ? 0 : elapsed * 0.18 + pointer.x * 0.07;
    root.rotation.y += (targetY - root.rotation.y) * 0.042;
    root.rotation.z +=
      ((mode === "pouring" ? -0.22 : pointer.x * 0.035) - root.rotation.z) * 0.052;
    root.rotation.x += ((-0.04 - pointer.y * 0.026) - root.rotation.x) * 0.05;

    const breathing = isStill ? 0 : Math.sin(elapsed * 1.6) * 0.006;
    teapot.position.y = breathing;
    lidKnob.position.y = 1.09 + (isStill ? 0 : Math.sin(elapsed * 2.2) * 0.01);

    const steamBoost = mode === "steam" || mode === "pouring" ? 1.65 : 1;
    steamParticles.forEach(({ mesh, seed, base }, index) => {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const drift = reducedMotion ? 0 : elapsed * (0.22 + index * 0.005);
      mesh.position.x = base.x + Math.sin(drift + seed) * 0.105 * steamBoost;
      mesh.position.y = base.y + ((drift + seed) % 1.5) * 0.23;
      mesh.position.z = base.z + Math.cos(drift * 0.8 + seed) * 0.065;
      const fade = 1 - ((mesh.position.y - 1.12) / 1.2);
      material.opacity = Math.max(0.06, Math.min(0.54, fade * 0.46 * steamBoost));
      mesh.scale.setScalar((0.45 + ((index + 2) % 6) * 0.075) * steamBoost);
    });

    pour.visible = mode === "pouring";
    if (pour.visible) {
      pour.scale.setScalar(0.96 + Math.sin(elapsed * 9) * 0.045);
    }

    renderer.render(scene, camera);
    animationId = window.requestAnimationFrame(animate);
  }

  try {
    options.onReady();
    animate();
  } catch {
    options.onError();
  }

  return {
    setMode(nextMode: TeapotMode) {
      mode = nextMode;
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value;
    },
    destroy() {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("pointermove", onPointerMove);
      resizeObserver.disconnect();
      renderer.dispose();
      environment.texture.dispose();
      pmrem.dispose();
      [
        teapotGeometry,
        lidKnob.geometry,
        lidBand.geometry,
        footRing.geometry,
        lidSeam.geometry,
        table.geometry,
        saucer.geometry,
        saucerRim.geometry,
        contactShadow.geometry,
        pour.geometry,
        steamGeometry,
      ].forEach((geometry) => geometry.dispose());
      [
        porcelain,
        brass,
        tea,
        steamMaterial,
        tableMaterial,
        porcelainShadow,
        saucer.material as THREE.Material,
        contactShadow.material as THREE.Material,
      ].forEach((material) => material.dispose());
      [
        porcelainTextures.color,
        porcelainTextures.roughness,
        porcelainTextures.bump,
        woodTextures.color,
        woodTextures.roughness,
        woodTextures.bump,
        contactShadowTexture,
      ].forEach((texture) => texture.dispose());
      steamParticles.forEach(({ mesh }) => {
        (mesh.material as THREE.Material).dispose();
      });
    },
  };
}
