<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="200px"
      v-loading="formLoading"
    >
      <el-form-item label="规则适用人群" prop="userIds">
        <el-tree-select
          v-model="formData.userIds"
          :data="userTree"
          :props="defaultProps"
          multiple
          filterable
          check-on-click-node
          node-key="id"
          placeholder="请选择规则适用人群"
        />
      </el-form-item>
      <el-form-item label="规则适用部门" prop="deptIds">
        <el-tree-select
          v-model="formData.deptIds"
          :data="deptTree"
          :props="defaultProps"
          multiple
          filterable
          check-strictly
          node-key="id"
          placeholder="请选择规则适用部门"
        />
      </el-form-item>
      <el-form-item
        :label="
          formData.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT
            ? '拥有客户数上限'
            : '锁定客户数上限'
        "
        prop="maxCount"
      >
        <el-input-number v-model="formData.maxCount" placeholder="请输入数量上限" />
      </el-form-item>
      <el-form-item
        label="成交客户是否占用拥有客户数"
        v-if="formData.type === LimitConfType.CUSTOMER_QUANTITY_LIMIT"
        prop="dealCountEnabled"
      >
        <el-switch v-model="formData.dealCountEnabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as CustomerLimitConfigApi from '@/api/crm/customer/limitConfig'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'
import * as UserApi from '@/api/system/user'
import { cloneDeep } from 'lodash-es'
import { LimitConfType } from '@/api/crm/customer/limitConfig'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  type: LimitConfType.CUSTOMER_LOCK_LIMIT, // 给个默认值，避免 IDE 报错
  userIds: undefined,
  deptIds: undefined,
  maxCount: undefined,
  dealCountEnabled: false
})
const formRules = reactive({
  type: [{ required: true, message: '规则类型不能为空', trigger: 'change' }],
  maxCount: [{ required: true, message: '数量上限不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
// TODO @芋艿：看看怎么搞个部门选择组件
const deptTree = ref() // 部门树形结构
const userTree = ref() // 用户树形结构

/** 打开弹窗 */
const open = async (type: string, limitConfType: LimitConfType, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await CustomerLimitConfigApi.getCustomerLimitConfig(id)
    } finally {
      formLoading.value = false
    }
  } else {
    formData.value.type = limitConfType
  }
  // 获得部门树
  await getDeptTree()
  // 获得用户
  await getUserTree()
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
    const data = formData.value as unknown as CustomerLimitConfigApi.CustomerLimitConfigVO
    if (formType.value === 'create') {
      await CustomerLimitConfigApi.createCustomerLimitConfig(data)
      message.success(t('common.createSuccess'))
    } else {
      await CustomerLimitConfigApi.updateCustomerLimitConfig(data)
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
    type: LimitConfType.CUSTOMER_LOCK_LIMIT,
    userIds: undefined,
    deptIds: undefined,
    maxCount: undefined,
    dealCountEnabled: false
  }
  formRef.value?.resetFields()
}

/**
 * 获取部门树
 */
const getDeptTree = async () => {
  const res = await DeptApi.getSimpleDeptList()
  deptTree.value = []
  deptTree.value.push(...handleTree(res))
}

/**
 * 获取用户树
 */
const getUserTree = async () => {
  const res = await UserApi.getAllUser()
  userTree.value = []
  userTree.value = cloneDeep(unref(deptTree))

  const deptUserMap = {}
  res.forEach((user) => {
    if (user.dept) {
      if (!deptUserMap[user.deptId]) {
        deptUserMap[user.deptId] = []
      }
      deptUserMap[user.deptId].push(user)
    }
  })

  handleUserData(userTree.value, deptUserMap)
}

// TODO @芋艿：看看怎么搞个用户选择的组件
/**
 * 处理用户树
 *
 * @param deptTree
 * @param deptUserMap
 */
const handleUserData = (deptTree, deptUserMap) => {
  for (let i = 0; i < deptTree.length; i++) {
    // 如果是用户，就不用继续找部门下的用户
    if (deptTree[i].isUser) {
      continue
    }
    const users = deptUserMap[deptTree[i].id]
    if (users) {
      if (!deptTree[i].children) {
        deptTree[i].children = []
      }
      deptTree[i].children.push(
        ...users.map((user) => {
          return {
            id: user.id,
            name: user.username + '-' + user.nickname,
            isUser: true,
            // 用户状态为关闭
            disabled: user.status === 1
          }
        })
      )
    }

    if (deptTree[i].children && deptTree[i].children.length !== 0) {
      handleUserData(deptTree[i].children, deptUserMap)
    }

    // 非人员选项禁用
    deptTree[i].disabled = true
    // 将非人员的 id 置为空
    deptTree[i].id = 'null'
  }
}
</script>
