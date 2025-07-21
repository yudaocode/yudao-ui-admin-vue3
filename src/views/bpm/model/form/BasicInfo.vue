<template>
  <el-form ref="formRef" :model="modelData" :rules="rules" label-width="120px" class="mt-20px">
    <el-form-item label="流程标识" prop="key" class="mb-20px">
      <div class="flex items-center">
        <el-input
          class="!w-440px"
          v-model="modelData.key"
          :disabled="!!modelData.id"
          placeholder="请输入流程标识，以字母或下划线开头"
        />
        <el-tooltip
          class="item"
          :content="modelData.id ? '流程标识不可修改！' : '新建后，流程标识不可修改！'"
          effect="light"
          placement="top"
        >
          <Icon icon="ep:question-filled" class="ml-5px" />
        </el-tooltip>
      </div>
    </el-form-item>
    <el-form-item label="流程名称" prop="name" class="mb-20px">
      <el-input
        v-model="modelData.name"
        :disabled="!!modelData.id"
        clearable
        placeholder="请输入流程名称"
      />
    </el-form-item>
    <el-form-item label="流程分类" prop="category" class="mb-20px">
      <el-select
        class="!w-full"
        v-model="modelData.category"
        clearable
        placeholder="请选择流程分类"
      >
        <el-option
          v-for="category in categoryList"
          :key="category.code"
          :label="category.name"
          :value="category.code"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="流程图标" class="mb-20px">
      <UploadImg v-model="modelData.icon" :limit="1" height="64px" width="64px" />
    </el-form-item>
    <el-form-item label="流程描述" prop="description" class="mb-20px">
      <el-input v-model="modelData.description" clearable type="textarea" />
    </el-form-item>
    <el-form-item label="流程类型" prop="type" class="mb-20px">
      <el-radio-group v-model="modelData.type">
        <el-radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
          :key="dict.value"
          :value="dict.value"
        >
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="是否可见" prop="visible" class="mb-20px">
      <el-radio-group v-model="modelData.visible">
        <el-radio
          v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
          :key="dict.value as string"
          :value="dict.value"
        >
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="谁可以发起" prop="startUserType" class="mb-20px">
      <el-select
        v-model="modelData.startUserType"
        placeholder="请选择谁可以发起"
        @change="handleStartUserTypeChange"
      >
        <el-option label="全员" :value="0" />
        <el-option label="指定人员" :value="1" />
        <el-option label="指定部门" :value="2" />
      </el-select>
      <div v-if="modelData.startUserType === 1" class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="user in selectedStartUsers"
          :key="user.id"
          class="bg-gray-100 h-35px rounded-3xl flex items-center pr-8px dark:color-gray-600 position-relative"
        >
          <el-avatar class="!m-5px" :size="28" v-if="user.avatar" :src="user.avatar" />
          <el-avatar class="!m-5px" :size="28" v-else>
            {{ user.nickname.substring(0, 1) }}
          </el-avatar>
          {{ user.nickname }}
          <Icon
            icon="ep:close"
            class="ml-2 cursor-pointer hover:text-red-500"
            @click="handleRemoveStartUser(user)"
          />
        </div>
        <el-button type="primary" link @click="openStartUserSelect">
          <Icon icon="ep:plus" /> 选择人员
        </el-button>
      </div>
      <div v-if="modelData.startUserType === 2" class="mt-2 flex flex-wrap gap-2">
        <div
          v-for="dept in selectedStartDepts"
          :key="dept.id"
          class="bg-gray-100 h-35px rounded-3xl flex items-center pr-8px dark:color-gray-600 position-relative"
        >
          <Icon icon="ep:office-building" class="!m-5px text-20px" />
          {{ dept.name }}
          <Icon
            icon="ep:close"
            class="ml-2 cursor-pointer hover:text-red-500"
            @click="handleRemoveStartDept(dept)"
          />
        </div>
        <el-button type="primary" link @click="openStartDeptSelect">
          <Icon icon="ep:plus" /> 选择部门
        </el-button>
      </div>
    </el-form-item>
    <el-form-item label="流程管理员" prop="managerUserIds" class="mb-20px">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="user in selectedManagerUsers"
          :key="user.id"
          class="bg-gray-100 h-35px rounded-3xl flex items-center pr-8px dark:color-gray-600 position-relative"
        >
          <el-avatar class="!m-5px" :size="28" v-if="user.avatar" :src="user.avatar" />
          <el-avatar class="!m-5px" :size="28" v-else>
            {{ user.nickname.substring(0, 1) }}
          </el-avatar>
          {{ user.nickname }}
          <Icon
            icon="ep:close"
            class="ml-2 cursor-pointer hover:text-red-500"
            @click="handleRemoveManagerUser(user)"
          />
        </div>
        <el-button type="primary" link @click="openManagerUserSelect">
          <Icon icon="ep:plus" />选择人员
        </el-button>
      </div>
    </el-form-item>
  </el-form>

  <!-- 用户选择弹窗 -->
  <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
  <!-- 部门选择弹窗 -->
  <DeptSelectForm
    ref="deptSelectFormRef"
    :multiple="true"
    :check-strictly="true"
    @confirm="handleDeptSelectConfirm"
  />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '@/utils/dict'
