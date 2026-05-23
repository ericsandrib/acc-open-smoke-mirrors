import type { WheelEvent } from 'react'

export const WIZARD_FORM_SCROLL_AREA_ID = 'wizard-form-scroll-area'

function canElementScroll(el: HTMLElement, deltaY: number): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false
  const atTop = el.scrollTop <= 0
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
  if (deltaY < 0 && !atTop) return true
  if (deltaY > 0 && !atBottom) return true
  return false
}

function forwardWheelToMainForm(e: WheelEvent<HTMLElement>) {
  const main = document.getElementById(WIZARD_FORM_SCROLL_AREA_ID)
  e.preventDefault()
  if (main && canElementScroll(main, e.deltaY)) {
    main.scrollTop += e.deltaY
  }
}

/** Left nav scroll pane — may chain to the center form when exhausted. */
export function handleWizardScrollPaneWheel(e: WheelEvent<HTMLElement>) {
  if (canElementScroll(e.currentTarget, e.deltaY)) {
    e.stopPropagation()
    return
  }
  forwardWheelToMainForm(e)
}

/** Footer / left nav chrome — chain to the center form, never the document. */
export function handleWizardPanelShellWheel(e: WheelEvent<HTMLElement>) {
  forwardWheelToMainForm(e)
}

/** Right-rail chrome (tabs, headers) — independent from the center form. */
export function handleWizardIsolatedPanelShellWheel(e: WheelEvent<HTMLElement>) {
  e.preventDefault()
  e.stopPropagation()
}

/** Right-rail scroll pane (Activity, etc.) — scrolls only itself. */
export function handleWizardIsolatedScrollPaneWheel(e: WheelEvent<HTMLElement>) {
  e.stopPropagation()
  if (!canElementScroll(e.currentTarget, e.deltaY)) {
    e.preventDefault()
  }
}
