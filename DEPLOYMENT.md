# Deployment Guide - Workbench Marketing Website

## Pre-Deployment Checklist

### 1. Content Review
- [ ] All copy reviewed and approved
- [ ] No placeholder text remains (search for "Lorem", "TODO", "TBD")
- [ ] All links tested and functional
- [ ] Contact information up to date
- [ ] Legal pages ready (Privacy Policy, Terms of Service)

### 2. Design & UX
- [ ] All screenshots display correctly in light and dark themes
- [ ] Animations tested across browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive design verified (375px, 768px, 1024px, 1440px+)
- [ ] Theme toggle works correctly
- [ ] Reduced motion preferences respected

### 3. Performance
- [ ] Lighthouse audit passed (Performance > 90, Accessibility 100, SEO 100)
- [ ] Bundle size verified (< 150KB gzipped)
- [ ] Images optimized (WebP with fallbacks)
- [ ] Fonts preloaded
- [ ] Critical CSS inlined (if applicable)

### 4. SEO & Social
- [ ] Meta tags complete (title, description, keywords)
- [ ] Open Graph tags set up
- [ ] Twitter Card tags configured
- [ ] Structured data (JSON-LD) validated at [schema.org validator](https://validator.schema.org/)
- [ ] Canonical URLs set
- [ ] Sitemap generated (if applicable)
- [ ] robots.txt configured

### 5. Analytics & Tracking
- [ ] Plausible analytics script added (or analytics provider of choice)
- [ ] Domain added to Plausible dashboard
- [ ] A/B testing variants configured
- [ ] Custom events tracked (CTA clicks, form submissions, scroll depth)
- [ ] Privacy policy updated with analytics mention

### 6. Technical
- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] No console errors in production build
- [ ] Environment variables documented and configured
- [ ] Auth flow tested (unauthenticated → marketing → sign up → app)
- [ ] Error pages styled (404, 500)
- [ ] HTTPS enforced
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)

---

## Environment Variables

### Required for Production

```bash
# Base URL for canonical links and Open Graph
NUXT_PUBLIC_SITE_URL=https://workbench.app

# Analytics (optional but recommended)
# Add Plausible script tag to nuxt.config.ts instead

# Auth (Supabase or local)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Features (optional)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

### Add to `.env.production`

```bash
NODE_ENV=production
NUXT_PUBLIC_SITE_URL=https://workbench.app
```

---

## Build & Deployment

### 1. Local Production Build

Test the production build locally before deploying:

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4000` and verify:
- Marketing page loads
- All animations work
- Theme toggle functions
- CTA buttons link to `/login`
- Authenticated users redirect to `/projects`

### 2. Deploy to Vercel (Recommended)

Vercel is optimized for Nuxt 3 applications.

#### First-Time Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time will prompt for configuration)
vercel
```

#### Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nuxtjs",
  "outputDirectory": ".output/public"
}
```

#### Environment Variables

Add via Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables from `.env.production`
3. Set scope to "Production"

#### Deploy

```bash
# Deploy to production
vercel --prod
```

### 3. Deploy to Netlify

#### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

#### Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

### 4. Deploy to Cloudflare Pages

```bash
# Build
npm run build

# Upload .output/public directory to Cloudflare Pages
# Via dashboard or CLI
```

Build settings:
- Build command: `npm run build`
- Build output directory: `.output/public`
- Node version: 18 or higher

---

## Post-Deployment Verification

### Immediate Checks (< 5 minutes)

```bash
# 1. Check site loads
curl -I https://workbench.app

# 2. Test auth flow
# Visit site → Click "Start working" → Should reach /login

# 3. Test authenticated redirect
# Login → Visit / → Should redirect to /projects
```

### Full Testing (30 minutes)

#### Desktop Testing
- [ ] Visit `https://workbench.app`
- [ ] Verify hero animation plays
- [ ] Scroll through all sections
- [ ] Click all navigation links
- [ ] Test theme toggle (dark ↔ light)
- [ ] Click primary CTA → reach login
- [ ] Test scroll-triggered animations
- [ ] Check screenshots render correctly

#### Mobile Testing (iPhone/Android)
- [ ] Visit site on mobile device
- [ ] Verify single-column layout
- [ ] Test touch interactions
- [ ] Check animation performance
- [ ] Test navigation menu (if mobile nav implemented)

#### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)

#### Performance
- [ ] Run Lighthouse audit (Desktop + Mobile)
- [ ] Check Core Web Vitals (LCP, FID, CLS)
- [ ] Verify PageSpeed Insights score

#### SEO
- [ ] Search `site:workbench.app` on Google (after indexing)
- [ ] Verify meta tags with [OpenGraph.xyz](https://www.opengraph.xyz/)
- [ ] Test structured data with [Rich Results Test](https://search.google.com/test/rich-results)

---

## Analytics Setup

### 1. Add Plausible Script

In `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          defer: true,
          'data-domain': 'workbench.app',
          src: 'https://plausible.io/js/script.js'
        }
      ]
    }
  }
})
```

### 2. Configure Plausible Dashboard

1. Create account at [plausible.io](https://plausible.io)
2. Add domain: `workbench.app`
3. Enable custom events:
   - `CTA Click`
   - `Theme Toggle`
   - `Scroll Depth`
   - `AB Test Assigned`
   - `AB Test Conversion`

### 3. Set Goals

In Plausible dashboard:
- **Pageviews**: `/login` (signup initiated)
- **Custom Events**: `CTA Click`, `AB Test Conversion`

### 4. Share Dashboard (Optional)

Generate public link for stakeholders to view traffic data.

---

## A/B Testing Setup

The A/B testing framework is already implemented in `composables/useABTest.ts`.

### 1. Define Test Variants

Current implementation tests CTA copy variations. Default variants in code:

```typescript
const { getVariant, trackConversion } = useABTest('hero-cta');
const ctaText = getVariant(CTA_VARIATIONS.ACTION);
// Returns: "Start working", "Get started", or "Try now"
```

### 2. Track Conversions

On CTA click or signup completion:

```typescript
const { trackConversion } = useABTest('hero-cta');
trackConversion(); // Logs to Plausible
```

### 3. Analyze Results

After collecting data (min. 100 conversions per variant):

1. Go to Plausible dashboard
2. Filter by custom event: **"AB Test Conversion"**
3. Group by property: **"variant"**
4. Calculate conversion rate:
   ```
   Conversion Rate = (Conversions / Assignments) × 100
   ```

Example:
- Variant A: 120 assignments, 18 conversions = **15.0%**
- Variant B: 115 assignments, 26 conversions = **22.6%** ✅ Winner
- Variant C: 118 assignments, 20 conversions = **16.9%**

### 4. Implement Winner

Once statistically significant winner is identified:

1. Remove losing variants from code
2. Set winning variant as the single CTA
3. Start new test with variations of the winner

---

## Monitoring & Maintenance

### Performance Monitoring

**Tools:**
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) - Automated performance testing
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance analysis
- [DebugBear](https://www.debugbear.com/) - Continuous monitoring

**Set alerts for:**
- Performance score drops below 90
- First Contentful Paint > 2s
- Total Blocking Time > 300ms
- Cumulative Layout Shift > 0.1

### Error Tracking (Optional)

Consider adding:
- [Sentry](https://sentry.io/) - Error tracking and performance monitoring
- [LogRocket](https://logrocket.com/) - Session replay for debugging

### Regular Audits

**Weekly:**
- [ ] Check analytics for traffic trends
- [ ] Review A/B test performance
- [ ] Monitor error logs

**Monthly:**
- [ ] Run Lighthouse audit
- [ ] Update dependencies (`npm outdated`)
- [ ] Review and refresh content

**Quarterly:**
- [ ] Update screenshots with new features
- [ ] Refresh customer testimonials
- [ ] Review and optimize conversion funnels

---

## Rollback Plan

If critical issues are discovered post-deployment:

### Vercel

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Netlify

```bash
# View deployments
netlify deploys

# Restore previous deployment
netlify deploys:restore [deployment-id]
```

### Manual Rollback

1. Identify last working commit: `git log`
2. Revert to that commit: `git revert [commit-hash]`
3. Push and redeploy: `git push origin main`

---

## Troubleshooting

### Animations Not Working

**Symptoms:** Scroll animations don't trigger, hero animation doesn't play

**Fixes:**
1. Check browser console for GSAP errors
2. Verify GSAP installed: `npm list gsap`
3. Clear browser cache (Ctrl+Shift+R)
4. Check if user has reduced motion enabled
5. Verify JavaScript is not blocked

### Theme Toggle Not Working

**Symptoms:** Dark/light mode doesn't switch

**Fixes:**
1. Check localStorage access (may be blocked in private browsing)
2. Verify `useTheme()` composable is imported
3. Check for console errors related to theme
4. Clear localStorage: `localStorage.clear()`

### Screenshots Not Rendering

**Symptoms:** Screenshot components appear blank or broken

**Fixes:**
1. Check component imports in `pages/index.vue`
2. Verify design tokens loaded (`design-tokens.css`)
3. Check for CSS variable undefined errors in console
4. Test in incognito/private mode

### Poor Performance

**Symptoms:** Lighthouse score < 90, slow load times

**Fixes:**
1. Disable animations temporarily to isolate issue
2. Check Network tab for large resources
3. Verify GSAP is not loaded multiple times
4. Use `npm run build` to check bundle size
5. Implement code splitting for below-fold components

### Analytics Not Tracking

**Symptoms:** No events in Plausible dashboard

**Fixes:**
1. Verify Plausible script loaded (check Network tab)
2. Check correct domain in script tag
3. Test with `window.plausible` in console
4. Disable ad blockers
5. Check for CSP blocking script

---

## Security Checklist

Before going live:

- [ ] HTTPS enforced (no mixed content)
- [ ] Security headers configured:
  ```
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' plausible.io
  ```
- [ ] No API keys exposed in client-side code
- [ ] CORS configured correctly (if applicable)
- [ ] Rate limiting on API endpoints
- [ ] Input validation on all forms
- [ ] XSS protection enabled

---

## Success Metrics

Track these KPIs post-launch:

### Week 1 (Discovery)
- Unique visitors
- Bounce rate (target: < 40%)
- Average time on page (target: > 45s)
- CTA click-through rate

### Month 1 (Optimization)
- Conversion rate (marketing → signup)
- A/B test results
- Page load time (target: < 3s)
- Scroll depth (% reaching footer)

### Quarter 1 (Growth)
- Organic search traffic
- Return visitor rate
- Referral sources
- Feature interest (which sections get most engagement)

---

## Support & Updates

### Documentation
- **Marketing website**: [MARKETING.md](./MARKETING.md)
- **API coverage**: [docs/api-coverage.md](./docs/api-coverage.md)
- **Project instructions**: [CLAUDE.md](./CLAUDE.md)

### Updating Content

**To update CTA text:**
1. Edit `pages/index.vue`
2. Search for `"Start working"`
3. Replace with new copy
4. Commit and redeploy

**To add new features:**
1. Update screenshot components in `components/marketing/screenshots/`
2. Add new section to `pages/index.vue`
3. Update animations if needed
4. Test thoroughly before deploying

**To refresh testimonials:**
1. Edit `components/marketing/MarketingTestimonials.vue`
2. Update testimonial content and stats
3. Commit and redeploy

---

## Contact & Escalation

For deployment issues:
1. Check this guide and troubleshooting section
2. Review error logs in deployment platform
3. Test locally with `npm run build && npm run preview`
4. Consult Nuxt 3 deployment docs: [nuxt.com/docs/getting-started/deployment](https://nuxt.com/docs/getting-started/deployment)

---

## Final Launch Checklist

One hour before launch:

- [ ] All pre-deployment checks passed
- [ ] Production build tested locally
- [ ] Environment variables configured
- [ ] Analytics script added
- [ ] SSL certificate active
- [ ] DNS records propagated
- [ ] Backup of current site taken (if replacing existing site)
- [ ] Team notified of launch time
- [ ] Rollback plan ready

During launch:

- [ ] Deploy to production
- [ ] Verify site loads at primary domain
- [ ] Complete post-deployment verification checklist
- [ ] Monitor analytics for first traffic
- [ ] Watch for error logs

First 24 hours:

- [ ] Check analytics hourly
- [ ] Monitor error logs
- [ ] Review performance metrics
- [ ] Collect initial user feedback
- [ ] Document any issues and fixes

---

🚀 **Ready to launch!**

Built with [Claude Code](https://claude.com/claude-code) | Powered by Nuxt 3 + GSAP
