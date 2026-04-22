# `claude-plugins-site` — generic landing shell

**Date:** 2026-04-22
**Status:** Design approved, awaiting spec review before implementation plan

## Purpose

Extract the landing-page shell of `lawpowers/site` into a standalone Astro package so that sibling plugin repos (`businesspowers`, and future `*powers` repos) can produce a full landing page by supplying data only: brand, repo URL, plugin list, sources, locale dictionaries. The shell owns layout, components, SEO plumbing, i18n scaffolding, and design tokens. Consumers own deployment config, content, and any overrides.

## Goals

- **One rendering implementation.** Bug fixes, SEO improvements, and design updates land in one repo and reach every consumer by bumping a dependency.
- **Thin consumers.** A new `*powers` site should be reachable in roughly one `site/config.ts`, three `locales/*.ts` files, and one `[locale]/index.astro` that imports `PageShell`.
- **Compile-time translation safety.** Missing translation keys — shell-level or plugin-specific agent/skill labels — must be caught by `astro check`, not at runtime.
- **Slot-based override surface.** Any section (`hero`, `plugins`, `install`, `principles`, `sources`, `disclaimer`, `footer`, `nav`) can be replaced by a consumer-supplied component via a named slot, falling back to the shell default when absent.
- **Per-consumer deploy autonomy.** Each `*powers` repo keeps its own `astro.config.mjs`, `firebase.json`, OG image script, and hosting target. The shell does not own deployment.
- **N plugin cards, not fixed to ua+pl.** Consumers declare an arbitrary array of plugins with arbitrary jurisdiction / domain codes. No country-specific assumptions in shell code.
- **N locales, not fixed to en/ua/pl.** Consumers declare their locale set. Shell provides presets for the common mappings (hreflang, OG locale).

## Non-goals

- A CLI or generator (`create-claude-plugins-site`). v1 is just a library; consumers scaffold by hand or by copying an example.
- Runtime configuration. All config is evaluated at build time.
- Dark-mode palette per-consumer. Shell ships one token set; consumers override individual CSS custom properties in their own stylesheet.
- MDX pages, blog, search, analytics. Out of scope.
- A runtime JS framework integration (React/Vue/Svelte). Astro's `.astro` + inline `<script>` stays, same rule as lawpowers today.
- Publishing to npm. Phase 1 uses local `file:` links. Registry publish is a later, unblocked decision.

## Out of scope for this spec

Lawpowers migration to the shell and businesspowers site scaffolding are separate, follow-on projects. They inform the API but are not delivered here. Only the shell package is in scope for implementation.

## Distribution

**Phase 1:** Local file link. Consumers depend on the shell via `"claude-plugins-site": "file:../../claude-plugins-site"` in `package.json`. Both current consumers live under `/Users/yurii/Projects/` alongside `claude-plugins-site`, so this is a one-line change per consumer.

**Phase 2 (not in this spec):** Pin to a git tag: `"claude-plugins-site": "github:crankshift/claude-plugins-site#v1.0.0"`. Registry publish is a further option if/when a third consumer appears outside this machine.

No workspace manifest, no pnpm workspace wiring. Shell and consumers stay as independent repos, connected only by the `file:` path during phase 1.

## Package shape

```
claude-plugins-site/
  package.json
  tsconfig.json
  astro.config.mjs                # minimal, only for the package's own playground/dev
  src/
    index.ts                      # public re-exports (components, helpers, types)
    types.ts                      # ShellTranslation, Plugin, SiteConfig, LocaleSpec
    i18n/
      index.ts                    # getT, isLang, HREFLANG_PRESETS, OG_LOCALE_PRESETS
    layouts/
      BaseLayout.astro            # <html>, <head> (SEO/OG/JSON-LD/hreflang/theme bootstrap), <body>
      PageShell.astro             # BaseLayout + named slots for every section
    components/
      Nav.astro
      Hero.astro
      Plugins.astro
      PluginCard.astro
      Install.astro
      Principles.astro
      Sources.astro
      Disclaimer.astro
      Footer.astro
      CopyButton.astro
      BrandMark.astro
      RedirectShell.astro         # consumer's /index.astro — noindex + meta-refresh + inline JS that picks a locale from site.locales using navigator.languages
    styles/
      global.css                  # CSS custom properties (oklch), typography, containers
  package/
    README.md                     # consumer-facing getting-started
  docs/
    superpowers/specs/            # this file + future design docs
  dev/                            # optional playground that consumes its own package
    src/config.ts
    src/locales/{en,ua,pl}.ts
    src/pages/[locale]/index.astro
    public/og.png
```

