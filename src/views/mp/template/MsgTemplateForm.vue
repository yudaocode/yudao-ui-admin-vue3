<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px" v-loading="formLoading">
      <!-- 其他表单项保持不变 -->
      <el-form-item label="appId" prop="appId">
        <el-input v-model="formData.appId" placeholder="请输入appId"/>
      </el-form-item>
      <el-form-item label="公众号模板ID" prop="templateId">
        <el-input v-model="formData.templateId" placeholder="请输入公众号模板ID"/>
      </el-form-item>
      <el-form-item label="模版名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入模版名称"/>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题"/>
      </el-form-item>
      <el-form-item label="链接" prop="url">
        <el-input v-model="formData.url" placeholder="请输入链接"/>
      </el-form-item>
      <el-form-item label="小程序appId" prop="miniProgramAppId">
        <el-input v-model="formData.miniProgramAppId" placeholder="请输入小程序appId"/>
      </el-form-item>
      <el-form-item label="小程序页面路径" prop="miniProgramPagePath">
        <el-input v-model="formData.miniProgramPagePath" placeholder="请输入小程序页面路径"/>
      </el-form-item>
      <el-row :gutter="10">
        <el-col :span="12">
          <el-form-item label="是否有效" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                  v-for="dict in getIntDictOptions(DICT_TYPE.IS_VALID)"
                  :key="dict.value"
                  :label="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <!--        <el-col :span="12">
                  <el-form-item label="公众号是否已移除" prop="isRemoved">
                    <el-radio-group v-model="formData.isRemoved">
                      <el-radio
                          v-for="dict in getIntDictOptions(DICT_TYPE.IS_DELETE)"
                          :key="dict.value"
                          :label="dict.value"
                      >
                        {{ dict.label }}
                      </el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>-->
      </el-row>
      <el-form-item label="模板内容" prop="content">
        <el-input
            readonly
            type="textarea"
            v-model="formData.content"
            :rows="3"
            autosize
            placeholder="请输入模板内容，使用{{变量名.DATA}}格式定义变量"
        />
      </el-form-item>

      <!-- 修改点：消息变量部分 -->
      <el-form-item label="消息变量" v-if="templateVariables.length > 0">
        <div class="variable-editor">
          <div v-for="(item, index) in templateVariables" :key="item.name" class="variable-item">
            <el-row :gutter="10">
              <el-col :span="6">
                <div class="variable-name">{{ item.name }}</div>
              </el-col>
              <el-col :span="14">  <!-- 修改点：增加输入框宽度 -->
                <el-form-item
                    :prop="`templateVariables.${index}.value`"
                >
                  <el-input v-model="item.value" placeholder="填充内容" clearable/>
                </el-form-item>
              </el-col>
              <el-col :span="4">
                <el-form-item>
                  <el-color-picker v-model="item.color" :predefine="predefineColors" size="small"/>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
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
import {ref, reactive, watch, nextTick} from 'vue'
import {MsgTemplateApi, type MsgTemplateVO} from '@/api/mp/template'
import {getIntDictOptions, DICT_TYPE} from '@/utils/dict'
import type {FormInstance, FormRules} from 'element-plus'

interface TemplateVariable {
  name: string;
  value: string;
  color: string;
}

// 消息模板表单组件
defineOptions({name: 'MsgTemplateForm'})

const {t} = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载状态
const formType = ref('') // 表单类型：create/update
const list = ref<any[]>([])

// 表单数据保持不变
const formData = reactive<MsgTemplateVO>({
  id: undefined,
  appId: '',
  templateId: '',
  name: '',
  title: '',
  content: '',
  data: '',
  url: '',
  miniProgramAppId: '',
  miniProgramPagePath: '',
  status: 0,
  isRemoved: 0
})

// 表单验证规则保持不变
const formRules = reactive<FormRules<MsgTemplateVO>>({
  appId: [{required: true, message: 'appId不能为空', trigger: 'blur'}],
  templateId: [{required: true, message: '公众号模板ID不能为空', trigger: 'blur'}],
  name: [{required: true, message: '模板名称不能为空', trigger: 'blur'}],
  title: [{required: true, message: '标题不能为空', trigger: 'blur'}],
  status: [{required: true, message: '请选择是否有效', trigger: 'change'}]
})

