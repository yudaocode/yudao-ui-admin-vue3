<template>
  <div class="w-full">
    <!-- 已选申请 -->
    <el-input
      :model-value="selectedItem ? selectedItem.no + ' / ' + selectedItem.vehicleNo : ''"
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
          aria-label="清空用车申请"
          @click.stop="handleClear"
          @keydown.enter.stop.prevent="handleClear"
        />
        <Icon v-else icon="ep:search" />
      </template>
    </el-input>
    <!-- 用车申请选择弹窗 -->
    <OaVehicleApplySelectDialog
      ref="selectDialogRef"
      :status="status"
      :return-status="returnStatus"
      @selected="handleSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { useFormItem } from 'element-plus'
import * as VehicleApplyApi from '@/api/oa/vehicle/apply'
import OaVehicleApplySelectDialog from './OaVehicleApplySelectDialog.vue'

defineOptions({ name: 'OaVehicleApplySelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number // 用车申请编号
    status?: number // 审批状态
    returnStatus?: number // 还车状态
    disabled?: boolean // 是否禁用
    clearable?: boolean // 是否允许清空
    placeholder?: string // 占位文本
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择用车申请单'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: VehicleApplyApi.VehicleApplyVO | undefined]
}>()

const { formItem } = useFormItem() // 所属表单项
const selectedItem = ref<VehicleApplyApi.VehicleApplyVO>() // 当前选中的申请
const selectDialogRef = ref() // 选择弹窗 Ref

/** 打开选择弹窗 */
function openSelect() {
  if (props.disabled) return
  selectDialogRef.value.open(selectedItem.value)
}

/** 确认选择 */
function handleSelected(item: VehicleApplyApi.VehicleApplyVO) {
  selectedItem.value = item
  emit('update:modelValue', item.id)
  emit('change', item)
}

/** 清空选择 */
function handleClear() {
  selectedItem.value = undefined
  emit('update:modelValue', undefined)
  emit('change', undefined)
}

/** 根据申请编号回显，选择或清空后触发表单校验 */
watch(
  () => props.modelValue,
  async (id, oldId) => {
    if (id == null) {
      selectedItem.value = undefined
    } else if (selectedItem.value?.id !== id) {
      selectedItem.value = undefined
      const item = await VehicleApplyApi.getVehicleApply(id)
      // 编辑对象切换时，不回填上一次请求的结果
      if (props.modelValue === id) {
        selectedItem.value = item
      }
    }
    if (id !== oldId) {
      formItem?.validate('change').catch(() => {})
    }
  },
  { immediate: true }
)
</script>