### `package.json` exports

```json
{
  "name": "claude-plugins-site",
  "type": "module",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./i18n": "./src/i18n/index.ts",
    "./types": "./src/types.ts",
    "./styles/global.css": "./src/styles/global.css",
    "./components/*": "./src/components/*",
    "./layouts/*": "./src/layouts/*"
  },
  "peerDependencies": {
    "astro": "^6.1.8"
  },
  "dependencies": {}
}
```

Astro 6 supports `.astro` component imports from dependencies out of the box. The `exports` map lets consumers do `import { PageShell } from 'claude-plugins-site'` and `import 'claude-plugins-site/styles/global.css'` without any build step inside the shell package — source files are consumed directly by the consumer's Astro/Vite build.

## Public API

### Top-level exports (`src/index.ts`)

```ts
// Layouts
export { default as BaseLayout } from './layouts/BaseLayout.astro'
export { default as PageShell } from './layouts/PageShell.astro'

// Components
export { default as Nav } from './components/Nav.astro'
export { default as Hero } from './components/Hero.astro'
export { default as Plugins } from './components/Plugins.astro'
export { default as PluginCard } from './components/PluginCard.astro'
export { default as Install } from './components/Install.astro'
export { default as Principles } from './components/Principles.astro'
export { default as Sources } from './components/Sources.astro'
export { default as Disclaimer } from './components/Disclaimer.astro'
export { default as Footer } from './components/Footer.astro'
export { default as CopyButton } from './components/CopyButton.astro'
export { default as BrandMark } from './components/BrandMark.astro'
export { default as RedirectShell } from './components/RedirectShell.astro'

// Types + helpers (also available at 'claude-plugins-site/types' and '/i18n')
export type { ShellTranslation, Plugin, SiteConfig, LocaleSpec, Source } from './types'
export { getT, isLang, HREFLANG_PRESETS, OG_LOCALE_PRESETS } from './i18n'
```

### Types (`src/types.ts`)

