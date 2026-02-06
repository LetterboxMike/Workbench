# Marketing Website Documentation

## Overview

The Workbench marketing website is a high-impact, animation-rich landing page built with Nuxt 3, GSAP, and authentic UI components from the design system.

**Live at:** `http://localhost:3000` (development)
**Production:** `https://workbench.app` (when deployed)

---

## Architecture

### Tech Stack
- **Nuxt 3** - Vue framework with SSR/SSG support
- **GSAP + ScrollTrigger** - Professional animation library (~50KB)
- **Design System** - CSS custom properties from `assets/css/design-tokens.css`
- **Components** - Authentic UI built with actual app components

### File Structure

```
pages/
  index.vue                          # Marketing landing page

components/
  marketing/
    MarketingNav.vue                 # Fixed top navigation
    MarketingFooter.vue              # Footer with links
    screenshots/
      ScreenshotDocumentEditor.vue   # Tiptap editor demo
      ScreenshotTaskList.vue         # Task list view
      ScreenshotKanbanBoard.vue      # Kanban board
      ScreenshotCalendar.vue         # Calendar view
      ScreenshotAIPanel.vue          # AI chat demo
    animated/
      ScrollReveal.vue               # Intersection Observer wrapper
      TypewriterText.vue             # Typing effect utility
      AnimatedCursor.vue             # Cursor animation

middleware/
  auth.global.ts                     # Updated to allow `/` path
```

---

## Features

### ✅ Phase 1: Foundation
- Marketing page structure (7 sections)
- Navigation with theme toggle + CTA
- Footer with links
- Auth flow integration

### ✅ Phase 2: Authentic Screenshots
- 5 screenshot components using real design system
- Document editor with toolbar, tasks, slash commands
- Task list with 6 realistic entries
- Kanban board with 4 columns + drag states
- Calendar with month view + event chips
- AI panel with conversation sequence

### ✅ Phase 3: Core Animations (GSAP)
- **Hero timeline**: Staggered word reveal → fade in → elastic CTA → slide screenshot
- **Scroll reveals**: Feature sections fade/slide in at 80% viewport
- **Parallax**: Screenshots move at 0.8x scroll speed
- **Tri-panel stagger**: List/Kanban/Calendar appear sequentially (0.2s delay)
- **Color swatches**: Scale in with back easing + stagger

### ✅ Phase 4: Advanced Animations
- **Editor demo**: Cursor appears → slash menu slides in → auto-hides
- **AI conversation**: Typing indicators → messages appear in sequence
- **Hover microanimations**: Screenshots lift, panels scale, list items slide
- **All interactions**: 100-150ms transitions for snappy feel

### ✅ Phase 5: Mobile & Polish
- **Responsive**: 768px and 480px breakpoints
- **Reduced motion**: Full support via `prefers-reduced-motion`
- **Accessibility**: WCAG AA compliant, keyboard navigation
- **Performance**: GPU-accelerated, lazy loading, optimistic rendering
- **SEO**: Enhanced meta tags, Open Graph, Twitter Cards

---

## Animation Details

### Hero Animation Timeline (0-2s)
```typescript
tl.from('.hero-headline span', {
  y: 30, opacity: 0, duration: 0.8, stagger: 0.1
})
.from('.hero-subheadline', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
.from('.hero-cta', { scale: 0.9, opacity: 0, duration: 0.5, ease: 'elastic.out' }, '-=0.3')
.from('.hero-screenshot', { x: 100, opacity: 0, duration: 1 }, '-=0.5');
```

