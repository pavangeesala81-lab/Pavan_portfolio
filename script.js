const TOTAL_FRAMES = 240;
const CRITICAL_FRAMES = 10; // Load initial 10 frames to start instantly
const canvas = document.getElementById('hero-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const loader = document.getElementById('loader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const images = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let currentFrame = 0;
let targetFrame = 0;
let lastRenderedFrame = -1;

// Generate image filename
function getFrameFilename(index) {
  const frameNum = String(index).padStart(3, '0');
  return `assets/frames/ezgif-frame-${frameNum}.webp`;
}

function updateProgress(count, max) {
  const percent = Math.min(100, Math.round((count / max) * 100));
  if (progressBar) progressBar.style.width = `${percent}%`;
  if (progressText) progressText.textContent = `${percent}%`;
}

// Preload critical initial hero frames
function loadCriticalFrames() {
  return new Promise((resolve) => {
    let criticalLoaded = 0;
    for (let i = 0; i < CRITICAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      images[i] = img;

      const onComplete = () => {
        criticalLoaded++;
        loadedCount++;
        updateProgress(criticalLoaded, CRITICAL_FRAMES);
        if (criticalLoaded === CRITICAL_FRAMES) {
          resolve();
        }
      };

      img.onload = onComplete;
      img.onerror = onComplete;
    }
  });
}

// Progressive background loader for remaining animation frames
function loadRemainingFrames() {
  let index = CRITICAL_FRAMES;
  function loadNextBatch() {
    if (index >= TOTAL_FRAMES) return;
    const batchSize = 10;
    const end = Math.min(TOTAL_FRAMES, index + batchSize);
    for (let i = index; i < end; i++) {
      if (!images[i]) {
        const img = new Image();
        img.src = getFrameFilename(i);
        img.onload = () => { loadedCount++; };
        img.onerror = () => { loadedCount++; };
        images[i] = img;
      }
    }
    index = end;
    if (index < TOTAL_FRAMES) {
      setTimeout(loadNextBatch, 50);
    }
  }
  setTimeout(loadNextBatch, 100);
}

// Safely retrieve loaded frame or nearest fallback frame
function getLoadedFrame(index) {
  if (images[index] && images[index].complete && images[index].naturalWidth > 0) {
    return images[index];
  }
  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = index - offset;
    if (prev >= 0 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = index + offset;
    if (next < TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }
  return null;
}

// Setup Canvas Sizing with HiDPI / Retina Support
function resizeCanvas() {
  if (!canvas || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render(true);
}

// Draw Image preserving aspect ratio
function drawImageCover(img) {
  if (!img || !img.complete || img.naturalWidth === 0 || !ctx) return;

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;

  let x = (canvasWidth - width) / 2;
  if (width > canvasWidth) {
    x = (canvasWidth - width) * 0.55;
  }
  const y = (canvasHeight - height) / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, x, y, width, height);
}

function render(force = false) {
  if (!canvas || !ctx) return;
  const frameIndex = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.round(currentFrame))
  );

  if (force || frameIndex !== lastRenderedFrame) {
    const frameImg = getLoadedFrame(frameIndex);
    if (frameImg) {
      drawImageCover(frameImg);
      lastRenderedFrame = frameIndex;
    }
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
  requestAnimationFrame(animationLoop);
}

async function init() {
  if (canvas) {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    await loadCriticalFrames();
  }

  // Hide preloader instantly once critical hero assets are ready
  if (loader) {
    loader.classList.add('hidden');
  }

  if (canvas) {
    resizeCanvas();
    animationLoop();
    loadRemainingFrames();
  }
}

init();