```ts
export interface LocaleSpec {
  /** URL path segment, e.g. 'en', 'ua', 'pl' */
  code: string
  /** ISO 639-1 for hreflang + <html lang>. e.g. 'uk' for Ukrainian */
  hreflang: string
  /** Open Graph locale, e.g. 'uk_UA' */
  ogLocale: string
  /** Native name for the language switcher, e.g. 'EN', 'УКР', 'PL' */
  displayName: string
}

export interface Source {
  name: string
  url: string
}

export interface Plugin<
  Code extends string = string,
  Agent extends string = string,
  Skill extends string = string,
> {
  /** Command prefix + URL fragment. e.g. 'ua', 'pl' */
  code: Code
  /** Agent IDs in this plugin — typed tuple so locale dicts can `satisfies Record<Agent, string>` */
  agents: readonly Agent[]
  /** Skill IDs in this plugin */
  skills: readonly Skill[]
  /** Primary-source list rendered in the Sources section, scoped per plugin */
  sources: readonly Source[]
  /** Optional flag/logo slot. Astro component or SVG path. If omitted, PluginCard renders without it. */
  flag?: unknown
}

export interface SiteConfig<
  Codes extends string = string,
  Locales extends string = string,
> {
  /** Brand name, e.g. 'lawpowers'. Used in title, OG, footer, JSON-LD. */
  brand: string
  /** Short tagline under brand in hero / footer */
  tagline?: string
  /** 'crankshift/lawpowers' — used to derive GitHub URLs, marketplace command, JSON-LD sameAs. */
  repo: string
  /** Canonical production URL, no trailing slash. e.g. 'https://lawpowers.web.app' */
  url: string
  /** Path to OG image, defaults to '/og.png' */
  ogImage?: string
  /** Theme accent color override (CSS value applied as --accent on :root). Optional. */
  accent?: string
  /** Locale set. First or explicitly-flagged one is default. */
  defaultLocale: Locales
  locales: readonly LocaleSpec[]
  /** Plugin cards to render in the Plugins section. */
  plugins: readonly Plugin[]
  /** Marketplace add command. Default: `/plugin marketplace add <repo>`. */
  marketplaceInstall?: string
  /** Slug used in per-plugin install commands, i.e. `/plugin install <code>@<slug>`. Default: last path segment of `repo`. */
  marketplaceSlug?: string
  /** Reload command. Default: '/reload-plugins'. */
  reloadCmd?: string
}

/**
 * Fixed, shell-owned locale keys. Consumers declare a larger Translation that
 * extends this with plugin-specific agent / skill label maps.
 */
export interface ShellTranslation {
  locale: string
  seo: { title: string; description: string }
  nav: {
    plugins: string
    install: string
    principles: string
    sources: string
    repo: string
  }
  hero: {
    eyebrow: string
    title_a: string
    title_b: string
    title_c: string
    sub: string
    install_label: string
    install_hint: string
    install_done: string
    install_copy: string
    no_claude_prefix: string
    get_claude_code: string
    cta_primary: string
    cta_secondary: string
    stat_plugins: string
    stat_agents: string
    stat_skills: string
    stat_license: string
  }
  plugins: {
    section_eyebrow: string
    section_title: string
    section_sub: string
    install_in: string
    docs: string
    agents: string
    skills: string
    lang: string
    commands: string
  }
  install: {
    eyebrow: string
    title: string
    sub: string
    step1: string
    step2: string
    pick: string
    prereq_heading: string
    prereq_sub: string
    verify_line: string
    cli_title: string
    cli_body: string
    cli_cta: string
    desktop_title: string
    desktop_body: string
    desktop_cta: string
    vscode_badge: string
    vscode_title: string
    vscode_body: string
    vscode_step1: string
    vscode_step2: string
    vscode_cta: string
  }
  principles: {
    eyebrow: string
    title: string
    items: Array<{ k: string; v: string }>
  }
  sources: {
    eyebrow: string
    title: string
    sub: string
    /** One heading per plugin code. Consumer provides `{ ua: 'Ukraine', pl: 'Poland' }` etc. */
    headings: Record<string, string>
  }
  disclaimer: { tag: string; title: string; body: string }
  footer: {
    tagline: string
    links_title: string
    repo: string
    releases: string
    changelog: string
    license: string
    plugins_title: string
    legal_title: string
    rights: string
  }
  a11y: {
    switch_lang: string
    toggle_theme_to_light: string
    toggle_theme_to_dark: string
    brand_home: string
  }
  /** Per-plugin display metadata, keyed by plugin code. */
  plugin_meta: Record<string, { name: string; tag: string; lang_value: string }>
  /** Per-plugin agent label maps. Consumer uses `satisfies Record<AgentId, string>` on each entry. */
  agents: Record<string, Record<string, string>>
  /** Per-plugin skill label maps. */
  skills: Record<string, Record<string, string>>
}
```

### i18n helpers (`src/i18n/index.ts`)

```ts
export const HREFLANG_PRESETS = {
  en: 'en', ua: 'uk', pl: 'pl',
  de: 'de', fr: 'fr', es: 'es', it: 'it', pt: 'pt',
  ja: 'ja', zh: 'zh', ko: 'ko', ru: 'ru',
} as const

export const OG_LOCALE_PRESETS = {
  en: 'en_US', ua: 'uk_UA', pl: 'pl_PL',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', it: 'it_IT', pt: 'pt_PT',
  ja: 'ja_JP', zh: 'zh_CN', ko: 'ko_KR', ru: 'ru_RU',
} as const

export function isLang<L extends string>(
  value: string | undefined,
  locales: readonly { code: L }[],
): value is L {
  if (value === undefined) return false
  return locales.some((l) => l.code === value)
}

export function getT<T>(
  lang: string,
  dicts: Record<string, T>,
): T {
  const dict = dicts[lang]
  if (!dict) throw new Error(`No dictionary for locale: ${lang}`)
  return dict
}
```

Consumers wire their own dicts:

```ts
// lawpowers/site/src/locales/index.ts
import { en } from './en'
import { ua } from './ua'
import { pl } from './pl'
export const dicts = { en, ua, pl }
```

### `BaseLayout.astro` props

```ts
interface Props {
  lang: string
  t: ShellTranslation
  site: SiteConfig
}
```

