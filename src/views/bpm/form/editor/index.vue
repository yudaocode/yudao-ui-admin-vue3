<template>
  <ContentWrap :body-style="{ padding: '0px' }" class="!mb-0">
    <!-- 表单设计器 -->
    <div
      class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding)-2px)]"
    >
      <fc-designer class="my-designer" ref="designer" :config="designerConfig">
        <template #handle>
          <el-button size="small" type="success" plain @click="handleSave">
            <Icon class="mr-5px" icon="ep:plus" />
            保存
          </el-button>
        </template>
      </fc-designer>
    </div>
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
            :value="dict.value"
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
import { useRoute } from 'vue-router'

defineOptions({ name: 'BpmFormEditor' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息
const route = useRoute() // 路由
const { push, currentRoute } = useRouter() // 路由
const { query } = useRoute() // 路由信息
const { delView } = useTagsViewStore() // 视图操作

// 表单设计器配置
const designerConfig = ref({
  switchType: [], // 是否可以切换组件类型,或者可以相互切换的字段
  autoActive: true, // 是否自动选中拖入的组件
  useTemplate: false, // 是否生成vue2语法的模板组件
  formOptions: {
    form: {
      labelWidth: '100px' // 设置默认的 label 宽度为 100px
    }
  }, // 定义表单配置默认值
  fieldReadonly: false, // 配置field是否可以编辑
  hiddenDragMenu: false, // 隐藏拖拽操作按钮
  hiddenDragBtn: false, // 隐藏拖拽按钮
  hiddenMenu: [], // 隐藏部分菜单
  hiddenItem: [], // 隐藏部分组件
  hiddenItemConfig: {}, // 隐藏组件的部分配置项
  disabledItemConfig: {}, // 禁用组件的部分配置项
  showSaveBtn: false, // 是否显示保存按钮
  showConfig: true, // 是否显示右侧的配置界面
  showBaseForm: true, // 是否显示组件的基础配置表单
  showControl: true, // 是否显示组件联动
  showPropsForm: true, // 是否显示组件的属性配置表单
  showEventForm: true, // 是否显示组件的事件配置表单
  showValidateForm: true, // 是否显示组件的验证配置表单
  showFormConfig: true, // 是否显示表单配置
  showInputData: true, // 是否显示录入按钮
  showDevice: true, // 是否显示多端适配选项
  appendConfigData: [] // 定义渲染规则所需的formData
})
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

  if (route.query.type !== 'copy') {
    return
  }
  // 场景三： 复制表单
  const { id: foo, ...copied } = data
  formData.value = copied
  formData.value.name += '_copy'
})
</script>

<style>
.my-designer {
  ._fc-l,
  ._fc-m,
  ._fc-r {
    border-top: none;
  }
}
</style>
