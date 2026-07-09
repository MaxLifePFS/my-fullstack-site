# MaxLife Academy — Business Website

A bilingual (English / 中文) marketing website for **MaxLife Academy of Personal Finance Science** (万福财商学堂), built from the content at sites.google.com/view/maxfund.

## Files

| File | Purpose |
|------|---------|
| `index.html` | The entire site (single page, all sections) |
| `css/styles.css` | Design system — navy/gold theme, responsive layout |
| `js/main.js` | Language toggle, mobile menu, scroll animations |

## View Locally

Open `index.html` directly in a browser, or run a local server:

```
python -m http.server 8317
```

then visit http://localhost:8317

## Features

- **EN / 中文 toggle** — remembers the visitor's choice; auto-detects Chinese browsers
- **Calls to action throughout** — free Calendly consultation (calendly.com/timbao) and free 9Fortunes membership signup (sponsor ID zz72260)
- **Sections:** Hero with the Universal Wealth Equation, trust stats, Why Us, 8-lever services grid, products (MaxLife FIUL, MaxRetire FIA + 7 more), free education, franchise opportunity, FAQ accordion, final CTA, footer with compliance disclaimer
- **Fully responsive** — desktop, tablet, and phone layouts
- No build step, no dependencies — deploys anywhere

## Deploy (free options)

- **Netlify / Vercel:** drag-and-drop the folder, done
- **GitHub Pages:** push to a repo, enable Pages
- **Cloudflare Pages:** connect the repo or direct upload

## Editing Content

All text lives in `index.html`. Every piece of copy appears twice:

```html
<span class="en">English text</span><span class="zh">中文文本</span>
```

Edit both spans to keep the two languages in sync.