import { UserVO } from '@/api/system/user'
import { DeptVO } from '@/api/system/dept'
import { CategoryVO } from '@/api/bpm/category'

const props = defineProps({
  categoryList: {
    type: Array as PropType<CategoryVO[]>,
    required: true
  },
  userList: {
    type: Array,
    required: true
  },
  deptList: {
    type: Array,
    required: true
  }
})

const formRef = ref()
const selectedStartUsers = ref<UserVO[]>([])
const selectedStartDepts = ref<DeptVO[]>([])
const selectedManagerUsers = ref<UserVO[]>([])
const userSelectFormRef = ref()
const deptSelectFormRef = ref()
const currentSelectType = ref<'start' | 'manager'>('start')

const rules = {
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
  key: [
    { required: true, message: '流程标识不能为空', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        if (!/^[a-zA-Z_][\-_.0-9_a-zA-Z$]*$/.test(value)) {
          callback(new Error('只能包含字母、数字、下划线、连字符和点号，且必须以字母或下划线开头'))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  category: [{ required: true, message: '流程分类不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  managerUserIds: [{ required: true, message: '流程管理员不能为空', trigger: 'blur' }]
}

// 创建本地数据副本
const modelData = defineModel<any>()

// 初始化选中的用户
watch(
  () => modelData.value,
  (newVal) => {
    if (newVal.startUserIds?.length) {
      selectedStartUsers.value = props.userList.filter((user: UserVO) =>
        newVal.startUserIds.includes(user.id)
      ) as UserVO[]
    } else {
      selectedStartUsers.value = []
    }
    if (newVal.startDeptIds?.length) {
      selectedStartDepts.value = props.deptList.filter((dept: DeptVO) =>
        newVal.startDeptIds.includes(dept.id)
      ) as DeptVO[]
    } else {
      selectedStartDepts.value = []
    }
    if (newVal.managerUserIds?.length) {
      selectedManagerUsers.value = props.userList.filter((user: UserVO) =>
        newVal.managerUserIds.includes(user.id)
      ) as UserVO[]
    } else {
      selectedManagerUsers.value = []
    }
  },
  {
    immediate: true
  }
)

/** 打开发起人选择 */
const openStartUserSelect = () => {
  currentSelectType.value = 'start'
  userSelectFormRef.value.open(0, selectedStartUsers.value)
}

/** 打开部门选择 */
const openStartDeptSelect = () => {
  deptSelectFormRef.value.open(selectedStartDepts.value)
}

/** 打开管理员选择 */
const openManagerUserSelect = () => {
  currentSelectType.value = 'manager'
  userSelectFormRef.value.open(0, selectedManagerUsers.value)
}

/** 处理用户选择确认 */
const handleUserSelectConfirm = (_, users: UserVO[]) => {
  if (currentSelectType.value === 'start') {
    modelData.value = {
      ...modelData.value,
      startUserIds: users.map((u) => u.id)
    }
  } else {
    modelData.value = {
      ...modelData.value,
      managerUserIds: users.map((u) => u.id)
    }
  }
}

/** 处理部门选择确认 */
const handleDeptSelectConfirm = (depts: DeptVO[]) => {
  modelData.value = {
    ...modelData.value,
    startDeptIds: depts.map((d) => d.id)
  }
}

/** 处理发起人类型变化 */
const handleStartUserTypeChange = (value: number) => {
  if (value === 0) {
    modelData.value = {
      ...modelData.value,
      startUserIds: [],
      startDeptIds: []
    }
  } else if (value === 1) {
    modelData.value = {
      ...modelData.value,
      startDeptIds: []
    }
  } else if (value === 2) {
    modelData.value = {
      ...modelData.value,
      startUserIds: []
    }
  }
}

/** 移除发起人 */
const handleRemoveStartUser = (user: UserVO) => {
  modelData.value = {
    ...modelData.value,
    startUserIds: modelData.value.startUserIds.filter((id: number) => id !== user.id)
  }
}

/** 移除部门 */
const handleRemoveStartDept = (dept: DeptVO) => {
  modelData.value = {
    ...modelData.value,
    startDeptIds: modelData.value.startDeptIds.filter((id: number) => id !== dept.id)
  }
}

/** 移除管理员 */
const handleRemoveManagerUser = (user: UserVO) => {
  modelData.value = {
    ...modelData.value,
    managerUserIds: modelData.value.managerUserIds.filter((id: number) => id !== user.id)
  }
}

/** 表单校验 */
const validate = async () => {
  await formRef.value?.validate()
}

defineExpose({
  validate
})
</script>

<style lang="scss" scoped>
.bg-gray-100 {
  background-color: #f5f7fa;
  transition: all 0.3s;

  &:hover {
    background-color: #e6e8eb;
  }

  .ep-close {
    font-size: 14px;
    color: #909399;
    transition: color 0.3s;

    &:hover {
      color: #f56c6c;
    }
  }
}
</style>
