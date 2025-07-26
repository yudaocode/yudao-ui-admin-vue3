<!-- 验证结果组件 -->
<template>
  <div class="validation-result">
    <div v-if="!validationResult" class="no-validation">
      <el-text type="info" size="small">
        <Icon icon="ep:info-filled" />
        点击"验证配置"按钮检查规则配置
      </el-text>
    </div>
    <div v-else class="validation-content">
      <el-alert
        :title="validationResult.valid ? '配置验证通过' : '配置验证失败'"
        :description="validationResult.message"
        :type="validationResult.valid ? 'success' : 'error'"
        :closable="false"
        show-icon
      >
        <template #default>
          <div v-if="validationResult.valid" class="success-content">
            <p>{{ validationResult.message || '所有配置项验证通过，规则可以正常运行' }}</p>
            <div class="success-tips">
              <Icon icon="ep:check" class="tip-icon" />
              <span class="tip-text">规则配置完整且有效</span>
            </div>
          </div>
          <div v-else class="error-content">
            <p>{{ validationResult.message || '配置验证失败，请检查以下问题' }}</p>
            <div class="error-tips">
              <div class="tip-item">
                <Icon icon="ep:warning-filled" class="tip-icon error" />
                <span class="tip-text">请确保所有必填项都已配置</span>
              </div>
              <div class="tip-item">
                <Icon icon="ep:warning-filled" class="tip-icon error" />
                <span class="tip-text">请检查触发器和执行器配置是否正确</span>
              </div>
            </div>
          </div>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
/** 验证结果组件 */
defineOptions({ name: 'ValidationResult' })

interface Props {
  validationResult?: { valid: boolean; message?: string } | null
}

defineProps<Props>()
</script>

<style scoped>
.validation-result {
  width: 100%;
}

.no-validation {
  text-align: center;
  padding: 20px 0;
}

.validation-content {
  width: 100%;
}

.success-content,
.error-content {
  margin-top: 8px;
}

.success-content p,
.error-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.success-tips,
.error-tips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tip-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.tip-icon:not(.error) {
  color: var(--el-color-success);
}

.tip-icon.error {
  color: var(--el-color-danger);
}

.tip-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.success-tips .tip-text {
  color: var(--el-color-success-dark-2);
}

.error-tips .tip-text {
  color: var(--el-color-danger-dark-2);
}
</style>
