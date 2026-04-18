import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    layout?: 'main' | 'blank'
    requiresAuth?: boolean
    roles?: string[]
  }
}
