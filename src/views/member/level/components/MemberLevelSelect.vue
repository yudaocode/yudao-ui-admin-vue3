<template>
  <el-select v-model="levelId" placeholder="请选择用户等级" clearable class="!w-240px">
    <el-option v-for="level in levelOptions" :key="level.id" :label="level.name" :value="level.id">
      <span class="flex items-center gap-x-8px">
        <el-avatar :src="level.icon" size="small" />
        {{ level.name }}
      </span>
    </el-option>
  </el-select>
</template>
<script lang="ts" setup>
import * as LevelApi from '@/api/member/level'

/** 会员等级选择框 **/
defineOptions({ name: 'MemberLevelSelect' })

const props = defineProps({
  /** 下拉框选中值 **/
  modelValue: {
    type: Number,
    default: undefined
  }
})
const emit = defineEmits(['update:modelValue'])

const levelId = computed({
  get() {
    return props.modelValue
  },
  set(value: any) {
    emit('update:modelValue', value)
  }
})

const levelOptions = ref<LevelApi.LevelVO[]>([])

const getList = async () => {
  levelOptions.value = await LevelApi.getSimpleLevelList()
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
