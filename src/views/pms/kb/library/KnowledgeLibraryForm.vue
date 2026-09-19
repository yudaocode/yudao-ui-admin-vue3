<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <!-- 知识库模板选择 -->
    <div
      v-if="formType === 'create' && templateSelecting"
      v-loading="templateLoading"
      class="grid min-h-420px grid-cols-2 gap-16px"
    >
      <div class="max-h-440px overflow-y-auto pr-8px">
        <button
          :class="[
            'mb-6px flex w-full cursor-pointer items-center gap-12px rounded-[var(--el-border-radius-base)] border border-transparent bg-transparent p-10px text-inherit transition-colors hover:!border-[var(--el-color-primary-light-5)] hover:!bg-[var(--el-fill-color-light)]',
            selectedTemplateId === 0
              ? '!border-[var(--el-color-primary)] !bg-[var(--el-color-primary-light-9)]'
              : ''
          ]"
          type="button"
          @click="selectedTemplateId = 0"
        >
          <div
            class="h-48px w-54px flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--el-border-radius-base)] border border-dashed border-[var(--el-border-color)] text-22px text-[var(--el-color-primary)]"
          >
            <Icon icon="ep:plus" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-15px font-600">空白知识库</div>
            <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
              邀请团队成员一起创作和交流知识
            </div>
          </div>
        </button>
        <button
          v-for="template in templateList"
          :key="template.id"
          :class="[
            'mb-6px flex w-full cursor-pointer items-center gap-12px rounded-[var(--el-border-radius-base)] border border-transparent bg-transparent p-10px text-inherit transition-colors hover:!border-[var(--el-color-primary-light-5)] hover:!bg-[var(--el-fill-color-light)]',
            selectedTemplateId === template.id
              ? '!border-[var(--el-color-primary)] !bg-[var(--el-color-primary-light-9)]'
              : ''
          ]"
          type="button"
          @click="selectedTemplateId = template.id"
        >
          <el-image
            v-if="template.coverUrl"
            class="h-48px w-54px shrink-0 overflow-hidden rounded-[var(--el-border-radius-base)]"
            fit="cover"
            :src="template.coverUrl"
          />
          <div
            v-else
            class="h-48px w-54px flex shrink-0 items-center justify-center rounded-[var(--el-border-radius-base)] bg-[var(--el-color-primary-light-9)] text-22px text-[var(--el-color-primary)]"
          >
            <Icon icon="ep:notebook" />
          </div>
          <div class="min-w-0 text-left">
            <div class="truncate text-15px font-600">{{ template.name }}</div>
            <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
              {{ template.description }}
            </div>
          </div>
        </button>
      </div>
      <div class="rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)] p-18px">
        <template v-if="selectedTemplate">
          <div class="flex items-center gap-12px">
            <div
              class="h-48px w-54px flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--el-border-radius-base)] bg-[var(--el-color-primary-light-9)] text-22px text-[var(--el-color-primary)]"
            >
              <el-image
                v-if="selectedTemplate.coverUrl"
                class="h-full w-full"
                fit="cover"
                :src="selectedTemplate.coverUrl"
              />
              <Icon v-else icon="ep:notebook" />
            </div>
            <div class="min-w-0">
              <div class="truncate text-15px font-600">{{ selectedTemplate.name }}</div>
              <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
                {{ selectedTemplate.description }}
              </div>
            </div>
          </div>
          <el-scrollbar class="mt-20px" height="320px">
            <div
              v-for="document in selectedTemplate.documents ?? []"
              :key="document.title"
              class="mb-18px flex items-center gap-12px text-[var(--el-text-color-regular)]"
            >
              <Icon icon="ep:document" />
              <span>{{ document.title }}</span>
            </div>
          </el-scrollbar>
        </template>
        <div
          v-else
          class="h-full flex flex-col items-center justify-center text-[var(--el-text-color-regular)]"
        >
          <Icon class="text-46px" icon="ep:notebook" />
          <div class="mt-12px">从空白知识库开始</div>
          <div class="mt-6px text-13px text-[var(--el-text-color-secondary)]">
            创建后可自由添加目录和文档
          </div>
        </div>
      </div>
    </div>

    <!-- 知识库基础信息 -->
    <el-form
      v-else
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="知识库名称" prop="name">
        <el-input
          v-model="formData.name"
          maxlength="50"
          placeholder="请输入知识库名称"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="知识库封面" prop="coverUrl">
        <UploadImg v-model="formData.coverUrl" :limit="1" />
      </el-form-item>
      <el-form-item label="知识库简介" prop="description">
        <el-input
          v-model="formData.description"
          :rows="4"
          maxlength="300"
          placeholder="请输入知识库简介"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="可见范围" prop="openStatus">
        <el-radio-group
          v-model="formData.openStatus"
          :disabled="formType === 'update' && formData.creatorUserId !== currentUserId"
        >
          <el-radio :value="false">私有：只有知识库成员可以查看</el-radio>
          <el-radio :value="true">公开：所有人可以查看，成员可以协作</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formType === 'create'" label="初始管理员">
        <UserSelectV2
          v-model="initialAdminUserIds"
          :disabled-ids="[currentUserId]"
          :multiple="true"
          placeholder="请选择初始管理员"
        />
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          可管理知识库信息和成员；创建人由系统自动加入
        </div>
      </el-form-item>
      <el-form-item v-if="formType === 'create'" label="普通成员">
        <UserSelectV2
          v-model="initialMemberUserIds"
          :disabled-ids="[currentUserId]"
          :multiple="true"
          placeholder="请选择普通成员"
        />
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          可参与内容协作，具体能力受文档权限控制
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex items-center justify-between">
        <el-button
          v-if="formType === 'update'"
          v-hasPermi="['pms:kb:library:update']"
          @click="openMemberForm"
        >
          成员管理
        </el-button>
        <span v-else></span>
        <div>
          <el-button
            v-if="formType === 'create' && templateSelecting"
            :disabled="templateLoading"
            type="primary"
            @click="handleTemplateNext"
          >
            下一步
          </el-button>
          <template v-else>
            <el-button
              v-if="formType === 'create'"
              :disabled="formLoading"
              @click="handleTemplateBack"
            >
              上一步
            </el-button>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">
              确 定
            </el-button>
          </template>
          <el-button @click="dialogVisible = false">取 消</el-button>
        </div>
      </div>
    </template>
  </Dialog>

  <!-- 知识库成员管理 -->
  <KnowledgeMemberForm ref="memberFormRef" @success="handleMemberSuccess" />
