<template>
  <div class="w-full">
    <!-- 已选车辆 -->
    <el-input
      :model-value="selectedItem?.no || ''"
      :placeholder="placeholder"
      :disabled="disabled"
      readonly
      @click="openSelect"
      @keydown.enter.prevent="openSelect"
    >
      <template #suffix>
        <Icon
          v-if="clearable && !disabled && modelValue != null"
          icon="ep:circle-close"
          class="cursor-pointer"
          role="button"
          tabindex="0"
          aria-label="清空车辆"
          @click.stop="handleClear"
          @keydown.enter.stop.prevent="handleClear"
        />
        <Icon v-else icon="ep:search" />
      </template>
    </el-input>
    <!-- 车辆选择弹窗 -->
    <OaVehicleSelectDialog ref="selectDialogRef" @selected="handleSelected" />
  </div>
</template>

<script setup lang="ts">
import { useFormItem } from 'element-plus'
import type { VehicleVO } from '@/api/oa/vehicle'
import OaVehicleSelectDialog from './OaVehicleSelectDialog.vue'

defineOptions({ name: 'OaVehicleSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 车辆编号
    selectedVehicle?: VehicleVO // 编辑时回显的车辆
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文本
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择车辆'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: VehicleVO | undefined]
}>()

const { formItem } = useFormItem() // 所属表单项
const currentVehicle = ref<VehicleVO>() // 本次选中的车辆
const selectedItem = computed(() =>
  currentVehicle.value?.id === props.modelValue
    ? currentVehicle.value
    : props.selectedVehicle?.id === props.modelValue
      ? props.selectedVehicle
      : undefined
)
const selectDialogRef = ref() // 选择弹窗 Ref

/** 打开选择弹窗 */
function openSelect() {
  if (props.disabled) return
  selectDialogRef.value.open(selectedItem.value)
}

/** 确认选择 */
function handleSelected(item: VehicleVO) {
  currentVehicle.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空选择 */
function handleClear() {
  currentVehicle.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 选择或清空后触发表单校验 */
watch(
  () => props.modelValue,
  () => {
    formItem?.validate('change').catch(() => {})
  }
)
</script>
