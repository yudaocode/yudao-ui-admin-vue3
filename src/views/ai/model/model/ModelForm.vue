<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="130px"
      v-loading="formLoading"
    >
      <el-form-item label="所属平台" prop="platform">
        <el-select v-model="formData.platform" placeholder="请输入平台" clearable>
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.AI_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模型类型" prop="type">
        <el-select
          v-model="formData.type"
          placeholder="请输入模型类型"
          clearable
          :disabled="formData.id"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_MODEL_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="API 秘钥" prop="keyId">
        <el-select v-model="formData.keyId" placeholder="请选择 API 秘钥" clearable>
          <el-option
            v-for="apiKey in apiKeyList"
            :key="apiKey.id"
            :label="apiKey.name"
            :value="apiKey.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="模型名字" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模型名字" />
      </el-form-item>
      <el-form-item label="模型标识" prop="model">
        <el-input v-model="formData.model" placeholder="请输入模型标识" />
      </el-form-item>
      <el-form-item label="模型排序" prop="sort">
        <el-input-number v-model="formData.sort" placeholder="请输入模型排序" class="!w-1/1" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        label="温度参数"
        prop="temperature"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.temperature"
          placeholder="请输入温度参数"
          :min="0"
          :max="2"
          :precision="2"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item
        label="回复数 Token 数"
        prop="maxTokens"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.maxTokens"
          placeholder="请输入回复数 Token 数"
          :min="0"
          :max="8192"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item
        label="上下文数量"
        prop="maxContexts"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-input-number
          v-model="formData.maxContexts"
          placeholder="请输入上下文数量"
          :min="0"
          :max="20"
          class="!w-1/1"
        />
      </el-form-item>
      <el-form-item
        label="输入能力"
        prop="inputModalities"
        v-if="formData.type === AiModelTypeEnum.CHAT"
      >
        <el-checkbox-group v-model="formData.inputModalities">
          <el-checkbox
            v-for="item in AiModelInputModalityOptions"
            :key="item.value"
            :value="item.value"
            :disabled="item.disabled"
          >
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="思考配置" v-if="formData.type === AiModelTypeEnum.CHAT">
        <div class="w-full">
          <div class="flex items-center">
            <el-switch v-model="reasoningEnabled" @change="handleReasoningEnabledChange" />
            <el-select
              v-if="reasoningEnabled"
              v-model="reasoningPresetKey"
              placeholder="从预设填入"
              clearable
              class="ml-10px !w-360px"
              @change="handleReasoningPresetChange"
            >
              <el-option
                v-for="preset in AiReasoningPresets"
                :key="preset.key"
                :label="preset.name"
                :value="preset.key"
              />
            </el-select>
          </div>
          <template v-if="reasoningEnabled">
            <div
              v-if="reasoningPresetNote"
              class="mt-5px text-12px text-[var(--el-text-color-secondary)]"
            >
              {{ reasoningPresetNote }}
            </div>
            <div
              v-for="(row, index) in reasoningRows"
              :key="row.key"
              class="mt-8px flex items-start gap-8px"
            >
              <el-input v-model="row.level" placeholder="档位值，如 high" class="!w-140px" />
              <el-input
                v-model="row.options"
                type="textarea"
                :rows="2"
                placeholder="思考参数 JSON 对象"
                class="flex-1"
              />
              <el-button link :disabled="index === 0" @click="handleReasoningRowMove(index, -1)">
                <Icon icon="ep:top" />
              </el-button>
              <el-button
                link
                class="!ml-0"
                :disabled="index === reasoningRows.length - 1"
                @click="handleReasoningRowMove(index, 1)"
              >
                <Icon icon="ep:bottom" />
              </el-button>
              <el-button link type="danger" class="!ml-0" @click="handleReasoningRowDelete(index)">
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <el-button link type="primary" class="mt-8px" @click="handleReasoningRowAdd">
              <Icon icon="ep:plus" class="mr-5px" /> 添加档位
            </el-button>
            <div class="mt-8px flex items-center">
              <span class="mr-10px text-14px">默认档位</span>
              <el-select v-model="reasoningDefault" placeholder="请选择默认档位" class="!w-200px">
                <el-option
                  v-for="level in reasoningLevelOptions"
                  :key="level"
                  :label="level"
                  :value="level"
                />
              </el-select>
            </div>
            <div class="mt-5px text-12px leading-18px text-[var(--el-text-color-secondary)]">
              档位从低到高排列，off 表示发送关闭思考的参数；思考参数需按厂商文档核对。思考 Token
              也计入回复 Token 数，档位越高越可能截断。
            </div>
          </template>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ModelApi, ModelReasoningLevelVO, ModelVO } from '@/api/ai/model/model'
