import Search from './src/Search.vue'
import type { ElForm } from 'element-plus'

export interface SearchExpose {
  getFormData: <T = Recordable>() => Promise<T>
  getElFormExpose: () => Promise<ComponentRef<typeof ElForm> | undefined>
  setValues: (data: Recordable) => void
}

export { Search }
