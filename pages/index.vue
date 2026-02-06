<template>
  <div class="marketing-page">
    <MarketingNav />

    <main class="marketing-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-headline">
              <span>Operational</span>
              <span>clarity</span>
              <span>for</span>
              <span>project</span>
              <span>teams.</span>
            </h1>
            <p class="hero-subheadline">
              Document authoring, task management, and AI collaboration in one minimal interface. The Basecamp alternative built for speed.
            </p>
            <NuxtLink to="/login?source=marketing" class="hero-cta">
              Start working
            </NuxtLink>
          </div>
          <div class="hero-screenshot">
            <ScreenshotDocumentEditor />
          </div>
        </div>
        <div class="scroll-indicator">
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 5v14m0 0l-4-4m4 4l4-4" />
          </svg>
        </div>
      </section>

      <!-- Feature: Document-First Collaboration -->
      <section class="feature-section feature-left">
        <div class="feature-container">
          <div class="feature-content">
            <span class="feature-label">document-first</span>
            <h2 class="feature-title">Everything is a document</h2>
            <p class="feature-description">
              No database maze. No separate trackers. Write naturally, add tasks inline with slash commands, and watch them appear in project views automatically. Documents are the source of truth.
            </p>
            <ul class="feature-list">
              <li>Real-time Tiptap editor with slash commands</li>
              <li>Inline task creation becomes project tasks</li>
              <li>Markdown support with live preview</li>
              <li>Version history and collaboration</li>
            </ul>
          </div>
          <div class="feature-screenshot">
            <ScreenshotDocumentEditor />
          </div>
        </div>
      </section>

      <!-- Feature: Three Views -->
      <section class="feature-section feature-right">
        <div class="feature-container">
          <div class="feature-screenshot tri-panel-real">
            <div class="panel-wrapper">
              <div class="panel-label">list</div>
              <ScreenshotTaskList />
            </div>
            <div class="panel-wrapper">
              <div class="panel-label">kanban</div>
              <ScreenshotKanbanBoard />
            </div>
            <div class="panel-wrapper">
              <div class="panel-label">calendar</div>
              <ScreenshotCalendar />
            </div>
          </div>
          <div class="feature-content">
            <span class="feature-label">unified views</span>
            <h2 class="feature-title">Three views, one task index</h2>
            <p class="feature-description">
              Switch between list, kanban, and calendar without losing context. Every view pulls from the same task index. Update in one, see it everywhere. No sync conflicts, no duplicate entries.
            </p>
            <ul class="feature-list">
              <li>List view for prioritization and filtering</li>
              <li>Kanban board for workflow visualization</li>
              <li>Calendar for deadline planning</li>
              <li>Drag tasks between views seamlessly</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Feature: AI Assistant -->
      <section class="feature-section feature-ai">
        <div class="feature-container">
          <div class="feature-content centered">
            <span class="feature-label">ai assistant</span>
            <h2 class="feature-title">AI as a first-class citizen</h2>
            <p class="feature-description">
              Not a chatbot. A teammate. The AI assistant uses the same REST API as you do, with full permission awareness and activity logging. Ask questions, create tasks, summarize activity.
            </p>
          </div>
          <div class="ai-demo">
            <ScreenshotAIPanel />
          </div>
        </div>
      </section>

      <!-- Feature: Design Philosophy -->
      <section class="feature-section feature-design">
        <div class="feature-container">
          <div class="feature-content centered">
            <span class="feature-label">design system</span>
            <h2 class="feature-title">Pure neutral. Zero tint.</h2>
            <p class="feature-description">
              No drop shadows. No rounded-corner cards. Just whitespace, typography, and a pure grayscale palette. Light and dark modes are perfect inversions. Inter for content, JetBrains Mono for chrome.
            </p>
          </div>
          <div class="design-showcase">
            <div class="color-swatches">
              <div class="swatch" style="background: var(--color-text)"></div>
              <div class="swatch" style="background: var(--color-priority-high)"></div>
              <div class="swatch" style="background: var(--color-text-secondary)"></div>
              <div class="swatch" style="background: var(--color-text-tertiary)"></div>
              <div class="swatch" style="background: var(--color-bg-surface)"></div>
            </div>
            <div class="typography-sample">
              <div class="type-inter">Operational clarity</div>
              <div class="type-mono">backlog · todo · in progress</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="cta-section">
        <div class="cta-container">
          <h2 class="cta-title">Ready to ship faster?</h2>
          <p class="cta-description">Start working with less ceremony</p>
          <div class="cta-buttons">
            <NuxtLink to="/login?source=marketing" class="cta-primary">
              Start free
            </NuxtLink>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="cta-secondary">
              View on GitHub →
            </a>
          </div>
        </div>
      </section>
    </main>

    <MarketingFooter />
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (import.meta.client) {
  gsap.registerPlugin(ScrollTrigger);
}

