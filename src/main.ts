import "./styles.css";
import { createTeapotScene, type TeapotMode } from "./teapot-scene";

const canvas = document.querySelector<HTMLCanvasElement>("#teapot-canvas");
const loading = document.querySelector<HTMLElement>("#scene-loading");
const fallback = document.querySelector<HTMLElement>("#fallback-teapot");
const fallbackNote = document.querySelector<HTMLElement>("#fallback-note");
const readout = document.querySelector<HTMLElement>("#mode-readout");
const controls = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-mode]"),
);

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let mode: TeapotMode = motionQuery.matches ? "still" : "idle";

function setReadout(nextMode: TeapotMode | "warming"): void {
  if (!readout) return;
  const labels: Record<TeapotMode | "warming", string> = {
    warming: "warming",
    idle: "idle",
    pouring: "pouring",
    steam: "steam",
    still: "still",
    error: "fallback",
  };
  readout.textContent = labels[nextMode];
  document.documentElement.dataset.sceneMode = nextMode;
}

function showFallback(): void {
  if (canvas) canvas.hidden = true;
  if (fallback) {
    fallback.hidden = false;
    fallback.setAttribute("aria-hidden", "false");
  }
  if (fallbackNote) fallbackNote.hidden = false;
  if (loading) loading.hidden = true;
  controls.forEach((button) => {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
  });
  setReadout("error");
}

if (!canvas) {
  showFallback();
} else {
  try {
    const scene = createTeapotScene(canvas, {
      reducedMotion: motionQuery.matches,
      onReady: () => {
        if (loading) loading.hidden = true;
        setReadout(mode);
      },
      onError: showFallback,
    });

    scene.setMode(mode);

    controls.forEach((button) => {
      button.addEventListener("click", () => {
        mode = button.dataset.mode as TeapotMode;
        scene.setMode(mode);
        setReadout(mode);
      });
    });

    motionQuery.addEventListener("change", (event) => {
      scene.setReducedMotion(event.matches);
      if (event.matches) {
        mode = "still";
        scene.setMode("still");
        setReadout("still");
      }
    });

    window.addEventListener("beforeunload", () => scene.destroy());
  } catch {
    showFallback();
  }
}
