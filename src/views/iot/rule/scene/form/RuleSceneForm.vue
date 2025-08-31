<template>
  <el-drawer
    v-model="drawerVisible"
    :title="drawerTitle"
    size="80%"
    direction="rtl"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
      <!-- 基础信息配置 -->
      <BasicInfoSection v-model="formData" :rules="formRules" />
      <!-- 触发器配置 -->
      <TriggerSection v-model:triggers="formData.triggers" />
      <!-- 执行器配置 -->
      <ActionSection v-model:actions="formData.actions" />
    </el-form>
    <template #footer>
      <div class="drawer-footer">
        <el-button :disabled="submitLoading" type="primary" @click="handleSubmit">
          <Icon icon="ep:check" />
          确 定
        </el-button>
        <el-button @click="handleClose">
          <Icon icon="ep:close" />
          取 消
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import BasicInfoSection from './sections/BasicInfoSection.vue'
import TriggerSection from './sections/TriggerSection.vue'
import ActionSection from './sections/ActionSection.vue'
import { IotSceneRule } from '@/api/iot/rule/scene'
import { RuleSceneApi } from '@/api/iot/rule/scene'
import {
  IotRuleSceneTriggerTypeEnum,
  IotRuleSceneActionTypeEnum,
  isDeviceTrigger
} from '@/views/iot/utils/constants'
import { ElMessage } from 'element-plus'
import { CommonStatusEnum } from '@/utils/constants'

/** IoT 场景联动规则表单 - 主表单组件 */
defineOptions({ name: 'RuleSceneForm' })

/** 组件属性定义 */
const props = defineProps<{
  /** 抽屉显示状态 */
  modelValue: boolean
  /** 编辑的场景联动规则数据 */
  ruleScene?: IotSceneRule
}>()

/** 组件事件定义 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const drawerVisible = useVModel(props, 'modelValue', emit) // 抽屉显示状态

/**
 * 创建默认的表单数据
 * @returns 默认表单数据对象
 */
const createDefaultFormData = (): IotSceneRule => {
  return {
    name: '',
    description: '',
    status: CommonStatusEnum.ENABLE, // 默认启用状态
    triggers: [
      {
        type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
        productId: undefined,
        deviceId: undefined,
        identifier: undefined,
        operator: undefined,
        value: undefined,
        cronExpression: undefined,
        conditionGroups: [] // 空的条件组数组
      }
    ],
    actions: []
  }
}

const formRef = ref() // 表单引用
const formData = ref<IotSceneRule>(createDefaultFormData()) // 表单数据

/**
 * 触发器校验器
 * @param _rule 校验规则（未使用）
 * @param value 校验值
 * @param callback 回调函数
 */
const validateTriggers = (_rule: any, value: any, callback: any) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个触发器'))
    return
  }

  for (let i = 0; i < value.length; i++) {
    const trigger = value[i]

    // 校验触发器类型
    if (!trigger.type) {
      callback(new Error(`触发器 ${i + 1}: 触发器类型不能为空`))
      return
    }

    // 校验设备触发器
    if (isDeviceTrigger(trigger.type)) {
      if (!trigger.productId) {
        callback(new Error(`触发器 ${i + 1}: 产品不能为空`))
        return
      }
      if (!trigger.deviceId) {
        callback(new Error(`触发器 ${i + 1}: 设备不能为空`))
        return
      }
      if (!trigger.identifier) {
        callback(new Error(`触发器 ${i + 1}: 物模型标识符不能为空`))
        return
      }
      if (!trigger.operator) {
        callback(new Error(`触发器 ${i + 1}: 操作符不能为空`))
        return
      }
      if (trigger.value === undefined || trigger.value === null || trigger.value === '') {
        callback(new Error(`触发器 ${i + 1}: 参数值不能为空`))
        return
      }
    }

    // 校验定时触发器
    if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
      if (!trigger.cronExpression) {
        callback(new Error(`触发器 ${i + 1}: CRON表达式不能为空`))
        return
      }
    }
  }

  callback()
}

/**
 * 执行器校验器
 * @param _rule 校验规则（未使用）
 * @param value 校验值
 * @param callback 回调函数
 */
