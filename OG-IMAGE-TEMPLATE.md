# Open Graph Image Template

## Specifications

Create an Open Graph image for social media sharing with these exact dimensions:

**Dimensions:** 1200×630px
**Format:** PNG or JPG
**File size:** < 1MB
**Location:** `/public/og-image.png`

---

## Design Guidelines

Use the Workbench design system for visual consistency:

### Colors
- **Background**: `#161616` (dark mode) or `#F4F4F4` (light mode)
- **Text**: `#E2E2E2` (dark) or `#1C1C1C` (light)
- **Accent**: Pure neutral grays only (no tint)

### Typography
- **Headline**: Inter, 600 weight, ~72px
- **Subheadline**: Inter, 400 weight, ~32px
- **Labels**: JetBrains Mono, 400 weight, ~18px

### Layout
```
┌─────────────────────────────────────────┐
│                                         │
│   WORKBENCH (logo/wordmark)            │
│                                         │
│   Operational clarity                   │
│   for project teams.                    │
│                                         │
│   Document authoring, tasks, and AI     │
│   in one minimal interface.             │
│                                         │
│   workbench.app                         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Content Suggestions

### Option 1: Hero Message
**Headline:** "Operational clarity for project teams."
**Subheadline:** "Document authoring, task management, and AI collaboration in one minimal interface."
**URL:** workbench.app

### Option 2: Feature Focus
**Headline:** "Everything is a document"
**Subheadline:** "No database maze. No separate trackers. Just write, and tasks appear automatically."
**URL:** workbench.app

### Option 3: Stats
**Layout:** Grid of key stats
- 150ms avg transition time
- 3 task views, one index
- 0 drop shadows used
- 100% grayscale palette

---

## Tools for Creation

### Figma Template
1. Create 1200×630px frame
2. Use Inter (Google Fonts) for body text
3. Use JetBrains Mono for mono text
4. Export as PNG at 2x quality

### Canva Template
1. Use "Twitter Post" template (1200×630)
2. Upload Inter and JetBrains Mono fonts
3. Match color palette exactly
4. Export as PNG

### Code-Based (HTML → Image)
Use a screenshot tool or service like:
- **Puppeteer**: Render HTML template to PNG
- **Satori** (Vercel): Convert React component to image
- **Cloudinary**: Dynamic OG image generation

---

## Example HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=JetBrains+Mono:wght@400&display=swap');

    body {
      margin: 0;
      width: 1200px;
      height: 630px;
      background: #161616;
      color: #E2E2E2;
      font-family: 'Inter', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
      box-sizing: border-box;
    }

    .wordmark {
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 500;
      margin-bottom: 60px;
      opacity: 0.8;
    }

    h1 {
      font-size: 72px;
      font-weight: 600;
      line-height: 1.1;
      margin: 0 0 32px 0;
      max-width: 900px;
    }

    p {
      font-size: 32px;
      font-weight: 400;
      line-height: 1.4;
      margin: 0 0 60px 0;
      max-width: 800px;
      opacity: 0.7;
    }

    .url {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      opacity: 0.5;
    }
  </style>
</head>
<body>
  <div class="wordmark">workbench</div>
  <h1>Operational clarity for project teams.</h1>
  <p>Document authoring, task management, and AI collaboration in one minimal interface.</p>
  <div class="url">workbench.app</div>
</body>
</html>
```

---

## Usage in Nuxt

Once created, add to `/public/og-image.png` and update meta tags:

```typescript
// pages/index.vue
useHead({
  meta: [
    { property: 'og:image', content: 'https://workbench.app/og-image.png' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:image', content: 'https://workbench.app/og-image.png' }
  ]
});
```

---

## Testing

Before deployment, test the OG image:

1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
4. **Social Share Preview**: https://socialsharepreview.com/

---

## Checklist

- [ ] Image dimensions are exactly 1200×630px
- [ ] File size is under 1MB
- [ ] Colors match design system (pure neutral grays)
- [ ] Typography uses Inter + JetBrains Mono
- [ ] Text is readable at thumbnail size
- [ ] Saved as `/public/og-image.png`
- [ ] Meta tags updated with correct URL
- [ ] Tested with Facebook Debugger
- [ ] Tested with Twitter Card Validator
- [ ] Looks good on mobile preview

---

## Alternative: Dynamic OG Images

For personalized OG images (per page), consider:

1. **Vercel OG Image**: Generate images at build time
2. **Cloudinary**: URL-based image generation
3. **Puppeteer**: Server-side screenshot on-demand

Example with Vercel OG:
```typescript
// pages/api/og.tsx
import { ImageResponse } from '@vercel/og';

export default function handler() {
  return new ImageResponse(
    (
      <div style={{ /* ... */ }}>
        Operational clarity for project teams.
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

Then use: `https://workbench.app/api/og` as the og:image URL.