Renders:
- `<!doctype html>` with `<html lang={hreflang(lang)} data-theme="light">`
- `<title>`, `<meta description>`, `<link rel="canonical">` from `t.seo` + `site.url`
- `hreflang` alternate links for every `site.locales` entry + `x-default` → `${site.url}/${site.defaultLocale}/`
- OG + Twitter tags using `site.brand`, `site.ogImage || '/og.png'`
- `<meta name="theme-color">` for light/dark (reads tokens from CSS)
- Inline `is:inline` theme-bootstrap script (keyed per-site: `localStorage.getItem('cps-theme')` with fallback), runs before paint
- JSON-LD `WebSite` + `Organization` graph from `site.brand`, `site.url`, `site.repo`
- Font preconnect + Google Fonts link (Instrument Serif / Inter / JetBrains Mono — shell-chosen, not configurable in v1)
- Favicon (SVG data-URL default, consumer overrides via their own `<link rel="icon">` in a slot if needed — deferred to v2 if demanded)
- Optional `--accent` inline `<style>` override when `site.accent` is set
- `<slot />` for body content

### `PageShell.astro` props and slots

```ts
interface Props {
  lang: string
  t: ShellTranslation
  site: SiteConfig
}
```

Composition (fallbacks shown):

```astro
<BaseLayout lang={lang} t={t} site={site}>
  <slot name="nav">
    <Nav lang={lang} t={t} site={site} />
  </slot>
  <main>
    <slot name="hero">
      <Hero t={t} site={site} />
    </slot>
    <slot name="plugins">
      <Plugins t={t} site={site} />
    </slot>
    <slot name="install">
      <Install t={t} site={site} />
    </slot>
    <slot name="principles">
      <Principles t={t} />
    </slot>
    <slot name="sources">
      <Sources t={t} site={site} />
    </slot>
    <slot name="disclaimer">
      <Disclaimer t={t} />
    </slot>
    <slot />
  </main>
  <slot name="footer">
    <Footer t={t} site={site} />
  </slot>
</BaseLayout>
```

- **Override a section:** consumer supplies `<MyHero slot="hero" />` inside `<PageShell>`.
- **Hide a section:** consumer supplies an empty fragment to its slot, e.g. `<Fragment slot="sources" />`.
- **Add sections:** anything in the default slot renders after `disclaimer`, before `footer`.
- **Reorder sections:** consumer skips `PageShell` entirely and hand-composes with individual components + `BaseLayout`. This escape hatch is intentional.

## Translation type discipline

The shell's `ShellTranslation` covers shell-owned copy and keeps plugin-specific maps typed as `Record<string, Record<string, string>>` — the shell cannot know agent IDs per consumer, so plugin-specific completeness is enforced on the consumer side.

Consumer pattern (`lawpowers/site/src/locales/en.ts`, example):

```ts
import type { ShellTranslation } from 'claude-plugins-site'
import type { UaAgent, PlAgent, UaSkill, PlSkill, PluginCode } from '../config'

export const en = {
  locale: 'EN',
  seo: { title: '…', description: '…' },
  nav: { /* … */ },
  hero: { /* … */ },
  plugins: { /* … */ },
  install: { /* … */ },
  principles: { eyebrow: '…', title: '…', items: [/* … */] },
  sources: {
    eyebrow: '…',
    title: '…',
    sub: '…',
    headings: { ua: 'Ukraine', pl: 'Poland' } satisfies Record<PluginCode, string>,
  },
  disclaimer: { /* … */ },
  footer: { /* … */ },
  a11y: { /* … */ },
  plugin_meta: {
    ua: { name: 'Ukraine', tag: '…', lang_value: 'Ukrainian' },
    pl: { name: 'Poland', tag: '…', lang_value: 'Polish' },
  } satisfies Record<PluginCode, { name: string; tag: string; lang_value: string }>,
  agents: {
    ua: { 'claim-drafter': 'Claim drafter', /* … */ } satisfies Record<UaAgent, string>,
    pl: { 'claim-drafter': 'Claim drafter', /* … */ } satisfies Record<PlAgent, string>,
  },
  skills: {
    ua: { /* … */ } satisfies Record<UaSkill, string>,
    pl: { /* … */ } satisfies Record<PlSkill, string>,
  },
} satisfies ShellTranslation

export type Translation = typeof en
```

Other locales (`ua.ts`, `pl.ts`) annotate with `: Translation`:

```ts
import type { Translation } from './en'

export const pl: Translation = {
  // compile error if any key from en is missing or mistyped
}
```

