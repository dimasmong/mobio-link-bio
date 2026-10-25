# Mobio Link Bio

A modern, high-performance personal Link in Bio web application featuring a **Full Premium Liquid Glass** aesthetic. Built with **React Router v7 Framework Mode (SSR)**, **Cloudflare Workers** edge runtime, and **Tailwind CSS v4**.

---

## 🌟 Highlights

- **Server-Side Rendered (SSR):** High-speed semantic HTML streaming directly from the Cloudflare Workers edge runtime via Web Streams API. Instant first-contentful paint and 100% SEO/crawler friendly.
- **Full Premium Liquid Glass Design System:**
  - Realistic multi-layered translucent glass panels (`backdrop-filter: blur(24px) saturate(180%)`).
  - Specular edge highlights (`inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95)`) and multi-layer diffuse floating shadows.
  - Frost Aurora aesthetic with lavender, ice blue, and soft violet refractions.
- **Fixed Fullscreen Background Engine:**
  - Supports 3 modes: CSS animated gradient mesh, static high-res image, or background video.
  - Built-in safe media playback: automatically pauses when hidden (tab switch) or when `prefers-reduced-motion` is detected.
  - Integrated adaptive readability overlay (`rgba(248, 250, 252, 0.45)`).
- **Customizable Cover Banner:**
  - High-res cover image or an animated specular Liquid Glass Aurora fallback banner.
- **Dedicated Profile Glass Card:**
  - Elegant circular avatar with polished liquid glass ring and automatic monogram initials fallback.
  - Pure profile presentation: name, handle, location, and bio ONLY (strictly separated from links and actions).
- **Single-Column Vertical Link List:**
  - All regular links are rendered in a clean, thumb-friendly single vertical column on **all screen sizes** (mobile, tablet, desktop).
  - Smooth hover sheen, platform-specific iconography, and clear external link indicators.
- **Floating Navigation Dock:**
  - **Desktop:** Floating top pill bar.
  - **Mobile:** Floating bottom capsule dock that compacts gracefully on scroll down.
  - Dynamic active section tracking via `IntersectionObserver` with smooth scrolling to `#home`, `#explore`, and `#contact`.
- **Modular Explore Section (`#explore`):**
  - Project cards with tech stack tags and live external links.
  - Interactive photo gallery with accessible Liquid Glass Lightbox modal (keyboard navigation, Escape key close, and backdrop blur).
  - Music playlist previews, game showcase cards, and reading notes.
- **Direct Action Contact Section (`#contact`):**
  - One-click contact cards for Email, WhatsApp, Telegram, and Instagram (no fake backend forms).
- **Dwibahasa / Bilingual Switcher:**
  - Seamless toggle between Bahasa Indonesia (`ID`) and English (`EN`) across all components.
- **Self-Hosted MOBIO Studio (`/studio`):**
  - **Zero Trust Security:** Protected by Cloudflare Access with Email OTP and native Web Crypto RS256 JWKS verification.
  - **Content Management:** Fully visual editors for Profile, Links, and Direct Action Contacts.
  - **Appearance Studio:** Customize theme presets, Liquid Glass intensities, custom background positioning/scale, and upload media to Cloudflare R2.
  - **Explore Editor (10 Content Models):** Manage Projects, Galleries, Videos, Audio playlists, Games, Reviews, Notes, Links, and Custom blocks.
  - **Privacy-First Click Monitor:** Built-in link telemetry via first-party redirect (`/go/:linkId`), SHA-256 user-agent hashing, sanitized referrers, and zero PII collection.
  - **Atomic Publishing:** Save edits to isolated draft tables in Cloudflare D1; promote atomically to public production in a single transaction with instant rollback (Discard).
  - **Zero-Downtime Fallback:** Seamlessly falls back to neutral TypeScript defaults if database connectivity is unavailable.
- **Single Source of Truth Configuration:**
  - All profile details, background options, cover banner, links, explore items, and contact methods are centralized in [app/data/profile.ts](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/app/data/profile.ts).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Router v7 (Framework Mode with SSR) |
| **UI Library** | React 19 |
| **Edge Runtime** | Cloudflare Workers (`workerd` simulation via Vite plugin) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + Custom Liquid Glass Tokens |
| **Language** | TypeScript (Strict mode enabled) |
| **Build Tool** | Vite v7 + `@cloudflare/vite-plugin` |
| **Verification** | Playwright Browser Automation |
| **Package Manager** | npm |

---

## 📁 Project Structure

```text
mobio-link-bio/
├── app/
│   ├── components/
│   │   ├── Icons.tsx               # Scalable accessible SVG icon library
│   │   ├── FixedBackground.tsx     # Fullscreen background (mesh / image / video)
│   │   ├── CoverBanner.tsx         # Customizable cover banner with aurora fallback
│   │   ├── ProfileGlassCard.tsx    # Dedicated profile card (avatar, name, bio)
│   │   ├── VerticalLinkList.tsx    # Single-column vertical link card list
│   │   ├── ExploreSection.tsx      # Modular explore cards + Lightbox modal
│   │   ├── ContactSection.tsx      # Direct action contact cards
│   │   ├── FloatingNav.tsx         # Responsive floating dock (Home / Explore / Contact)
│   │   ├── LanguageToggle.tsx      # Liquid glass bilingual toggle (ID / EN)
│   │   └── Footer.tsx              # Configurable personal copyright footer
│   ├── data/
│   │   └── profile.ts              # Single source of truth configuration
│   ├── routes/
│   │   ├── home.tsx                # Unified single-page Liquid Glass view
│   │   └── api.public.health.ts    # Service health endpoint (GET /api/public/health)
│   ├── app.css                     # Liquid glass material tokens, aurora mesh, keyframes
│   ├── entry.server.tsx            # Cloudflare SSR streaming request pipeline
│   ├── root.tsx                    # Root HTML document and font definitions
│   └── routes.ts                   # React Router route definitions
├── workers/
│   └── app.ts                      # Cloudflare Worker fetch handler
├── docs/
│   └── ARCHITECTURE.md             # Technical architecture & material system spec
├── public/
│   ├── images/                     # Local avatar, cover, and gallery assets
│   └── favicon.ico                 # Browser favicon
├── scripts/
│   └── test-liquid-glass.mjs       # Comprehensive Playwright end-to-end verification
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # Strict TypeScript configuration
└── wrangler.json                   # Cloudflare Workers deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** v20.x or v22.x LTS
- **npm:** v10.x or higher

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

Run the local development server with Cloudflare Workers emulation:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Typecheck & Production Build

```bash
# Verify TypeScript types
npm run typecheck

# Build for Cloudflare Workers
npm run build
```

---

## 🛠️ Self-Hosted MOBIO Studio Setup

To set up your own sovereign self-hosted admin dashboard with Cloudflare D1, Cloudflare R2, and Cloudflare Access (Email OTP):

👉 Read the complete guide: [docs/STUDIO-SETUP.md](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/docs/STUDIO-SETUP.md)

---

## 🎨 Personalization

To personalize the website, open:
👉 [app/data/profile.ts](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/app/data/profile.ts)

Consult [PERSONALIZATION-GUIDE.md](file:///c:/Users/Dimas%20Mong/Downloads/Project/Link%20in%20Bio/PERSONALIZATION-GUIDE.md) for full step-by-step instructions.

---

## 📄 License

MIT © [Dimas Mong](https://github.com/dimasmong)
