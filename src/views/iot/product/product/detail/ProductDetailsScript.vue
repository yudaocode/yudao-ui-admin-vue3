<!-- 产品数据解析脚本 -->
<template>
  <el-row :gutter="20">
    <!-- 左侧：脚本编辑 -->
    <el-col :span="canEdit ? 14 : 24">
      <ContentWrap>
        <!-- 顶部信息栏 -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600 flex items-center gap-2">
              启用状态：
              <el-tag :type="product.scriptEnabled ? 'success' : 'info'">
                {{ product.scriptEnabled ? '启用' : '停用' }}
              </el-tag>
            </span>
            <span v-if="savedHash" class="text-sm text-gray-600">
              已保存内容：<span class="font-mono">#{{ savedHash }}</span>
            </span>
            <el-tag v-if="dirty" type="warning">有未保存的修改</el-tag>
          </div>
          <div v-if="canEdit" class="flex gap-2">
            <el-button type="primary" :disabled="!dirty" :loading="saving" @click="handleSave">
              保存并生效
            </el-button>
            <el-button
              v-if="product.scriptEnabled"
              type="danger"
              plain
              :loading="toggling"
              @click="handleToggle(false)"
            >
              停用
            </el-button>
            <el-button v-else type="success" plain :loading="toggling" @click="handleToggle(true)">
              启用
            </el-button>
            <el-button :disabled="!dirty" @click="handleRestore">恢复为已保存内容</el-button>
          </div>
        </div>
        <div class="text-xs text-gray-500 mb-2">
          脚本（ES5）· UTF-8 不超过 32KB · 每次调用都重新执行顶层代码，不能保存状态
        </div>
        <div class="text-xs text-gray-500 mb-2">
          decode 返回一条标准消息 {method, params?, requestId?, code?, msg?, data?}，返回 null
          表示无业务消息；上报 method 只能是 thing.property.post / thing.event.post，回执（带
          code）只能是 thing.property.set / thing.service.invoke 且必须带
          requestId；原始帧由平台自动附带，不能返回 raw、id、deviceId、messages、ack 等字段 · encode
          返回 {bytes: [...]} 或 {standard: true}，返回 null 表示不下发
        </div>
        <el-input
          v-model="editorContent"
          type="textarea"
          class="script-editor"
          :rows="24"
          :readonly="!canEdit"
          spellcheck="false"
          placeholder="请输入脚本，定义 decode(ctx)、encode(ctx) 函数"
        />
        <div v-if="canEdit" class="text-xs text-gray-500 mt-2">
          「保存并生效」不改变启用状态；未保存的修改只保留在当前页面，刷新后丢失
        </div>
      </ContentWrap>
    </el-col>

    <!-- 右侧：调试 -->
    <el-col v-if="canEdit" :span="10">
      <ContentWrap title="调试">
        <div class="text-xs text-gray-500 mb-3">
          调试对象：当前编辑内容（未保存也可以）；不保存脚本，也不会发送给设备
        </div>
        <el-form label-width="80px">
          <el-form-item label="方向">
            <el-radio-group v-model="debugDirection">
              <el-radio-button value="decode">上行解码</el-radio-button>
              <el-radio-button value="encode">下行编码</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="debugDirection === 'decode'" label="输入 HEX">
            <el-input
              v-model="debugInputHex"
              type="textarea"
              class="script-editor"
              :rows="4"
              placeholder="例如：01 03 04 00 FA 02 58"
            />
          </el-form-item>
          <el-form-item v-else label="输入消息">
            <div class="w-full">
              <JsonEditor
                v-model="debugMessage"
                mode="code"
                height="220px"
                @error="onDebugMessageError"
              />
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="debugging" @click="handleDebug">调试</el-button>
          </el-form-item>
        </el-form>

        <!-- 调试结果 -->
        <template v-if="debugResult">
          <el-divider content-position="left">调试结果</el-divider>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="结果">
              <el-tag :type="debugResult.success ? 'success' : 'danger'">
                {{ debugResult.success ? '成功' : '失败' }}
              </el-tag>
              <span class="ml-2 text-sm text-gray-600">耗时 {{ debugResult.durationMs }} ms</span>
            </el-descriptions-item>
            <template v-if="debugResult.error">
              <el-descriptions-item label="错误类型">{{ debugResult.error.type }}</el-descriptions-item>
              <el-descriptions-item label="错误信息">
                <span class="whitespace-pre-wrap break-all">{{ debugResult.error.message }}</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="debugResult.error.line" label="行号">
                第 {{ debugResult.error.line }} 行
              </el-descriptions-item>
            </template>
            <template v-if="debugResultDirection === 'encode' && debugResult.success">
              <el-descriptions-item label="下发方式">
                {{ debugResult.standard ? '按标准消息下发' : '下发脚本输出的字节' }}
              </el-descriptions-item>
              <el-descriptions-item v-if="!debugResult.standard" label="输出 HEX">
                <span class="font-mono break-all">{{ debugResult.outputHex || '-' }}</span>
              </el-descriptions-item>
            </template>
          </el-descriptions>
          <template v-if="debugResultDirection === 'decode' && debugResult.success">
            <div class="text-sm text-gray-600 mt-3 mb-1">解析消息</div>
            <pre
              v-if="debugResult.message"
              class="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-80"
              >{{ JSON.stringify(debugResult.message, null, 2) }}</pre
            >
            <div v-else class="text-sm text-gray-500">
              无业务消息（实际上报时记录为透传上报）
            </div>
          </template>
        </template>
      </ContentWrap>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import {
  ProductApi,
  ProductScriptDebugReqVO,
  ProductScriptDebugRespVO,
  ProductVO
} from '@/api/iot/product/product'
import { checkPermi } from '@/utils/permission'
import { isEmpty } from '@/utils/is'
import {
  getScriptShortHash,
  getUtf8ByteLength,
  parseHex,
  SCRIPT_CONTENT_MAX_BYTES
} from '@/views/iot/utils/raw'

