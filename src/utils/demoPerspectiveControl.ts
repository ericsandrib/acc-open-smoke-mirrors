/** Demo-only: keep the draggable perspective switcher interactive above open sheets. */
export const DEMO_PERSPECTIVE_CARD_SELECTOR = '[data-demo-perspective-card]'
export const DEMO_PERSPECTIVE_MENU_SELECTOR = '[data-demo-perspective-menu]'
export const DEMO_PERSPECTIVE_LAYER_SELECTOR = '[data-demo-perspective-layer]'

export function isDemoPerspectiveControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest(DEMO_PERSPECTIVE_LAYER_SELECTOR) ||
      target.closest(DEMO_PERSPECTIVE_CARD_SELECTOR) ||
      target.closest(DEMO_PERSPECTIVE_MENU_SELECTOR),
  )
}

export function isDemoPerspectiveDragging(): boolean {
  return document.body.dataset.demoPerspectiveDragging === 'true'
}

export function setDemoPerspectiveDragging(active: boolean): void {
  if (active) {
    document.body.dataset.demoPerspectiveDragging = 'true'
  } else {
    delete document.body.dataset.demoPerspectiveDragging
  }
}

export function shouldPreventSheetDismissForPerspective(event: Event): boolean {
  return isDemoPerspectiveDragging() || isDemoPerspectiveControl(event.target)
}