Three layers of type safety:
1. `satisfies ShellTranslation` on `en` — consumer cannot miss a shell key or fat-finger its shape.
2. `satisfies Record<PluginCode, …>` / `satisfies Record<UaAgent, string>` — consumer cannot miss a plugin code, agent ID, or skill ID.
3. `: Translation` on non-default locales — non-default dictionaries cannot drift from the source-of-truth shape.

## Consumer config example

```ts
// lawpowers/site/src/config.ts
import type { SiteConfig, Plugin } from 'claude-plugins-site'

export const UA_AGENTS = ['claim-drafter', 'response-drafter', /* … */] as const
export type UaAgent = typeof UA_AGENTS[number]

export const UA_SKILLS = ['fetching-zakon-rada', /* … */] as const
export type UaSkill = typeof UA_SKILLS[number]

export const PL_AGENTS = ['claim-drafter', /* … */] as const
export type PlAgent = typeof PL_AGENTS[number]

export const PL_SKILLS = ['fetching-isap-sejm', /* … */] as const
export type PlSkill = typeof PL_SKILLS[number]

export const PLUGIN_CODES = ['ua', 'pl'] as const
export type PluginCode = typeof PLUGIN_CODES[number]

export const LOCALE_CODES = ['en', 'ua', 'pl'] as const
export type LocaleCode = typeof LOCALE_CODES[number]

export const site: SiteConfig<PluginCode, LocaleCode> = {
  brand: 'lawpowers',
  repo: 'crankshift/lawpowers',
  url: 'https://lawpowers.web.app',
  defaultLocale: 'en',
  locales: [
    { code: 'en', hreflang: 'en', ogLocale: 'en_US', displayName: 'EN' },
    { code: 'ua', hreflang: 'uk', ogLocale: 'uk_UA', displayName: 'УКР' },
    { code: 'pl', hreflang: 'pl', ogLocale: 'pl_PL', displayName: 'PL' },
  ],
  plugins: [
    {
      code: 'ua',
      agents: UA_AGENTS,
      skills: UA_SKILLS,
      sources: [
        { name: 'zakon.rada.gov.ua', url: 'zakon.rada.gov.ua' },
        /* … */
      ],
    },
    {
      code: 'pl',
      agents: PL_AGENTS,
      skills: PL_SKILLS,
      sources: [
        { name: 'ISAP Sejm', url: 'isap.sejm.gov.pl' },
        /* … */
      ],
    },
  ],
}
```

## Consumer `[locale]/index.astro` example

```astro
---
import { PageShell, getT, isLang } from 'claude-plugins-site'
import { site } from '../../config'
import { dicts } from '../../locales'

export function getStaticPaths() {
  return site.locales.map(({ code }) => ({ params: { locale: code } }))
}
const { locale } = Astro.params
if (!isLang(locale, site.locales)) throw new Error(`Unsupported locale: ${locale}`)
const t = getT(locale, dicts)
---
<PageShell lang={locale} t={t} site={site} />
```

And `pages/index.astro` is a one-liner:

```astro
---
import { RedirectShell } from 'claude-plugins-site'
import { site } from '../config'
---
<RedirectShell site={site} />
```

## CSS theming

`src/styles/global.css` ships design tokens on `:root` and `:root[data-theme='dark']` — same oklch palette as lawpowers today. Import it once in `BaseLayout.astro`.

**Consumer override mechanism:**

1. **Accent color only:** pass `site.accent = 'oklch(…)'` — `BaseLayout` writes it as `--accent` inline on `<html>`, overriding the default.
2. **Broader override:** consumer's entry page or `[locale]/index.astro` imports `claude-plugins-site/styles/global.css` first, then a consumer-owned `./styles/overrides.css` — Astro preserves import order, so later `:root { --token: value }` rules win. Any CSS custom property in `global.css` can be overridden this way.

v1 ships one set of tokens. Palette forking (distinct light/dark token sets per consumer) is v2 if anyone needs it.

## SEO contract

The shell owns:
- `<title>`, `<meta description>` from `t.seo`
- Canonical URL: `${site.url}/${locale}/`
- `hreflang` alternates for every `site.locales` entry
- `x-default` → `${site.url}/${site.defaultLocale}/`
- OG tags: `og:type=website`, `og:site_name=site.brand`, localized `og:locale`, `og:image` from `site.ogImage || '/og.png'` with declared dimensions
- Twitter `summary_large_image` mirror of OG
- JSON-LD `WebSite` + `Organization` graph with `site.brand`, `site.url`, `site.repo` (→ `sameAs`)
- `theme-color` light + dark