// Meta tags for SEO
useHead({
  title: 'Workbench - Operational clarity for project teams',
  meta: [
    { name: 'description', content: 'Document authoring, task management, and AI collaboration in one minimal interface. The Basecamp alternative built for speed.' },
    { name: 'keywords', content: 'project management, task management, document collaboration, AI assistant, Basecamp alternative, Notion alternative' },

    // Open Graph
    { property: 'og:title', content: 'Workbench - Operational clarity for project teams' },
    { property: 'og:description', content: 'Document authoring, task management, and AI collaboration in one minimal interface. The Basecamp alternative built for speed.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://workbench.app' },
    { property: 'og:site_name', content: 'Workbench' },

    // Twitter Card
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'Workbench - Operational clarity for project teams' },
    { name: 'twitter:description', content: 'Document authoring, task management, and AI collaboration in one minimal interface.' },

    // Additional Meta
    { name: 'author', content: 'BetterSignShop' },
    { name: 'theme-color', content: '#161616' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'canonical', href: 'https://workbench.app' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
});

// Auth check - redirect authenticated users to /projects
const config = useRuntimeConfig();
const api = useWorkbenchApi();

onMounted(async () => {
  if (config.public.authMode !== 'disabled') {
    try {
      await api.get('/api/auth/session');
      // User authenticated, redirect to app
      await navigateTo('/projects');
      return; // Exit early if authenticated
    } catch {
      // User not authenticated, show marketing page and init animations
    }
  }

  // Initialize hero animation timeline
  initHeroAnimation();

  // Initialize scroll-triggered animations
  initScrollAnimations();
});

const initHeroAnimation = () => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animations if user prefers reduced motion
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  // Animate headline words with stagger
  tl.from('.hero-headline span', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1
  })
  // Fade in subheadline
  .from('.hero-subheadline', {
    opacity: 0,
    y: 20,
    duration: 0.6
  }, '-=0.4')
  // Animate CTA button with elastic easing
  .from('.hero-cta', {
    scale: 0.9,
    opacity: 0,
    duration: 0.5,
    ease: 'elastic.out(1, 0.5)'
  }, '-=0.3')
  // Slide in hero screenshot
  .from('.hero-screenshot', {
    x: 100,
    opacity: 0,
    duration: 1,
    ease: 'power2.out'
  }, '-=0.5');
};

const initScrollAnimations = () => {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animations if user prefers reduced motion
    return;
  }

  // Feature sections fade in on scroll
  gsap.utils.toArray('.feature-section').forEach((section: any) => {
    gsap.from(section, {
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'top 50%',
        toggleActions: 'play none none none'
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out'
    });
  });

  // Parallax effect on screenshots
  gsap.utils.toArray('.feature-screenshot').forEach((screenshot: any) => {
    gsap.to(screenshot, {
      scrollTrigger: {
        trigger: screenshot,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      y: -50,
      ease: 'none'
    });
  });

  // Tri-panel stagger animation
  const panels = gsap.utils.toArray('.panel-wrapper');
  if (panels.length > 0) {
    gsap.from(panels, {
      scrollTrigger: {
        trigger: '.tri-panel-real',
        start: 'top 70%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      },
      y: 60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });
  }

  // AI demo fade and slide
  gsap.from('.ai-demo', {
    scrollTrigger: {
      trigger: '.ai-demo',
      start: 'top 75%',
      toggleActions: 'play none none none'
    },
    y: 40,
    opacity: 0,
    duration: 1,
    ease: 'power2.out'
  });

  // Design showcase color swatches stagger
  gsap.from('.swatch', {
    scrollTrigger: {
      trigger: '.design-showcase',
      start: 'top 70%',
      toggleActions: 'play none none none'
    },
    scale: 0.8,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'back.out(1.7)'
  });
};
</script>

<style scoped>
/* Marketing page layout */
.marketing-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-top: var(--topbar-height);
}

.marketing-content {
  width: 100%;
}

/* Hero Section */
.hero-section {
  min-height: calc(100vh - var(--topbar-height));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-6);
  position: relative;
}