defineOptions({ name: 'ProductDetailsScript' })

const props = defineProps<{ product: ProductVO }>()
const emit = defineEmits<{
  (e: 'refresh'): void // 保存、启停后，通知父组件重新加载产品
}>()

const message = useMessage()
const canEdit = checkPermi(['iot:product:update']) // 是否有脚本编辑权限
const editorContent = ref('') // 编辑区内容（未保存的修改只保留在页面）
const savedHash = ref('') // 已保存内容的 SHA-256 短码
const saving = ref(false) // 保存中
const toggling = ref(false) // 启停中

/** 已保存的脚本内容 */
const savedContent = computed(() => props.product.scriptContent ?? '')
/** 是否有未保存的修改 */
const dirty = computed(() => editorContent.value !== savedContent.value)

/** 监听已保存内容：编辑区没有未保存的修改时，同步为最新的已保存内容；同时计算短码 */
watch(
  savedContent,
  async (newContent, oldContent) => {
    if (oldContent === undefined || editorContent.value === oldContent) {
      editorContent.value = newContent
    }
    const hash = await getScriptShortHash(newContent)
    if (newContent === savedContent.value) {
      savedHash.value = hash // 避免较早的计算结果覆盖最新内容的短码
    }
  },
  { immediate: true }
)

/** 保存并生效：只提交脚本内容，不改变启用状态 */
const handleSave = async () => {
  if (getUtf8ByteLength(editorContent.value) > SCRIPT_CONTENT_MAX_BYTES) {
    message.warning('脚本内容不能超过 32KB（UTF-8）')
    return
  }
  await message.confirm(
    '保存后，连接健康时通常一个刷新周期内对该产品的全部设备生效。确认保存？'
  )
  saving.value = true
  try {
    await ProductApi.updateProductScript({
      id: props.product.id,
      scriptContent: editorContent.value
    })
    message.success('已保存。连接健康时，通常一个刷新周期内对该产品的全部设备生效')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/** 启用、停用脚本：只提交启用状态，启用的是已保存的内容 */
const handleToggle = async (enabled: boolean) => {
  const action = enabled ? '启用' : '停用'
  const dirtyTip = dirty.value ? '当前有未保存的修改，生效的是已保存的内容。' : ''
  await message.confirm(
    `${dirtyTip}确认${action}数据解析脚本？连接健康时通常一个刷新周期内生效。`
  )
  toggling.value = true
  try {
    await ProductApi.updateProductScript({ id: props.product.id, scriptEnabled: enabled })
    message.success(`已${action}`)
    emit('refresh')
  } finally {
    toggling.value = false
  }
}

/** 恢复为已保存内容：放弃未保存的修改 */
const handleRestore = async () => {
  await message.confirm('确认放弃未保存的修改，恢复为已保存内容？')
  editorContent.value = savedContent.value
}

// ========== 调试 ==========

const debugDirection = ref<'decode' | 'encode'>('decode') // 调试方向
const debugInputHex = ref('') // 上行解码的输入 HEX
const debugMessage = ref<any>({ method: 'thing.property.set', requestId: 'debug-1', params: {} }) // 下行编码的输入消息
const debugMessageError = ref(false) // 下行编码的输入消息是否有 JSON 格式错误
const debugging = ref(false) // 调试中
const debugResult = ref<ProductScriptDebugRespVO>() // 调试结果
const debugResultDirection = ref<'decode' | 'encode'>('decode') // 调试结果对应的方向

/** 下行编码输入消息的 JSON 校验 */
const onDebugMessageError = (errors: any) => {
  debugMessageError.value = !isEmpty(errors)
}

/** 调试：执行当前编辑内容，不保存，也不发送给设备 */
const handleDebug = async () => {
  if (!editorContent.value.trim()) {
    message.warning('请先编写脚本')
    return
  }
  const direction = debugDirection.value
  const data: ProductScriptDebugReqVO = {
    id: props.product.id,
    scriptContent: editorContent.value,
    direction
  }
  if (direction === 'decode') {
    if (!parseHex(debugInputHex.value)) {
      message.warning('请输入合法的 HEX（偶数位十六进制字符，允许空格）')
      return
    }
    data.inputHex = debugInputHex.value
  } else {
    const msg = debugMessage.value
    if (
      debugMessageError.value ||
      !msg ||
      typeof msg !== 'object' ||
      Array.isArray(msg) ||
      typeof msg.method !== 'string' ||
      !msg.method
    ) {
      message.warning('请输入合法的 JSON 消息，且包含 method')
      return
    }
    data.message = msg
  }
  debugging.value = true
  try {
    debugResult.value = await ProductApi.debugProductScript(data)
    debugResultDirection.value = direction
  } finally {
    debugging.value = false
  }
}
</script>

<style scoped>
.script-editor :deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
