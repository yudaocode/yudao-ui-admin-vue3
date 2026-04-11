<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑请求头"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="header-editor">
      <div class="header-list">
        <div v-for="(item, index) in headerList" :key="index" class="header-item">
          <el-input v-model="item.key" placeholder="请输入参数名" class="header-key" clearable />
          <span class="separator">:</span>
          <el-input
            v-model="item.value"
            placeholder="请输入参数值 (支持表达式 ${变量名})"
            class="header-value"
            clearable
          />
          <el-button
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="removeHeader(index)"
          />
        </div>
      </div>
      <el-button type="primary" :icon="Plus" class="add-btn" @click="addHeader">
        添加请求头
      </el-button>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { Delete, Plus } from '@element-plus/icons-vue'

defineOptions({ name: 'HttpHeaderEditor' })

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  headers: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

interface HeaderItem {
  key: string
  value: string
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const headerList = ref<HeaderItem[]>([])

// 解析请求头字符串为列表
const parseHeaders = (headersStr: string): HeaderItem[] => {
  if (!headersStr || !headersStr.trim()) {
    return [{ key: '', value: '' }]
  }

  const lines = headersStr.split('\n').filter((line) => line.trim())
  const parsed = lines.map((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      return {
        key: line.substring(0, colonIndex).trim(),
        value: line.substring(colonIndex + 1).trim()
      }
    }
    return { key: line.trim(), value: '' }
  })

  return parsed.length > 0 ? parsed : [{ key: '', value: '' }]
}

// 将列表转换为请求头字符串
const stringifyHeaders = (headers: HeaderItem[]): string => {
  return headers
    .filter((item) => item.key.trim())
    .map((item) => `${item.key}: ${item.value}`)
    .join('\n')
}

// 添加请求头
const addHeader = () => {
  headerList.value.push({ key: '', value: '' })
}

// 移除请求头
const removeHeader = (index: number) => {
  if (headerList.value.length === 1) {
    // 至少保留一行
    headerList.value = [{ key: '', value: '' }]
  } else {
    headerList.value.splice(index, 1)
  }
}

// 保存
const handleSave = () => {
  const headersStr = stringifyHeaders(headerList.value)
  emit('save', headersStr)
  dialogVisible.value = false
}

// 关闭
const handleClose = () => {
  dialogVisible.value = false
}

// 监听对话框打开，初始化数据
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      headerList.value = parseHeaders(props.headers)
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.header-editor {
  .header-list {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .header-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .header-key {
      flex: 0 0 180px;
    }

    .separator {
      color: #606266;
      font-weight: 500;
    }

    .header-value {
      flex: 1;
    }
  }

  .add-btn {
    width: 100%;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