.hero-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  max-width: 1440px;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.hero-headline {
  font-family: var(--font-body);
  font-size: 56px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: var(--tracking-h1);
  color: var(--color-text);
  margin: 0;
}

.hero-headline span {
  display: inline-block;
}

.hero-subheadline {
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 540px;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: var(--radius-md);
  text-decoration: none;
  text-transform: lowercase;
  transition: opacity var(--transition-fast);
  align-self: flex-start;
}

.hero-cta:hover {
  opacity: 0.9;
}

.hero-screenshot {
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-indicator {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  color: var(--color-text-tertiary);
  opacity: 0.4;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-8px); }
}

/* Feature Sections */
.feature-section {
  padding: var(--space-12) var(--space-6);
  border-top: 1px solid var(--color-border);
}

.feature-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  max-width: 1440px;
  margin: 0 auto;
  align-items: center;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feature-content.centered {
  text-align: center;
  margin: 0 auto;
  max-width: 640px;
  grid-column: 1 / -1;
}

.feature-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: var(--tracking-label);
}

.feature-title {
  font-family: var(--font-body);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: var(--tracking-h1);
  color: var(--color-text);
  margin: 0;
}

.feature-description {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: var(--space-4) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.feature-list li {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  padding-left: var(--space-4);
  position: relative;
}

.feature-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--color-text-tertiary);
}

.feature-screenshot {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Placeholder Styles (will be replaced with real components) */
.screenshot-placeholder {
  width: 100%;
  max-width: 600px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-sizing: border-box;
}

.placeholder-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.editor-toolbar {
  height: 32px;
  background: var(--color-bg-hover);
  border-radius: var(--radius-sm);
}

.editor-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.editor-line {
  height: 12px;
  background: var(--color-text-tertiary);
  opacity: 0.2;
  border-radius: 2px;
}

.editor-line.short {
  width: 60%;
}

.editor-task-pill {
  height: 24px;
  width: 200px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

/* Tri-panel - Real Screenshots */
.tri-panel-real {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-8);
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6) 0;
}

.panel-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.panel-label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: lowercase;
  letter-spacing: 0.04em;
  text-align: center;
}

/* AI Section */
.feature-ai {
  background: linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-surface) 100%);
}

.ai-demo {
  grid-column: 1 / -1;
  max-width: 480px;
  margin: var(--space-8) auto 0;
}

.ai-panel-mockup {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.sparkle-icon {
  color: var(--color-text-secondary);
}

.ai-messages {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ai-message {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.message-role {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  letter-spacing: 0.06em;
}

.message-text {
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
}

/* Design Showcase */
.feature-design {
  background: var(--color-bg-surface);
}

.design-showcase {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.color-swatches {
  display: flex;
  gap: var(--space-3);
}

.swatch {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.typography-sample {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.type-inter {
  font-family: var(--font-body);
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
}

.type-mono {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
}

/* CTA Section */
.cta-section {
  padding: var(--space-12) var(--space-6);
  background: var(--color-bg);
}

.cta-container {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.cta-title {
  font-family: var(--font-body);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0;
}

.cta-description {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text-secondary);
  margin: 0;
}

.cta-buttons {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: var(--radius-md);
  text-decoration: none;
  text-transform: lowercase;
  transition: opacity var(--transition-fast);
}

.cta-primary:hover {
  opacity: 0.9;
}

.cta-secondary {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.cta-secondary:hover {
  opacity: 1;
}

/* Hover Microanimations */
.hero-screenshot,
.feature-screenshot {
  transition: transform var(--transition-normal);
}

.hero-screenshot:hover,
.feature-screenshot:hover {
  transform: translateY(-4px);
}

.panel-wrapper {
  transition: transform var(--transition-normal);
}

.panel-wrapper:hover {
  transform: scale(1.02);
}

.feature-list li {
  transition: color var(--transition-fast), transform var(--transition-fast);
}

.feature-list li:hover {
  color: var(--color-text);
  transform: translateX(4px);
}

.swatch {
  transition: transform var(--transition-normal);
  cursor: pointer;
}

.swatch:hover {
  transform: scale(1.1);
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .scroll-indicator {
    animation: none;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .hero-headline {
    font-size: 40px;
  }

  .feature-container {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .feature-title {
    font-size: 28px;
  }

  .tri-panel-real {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .cta-primary, .cta-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-headline {
    font-size: 32px;
  }

  .hero-subheadline {
    font-size: 16px;
  }

  .feature-title {
    font-size: 24px;
  }

  .cta-title {
    font-size: 28px;
  }
}
</style>
