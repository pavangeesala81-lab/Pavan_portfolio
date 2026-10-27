/**
 * Pavan Geesala Portfolio — Core JavaScript
 * Features:
 * - HiDPI Scroll-Driven Canvas Background (Homepage-optimized)
 * - Accessible Mobile Hamburger Navigation
 * - Page Visibility & Reduced-Motion Performance Handling
 * - Interactive Project Case Study Dialog
 * - Accessible Showreel Video Modal
 */

const isHomepage = window.location.pathname.endsWith('index.html') || 
                   window.location.pathname === '/' || 
                   window.location.pathname.endsWith('/');

const TOTAL_FRAMES = isHomepage ? 240 : 1;
const CRITICAL_FRAMES = isHomepage ? 10 : 1;
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
let isTabActive = true;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

// Progressive background loader for remaining animation frames (homepage only)
function loadRemainingFrames() {
  if (!isHomepage) return;
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
  if (!isHomepage || prefersReducedMotion) return;
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
  if (!isTabActive || prefersReducedMotion || !isHomepage) return;

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

// Page visibility API to pause animation work when tab is inactive
document.addEventListener('visibilitychange', () => {
  isTabActive = !document.hidden;
  if (isTabActive && !prefersReducedMotion && isHomepage) {
    requestAnimationFrame(animationLoop);
  }
});

/* ==========================================================================
   Mobile Navigation Menu (BUG-01)
   ========================================================================== */
function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('primary-nav');

  if (!menuBtn || !navLinks) return;

  function toggleMenu(expand) {
    const isCurrentlyExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    const nextState = (typeof expand === 'boolean') ? expand : !isCurrentlyExpanded;

    menuBtn.setAttribute('aria-expanded', String(nextState));
    if (nextState) {
      navLinks.classList.add('nav-open');
    } else {
      navLinks.classList.remove('nav-open');
    }
  }

  menuBtn.addEventListener('click', () => {
    toggleMenu();
  });

  // Close when clicking any nav item
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggleMenu(false);
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
      menuBtn.focus();
    }
  });

  // Close when clicking outside navbar
  document.addEventListener('click', (e) => {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(e.target) && menuBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
    }
  });
}

/* ==========================================================================
   Project Case Studies Modal (BUG-02)
   ========================================================================== */
const projectData = {
  'skyshade': {
    title: 'Skyshade Daylighting & Tensile Structures',
    category: 'Daylighting & Architectural Tensile',
    image: 'assets/images/skyshade-project.webp',
    overview: 'Pioneering architectural daylighting systems and tensile engineering. Showcases Norikool natural sunlight harvesters, Lightpipe technology, and custom canopy fabric architectures.',
    role: 'Produced end-to-end 3D architectural visual explainers, optical light-path ray-tracing simulations, and tensile membrane animations for global infrastructure clients.',
    tools: ['Blender 3D', 'After Effects', 'DaVinci Resolve', 'CAD Pipeline'],
    deliverables: ['Full Architectural Visual Explainer', 'Light Distribution Motion Analysis', 'Engineering Brand Commercials']
  },
  'prowess-soft': {
    title: 'Prowess Soft Enterprise Systems',
    category: 'Enterprise Systems & Workflow Automation',
    image: 'assets/images/prowess-soft-project.webp',
    overview: 'High-performance enterprise workflow automation, real-time business intelligence dashboards, and creative management systems for modern digital teams.',
    role: 'Directed product UI motion design, simulated real-time data flow animations, dashboard telemetry visualization, and brand marketing product explainers.',
    tools: ['After Effects', 'Premiere Pro', 'Figma', 'Illustrator'],
    deliverables: ['Enterprise Platform Feature Walkthrough', 'Data-Flow Motion Graphics', 'B2B Product Video Suite']
  },
  'hariom-pipes': {
    title: 'Hariom Pipes Pippo & GP Pipes',
    category: 'Industrial Brand & Manufacturing',
    image: 'assets/images/hariom-pipes-project.webp',
    overview: 'High-impact cinematic industrial commercial visual campaign showcasing premium Pippo and GP Pipes steel products, manufacturing strength, and durability.',
    role: 'Lead 3D Artist and Motion Director overseeing photorealistic metal shaders, industrial plant cinematics, slow-motion stress test simulations, and color grading.',
    tools: ['Blender', 'After Effects', 'DaVinci Resolve', 'Photoshop'],
    deliverables: ['Broadcast Television Commercial (TVC)', '3D Product Visualization', 'High-Impact Brand Identity Reels']
  },
  'akshara-consultants': {
    title: 'Akshara Consultants Advisory',
    category: 'Corporate Consulting & Process Transformation',
    image: 'assets/images/akshara-consultants-project.webp',
    overview: 'Strategic corporate advisory explainer series translating complex management methodologies, governance models, and corporate transformations into intuitive visual stories.',
    role: 'Crafted structured infographic motion systems, executive presentation visuals, and branded corporate storytelling assets for C-suite decision-makers.',
    tools: ['After Effects', 'Illustrator', 'Premiere Pro'],
    deliverables: ['Corporate Methodology Explainer', 'Kinetic Typography Presentation', 'Executive Digital Collateral']
  },
  'real-estate-ai': {
    title: 'Real Estate AI Video Works',
    category: 'Architectural AI & Generative Visuals',
    image: 'assets/images/real-estate-ai-project.webp',
    overview: 'Cinematic generative AI visual production and virtual walkthroughs for luxury architectural developments, combining AI diffusion synthesis with 3D compositing.',
    role: 'Developed customized generative AI pipelines, prompt-to-video style transfer, camera trajectory motion smoothing, and photorealistic architectural environmental renders.',
    tools: ['Midjourney', 'Runway Gen-2/3', 'Stable Diffusion', 'After Effects', 'Topaz Video AI'],
    deliverables: ['Luxury Property Cinematic Trailers', 'Generative Architectural Flythroughs', 'Hyper-Realistic Mood Films']
  },
  'ekluvya': {
    title: 'Ekluvya Creative Education & Motion',
    category: 'Creative Education & Visual Storytelling',
    image: 'assets/images/ekluvya-project.webp',
    overview: 'Comprehensive digital visual production, motion design curriculum, and branded social assets connecting creative education with nationwide digital learners.',
    role: 'Headed visual production, storyboarding, dynamic 2D/3D character and geometric motion design, and high-engagement social media campaigns across YouTube and Instagram.',
    tools: ['After Effects', 'Premiere Pro', 'Photoshop', 'Illustrator'],
    deliverables: ['Educational Motion Curriculum', 'Social Media Motion Series', 'Brand Identity & Motion Guidelines']
  }
};

