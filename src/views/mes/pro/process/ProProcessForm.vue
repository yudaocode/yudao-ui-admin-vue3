<!-- MES 生产工序表单 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="工序编码" prop="code">
            <el-input v-model="formData.code" placeholder="请输入工序编码" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工序名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入工序名称" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="工艺要求" prop="attention">
        <el-input
          v-model="formData.attention"
          type="textarea"
          :rows="3"
          placeholder="请输入工艺要求"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>

      <!-- 工序内容（操作步骤） -->
      <el-divider content-position="left">操作步骤</el-divider>
      <el-table :data="formData.contents" border style="width: 100%">
        <el-table-column label="序号" align="center" width="80">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.sort"
              :min="1"
              :max="999"
              controls-position="right"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="步骤说明" align="center" min-width="200">
          <template #default="scope">
            <el-input v-model="scope.row.content" type="textarea" :rows="2" placeholder="请输入步骤说明" />
          </template>
        </el-table-column>
        <el-table-column label="辅助设备" align="center" width="150">
          <template #default="scope">
            <el-input v-model="scope.row.device" placeholder="请输入辅助设备" />
          </template>
        </el-table-column>
        <el-table-column label="辅助材料" align="center" width="150">
          <template #default="scope">
            <el-input v-model="scope.row.material" placeholder="请输入辅助材料" />
          </template>
        </el-table-column>
        <el-table-column label="材料文档" align="center" width="150">
          <template #default="scope">
            <el-input v-model="scope.row.docUrl" placeholder="请输入文档 URL" />
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="scope">
            <el-button link type="danger" @click="handleDeleteContent(scope.$index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" plain class="mt-10px" @click="handleAddContent">
        <Icon icon="ep:plus" class="mr-5px" /> 添加步骤
      </el-button>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProProcessApi, ProProcessVO, ProProcessContentVO } from '@/api/mes/pro/process'

defineOptions({ name: 'ProProcessForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<ProProcessVO>({
  id: undefined,
  code: '',
  name: '',
  attention: '',
  status: 0,
  remark: '',
  contents: []
})
const formRules = reactive({
  code: [{ required: true, message: '工序编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '工序名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增生产工序' : '编辑生产工序'
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProProcessApi.getProcess(id)
      // 确保 contents 是数组
      if (!formData.value.contents) {
        formData.value.contents = []
      }
    } finally {
      formLoading.value = false
    }
  }
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
    const data = { ...formData.value }
    if (formType.value === 'create') {
      await ProProcessApi.createProcess(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProProcessApi.updateProcess(data)
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
    code: '',
    name: '',
    attention: '',
    status: 0,
    remark: '',
    contents: []
  }
  formRef.value?.resetFields()
}

/** 添加操作步骤 */
const handleAddContent = () => {
  if (!formData.value.contents) {
    formData.value.contents = []
  }
  const maxSort = formData.value.contents.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formData.value.contents.push({
    sort: maxSort + 1,
    content: '',
    device: '',
    material: '',
    docUrl: '',
    remark: ''
  })
}

/** 删除操作步骤 */
const handleDeleteContent = (index: number) => {
  formData.value.contents?.splice(index, 1)
}
</script>