The sitemap integration is a **consumer-level** concern — each `astro.config.mjs` configures `@astrojs/sitemap` with its own locale map and its own `/` filter. Shell does not attempt to abstract `astro.config.mjs`.

## Installation commands

`Install.astro` and `PluginCard.astro` derive commands from `site`:
- Marketplace add: `site.marketplaceInstall ?? \`/plugin marketplace add ${site.repo}\``
- Per-plugin install: `/plugin install ${plugin.code}@<marketplace-slug>`
  - Marketplace slug defaults to the last path segment of `site.repo` (e.g. `lawpowers`); override with `site.marketplaceSlug`.
- Reload: `site.reloadCmd ?? '/reload-plugins'`
- "Install all" tab: concatenates every plugin's install line.

All tabs are derived from `site.plugins` — no hardcoding. Tabs auto-include individual plugins plus an "All" tab when `site.plugins.length >= 2`.

## Open questions for implementation

Items to validate during the implementation plan, not blockers:

- **Astro package consumption:** confirm Astro 6 consumes `.astro` from `file:` linked deps without needing `vite.ssr.noExternal: ['claude-plugins-site']`. If it does need it, document in the consumer README and factor it out of the "one-line change per consumer" claim.
- **Locale dictionary union typing:** `ShellTranslation` widens `agents` / `skills` to `Record<string, Record<string, string>>` to avoid locking the shell to specific codes. Verify that consumer-side `satisfies Record<UaAgent, string>` narrowing on the inner records still produces the `astro check` failure we want when a key is missing.
- **`Plugin` generic erasure:** `SiteConfig.plugins: readonly Plugin[]` widens element types. Consumer's `config.ts` types stay precise via `as const` tuples in their own module, so this is fine — but confirm the shell's `Plugins.astro` iterates `site.plugins` with the looser type and doesn't accidentally require a narrower shape.

## Source code conventions (shell-internal)

- No runtime framework. `.astro` only, inline `<script>`, scoped `<style>`.
- Scripts use event delegation on `document` when components appear multiple times on a page (copy button pattern).
- Component files stay under ~450 lines; extract if they grow.
- Shell components accept `t` + `site` (or a subset) as props, never read from a global — consumers must be able to feed synthetic test data.
- CSS custom properties only. No Sass, no PostCSS plugins beyond Astro defaults.
- Every shell component that renders consumer-supplied strings treats them as plain text (no `set:html` except for the JSON-LD script in BaseLayout).

## Dev playground

`claude-plugins-site/dev/` is a minimal Astro site that consumes the shell from the same repo (via relative imports). It lets shell contributors run `pnpm --filter dev dev` and see every component rendered with lawpowers-shaped sample data without depending on the lawpowers repo. Not published, not deployed. The playground's locales and config are sample data, not the real lawpowers copy.

## Verification

Shell repo:
- `pnpm astro check` passes.
- `pnpm --filter dev build` succeeds and produces a working static site.
- Visual smoke check of the dev playground in a browser covers: language switcher, theme toggle, copy buttons, install-tab switcher, responsive breakpoints.

Consumer-side (verified during phase 2 — lawpowers migration):
- `pnpm astro check` passes in the consumer repo.
- `pnpm build` produces output byte-identical (or visually identical) to the pre-migration site.

No test framework yet. Visual parity + type checks are the bar for v1.

## Tech stack pins

| Thing | Version |
|---|---|
| Astro | `^6.1.8` (peer) |
| TypeScript | `~6.0.2` |
| Node | `>= 22.12.0` |
| Package manager | pnpm |

Shell has **no** runtime dependencies beyond Astro. `@astrojs/sitemap` stays in each consumer's `astro.config.mjs`.

## Rollout plan (informational — not delivered here)

Follow-on projects, separate specs:

1. **Lawpowers migration.** Replace `lawpowers/site/src/components/*.astro` and `BaseLayout.astro` with imports from the shell. Keep `config.ts` + `locales/*.ts` + `pages/[locale]/index.astro` + `astro.config.mjs` + `firebase.json`. Verify visual parity.
2. **Businesspowers site scaffold.** New `businesspowers/site/` authored against the shell from day one.
3. **Git-tag install.** Switch `file:` to `github:…#vX.Y.Z` once the shape stabilizes.
