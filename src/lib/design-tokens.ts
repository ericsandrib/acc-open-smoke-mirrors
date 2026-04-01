/**
 * Design Tokens — TypeScript mirror of CSS custom properties
 *
 * This module provides type-safe access to the CSS variable-based design tokens
 * defined in src/styles/themes/*.css.  It does NOT hard-code colour values;
 * instead it stores the *names* of the CSS variables so that components can
 * read the current theme's value at runtime via `getTokenValue()`.
 *
 * Usage:
 *   import { getTokenValue, STATUS_COLORS } from '@/lib/design-tokens'
 *
 *   // Read the current theme's success fill colour
 *   const green = getTokenValue(STATUS_COLORS.success.fill)
 *
 *   // Use in inline styles (React Flow nodes, canvas, etc.)
 *   <div style={{ background: getTokenValue(BRAND_COLORS.primary.fill) }} />
 */

// ---------------------------------------------------------------------------
// Runtime helper
// ---------------------------------------------------------------------------

/**
 * Read a CSS custom property's computed value from :root.
 *
 * @param varName  The variable name **without** the leading `var()` wrapper,
 *                 e.g. `'--fill-success-primary'`.
 * @returns        The trimmed computed value string, or `''` if unavailable
 *                 (e.g. during SSR or in a test runner without a DOM).
 */
export function getTokenValue(varName: string): string {
  if (typeof document === 'undefined') return ''
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

// ---------------------------------------------------------------------------
// Status colours  (success / warning / danger / disabled)
// ---------------------------------------------------------------------------

export const STATUS_COLORS = {
  success: {
    fill: '--fill-success-primary',
    fillHover: '--fill-success-primary-hover',
    fillPressed: '--fill-success-primary-pressed',
    fillSecondary: '--fill-success-secondary',
    fillTertiary: '--fill-success-tertiary',
    text: '--text-success-primary',
    textOn: '--text-onsuccess-primary',
    border: '--border-success-primary',
    borderStrong: '--border-success-strong',
  },
  warning: {
    fill: '--fill-warning-primary',
    fillHover: '--fill-warning-primary-hover',
    fillPressed: '--fill-warning-primary-pressed',
    fillSecondary: '--fill-warning-secondary',
    fillTertiary: '--fill-warning-tertiary',
    text: '--text-warning-primary',
    textOn: '--text-onwarning-primary',
    border: '--border-warning-primary',
    borderStrong: '--border-warning-strong',
  },
  danger: {
    fill: '--fill-danger-primary',
    fillHover: '--fill-danger-primary-hover',
    fillPressed: '--fill-danger-primary-pressed',
    fillSecondary: '--fill-danger-secondary',
    fillTertiary: '--fill-danger-tertiary',
    text: '--text-danger-primary',
    textOn: '--text-ondanger-primary',
    border: '--border-danger-primary',
    borderStrong: '--border-danger-strong',
  },
  disabled: {
    fill: '--fill-disabled-primary',
    fillSecondary: '--fill-disabled-secondary',
    fillTertiary: '--fill-disabled-tertiary',
    text: '--text-disabled-primary',
  },
} as const

// ---------------------------------------------------------------------------
// Brand colours
// ---------------------------------------------------------------------------

export const BRAND_COLORS = {
  primary: {
    fill: '--fill-brand-primary',
    fillHover: '--fill-brand-primary-hover',
    fillPressed: '--fill-brand-primary-pressed',
    fillSecondary: '--fill-brand-secondary',
    fillTertiary: '--fill-brand-tertiary',
    text: '--text-brand-primary',
    textOn: '--text-onbrand-primary',
    border: '--border-brand-primary',
    borderStrong: '--border-brand-strong',
  },
  accent: {
    fill: '--fill-brand-accent-primary',
    fillHover: '--fill-brand-accent-primary-hover',
    fillPressed: '--fill-brand-accent-primary-pressed',
    fillSecondary: '--fill-brand-accent-secondary',
    fillTertiary: '--fill-brand-accent-tertiary',
    text: '--text-brand-accent-primary',
    textOn: '--text-onbrand-accent-primary',
    border: '--border-brand-accent-primary',
    borderStrong: '--border-brand-accent-strong',
  },
  inverse: {
    fill: '--fill-inverse-primary',
    fillHover: '--fill-inverse-primary-hover',
    fillPressed: '--fill-inverse-primary-pressed',
  },
} as const

// ---------------------------------------------------------------------------
// Neutral / surface colours
// ---------------------------------------------------------------------------

export const NEUTRAL_COLORS = {
  fill: {
    primary: '--fill-neutral-primary',
    primaryHover: '--fill-neutral-primary-hover',
    primaryPressed: '--fill-neutral-primary-pressed',
    secondary: '--fill-neutral-secondary',
    secondaryHover: '--fill-neutral-secondary-hover',
    secondaryPressed: '--fill-neutral-secondary-pressed',
    tertiary: '--fill-neutral-tertiary',
    tertiaryHover: '--fill-neutral-tertiary-hover',
    tertiaryPressed: '--fill-neutral-tertiary-pressed',
  },
  bg: {
    primary: '--bg-primary',
    secondary: '--bg-secondary',
    tertiary: '--bg-tertiary',
  },
  text: {
    primary: '--text-primary',
    secondary: '--text-secondary',
    tertiary: '--text-tertiary',
    strong: '--text-strong',
    placeholder: '--text-placeholder-primary',
  },
  icon: {
    primary: '--icon-primary',
    secondary: '--icon-secondary',
    tertiary: '--icon-tertiary',
  },
  border: {
    primary: '--border-primary',
    secondary: '--border-secondary',
    tertiary: '--border-tertiary',
    strong: '--border-strong',
  },
} as const

// ---------------------------------------------------------------------------
// Category colours  (1–6, used for chart series, tags, etc.)
// ---------------------------------------------------------------------------

function categoryTokens(n: number) {
  const tag = `category${n}`
  return {
    fill: `--fill-${tag}-primary`,
    fillHover: `--fill-${tag}-primary-hover`,
    fillPressed: `--fill-${tag}-primary-pressed`,
    fillSecondary: `--fill-${tag}-secondary`,
    fillTertiary: `--fill-${tag}-tertiary`,
    text: `--text-${tag}-primary`,
    icon: `--icon-${tag}-primary`,
    border: `--border-${tag}-primary`,
    borderStrong: `--border-${tag}-strong`,
  } as const
}

export const CATEGORY_COLORS = {
  category1: categoryTokens(1),
  category2: categoryTokens(2),
  category3: categoryTokens(3),
  category4: categoryTokens(4),
  category5: categoryTokens(5),
  category6: categoryTokens(6),
} as const

// ---------------------------------------------------------------------------
// Selected-state colours
// ---------------------------------------------------------------------------

export const SELECTED_COLORS = {
  fill: '--fill-selected-primary',
  fillHover: '--fill-selected-primary-hover',
  fillPressed: '--fill-selected-primary-pressed',
  fillSecondary: '--fill-selected-secondary',
  fillTertiary: '--fill-selected-tertiary',
  text: '--text-selected-primary',
  textOn: '--text-onselected-primary',
  border: '--border-selected-primary',
  borderStrong: '--border-selected-strong',
} as const

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export const OVERLAY_COLORS = {
  primary: '--fill-overlay-primary',
  strong: '--fill-overlay-strong',
} as const

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type StatusColorKey = keyof typeof STATUS_COLORS
export type BrandColorKey = keyof typeof BRAND_COLORS
export type CategoryColorKey = keyof typeof CATEGORY_COLORS
