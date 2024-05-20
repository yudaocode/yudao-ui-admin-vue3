<template>
  <ContentWrap>
    <!-- 表单设计器 -->
    <FcDesigner ref="designer" height="780px">
      <template #handle>
        <el-button round size="small" type="primary" @click="handleSave">
          <Icon class="mr-5px" icon="ep:plus" />
          保存
        </el-button>
      </template>
    </FcDesigner>
  </ContentWrap>

  <!-- 表单保存的弹窗 -->
  <Dialog v-model="dialogVisible" title="保存表单" width="600">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="表单名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入表单名" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as FormApi from '@/api/bpm/form'
import FcDesigner from '@form-create/designer'
import { encodeConf, encodeFields, setConfAndFields } from '@/utils/formCreate'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useFormCreateDesigner } from '@/components/FormCreate'

defineOptions({ name: 'BpmFormEditor' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息
const { push, currentRoute } = useRouter() // 路由
const { query } = useRoute() // 路由信息
const { delView } = useTagsViewStore() // 视图操作

const designer = ref() // 表单设计器
useFormCreateDesigner(designer) // 表单设计器增强
const dialogVisible = ref(false) // 弹窗是否展示
const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const formData = ref({
  name: '',
  status: CommonStatusEnum.ENABLE,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '表单名不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '开启状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 处理保存按钮 */
const handleSave = () => {
  dialogVisible.value = true
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as FormApi.FormVO
    data.conf = encodeConf(designer) // 表单配置
    data.fields = encodeFields(designer) // 表单字段
    if (!data.id) {
      await FormApi.createForm(data)
      message.success(t('common.createSuccess'))
    } else {
      await FormApi.updateForm(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    close()
  } finally {
    formLoading.value = false
  }
}
/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push('/bpm/manager/form')
}

/** 初始化 **/
onMounted(async () => {
  // 场景一：新增表单
  const id = query.id as unknown as number
  if (!id) {
    return
  }
  // 场景二：修改表单
  const data = await FormApi.getForm(id)
  formData.value = data
  setConfAndFields(designer, data.conf, data.fields)
})
</script>
