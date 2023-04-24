<template>
  <ContentWrap v-loading="formLoading">
    <el-tabs v-model="activeName">
      <el-tab-pane label="商品信息" name="basicInfo">
        <BasicInfoForm ref="basicInfoRef" />
      </el-tab-pane>
      <el-tab-pane label="商品详情" name="description">
        <DescriptionForm ref="DescriptionRef" />
      </el-tab-pane>
      <el-tab-pane label="其他设置" name="otherSettings">
        <OtherSettingsForm ref="otherSettingsRef" />
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
<script lang="ts" name="ProductManagementForm" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { BasicInfoForm, DescriptionForm, OtherSettingsForm } from './components'

// const { t } = useI18n() // 国际化
// const message = useMessage() // 消息弹窗
const { push, currentRoute } = useRouter() // 路由
// const { query } = useRoute() // 查询参数
const { delView } = useTagsViewStore() // 视图操作

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const activeName = ref('otherSettings') // Tag 激活的窗口
const basicInfoRef = ref<ComponentRef<typeof BasicInfoForm>>()
const DescriptionRef = ref<ComponentRef<typeof DescriptionForm>>()

/** 获得详情 */
const getDetail = async () => {}

/** 提交按钮 */
const submitForm = async () => {}

/** 关闭按钮 */
const close = () => {
  delView(unref(currentRoute))
  push('/product/product-management')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