import { ApiKeyApi, ApiKeyVO } from '@/api/ai/model/apiKey'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import {
  AiModelInputModalityEnum,
  AiModelInputModalityOptions,
  AiModelTypeEnum,
  AiReasoningPresets
} from '@/views/ai/utils/constants'

/** API 模型的表单 */
defineOptions({ name: 'ModelForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  keyId: undefined,
  name: undefined,
  model: undefined,
  platform: undefined,
  type: undefined,
  sort: undefined,
  status: CommonStatusEnum.ENABLE,
  temperature: undefined,
  maxTokens: undefined,
  maxContexts: undefined,
  inputModalities: [AiModelInputModalityEnum.TEXT] as string[] // 输入模态，默认 text
})
const formRules = reactive({
  keyId: [{ required: true, message: 'API 秘钥不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '模型名字不能为空', trigger: 'blur' }],
  model: [{ required: true, message: '模型标识不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '所属平台不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '模型类型不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }],
  temperature: [{ required: true, message: '温度参数不能为空', trigger: 'blur' }],
  maxTokens: [{ required: true, message: '回复数 Token 数不能为空', trigger: 'blur' }],
  maxContexts: [{ required: true, message: '上下文数量不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const apiKeyList = ref([] as ApiKeyVO[]) // API 密钥列表

// 思考配置：档位行只在表单内编辑，提交时转换成 reasoningConfig
interface ReasoningRow {
  key: number // 行标识
  level: string // 档位值
  options: string // 思考参数 JSON 文本
}
const reasoningEnabled = ref(false) // 是否启用思考配置
const reasoningRows = ref<ReasoningRow[]>([]) // 档位行，从低到高
const reasoningDefault = ref('') // 默认档位
const reasoningPresetKey = ref<string>() // 选中的预设
let reasoningRowKey = 0 // 档位行标识的自增值
// DONE @AI：不用这个，有点过度校验了。（已删除前端的平台不支持判断、提示和禁用，由后端保存校验拒绝）
const reasoningPresetNote = computed(
  () => AiReasoningPresets.find((preset) => preset.key === reasoningPresetKey.value)?.note
) // 选中预设的说明
const reasoningLevelOptions = computed(() => {
  const levels = reasoningRows.value.map((row) => row.level.trim()).filter((level) => level)
  return [...new Set(levels)]
}) // 默认档位的可选项

/** 创建档位行 */
const createReasoningRow = (level = '', options: Record<string, unknown> = {}): ReasoningRow => {
  return { key: ++reasoningRowKey, level, options: JSON.stringify(options) }
}

/** 设置思考配置的表单值；未传入时重置 */
const setReasoningForm = (data?: ModelVO) => {
  const levels = data?.reasoningConfig?.levels || []
  reasoningEnabled.value = levels.length > 0
  reasoningRows.value = levels.map((item) => createReasoningRow(item.level, item.options))
  reasoningDefault.value = data?.reasoningConfig?.defaultLevel || ''
  reasoningPresetKey.value = undefined
}

/** 切换思考配置开关：首次打开时补一行空档位 */
const handleReasoningEnabledChange = (enabled: boolean) => {
  if (enabled && reasoningRows.value.length === 0) {
    reasoningRows.value.push(createReasoningRow())
  }
}

/** 从预设填入档位、思考参数和默认档位 */
const handleReasoningPresetChange = (key?: string) => {
  const preset = AiReasoningPresets.find((item) => item.key === key)
  if (!preset) {
    return
  }
  reasoningRows.value = preset.levels.map(([level, options]) => createReasoningRow(level, options))
  reasoningDefault.value = preset.defaultLevel
}

/** 添加档位行 */
const handleReasoningRowAdd = () => {
  reasoningRows.value.push(createReasoningRow())
}

/** 上下移动档位行 */
const handleReasoningRowMove = (index: number, offset: number) => {
  const rows = reasoningRows.value
  const target = index + offset
  if (target < 0 || target >= rows.length) {
    return
  }
  const [row] = rows.splice(index, 1)
  rows.splice(target, 0, row)
}

/** 删除档位行；删除的是默认档位时清空默认档位 */
const handleReasoningRowDelete = (index: number) => {
  const [row] = reasoningRows.value.splice(index, 1)
  if (row && row.level.trim() === reasoningDefault.value) {
    reasoningDefault.value = ''
  }
}

/**
 * 校验并构建思考配置的提交数据，校验失败时抛出带提示的异常
 *
 * 关闭时提交空配置，表示清空；最终校验以后端为准
 */
const buildReasoningData = (): Pick<ModelVO, 'reasoningConfig'> => {
  if (!reasoningEnabled.value) {
    return { reasoningConfig: { levels: [] } }
  }
  const rows = reasoningRows.value
  if (rows.length === 0) {
    throw new Error('请至少配置一个思考档位')
  }
  const levels: ModelReasoningLevelVO[] = []
  for (const row of rows) {
    const level = row.level.trim()
    if (!level) {
      throw new Error('思考档位值不能为空')
    }
    if (!/^[a-z0-9_-]{1,32}$/.test(level)) {
      throw new Error(`档位值「${level}」只能包含小写字母、数字、下划线和中划线，最长 32 位`)
    }
    if (levels.some((item) => item.level === level)) {
      throw new Error(`档位值「${level}」重复`)
    }
    let options: unknown
    try {
      options = JSON.parse(row.options)
    } catch {
      throw new Error(`档位「${level}」的思考参数不是合法的 JSON`)
    }
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new Error(`档位「${level}」的思考参数必须是 JSON 对象`)
    }
    levels.push({ level, options: options as Record<string, unknown> })
  }
  if (!reasoningDefault.value || !levels.some((item) => item.level === reasoningDefault.value)) {
    throw new Error('请选择默认档位，且必须是已配置的档位')
  }
  return { reasoningConfig: { levels, defaultLevel: reasoningDefault.value } }
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const data = await ModelApi.getModel(id)
      // 保留已配置的 image/video，并补上必选的 text
      const inputModalities = data.inputModalities || []
      data.inputModalities = inputModalities.includes(AiModelInputModalityEnum.TEXT)
        ? inputModalities
        : [AiModelInputModalityEnum.TEXT, ...inputModalities]
      formData.value = data
      // 回显思考配置
      setReasoningForm(data)
    } finally {
      formLoading.value = false
    }
  }
  // 获得下拉数据
  apiKeyList.value = await ApiKeyApi.getApiKeySimpleList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 校验思考配置，仅聊天模型
  let reasoningData: ReturnType<typeof buildReasoningData> | undefined
  if (formData.value.type === AiModelTypeEnum.CHAT) {
    try {
      reasoningData = buildReasoningData()
    } catch (error: any) {
      message.error(error.message)
      return
    }
  }
  // 提交请求
  formLoading.value = true
  try {
    // 复制一份再删除字段，避免提交失败后表单丢失聊天参数
    const data = { ...formData.value, ...reasoningData } as unknown as ModelVO
    if (data.type !== AiModelTypeEnum.CHAT) {
      delete data.temperature
      delete data.maxTokens
      delete data.maxContexts
      delete data.inputModalities
      delete data.reasoningConfig
    }
    if (formType.value === 'create') {
      await ModelApi.createModel(data)
      message.success(t('common.createSuccess'))
    } else {
      await ModelApi.updateModel(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    keyId: undefined,
    name: undefined,
    model: undefined,
    platform: undefined,
    type: undefined,
    sort: undefined,
    status: CommonStatusEnum.ENABLE,
    temperature: undefined,
    maxTokens: undefined,
    maxContexts: undefined,
    inputModalities: [AiModelInputModalityEnum.TEXT]
  }
  setReasoningForm()
  formRef.value?.resetFields()
}
</script>
