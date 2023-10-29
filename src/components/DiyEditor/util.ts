import { ref, Ref } from 'vue'
import { PageConfigProperty } from '@/components/DiyEditor/components/mobile/PageConfig/config'
import { NavigationBarProperty } from '@/components/DiyEditor/components/mobile/NavigationBar/config'
import { TabBarProperty } from '@/components/DiyEditor/components/mobile/TabBar/config'

export interface DiyComponent<T> {
  id: string
  name: string
  icon: string
  property: T
}

export interface DiyComponentLibrary {
  name: string
  extended: boolean
  components: string[]
}

// 页面配置
export interface PageConfig {
  // 页面属性
  page: PageConfigProperty
  // 顶部导航栏属性
  navigationBar: NavigationBarProperty
  // 底部导航菜单属性
  tabBar: TabBarProperty
  // 页面组件列表
  components: PageComponent[]
}
// 页面组件，只保留组件ID，组件属性
export interface PageComponent extends Pick<DiyComponent<any>, 'id' | 'property'> {}

// 属性表单监听
export function usePropertyForm<T>(modelValue: T, emit: Function): { formData: Ref<T> } {
  const formData = ref<T>()
  // 监听属性数据变动
  watch(
    () => modelValue,
    () => {
      formData.value = modelValue
    },
    {
      deep: true,
      immediate: true
    }
  )
  // 监听表单数据变动
  watch(
    () => formData.value,
    () => {
      emit('update:modelValue', formData.value)
    },
    {
      deep: true
    }
  )

  return { formData }
}