</template>

<script lang="ts" setup>
import * as KnowledgeLibraryApi from '@/api/pms/kb/library'
import { getCurrentUserId } from '@/utils/auth'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import type { FormRules } from 'element-plus'
import KnowledgeMemberForm from './KnowledgeMemberForm.vue'

defineOptions({ name: 'PmsKnowledgeLibraryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const templateSelecting = ref(false) // 是否正在选择知识库模板
const templateLoading = ref(false) // 模板加载中
const templateList = ref<KnowledgeLibraryApi.PmsKnowledgeLibraryTemplateVO[]>([]) // 知识库模板列表
const selectedTemplateId = ref(0) // 0 表示空白知识库
const formData = ref<KnowledgeLibraryApi.PmsKnowledgeLibraryVO>(getDefaultFormData()) // 表单数据
const currentUserId = getCurrentUserId() // 创建人用户编号，不能重复加入初始成员
const initialAdminUserIds = ref<number[]>([]) // 创建时的初始管理员
const initialMemberUserIds = ref<number[]>([]) // 创建时的普通成员
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入知识库名称', trigger: 'blur' }],
  openStatus: [{ required: true, message: '请选择可见范围', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const memberFormRef = ref() // 知识库成员表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const selectedTemplate = computed(() =>
  templateList.value.find((template) => template.id === selectedTemplateId.value)
) // 当前选中的知识库模板

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  formType.value = type
  templateSelecting.value = type === 'create'
  dialogTitle.value =
    type === 'create' && templateSelecting.value ? '选择知识库模板' : t('action.' + type)
  selectedTemplateId.value = 0
  resetForm()
  if (type === 'create') {
    await getTemplateList()
  } else if (id) {
    formLoading.value = true
    try {
      formData.value = {
        ...(await KnowledgeLibraryApi.getKnowledgeLibrary(id)),
        adminUserIds: [],
        memberUserIds: [],
        templateId: undefined
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询知识库模板 */
async function getTemplateList() {
  templateLoading.value = true
  try {
    templateList.value = await KnowledgeLibraryApi.getKnowledgeLibraryTemplateList()
  } finally {
    templateLoading.value = false
  }
}

/** 进入知识库基本信息表单 */
function handleTemplateNext() {
  formData.value = selectedTemplate.value
    ? {
        ...getDefaultFormData(),
        name: selectedTemplate.value.name,
        description: selectedTemplate.value.description,
        coverUrl: selectedTemplate.value.coverUrl,
        templateId: selectedTemplateId.value
      }
    : getDefaultFormData()
  resetInitialMembers()
  templateSelecting.value = false
  dialogTitle.value = '新建知识库'
  nextTick(() => formRef.value?.clearValidate())
}

/** 返回知识库模板选择 */
function handleTemplateBack() {
  templateSelecting.value = true
  dialogTitle.value = '选择知识库模板'
}

/** 重置创建时的初始成员 */
function resetInitialMembers() {
  initialAdminUserIds.value = []
  initialMemberUserIds.value = []
}

/** 校验初始管理员和普通成员不能重复 */
function validateInitialMembers() {
  const memberUserIdSet = new Set(initialMemberUserIds.value)
  return !initialAdminUserIds.value.some((userId) => memberUserIdSet.has(userId))
}

/** 打开知识库成员表单 */
function openMemberForm() {
  if (!formData.value.id) return
  memberFormRef.value?.open(formData.value.id)
}

/** 处理知识库成员更新成功 */
function handleMemberSuccess() {
  emit('success')
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  if (formType.value === 'create' && !validateInitialMembers()) {
    message.warning('同一用户不能同时设置为初始管理员和普通成员')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await KnowledgeLibraryApi.createKnowledgeLibrary({
        ...formData.value,
        adminUserIds: [...initialAdminUserIds.value],
        memberUserIds: [...initialMemberUserIds.value]
      })
      message.success(t('common.createSuccess'))
    } else {
      await KnowledgeLibraryApi.updateKnowledgeLibrary(formData.value)
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
  formData.value = getDefaultFormData()
  resetInitialMembers()
  formRef.value?.resetFields()
}

/** 获得默认表单数据 */
function getDefaultFormData(): KnowledgeLibraryApi.PmsKnowledgeLibraryVO {
  return {
    id: undefined as unknown as number,
    name: '',
    description: '',
    openStatus: false,
    coverUrl: undefined,
    adminUserIds: [],
    memberUserIds: [],
    templateId: undefined
  }
}
</script>
