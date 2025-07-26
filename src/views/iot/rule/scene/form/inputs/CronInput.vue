<!-- CRON 表达式输入组件 -->
<!-- TODO @puhui999：看看能不能复用全局的 cron 组件 -->
<template>
  <div class="cron-input">
    <el-input
      v-model="localValue"
      placeholder="请输入 CRON 表达式，如：0 0 12 * * ?"
      @blur="handleBlur"
      @input="handleInput"
    >
      <template #suffix>
        <el-tooltip content="CRON 表达式帮助" placement="top">
          <Icon icon="ep:question-filled" class="input-help" @click="showHelp = !showHelp" />
        </el-tooltip>
      </template>
    </el-input>

    <!-- 帮助信息 -->
    <div v-if="showHelp" class="cron-help">
      <el-alert title="CRON 表达式格式：秒 分 时 日 月 周" type="info" :closable="false" show-icon>
        <template #default>
          <div class="help-content">
            <p><strong>示例：</strong></p>
            <ul>
              <li><code>0 0 12 * * ?</code> - 每天中午12点执行</li>
              <li><code>0 */5 * * * ?</code> - 每5分钟执行一次</li>
              <li><code>0 0 9-17 * * MON-FRI</code> - 工作日9-17点每小时执行</li>
            </ul>
            <p><strong>特殊字符：</strong></p>
            <ul>
              <li><code>*</code> - 匹配任意值</li>
              <li><code>?</code> - 不指定值（用于日和周）</li>
              <li><code>/</code> - 间隔触发，如 */5 表示每5个单位</li>
              <li><code>-</code> - 范围，如 9-17 表示9到17</li>
              <li><code>,</code> - 列举，如 MON,WED,FRI</li>
            </ul>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { validateCronExpression } from '../../utils/validation'

/** CRON 表达式输入组件 */
defineOptions({ name: 'CronInput' })

interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'validate', result: { valid: boolean; message: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = useVModel(props, 'modelValue', emit)

// 状态
const showHelp = ref(false)

// 事件处理
const handleInput = () => {
  validateExpression()
}

const handleBlur = () => {
  validateExpression()
}

const validateExpression = () => {
  if (!localValue.value) {
    emit('validate', { valid: false, message: '请输入CRON表达式' })
    return
  }

  const isValid = validateCronExpression(localValue.value)
  if (isValid) {
    emit('validate', { valid: true, message: 'CRON表达式验证通过' })
  } else {
    emit('validate', { valid: false, message: 'CRON表达式格式不正确' })
  }
}

// 监听值变化
watch(
  () => localValue.value,
  () => {
    validateExpression()
  }
)

// 初始化
onMounted(() => {
  if (localValue.value) {
    validateExpression()
  }
})
</script>

<style scoped>
.cron-input {
  width: 100%;
}

.input-help {
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color 0.2s;
}

.input-help:hover {
  color: var(--el-color-primary);
}

.cron-help {
  margin-top: 8px;
}

.help-content ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 4px;
}

.help-content code {
  background: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
}
</style>
