# Mobio Link Bio

A modern, high-performance personal Link in Bio web application featuring an elegant **Frost White Premium** aesthetic. Powered by **React Router v7 Framework Mode (SSR)** and the **Cloudflare Workers** edge runtime.

---

## Highlights

- **Server-Side Rendered (SSR):** Full semantic HTML streaming directly from the edge runtime using the Web Streams API. Instant first-contentful paint and search engine crawler friendly.
- **Frost White Premium Design:**
  - Crisp, translucent glassmorphism panels with subtle border lighting and soft shadows.
  - Carefully balanced violet accents and high-contrast typography meeting WCAG accessibility standards.
- **Floating Glass Profile Card:**
  - Displays avatar, name, handle, optional location, and bio.
  - Automatic monogram initials fallback if an avatar image is not configured or fails to load.
- **Detached Social Icons Bar:**
  - Social profiles sit outside the main profile card in an independent frosted pill navigation.
  - Inactive or unconfigured social links are automatically hidden.
- **Featured & Regular Link Cards:**
  - Featured link cards receive priority styling with a highlighted border and badge.
  - Responsive layout: single thumb-friendly column on mobile/tablet, expanding into an uncrowded 2-column grid on wide desktop screens.
  - Titles and descriptions wrap naturally without clipping.
- **Bilingual Ready (Indonesian & English):**
  - Seamless toggle between Bahasa Indonesia (`ID`) and English (`EN`) across the interface.
- **Single Source of Truth Configuration:**
  - All profile details, social icons, links, and footer copy are customized from a single file: `app/data/profile.ts`.
- **Public Health Endpoint:**
  - Read-only `GET /api/public/health` endpoint reporting service health.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | React Router v7 (Framework Mode with SSR) |
| **UI Library** | React 19 |
| **Runtime** | Cloudflare Workers (`workerd` simulation via Vite plugin) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) |
| **Language** | TypeScript (Strict mode enabled) |
| **Build Tool** | Vite v7 + `@cloudflare/vite-plugin` |
| **Package Manager** | npm |

---

## Project Structure

```text
mobio-link-bio/
├── app/
│   ├── components/
│   │   ├── Icons.tsx                 # Inline accessible SVG icons
│   │   ├── FloatingGlassProfile.tsx  # Floating glass profile card with initials fallback
│   │   ├── SocialIcons.tsx           # Detached social media navigation pill
│   │   ├── FeaturedLinkCard.tsx      # Highlighted featured link card
│   │   ├── LinkCard.tsx              # Standard responsive link card
│   │   ├── LanguageToggle.tsx        # Bilingual language switcher (ID / EN)
│   │   └── Footer.tsx                # Personal configurable footer
│   ├── data/
│   │   └── profile.ts                # Centralized profile & links configuration
│   ├── routes/
│   │   ├── home.tsx                  # SSR homepage route
│   │   └── api.public.health.ts      # Health check API endpoint
│   ├── app.css                       # Frost White design tokens & Tailwind v4
│   ├── entry.server.tsx              # Server-side streaming request handler
│   ├── root.tsx                      # Root HTML layout and meta definitions
│   └── routes.ts                     # React Router route registry
├── workers/
│   └── app.ts                        # Cloudflare Worker fetch entrypoint
├── docs/
│   └── ARCHITECTURE.md               # Technical architecture & integration map
├── public/
│   ├── images/                       # Directory for local avatar and media files
│   └── favicon.ico                   # Browser favicon
├── package.json                      # Project metadata & npm scripts
├── tsconfig.json                     # TypeScript root configuration
├── tsconfig.cloudflare.json          # TypeScript Worker environment configuration
├── vite.config.ts                    # Vite configuration
└── wrangler.json                     # Cloudflare Workers configuration
```

---

## Getting Started

### Prerequisites

- **Node.js:** v20.x or v22.x LTS (tested up to v24.x)
- **npm:** v10.x or v11.x

### Installation

Clone the repository and install dependencies:

```bash
npm install
```

### Development

Run the local development server with Cloudflare Workers simulation:

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Type Checking

Verify TypeScript strict types:

```bash
npm run typecheck
```

### Production Build

Create an optimized client and server bundle:

```bash
npm run build
```

Build outputs are saved to:
- `build/client`: Client-side static assets
- `build/server`: SSR worker script for Cloudflare Workers

---

## Personalization

All profile information is managed inside `app/data/profile.ts`:

1. **Profile Identity:** Set your name, username handle, and bio (in both Indonesian and English).
2. **Avatar Image:** Place your image inside `public/images/` (e.g. `public/images/avatar.jpg`) and set `avatarUrl: "/images/avatar.jpg"`. If left empty (`""`), the application will render an initials monogram.
3. **Social Media:** Populate the `socials` array with your profile URLs. Items with empty URLs (`""`) are automatically omitted.
4. **Link Cards:** Add your featured projects and external links to the `links` array. Each card supports title, description, category, and icon.
5. **Footer:** Customize copyright text or toggle footer visibility.

See [PERSONALIZATION-GUIDE.md](PERSONALIZATION-GUIDE.md) for a ready-to-use copy-paste template.

---

## Deployment (Cloudflare Workers)

This project is configured for Cloudflare Workers. When ready to publish live to Cloudflare:

1. Authenticate with your Cloudflare account:
   ```bash
   npx wrangler login
   ```
2. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```
