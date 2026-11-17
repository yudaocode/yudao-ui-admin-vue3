import { addIcon, type IconifyIcon } from '@iconify/vue'

export type IconRegistry = Readonly<Record<string, IconifyIcon>>

export const registerIcons = (icons: IconRegistry) => {
  Object.entries(icons).forEach(([name, data]) => addIcon(name, data))
}
