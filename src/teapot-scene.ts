import * as THREE from "three";

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
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 1.05, 8.8);
  camera.lookAt(0, 0.1, 0);

  const root = new THREE.Group();
  root.rotation.x = -0.06;
  scene.add(root);

  const porcelain = new THREE.MeshPhysicalMaterial({
    color: 0xfff6e7,
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.62,
    clearcoatRoughness: 0.22,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: 0xc8a259,
    roughness: 0.28,
    metalness: 0.45,
  });
  const tea = new THREE.MeshStandardMaterial({
    color: 0x89a66d,
    roughness: 0.4,
    transparent: true,
    opacity: 0.72,
  });
  const steamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.45, 72, 48), porcelain);
  body.scale.set(1.22, 0.82, 0.92);
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 16, 72), brass);
  rim.position.set(0, 0.77, 0);
  rim.rotation.x = Math.PI / 2;
  root.add(rim);

  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.54, 48, 24), porcelain);
  lid.position.set(0, 0.98, 0);
  lid.scale.set(1, 0.32, 1);
  root.add(lid);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 16), brass);
  knob.position.set(0, 1.23, 0);
  knob.scale.set(1, 0.72, 1);
  root.add(knob);

  const spoutCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(1.1, 0.18, 0),
    new THREE.Vector3(1.75, 0.38, 0.03),
    new THREE.Vector3(2.12, 0.7, 0.04),
    new THREE.Vector3(2.38, 0.58, 0.02),
  );
  const spout = new THREE.Mesh(
    new THREE.TubeGeometry(spoutCurve, 40, 0.13, 20, false),
    porcelain,
  );
  root.add(spout);

  const spoutLip = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.028, 12, 32), brass);
  spoutLip.position.copy(spoutCurve.getPoint(1));
  spoutLip.rotation.y = Math.PI / 2;
  spoutLip.rotation.z = 0.22;
  root.add(spoutLip);

  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.12, 0.36, 0),
    new THREE.Vector3(-1.68, 0.72, 0),
    new THREE.Vector3(-1.9, 0.02, 0),
    new THREE.Vector3(-1.52, -0.52, 0),
    new THREE.Vector3(-1.05, -0.28, 0),
  ]);
  const handle = new THREE.Mesh(
    new THREE.TubeGeometry(handleCurve, 64, 0.105, 20, false),
    porcelain,
  );
  root.add(handle);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(3.0, 3.35, 0.18, 96),
    new THREE.MeshStandardMaterial({
      color: 0x9b6f61,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  table.position.set(0, -1.16, 0);
  root.add(table);

  const pourCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(2.37, 0.52, 0.01),
    new THREE.Vector3(2.85, 0.28, 0.01),
    new THREE.Vector3(2.82, -0.54, 0.01),
    new THREE.Vector3(2.34, -1.02, 0.01),
  );
  const pour = new THREE.Mesh(
    new THREE.TubeGeometry(pourCurve, 52, 0.035, 12, false),
    tea,
  );
  pour.visible = false;
  root.add(pour);

  const steamParticles: Particle[] = [];
  const steamGeometry = new THREE.SphereGeometry(0.065, 16, 12);
  for (let i = 0; i < 26; i += 1) {
    const seed = i * 0.37;
    const particle = new THREE.Mesh(steamGeometry, steamMaterial.clone());
    const base = new THREE.Vector3(
      Math.sin(seed * 4.1) * 0.3,
      1.32 + (i % 8) * 0.16,
      Math.cos(seed * 3.3) * 0.16,
    );
    particle.position.copy(base);
    particle.scale.setScalar(0.6 + (i % 5) * 0.08);
    root.add(particle);
    steamParticles.push({ mesh: particle, seed, base });
  }

  scene.add(new THREE.AmbientLight(0xfff3df, 1.8));
  const key = new THREE.DirectionalLight(0xffdbb1, 3.8);
  key.position.set(4, 5, 5);
  scene.add(key);
  const fill = new THREE.PointLight(0x9bbd88, 9, 8);
  fill.position.set(-3, 1.5, 3);
  scene.add(fill);
  const brassGlow = new THREE.PointLight(0xf1c36c, 4, 5);
  brassGlow.position.set(0.3, 1.8, 2.4);
  scene.add(brassGlow);

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
    const sceneScale = compact ? 0.58 : narrow ? 0.72 : 0.9;
    root.scale.setScalar(sceneScale);
    root.position.y = compact ? -0.28 : narrow ? -0.18 : -0.08;
    camera.position.z = compact ? 9.2 : narrow ? 9.0 : 8.8;
    camera.lookAt(0, 0.08, 0);
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const clock = new THREE.Clock();
  function animate(): void {
    const elapsed = clock.getElapsedTime();
    const isStill = reducedMotion || mode === "still";

    const targetY = isStill ? 0 : elapsed * 0.23 + pointer.x * 0.08;
    root.rotation.y += (targetY - root.rotation.y) * 0.045;
    root.rotation.z +=
      ((mode === "pouring" ? -0.34 : pointer.x * 0.05) - root.rotation.z) * 0.055;
    root.rotation.x += ((-0.06 - pointer.y * 0.035) - root.rotation.x) * 0.05;

    const breathing = isStill ? 0 : Math.sin(elapsed * 1.8) * 0.012;
    body.scale.y = 0.82 + breathing;
    knob.position.y = 1.23 + (isStill ? 0 : Math.sin(elapsed * 2.3) * 0.025);

    const steamBoost = mode === "steam" || mode === "pouring" ? 1.7 : 1;
    steamParticles.forEach(({ mesh, seed, base }, index) => {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const drift = reducedMotion ? 0 : elapsed * (0.25 + index * 0.006);
      mesh.position.x = base.x + Math.sin(drift + seed) * 0.13 * steamBoost;
      mesh.position.y = base.y + ((drift + seed) % 1.55) * 0.26;
      mesh.position.z = base.z + Math.cos(drift * 0.8 + seed) * 0.08;
      const fade = 1 - ((mesh.position.y - 1.32) / 1.2);
      material.opacity = Math.max(0.08, Math.min(0.62, fade * 0.5 * steamBoost));
      mesh.scale.setScalar((0.55 + ((index + 2) % 6) * 0.08) * steamBoost);
    });

    pour.visible = mode === "pouring";
    if (pour.visible) {
      pour.scale.setScalar(0.92 + Math.sin(elapsed * 9) * 0.07);
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
      [
        body.geometry,
        rim.geometry,
        lid.geometry,
        knob.geometry,
        spout.geometry,
        spoutLip.geometry,
        handle.geometry,
        table.geometry,
        pour.geometry,
        steamGeometry,
      ].forEach((geometry) => geometry.dispose());
    },
  };
}