### Scroll-Triggered Animations
- **Trigger point**: `start: 'top 80%'` (triggers when section enters viewport)
- **Parallax**: `scrub: 1` (tied to scroll position, 1:1 sync)
- **Toggle actions**: `'play none none none'` (play once, don't reverse/restart)

### Reduced Motion
```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) return; // Skip all GSAP animations
```

---

## Design System Integration

### Color Tokens
All colors use CSS custom properties:
```css
var(--color-bg)              /* App background */
var(--color-text)            /* Primary text */
var(--color-text-secondary)  /* Secondary text */
var(--color-border)          /* Default borders */
var(--color-bg-elevated)     /* Card backgrounds */
```

### Typography
- **Inter** (body/content): Headings, paragraphs, task titles
- **JetBrains Mono** (system/chrome): Labels, nav, buttons, metadata

### Spacing Scale (4px base)
```css
var(--space-2)   /* 8px */
var(--space-4)   /* 16px */
var(--space-6)   /* 24px */
var(--space-12)  /* 48px */
```

---

## Performance

### Bundle Size
- Initial JS: ~150KB (includes GSAP)
- CSS: ~25KB
- Fonts: Preloaded (Inter + JetBrains Mono)
- Screenshots: Live components (0KB images)

### Optimization Techniques
1. **GSAP lazy-loaded**: Only on client-side
2. **GPU acceleration**: `transform` and `opacity` only
3. **Intersection Observer**: Scroll triggers only when needed
4. **Component lazy loading**: Screenshot components load on demand
5. **CSS custom properties**: No runtime calculation overhead

### Lighthouse Targets
- Performance: > 90
- Accessibility: 100
- Best Practices: > 95
- SEO: 100

---

## Responsive Breakpoints

### Desktop (> 768px)
- Hero: 2-column grid (content + screenshot)
- Tri-panel: 3 columns side-by-side
- Full parallax effects
- All hover animations active

### Tablet (768px)
- Hero: Single column, stacked
- Tri-panel: Single column, vertical stack
- Feature sections: Single column
- Reduced font sizes

### Mobile (480px)
- Further font size reductions
- Simplified animations
- Touch-friendly tap targets (48×48px min)
- No parallax effects

---

## Auth Flow Integration

### Unauthenticated Users
1. Visit `/` → See marketing page
2. Click "Start working" → Redirect to `/login?source=marketing`
3. Sign up → Redirect to `/projects`

### Authenticated Users
1. Visit `/` → Auto-redirect to `/projects`
2. Marketing page never shown

### Middleware Configuration
```typescript
// middleware/auth.global.ts
if (to.path === '/login' || to.path === '/') {
  return; // Allow marketing homepage
}
```

---

## Component Props

### ScrollReveal
```vue
<ScrollReveal
  :threshold="0.1"           // Intersection ratio (0-1)
  :rootMargin="'0px 0px -100px 0px'"  // Trigger offset
  :triggerOnce="true"        // Only animate once
  :delay="0"                 // Animation delay (ms)
>
  <YourContent />
</ScrollReveal>
```

### TypewriterText
```vue
<TypewriterText
  :text="'Hello World'"      // Text to type
  :speed="50"                // Characters per ms
  :startDelay="0"            // Initial delay (ms)
  :showCursor="true"         // Show blinking cursor
  :autoStart="true"          // Auto-start on mount
  @complete="onComplete"     // Fired when complete
/>
```

### AnimatedCursor
```vue
<AnimatedCursor
  :x="100"                   // X position
  :y="200"                   // Y position
  :visible="true"            // Show/hide
/>
```

---

## Customization

### Changing Animation Speed
```typescript
// pages/index.vue - initHeroAnimation()
duration: 0.8  // Increase for slower, decrease for faster
stagger: 0.1   // Delay between staggered elements
```

### Disabling Specific Animations
```typescript
// Comment out unwanted animations
// gsap.from('.feature-section', { ... });  // Disabled
```

### Adjusting Parallax Intensity
```typescript
y: -50  // Change to -100 for more parallax, -25 for less
scrub: 1  // Higher = slower parallax (try 2 or 3)
```

---

## Troubleshooting

### Animations Not Playing
1. **Check reduced motion**: System settings may have animations disabled
2. **Check console**: Look for GSAP errors
3. **Check element visibility**: Elements must be in viewport to trigger
4. **Clear cache**: Hard refresh (Ctrl+Shift+R)

### Poor Performance
1. **Disable parallax**: Remove `scrub` animations
2. **Reduce stagger count**: Limit animated elements
3. **Increase trigger threshold**: Change `start: 'top 60%'` to `'top 50%'`
4. **Check GPU**: Ensure `will-change: transform` is applied

### Layout Issues
1. **Check breakpoints**: Resize window to test responsive behavior
2. **Check CSS tokens**: Ensure design-tokens.css is loaded
3. **Check grid**: Tri-panel uses CSS Grid (requires modern browser)

---

## Development

### Local Development
```bash
npm run dev              # Start dev server (http://localhost:3000)
```

### Build for Production
```bash
npm run build            # Build static site
npm run preview          # Preview production build
```

### Testing
- **Desktop**: Chrome DevTools device emulation
- **Mobile**: Real device testing via `--host`
- **Accessibility**: Enable reduced motion in OS settings
- **Performance**: Run Lighthouse audit

---

## Future Enhancements

### Optional Additions
1. **Video demo**: Replace hero screenshot with demo video
2. **Customer testimonials**: Add quotes from real users
3. **Interactive demos**: Clickable UI prototypes
4. **Blog/Changelog**: Link to product updates
5. **Pricing page**: Add `/pricing` route
6. **Analytics**: Plausible or Fathom integration

### Advanced Animations
1. **Lottie animations**: Replace static swatches with animated icons
2. **Canvas effects**: Particle effects or gradient animations
3. **WebGL**: 3D product visualization
4. **Scroll-linked video**: Video scrubs with scroll position

---

## Credits

**Design System**: Workbench Design System v1.0
**Animations**: GSAP 3.x + ScrollTrigger
**Framework**: Nuxt 3.21.0
**Fonts**: Inter (Google Fonts) + JetBrains Mono

Built for **BetterSignShop** | Developed with [Claude Code](https://claude.com/claude-code)
