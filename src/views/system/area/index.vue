<template>
  <div class="app-container">
    <doc-alert title="地区 & IP" url="https://doc.iocoder.cn/area-and-ip/" />
    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <XButton preIcon="fa:search" type="primary" @click="handleAdd" title="IP 查询" />
      </el-col>
    </el-row>
    <!-- 列表 -->
    <el-table
      v-if="refreshTable"
      v-loading="loading"
      :data="list"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <el-table-column label="编号" prop="id" />
      <el-table-column label="名字" prop="name" />
    </el-table>
    <!-- <XTable ref="xGrid" @register="registerTable" show-overflow /> -->

    <!-- 对话框(添加 / 修改) -->
    <el-dialog title="IP 查询" v-model="open" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="IP" prop="ip">
          <el-input v-model="form.ip" placeholder="请输入 IP 地址" />
        </el-form-item>
        <el-form-item label="地址" prop="result">
          <el-input v-model="form.result" readonly placeholder="展示查询 IP 结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm(formRef)">查 询</el-button>
        <el-button @click="cancel(formRef)">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="Area">
import * as areaApi from '@/api/system/area'
import type { FormInstance } from 'element-plus'
// import { allSchemas } from './area.data'
// import { getAreaByIp, getAreaTree } from '@/api/system/area'
// 遮罩层
const loading = ref(true)
// 地区列表
const list = ref([])
// 弹出层标题
// const title = ref('')
// 是否显示弹出层
const open = ref(false)
// 重新渲染表格状态
const refreshTable = ref(true)
// 表单参数
const form = ref({
  ip: undefined,
  result: undefined
})
const formRef = ref<FormInstance>()
// 表单校验
const rules = ref({
  ip: [{ required: true, message: 'IP 地址不能为控', trigger: 'blur' }]
})
const message = useMessage() // 消息弹窗

// const treeConfig = {
//   transform: true,
//   rowField: 'id',
//   parentField: 'id'
//   // expandAll: true
// }

// const [registerTable, { reload }] = useXTable({
//   allSchemas: allSchemas,
//   treeConfig: treeConfig,
//   getListApi: areaApi.getAreaTree
// })

/** 查询列表 */
const getList = async () => {
  loading.value = true
  const response = await areaApi.getAreaTree()
  list.value = response.data
  loading.value = false
}
/** 取消按钮 */
const cancel = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
  open.value = false
  reset()
}
/** 表单重置 */
const reset = async () => {
  form.value = {
    ip: undefined,
    result: undefined
  }
  // await reload()
}
/** 新增按钮操作 */
const handleAdd = () => {
  open.value = true
  reset()
}
/** 提交按钮 */
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      console.log('submit!')
      const response = await areaApi.getAreaByIp(form.value.ip)
      message.success('查询成功')
      form.value.result = response.data
    } else {
      console.log('error submit!', fields)
    }
  })
}

onMounted(() => {
  getList()
})
</script>
