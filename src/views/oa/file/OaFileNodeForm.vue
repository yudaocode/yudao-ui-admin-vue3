<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item v-if="formType === 'create' || formType === 'rename'" label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" maxlength="255" />
      </el-form-item>
      <el-form-item v-else label="目标目录" prop="parentId">
        <el-tree-select
          v-model="formData.parentId"
          :data="directoryList"
          node-key="id"
          :props="defaultProps"
          check-strictly
          default-expand-all
          placeholder="请选择目标目录"
          class="!w-1/1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import * as NodeApi from '@/api/oa/file/node'
import { defaultProps, findNode, handleTree } from '@/utils/tree'
import { OA_FILE_NODE_TYPE, OA_FILE_PARENT_ID_ROOT } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaFileNodeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）目录加载；2）提交的按钮禁用
const formType = ref('') // 表单类型：create - 新建文件夹；rename - 重命名；move - 移动；copy - 复制
const formData = ref<NodeApi.OaFileNodeVO>({
  id: undefined,
  name: '',
  parentId: OA_FILE_PARENT_ID_ROOT,
  type: OA_FILE_NODE_TYPE.FOLDER
})
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  parentId: [{ required: true, message: '目标目录不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const directoryList = ref<Tree[]>([]) // 可移动的目录树

/** 打开弹窗 */
async function open(type: string, parentId: number, row?: NodeApi.OaFileNodeVO) {
  dialogVisible.value = true
  dialogTitle.value =
    { create: '新建文件夹', move: '移动', copy: '复制', rename: '重命名' }[type] || ''
  formType.value = type
  resetForm()
  // 重命名、移动时回显当前节点
  formData.value.id = row?.id
  formData.value.name = row?.name || ''
  formData.value.parentId = type === 'copy' ? OA_FILE_PARENT_ID_ROOT : parentId
  if (type !== 'move' && type !== 'copy') return
  // 加载目标目录，移除当前节点的整棵子树，避免移动到自身及下级目录
  formLoading.value = true
  try {
    const list = await NodeApi.getFileDirectoryList()
    directoryList.value = [
      { id: OA_FILE_PARENT_ID_ROOT, name: '我的文件', children: handleTree(list) }
    ]
    const parent = findNode<Tree>(directoryList.value, (item) =>
      item.children?.some((child: Tree) => child.id === row?.id)
    )
    if (parent) {
      parent.children = parent.children?.filter((item: Tree) => item.id !== row?.id)
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await NodeApi.createFileNode(formData.value)
      message.success(t('common.createSuccess'))
    } else if (formType.value === 'move') {
      await NodeApi.updateFileNodeParent(formData.value.id!, formData.value.parentId)
      message.success('移动成功')
    } else if (formType.value === 'copy') {
      await NodeApi.copyFileNode(formData.value.id!, formData.value.parentId)
      message.success('复制成功')
    } else {
      await NodeApi.updateFileNodeName(formData.value.id!, formData.value.name)
      message.success('重命名成功')
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
  formRef.value?.resetFields()
  formData.value = {
    id: undefined,
    name: '',
    parentId: OA_FILE_PARENT_ID_ROOT,
    type: OA_FILE_NODE_TYPE.FOLDER
  }
  directoryList.value = []
}
</script>
