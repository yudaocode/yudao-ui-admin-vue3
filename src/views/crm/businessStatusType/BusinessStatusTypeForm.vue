<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="状态类型名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入状态类型名" />
      </el-form-item>
      <el-form-item label="应用部门" prop="deptIds">
        <el-tree
          ref="treeRef"
          :data="deptList"
          :props="defaultProps"
          :check-strictly="!checkStrictly"
          node-key="id"
          placeholder="请选择归属部门"
          show-checkbox
        />
      </el-form-item>
      <el-form-item label="状态设置" prop="statusList">
        <el-table border style="width: 100%" :data="formData.statusList">
          <el-table-column align="center" label="状态" width="120" prop="star">
            <template #default="scope">
              <el-text>状态{{ scope.$index + 1 }}</el-text>
            </template>
          </el-table-column>
          <el-table-column align="center" label="状态名称" width="120" prop="name">
            <template #default="{ row }">
              <el-input v-model="row.name" placeholder="请输入状态名称" />
            </template>
          </el-table-column>
          <el-table-column width="120" align="center" label="赢单率" prop="percent">
            <template #default="{ row }">
              <el-input v-model="row.percent" placeholder="请输入赢单率" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center">
            <template #default="scope">
              <el-button link type="primary" @click="addStatusArea(scope.$index)"> 添加 </el-button>
              <el-button
                link
                type="danger"
                @click="deleteStatusArea(scope.$index)"
                v-show="scope.$index > 0"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as BusinessStatusTypeApi from '@/api/crm/businessStatusType'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: 0,
  name: '',
  deptIds: [],
  statusList: []
})
const formRules = reactive({
  name: [{ required: true, message: '状态类型名不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref
const deptList = ref<Tree[]>([]) // 树形结构
const treeRef = ref() // 菜单树组件 Ref
const checkStrictly = ref(true) // 是否严格模式，即父子不关联

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
      formData.value = await BusinessStatusTypeApi.getBusinessStatusType(id)
      treeRef.value.setCheckedKeys(formData.value.deptIds)
      if (formData.value.statusList.length == 0) {
        addStatusArea(0)
      }
    } finally {
      formLoading.value = false
    }
  } else {
    addStatusArea(0)
  }
  // 加载部门树
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as BusinessStatusTypeApi.BusinessStatusTypeVO
    data.deptIds = treeRef.value.getCheckedKeys(false)
    if (formType.value === 'create') {
      await BusinessStatusTypeApi.createBusinessStatusType(data)
      message.success(t('common.createSuccess'))
    } else {
      await BusinessStatusTypeApi.updateBusinessStatusType(data)
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
  checkStrictly.value = true
  formData.value = {
    id: 0,
    name: '',
    deptIds: [],
    statusList: []
  }
  treeRef.value?.setCheckedNodes([])
  formRef.value?.resetFields()
}

/** 添加状态 */
const addStatusArea = () => {
  const data = formData.value
  data.statusList.push({
    name: '',
    percent: ''
  })
}

/** 删除状态 */
const deleteStatusArea = (index: number) => {
  const data = formData.value
  data.statusList.splice(index, 1)
}
</script>
