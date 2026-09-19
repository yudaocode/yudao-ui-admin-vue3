<template>
  <Dialog v-model="dialogVisible" max-height="55vh" scroll :title="dialogTitle" width="900px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <!-- 基本信息 -->
      <el-form-item :label="`${workItemTypeName}标题`" prop="name">
        <el-input
          v-model="formData.name"
          maxlength="100"
          :placeholder="`请输入${workItemTypeName}标题`"
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-select v-model="formData.priority" class="!w-100%">
              <el-option
                v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="assigneeUserId">
            <ProjectMemberSelect
              v-model="formData.assigneeUserId"
              class="!w-100%"
              :project-id="projectId"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              class="!w-100%"
              clearable
              placeholder="请选择开始时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="截止时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              class="!w-100%"
              clearable
              placeholder="请选择截止时间"
              type="datetime"
              value-format="x"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col v-if="projectType === PmsProjectType.AGILE" :span="12">
          <el-form-item label="所属迭代" prop="iterationId">
            <IterationSelect
              v-model="formData.iterationId"
              class="!w-100%"
              :project-id="projectId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="projectType === PmsProjectType.AGILE ? 12 : 24">
          <el-form-item label="父级工作项" prop="parentId">
            <WorkItemSelect
              v-model="formData.parentId"
              class="!w-100%"
              :exclude-id="formData.id"
              placeholder="请选择父级工作项"
              :project-id="projectId"
              :type="type"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row
        v-if="projectType === PmsProjectType.AGILE && type !== PmsWorkItemType.REQUIREMENT"
        :gutter="20"
      >
        <el-col :span="12">
          <el-form-item label="关联需求" prop="relatedRequirementId">
            <WorkItemSelect
              v-model="formData.relatedRequirementId"
              class="!w-100%"
              placeholder="请选择关联需求"
              :project-id="projectId"
              :type="PmsWorkItemType.REQUIREMENT"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="type === PmsWorkItemType.DEFECT" :span="12">
          <el-form-item label="缺陷类型" prop="defectType">
            <el-select v-model="formData.defectType" class="!w-100%">
              <el-option
                v-for="option in getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="预估工时" prop="estimatedHours">
            <el-input-number
              v-model="formData.estimatedHours"
              class="!w-100%"
              :min="0"
              placeholder="请输入预估工时"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="完成进度" prop="progress">
            <el-slider v-model="formData.progress" show-input :max="100" :min="0" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="参与人" prop="memberUserIds">
        <ProjectMemberSelect
          v-model="formData.memberUserIds"
          class="!w-100%"
          multiple
          :project-id="projectId"
        />
      </el-form-item>
      <el-form-item label="标签" prop="labelIds">
        <div class="flex w-100% gap-8px">
          <WorkItemLabelSelect ref="labelSelectRef" v-model="formData.labelIds" class="flex-1" />
          <el-button @click="labelManageRef?.open()">标签管理</el-button>
        </div>
      </el-form-item>
      <el-form-item :label="`${workItemTypeName}描述`" prop="description">
        <Editor v-model="formData.description" height="240px" />
      </el-form-item>
      <el-form-item label="附件" prop="fileUrls">
        <UploadFile v-model="formData.fileUrls" />
      </el-form-item>
      <template v-if="formType === 'create'">
        <el-form-item label="子工作项">
          <div class="flex w-100% flex-col gap-8px">
            <div
              v-for="(_, index) in formData.childWorkItemNames"
              :key="index"
              class="flex items-center gap-8px"
            >
              <el-input
                v-model="formData.childWorkItemNames![index]"
                maxlength="100"
                placeholder="请输入子工作项标题"
              />
              <el-button link type="danger" @click="formData.childWorkItemNames?.splice(index, 1)">
                删除
              </el-button>
            </div>
            <el-button class="!w-fit" plain @click="formData.childWorkItemNames?.push('')">
              <Icon class="mr-4px" icon="ep:plus" />添加子工作项
            </el-button>
          </div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实际投入" prop="actualHours">
              <el-input-number
                v-model="formData.actualHours"
                class="!w-100%"
                :min="1"
                placeholder="请输入实际投入工时"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剩余工时" prop="remainingHours">
              <el-input-number
                v-model="formData.remainingHours"
                class="!w-100%"
                :min="0"
                placeholder="请输入剩余工时"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 标签管理 -->
  <WorkItemLabelList ref="labelManageRef" @success="labelSelectRef?.getWorkItemLabelList()" />
</template>

