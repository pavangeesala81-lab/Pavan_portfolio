const TOTAL_FRAMES = 240;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const images = [];
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;
let animationFrameId = null;

// Generate image filename
function getFrameFilename(index) {
  const frameNum = String(index).padStart(3, '0');
  return `assets/frames/ezgif-frame-${frameNum}.jpg`;
}

// Preload all frames
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);

      img.onload = () => {
        loadedCount++;
        updateProgress();
        if (loadedCount === TOTAL_FRAMES) {
          resolve();
        }
      };

      img.onerror = () => {
        loadedCount++;
        updateProgress();
        if (loadedCount === TOTAL_FRAMES) {
          resolve();
        }
      };

      images.push(img);
    }
  });
}

function updateProgress() {
  const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
}

// Setup Canvas Sizing with HiDPI / Retina Support
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render(true);
}

// Draw Image preserving aspect ratio (Cover mode centered for optimal face visibility)
function drawImageCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Calculate scale for full canvas cover
  const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;

  // Center subject in canvas with optimal framing
  let x = (canvasWidth - width) / 2;
  if (width > canvasWidth) {
    // Slightly adjust horizontal center so the portrait features are prominently visible
    x = (canvasWidth - width) * 0.55;
  }
  const y = (canvasHeight - height) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, x, y, width, height);
}

function render(force = false) {
  const frameIndex = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.round(currentFrame))
  );

  if (force || frameIndex !== lastRenderedFrame) {
    drawImageCover(images[frameIndex]);
    lastRenderedFrame = frameIndex;
  }
}

function updateScrollTarget() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  const scrollHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );
  const maxScroll = scrollHeight - window.innerHeight;

  if (maxScroll > 0) {
    const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScroll));
    targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
  }
}

// Smooth Animation Loop using Lerp
function animationLoop() {
  updateScrollTarget();

  const lerpFactor = 0.12;
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * lerpFactor;
  } else {
    currentFrame = targetFrame;
  }

  render();
  animationFrameId = requestAnimationFrame(animationLoop);
}

// Initialize Application
async function init() {
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('scroll', updateScrollTarget, { passive: true });

  await preloadImages();

  // Hide loading indicator smoothly
  loader.classList.add('hidden');

  // Initial canvas sizing and first render
  resizeCanvas();

  // Start smooth animation loop
  animationLoop();
}

init();