const validateActions = (_rule: any, value: any, callback: any) => {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个执行器'))
    return
  }

  for (let i = 0; i < value.length; i++) {
    const action = value[i]

    // 校验执行器类型
    if (!action.type) {
      callback(new Error(`执行器 ${i + 1}: 执行器类型不能为空`))
      return
    }

    // 校验设备控制执行器
    if (
      action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
      action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      if (!action.productId) {
        callback(new Error(`执行器 ${i + 1}: 产品不能为空`))
        return
      }
      if (!action.deviceId) {
        callback(new Error(`执行器 ${i + 1}: 设备不能为空`))
        return
      }

      // 服务调用需要验证服务标识符
      if (action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE) {
        if (!action.identifier) {
          callback(new Error(`执行器 ${i + 1}: 服务不能为空`))
          return
        }
      }

      if (!action.params || Object.keys(action.params).length === 0) {
        callback(new Error(`执行器 ${i + 1}: 参数配置不能为空`))
        return
      }
    }

    // 校验告警执行器
    if (
      action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER ||
      action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER
    ) {
      if (!action.alertConfigId) {
        callback(new Error(`执行器 ${i + 1}: 告警配置不能为空`))
        return
      }
    }
  }

  callback()
}

const formRules = reactive({
  name: [
    { required: true, message: '场景名称不能为空', trigger: 'blur' },
    { type: 'string', min: 1, max: 50, message: '场景名称长度应在1-50个字符之间', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '场景状态不能为空', trigger: 'change' },
    {
      type: 'enum',
      enum: [CommonStatusEnum.ENABLE, CommonStatusEnum.DISABLE],
      message: '状态值必须为启用或禁用',
      trigger: 'change'
    }
  ],
  description: [
    { type: 'string', max: 200, message: '场景描述不能超过200个字符', trigger: 'blur' }
  ],
  triggers: [{ required: true, validator: validateTriggers, trigger: 'change' }],
  actions: [{ required: true, validator: validateActions, trigger: 'change' }]
}) // 表单校验规则

const submitLoading = ref(false) // 提交加载状态
const isEdit = ref(false) // 是否为编辑模式
const drawerTitle = computed(() => (isEdit.value ? '编辑场景联动规则' : '新增场景联动规则')) // 抽屉标题

/** 提交表单 */
const handleSubmit = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  // 提交请求
  submitLoading.value = true
  try {
    if (isEdit.value) {
      // 更新场景联动规则
      await RuleSceneApi.updateRuleScene(formData.value)
      ElMessage.success('更新成功')
    } else {
      // 创建场景联动规则
      await RuleSceneApi.createRuleScene(formData.value)
      ElMessage.success('创建成功')
    }

    // 关闭抽屉并触发成功事件
    drawerVisible.value = false
    emit('success')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitLoading.value = false
  }
}

/** 处理抽屉关闭事件 */
const handleClose = () => {
  drawerVisible.value = false
}

/** 初始化表单数据 */
const initFormData = () => {
  if (props.ruleScene) {
    // 编辑模式：数据结构已对齐，直接使用后端数据
    isEdit.value = true
    formData.value = {
      ...props.ruleScene,
      // 确保触发器数组不为空
      triggers: props.ruleScene.triggers?.length
        ? props.ruleScene.triggers
        : [
            {
              type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
              productId: undefined,
              deviceId: undefined,
              identifier: undefined,
              operator: undefined,
              value: undefined,
              cronExpression: undefined,
              conditionGroups: []
            }
          ],
      // 确保执行器数组不为空
      actions: props.ruleScene.actions || []
    }
  } else {
    // 新增模式：使用默认数据
    isEdit.value = false
    formData.value = createDefaultFormData()
  }
}

/** 监听抽屉显示 */
watch(drawerVisible, async (visible) => {
  if (visible) {
    initFormData()
    // 重置表单验证状态
    await nextTick()
    formRef.value?.clearValidate()
  }
})

/** 监听编辑数据变化 */
watch(
  () => props.ruleScene,
  () => {
    if (drawerVisible.value) {
      initFormData()
    }
  },
  { deep: true }
)
</script>