<script lang="ts" setup>
import * as ProjectApi from '@/api/pms/pm/project'
import * as WorkItemApi from '@/api/pms/pm/workitem'
import {
  PmsProjectType,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType
} from '@/views/pms/pm/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getWorkItemTypeName } from '@/views/pms/pm/utils/format'
import ProjectMemberSelect from '@/views/pms/pm/project/components/ProjectMemberSelect.vue'
import IterationSelect from '@/views/pms/pm/iteration/components/IterationSelect.vue'
import WorkItemSelect from '../components/WorkItemSelect.vue'
import WorkItemLabelList from '../label/WorkItemLabelList.vue'
import WorkItemLabelSelect from '../label/WorkItemLabelSelect.vue'

defineOptions({ name: 'PmsWorkItemForm' })

type WorkItemFormType = 'create' | 'update'

interface WorkItemCreateContext {
  projectId: number
  projectType: number
  type: number
  iterationId?: number
}

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否展示
const formLoading = ref(false) // 表单加载中
const formType = ref<WorkItemFormType>('create') // 表单类型
const projectId = ref(0) // 项目编号
const projectType = ref<number>(PmsProjectType.GENERAL) // 项目类型
const type = ref<number>(PmsWorkItemType.TASK) // 工作项类型
const formData = ref<WorkItemApi.PmsWorkItemVO>(getDefaultFormData()) // 表单数据
const workItemTypeName = computed(() => getWorkItemTypeName(type.value)) // 工作项业务名称
const dialogTitle = computed(
  () => `${formType.value === 'create' ? '新建' : '编辑'}${workItemTypeName.value}`
) // 弹窗标题
const formRules = computed(() => ({
  name: [{ required: true, message: `${workItemTypeName.value}标题不能为空`, trigger: 'blur' }],
  priority: [{ required: true, message: '优先级不能为空', trigger: 'change' }],
  startTime: [{ validator: validateWorkItemTimeRange, trigger: 'change' }],
  endTime: [{ validator: validateWorkItemTimeRange, trigger: 'change' }],
  defectType:
    type.value === PmsWorkItemType.DEFECT
      ? [{ required: true, message: '缺陷类型不能为空', trigger: 'change' }]
      : []
})) // 表单校验规则
const formRef = ref() // 表单 Ref
const labelManageRef = ref<InstanceType<typeof WorkItemLabelList>>() // 标签列表弹窗 Ref
const labelSelectRef = ref<InstanceType<typeof WorkItemLabelSelect>>() // 标签选择 Ref
const emit = defineEmits<{ success: [] }>() // 定义 success 事件，用于操作成功后的回调

/** 打开工作项表单 */
async function open(
  currentFormType: WorkItemFormType,
  id?: number,
  createContext?: WorkItemCreateContext
) {
  formType.value = currentFormType
  formLoading.value = true
  try {
    if (currentFormType === 'update' && id) {
      // 修改场景通过工作项详情确定项目和事项类型
      const workItem = await WorkItemApi.getWorkItem(id)
      projectId.value = workItem.projectId
      projectType.value = (await ProjectApi.getProject(workItem.projectId)).type
      type.value = workItem.type
      formData.value = {
        ...workItem,
        fileUrls: workItem.fileUrls ?? [],
        labelIds: workItem.labelIds ?? []
      }
      dialogVisible.value = true
      return
    }
    // 新建场景没有工作项编号，需要由业务入口提供项目和事项类型
    if (!createContext) {
      return
    }
    projectId.value = createContext.projectId
    projectType.value = createContext.projectType
    type.value = createContext.type
    resetForm()
    formData.value.iterationId = createContext.iterationId
    dialogVisible.value = true
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开表单

/** 校验工作项时间范围 */
function validateWorkItemTimeRange(
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void
) {
  if (
    formData.value.startTime &&
    formData.value.endTime &&
    Number(formData.value.startTime) >= Number(formData.value.endTime)
  ) {
    callback(new Error('开始时间必须早于截止时间'))
    return
  }
  callback()
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value || !(await formRef.value.validate())) {
    return
  }
  // 新增或修改工作项
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await WorkItemApi.createWorkItem(formData.value)
      message.success('创建成功')
    } else {
      await WorkItemApi.updateWorkItem(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  formRef.value?.resetFields()
}

/** 获得表单默认值 */
function getDefaultFormData(): WorkItemApi.PmsWorkItemVO {
  return {
    projectId: projectId.value,
    type: type.value,
    name: '',
    priority: PmsWorkItemPriority.MEDIUM,
    memberUserIds: [],
    progress: 0,
    defectType: type.value === PmsWorkItemType.DEFECT ? PmsWorkItemDefectType.FUNCTION : undefined,
    fileUrls: [],
    labelIds: [],
    childWorkItemNames: []
  }
}
</script>
