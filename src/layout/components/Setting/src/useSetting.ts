import { ref } from 'vue'

const drawerVisible = ref(false)

export const useSetting = () => {
  const openSetting = () => {
    drawerVisible.value = true
  }

  return {
    drawerVisible,
    openSetting
  }
}