function initProjectModals() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalBadge = document.getElementById('modal-badge');
  const modalImg = document.getElementById('modal-img');
  const modalOverview = document.getElementById('modal-overview');
  const modalRole = document.getElementById('modal-role');
  const modalTools = document.getElementById('modal-tools');
  const modalDeliverables = document.getElementById('modal-deliverables');

  function openProject(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalBadge) modalBadge.textContent = data.category;
    if (modalImg) {
      modalImg.src = data.image;
      modalImg.alt = data.title;
    }
    if (modalOverview) modalOverview.textContent = data.overview;
    if (modalRole) modalRole.textContent = data.role;

    if (modalTools) {
      modalTools.innerHTML = '';
      data.tools.forEach(tool => {
        const span = document.createElement('span');
        span.textContent = tool;
        modalTools.appendChild(span);
      });
    }

    if (modalDeliverables) {
      modalDeliverables.innerHTML = '';
      data.deliverables.forEach(item => {
        const span = document.createElement('span');
        span.textContent = item;
        modalDeliverables.appendChild(span);
      });
    }

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', '');
    }
  }

  // Attach click listeners to all project action triggers
  document.querySelectorAll('[data-project]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const projectId = trigger.getAttribute('data-project');
      openProject(projectId);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.removeAttribute('open');
      }
    });
  }

  // Close when clicking modal backdrop
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      modal.close();
    }
  });

  // Check URL hash for direct project link
  const hash = window.location.hash.replace('#', '');
  if (hash && projectData[hash]) {
    setTimeout(() => { openProject(hash); }, 400);
  }
}

/* ==========================================================================
   Showreel Video Modal (BUG-03)
   ========================================================================== */
function initShowreelModal() {
  const showreelBtn = document.getElementById('watch-showreel-btn');
  const showreelModal = document.getElementById('showreel-modal');
  if (!showreelModal) return;

  const closeBtn = showreelModal.querySelector('.modal-close-btn');
  const video = showreelModal.querySelector('video');

  if (showreelBtn) {
    showreelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof showreelModal.showModal === 'function') {
        showreelModal.showModal();
        if (video) video.play().catch(() => {});
      }
    });
  }

  function closeShowreel() {
    if (video) video.pause();
    if (typeof showreelModal.close === 'function') {
      showreelModal.close();
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeShowreel);
  }

  showreelModal.addEventListener('click', (e) => {
    const rect = showreelModal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      closeShowreel();
    }
  });

  showreelModal.addEventListener('close', () => {
    if (video) video.pause();
  });
}

/* ==========================================================================
   Initialization Lifecycle
   ========================================================================== */
async function init() {
  initMobileNav();
  initProjectModals();
  initShowreelModal();

  if (canvas) {
    window.addEventListener('resize', resizeCanvas);
    if (isHomepage && !prefersReducedMotion) {
      window.addEventListener('scroll', updateScrollTarget, { passive: true });
    }
    await loadCriticalFrames();
  }

  // Hide preloader instantly once critical hero assets are ready
  if (loader) {
    loader.classList.add('hidden');
  }

  if (canvas) {
    resizeCanvas();
    if (isHomepage && !prefersReducedMotion) {
      animationLoop();
      loadRemainingFrames();
    } else {
      // On subpages or reduced motion, render the single crisp background frame
      render(true);
    }
  }
}

// Start application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
