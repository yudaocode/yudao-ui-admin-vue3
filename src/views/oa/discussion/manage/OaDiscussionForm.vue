<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="850px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <!-- 讨论内容 -->
      <el-form-item label="讨论类型" prop="type">
        <el-select v-model="formData.type" :disabled="isUpdate" placeholder="请选择讨论类型">
          <el-option
            v-for="item in discussionTypeOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="formData.title"
          placeholder="请输入讨论标题"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="正文" prop="content">
        <Editor v-model="formData.content" height="280px" />
      </el-form-item>
      <el-form-item label="附件">
        <UploadFile v-model="formData.fileUrls" />
      </el-form-item>

      <!-- 投票配置 -->
      <template v-if="formData.type === OA_DISCUSSION_TYPE.VOTE">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="允许多选" prop="voteMultiple">
              <el-switch v-model="formData.voteMultiple" :disabled="isUpdate" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始时间" prop="voteStartTime">
              <el-date-picker
                v-model="formData.voteStartTime"
                type="datetime"
                value-format="x"
                class="!w-full"
                :disabled="isUpdate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束时间" prop="voteEndTime">
              <el-date-picker
                v-model="formData.voteEndTime"
                type="datetime"
                value-format="x"
                class="!w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="投票选项">
          <div class="w-full">
            <div
              v-for="(option, index) in formData.voteOptions"
              :key="index"
              class="mb-10px flex gap-10px"
            >
              <el-input
                v-model="option.title"
                :placeholder="`选项 ${index + 1}`"
                maxlength="200"
                :disabled="isUpdate"
              />
              <el-color-picker v-model="option.color" :disabled="isUpdate" />
              <el-button
                v-if="!isUpdate"
                type="danger"
                link
                :disabled="formData.voteOptions!.length <= 2"
                @click="handleDeleteVoteOption(index)"
              >
                删除
              </el-button>
            </div>
            <el-button v-if="!isUpdate" plain @click="handleAddVoteOption">
              <Icon icon="ep:plus" /> 新增选项
            </el-button>
          </div>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import type { FormInstance, FormRules } from 'element-plus'
import * as DiscussionApi from '@/api/oa/discussion'
import * as DiscussionVoteApi from '@/api/oa/discussion/vote'
import { OA_DISCUSSION_TYPE } from '../../utils/constants'

defineOptions({ name: 'OaDiscussionForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const isUpdate = ref(false) // 是否修改
const formData = ref<DiscussionApi.OaDiscussionVO>(createDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  type: [{ required: true, message: '讨论类型不能为空', trigger: 'change' }],
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  voteStartTime: [{ required: true, message: '投票开始时间不能为空', trigger: 'change' }],
  voteEndTime: [{ required: true, message: '投票结束时间不能为空', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单 Ref
const discussionTypeOptions = getIntDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE) // 讨论类型选项

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '发布讨论' : '修改讨论'
  isUpdate.value = type === 'update'
  resetForm()
  // 修改时，加载讨论详情
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DiscussionApi.getDiscussion(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 新增投票选项 */
function handleAddVoteOption() {
  formData.value.voteOptions!.push({
    title: '',
    color: '#409EFF',
    sort: formData.value.voteOptions!.length
  })
}

/** 删除投票选项 */
function handleDeleteVoteOption(index: number) {
  formData.value.voteOptions!.splice(index, 1)
}

/** 提交表单 */
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value || formLoading.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 校验并整理投票选项
  if (formData.value.type === OA_DISCUSSION_TYPE.VOTE) {
    const options = formData.value.voteOptions || []
    if (options.length < 2 || options.some((item) => !item.title.trim())) {
      message.error('请至少填写两个投票选项')
      return
    }
    if (Number(formData.value.voteEndTime) <= Number(formData.value.voteStartTime)) {
      message.error('投票结束时间必须晚于开始时间')
      return
    }
    options.forEach((item, index) => (item.sort = index))
  }
  // 提交请求
  formLoading.value = true
  try {
    const data: DiscussionApi.OaDiscussionVO = {
      ...formData.value,
      voteMultiple:
        formData.value.type === OA_DISCUSSION_TYPE.VOTE ? formData.value.voteMultiple : undefined,
      voteStartTime:
        formData.value.type === OA_DISCUSSION_TYPE.VOTE ? formData.value.voteStartTime : undefined,
      voteEndTime:
        formData.value.type === OA_DISCUSSION_TYPE.VOTE ? formData.value.voteEndTime : undefined,
      voteOptions: formData.value.type === OA_DISCUSSION_TYPE.VOTE ? formData.value.voteOptions : []
    }
    if (!isUpdate.value) {
      await DiscussionApi.createDiscussion(data)
      message.success('发布成功')
    } else {
      await DiscussionApi.updateDiscussion(data)
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
function resetForm() {
  formData.value = createDefaultFormData()
  formRef.value?.resetFields()
}

/** 创建讨论默认表单数据 */
function createDefaultFormData(): DiscussionApi.OaDiscussionVO {
  return {
    type: OA_DISCUSSION_TYPE.DISCUSSION,
    title: '',
    content: '',
    fileUrls: [],
    voteMultiple: false,
    voteStartTime: '',
    voteEndTime: '',
    voteOptions: createDefaultVoteOptions()
  }
}

/** 创建默认投票选项 */
function createDefaultVoteOptions(): DiscussionVoteApi.OaVoteOptionVO[] {
  return [
    { title: '', color: '#409EFF', sort: 0 },
    { title: '', color: '#67C23A', sort: 1 }
  ]
}
</script>
