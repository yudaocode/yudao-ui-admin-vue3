<template>
  <ContentWrap v-loading="formLoading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basicInfo">
        <basic-info-form ref="basicInfoRef" :table="formData.table" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="colum">
        <colum-info-form ref="columInfoRef" :columns="formData.columns" />
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="generateInfo">
        <generate-info-form
          ref="generateInfoRef"
          :table="formData.table"
          :columns="formData.columns"
        />
      </el-tab-pane>
    </el-tabs>
    <el-form>
      <el-form-item style="float: right">
        <el-button :loading="formLoading" type="primary" @click="submitForm">保存</el-button>
        <el-button @click="close">返回</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { BasicInfoForm, ColumInfoForm, GenerateInfoForm } from './components'
import * as CodegenApi from '@/api/infra/codegen'

defineOptions({ name: 'InfraCodegenEditTable' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
const { query } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const activeName = ref('colum') // Tag 激活的窗口
const basicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>()
const columInfoRef = ref<ComponentRef<typeof ColumInfoForm>>()
const generateInfoRef = ref<ComponentRef<typeof GenerateInfoForm>>()
const formData = ref<CodegenApi.CodegenUpdateReqVO>({
  table: {},
  columns: []
})

/** 获得详情 */
const getDetail = async () => {
  const id = query.id as unknown as number
  if (!id) {
    return
  }
  formLoading.value = true
  try {
    formData.value = await CodegenApi.getCodegenTable(id)
  } finally {
    formLoading.value = false
  }
}

/** 提交按钮 */
const submitForm = async () => {
  // 参数校验
  if (!unref(formData)) return
  await unref(basicInfoRef)?.validate()
  await unref(generateInfoRef)?.validate()
  try {
    // 提交请求
    await CodegenApi.updateCodegenTable(formData.value)
    message.success(t('common.updateSuccess'))
    close()
  } catch {}
}

/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push('/infra/codegen')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
