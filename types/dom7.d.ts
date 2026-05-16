declare module 'dom7' {
  interface Dom7Static {
    fn: Record<string, any>
    (...args: any[]): any
  }

  const dom7: Dom7Static
  export default dom7

  export const append: any
  export const on: any
  export const hide: any
  export const click: any
  export type Dom7Array = any
}
