import type { InjectionKey, Ref } from 'vue'
import { computed, inject } from 'vue'

export interface PortalHostContextValue {
  portalHost: Ref<HTMLElement | null>
}

export const PORTAL_HOST_KEY: InjectionKey<PortalHostContextValue> = Symbol('AiBotPortalHost')

export function usePortalHost(): PortalHostContextValue {
  const ctx = inject(PORTAL_HOST_KEY)
  if (!ctx) {
    return {
      portalHost: computed(() => null),
    }
  }
  return ctx
}