const templateVariables = ref<TemplateVariable[]>([]) // 模板变量
const predefineColors = ref([
  '#000000', // 黑色
  '#173177', // 深蓝色
  '#ff0000', // 红色
  '#00b050', // 绿色
  '#ff9900', // 橙色
  '#800080', // 紫色
]) // 预定义颜色

const formRef = ref<FormInstance>() // 表单引用

// 以下是新增的模板变量相关代码

// 提取模板中的变量名
const extractTemplateVariables = (content: string): string[] => {
  if (!content) return []
  const regex = /\{\{(\w+)\.DATA\}\}/g
  const matches = content.match(regex) || []
  const uniqueNames = [...new Set(matches.map(match =>
      match.replace('{{', '').replace('.DATA}}', '')
  ))]
  return uniqueNames
}

// 当模板内容变化时更新变量列表
watch(() => formData.content, (newContent) => {
  const variableNames = extractTemplateVariables(newContent)

  // 保留现有变量值
  const currentVariables = [...templateVariables.value]

  // 创建新的变量列表
  const newVariables = variableNames.map(name => {
    const existing = currentVariables.find(v => v.name === name)
    return existing || {name, value: '', color: '#000000'}
  })

  templateVariables.value = newVariables
})

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      const res = await MsgTemplateApi.getMsgTemplate(id)
      Object.assign(formData, res)

      // 解析模板变量
      if (res.data) {
        try {
          const parsedData = JSON.parse(res.data)
          if (Array.isArray(parsedData)) {
            templateVariables.value = parsedData
          }
        } catch (e) {
          // 如果解析失败，从内容中提取变量
          const variableNames = extractTemplateVariables(res.content || '')
          templateVariables.value = variableNames.map(name => ({
            name,
            value: '',
            color: '#000000'
          }))
        }
      } else {
        // 没有数据字段，从内容中提取变量
        const variableNames = extractTemplateVariables(res.content || '')
        templateVariables.value = variableNames.map(name => ({
          name,
          value: '',
          color: '#000000'
        }))
      }
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({open}) // 暴露open方法

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return

  // 使用 Element Plus 表单验证统一处理所有校验
  try {
    await formRef.value.validate()

    // 验证模板变量是否都填写了
    const isAllFilled = templateVariables.value.every(item => item.value.trim() !== '')
    if (!isAllFilled) {
      message.error('请填写所有消息变量的内容')
      return
    }

    // 准备数据 - 修改点：将模板变量转为JSON字符串
    const submitData = {
      ...formData,
      data: JSON.stringify(templateVariables.value)
    }

    formLoading.value = true
    try {
      if (formType.value === 'create') {
        await MsgTemplateApi.createMsgTemplate(submitData)
        message.success(t('common.createSuccess'))
      } else {
        await MsgTemplateApi.updateMsgTemplate(submitData)
        message.success(t('common.updateSuccess'))
      }
      dialogVisible.value = false
      emit('success')
    } catch (error) {
      message.error('操作失败，请重试')
    } finally {
      formLoading.value = false
    }
  } catch (error) {
    // 表单验证失败
    message.error('请完善表单信息')
  }
}

/** 重置表单 */
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    appId: '',
    templateId: '',
    name: '',
    title: '',
    content: '',
    data: '',
    url: '',
    miniProgramAppId: '',
    miniProgramPagePath: '',
    status: 0,
    isRemoved: 0
  })
  // 新增：重置模板变量
  templateVariables.value = []
}
</script>

<style scoped>
/* 新增的样式 */
.variable-editor {
  width: 100%;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 12px;
  background-color: var(--el-bg-color);
}

.variable-item {
  padding: 8px 0;
}

.variable-item + .variable-item {
  border-top: 1px dashed #EBEEF5;
  padding-top: 12px;
}

.variable-name {
  line-height: 32px;
  font-weight: bold;
  color: var(--el-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-color-picker) {
  vertical-align: middle;
  margin-left: 8px;
}

/* 增加输入框宽度 */
.variable-editor :deep(.el-input) {
  width: 100%;
}
</style>
