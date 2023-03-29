<template>
  <content-wrap v-loading="loading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="基本信息" name="basicInfo">
        <basic-info-form ref="basicInfoRef" :table="formData.table" />
      </el-tab-pane>
      <el-tab-pane label="字段信息" name="colum">
        <colum-info-form ref="columInfoRef" :columns="formData.columns" />
      </el-tab-pane>
      <el-tab-pane label="生成信息" name="generateInfo">
        <generate-info-form ref="generateInfoRef" :table="formData.table" />
      </el-tab-pane>
    </el-tabs>
    <el-form label-width="100px">
      <el-form-item style="text-align: center; margin-left: -100px; margin-top: 10px">
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          {{ t('action.save') }}
        </el-button>
        <el-button @click="close">返回</el-button>
      </el-form-item>
    </el-form>
  </content-wrap>
</template>
<script setup lang="ts">
import { BasicInfoForm, ColumInfoForm, GenerateInfoForm } from './components'
import * as CodegenApi from '@/api/infra/codegen'
import ContentWrap from '@/components/ContentWrap/src/ContentWrap.vue'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { CodegenUpdateReqVO } from '@/api/infra/codegen/types'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter()
const { query } = useRoute()
const { delView } = useTagsViewStore()
const loading = ref(false)
const submitLoading = ref(false)
const activeName = ref('basicInfo')
const basicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>()
const columInfoRef = ref<ComponentRef<typeof ColumInfoForm>>()
const generateInfoRef = ref<ComponentRef<typeof GenerateInfoForm>>()
const formData = ref<CodegenUpdateReqVO>({
  table: {},
  columns: []
})

const getDetail = async () => {
  const id = query.id as unknown as number
  if (id) {
    loading.value = true
    // 获取表详细信息
    formData.value = await CodegenApi.getCodegenTable(id)
    loading.value = false
  }
}
const submitForm = async () => {
  if (!unref(formData)) return
  try {
    await unref(basicInfoRef)?.validate()
    await unref(generateInfoRef)?.validate()
    await CodegenApi.updateCodegenTable(unref(formData))
    message.success(t('common.updateSuccess'))
    push('/infra/codegen')
  } catch {}
}
/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push('/infra/codegen')
}
onMounted(() => {
  getDetail()
})
</script>
