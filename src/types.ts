export interface LocaleSpec {
  code: string
  hreflang: string
  ogLocale: string
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
  code: Code
  agents: readonly Agent[]
  skills: readonly Skill[]
  sources: readonly Source[]
  flag?: unknown
}

export interface SiteConfig<
  Codes extends string = string,
  Locales extends string = string,
> {
  brand: string
  tagline?: string
  repo: string
  url: string
  ogImage?: string
  accent?: string
  defaultLocale: Locales
  locales: readonly LocaleSpec[]
  plugins: readonly Plugin[]
  marketplaceInstall?: string
  marketplaceSlug?: string
  reloadCmd?: string
}

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
  plugin_meta: Record<string, { name: string; tag: string; lang_value: string }>
  agents: Record<string, Record<string, string>>
  skills: Record<string, Record<string, string>>
}
