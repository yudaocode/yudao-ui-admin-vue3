<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="上级部门" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="deptTree"
          :props="{ value: 'id', label: 'name', children: 'children' }"
          value-key="deptId"
          placeholder="请选择上级部门"
          check-strictly
          default-expand-all
        />
      </el-form-item>
      <el-form-item label="部门名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入部门名称" />
      </el-form-item>
      <el-form-item label="显示排序" prop="sort">
        <el-input-number v-model="formData.sort" controls-position="right" :min="0" />
      </el-form-item>
      <el-form-item label="负责人" prop="leaderUserId">
        <el-select
          v-model="formData.leaderUserId"
          placeholder="请输入负责人"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" maxlength="11" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" maxlength="50" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="modelVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { CommonStatusEnum } from '@/utils/constants'
const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  title: '',
  parentId: undefined,
  name: undefined,
  sort: undefined,
  leaderUserId: undefined,
  phone: undefined,
  email: undefined,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({
  parentId: [{ required: true, message: '上级部门不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '部门名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '显示排序不能为空', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [
    { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
})
const formRef = ref() // 表单 Ref
const deptTree = ref() // 树形结构
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await DeptApi.getDeptApi(id)
    } finally {
      formLoading.value = false
    }
  }
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
  // 获得部门树
  await getTree()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as DeptApi.DeptVO
    if (formType.value === 'create') {
      await DeptApi.createDeptApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await DeptApi.updateDeptApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
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
    title: '',
    parentId: undefined,
    name: undefined,
    sort: undefined,
    leaderUserId: undefined,
    phone: undefined,
    email: undefined,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

/** 获得部门树 */
const getTree = async () => {
  deptTree.value = []
  const data = await DeptApi.listSimpleDeptApi()
  let dept: Tree = { id: 0, name: '顶级部门', children: [] }
  dept.children = handleTree(data)
  deptTree.value.push(dept)
}
</script>
