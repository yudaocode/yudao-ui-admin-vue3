<!-- TODO puhui999: 先单独一个后面封装成通用选择组件 -->
<template>
  <el-select class="w-1/1" v-bind="attrs">
    <el-option
      v-for="(dict, index) in userOptions"
      :key="index"
      :label="dict.nickname"
      :value="dict.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'UserSelect' })

const attrs = useAttrs()
const userOptions = ref<UserApi.UserVO[]>([]) // 用户下拉数据

onMounted(async () => {
  const data = await UserApi.getSimpleUserList()
  if (!data || data.length === 0) {
    return
  }
  userOptions.value = data
})
</script>
