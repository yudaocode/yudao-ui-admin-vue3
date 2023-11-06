<template>
  <DiyEditor
    v-if="formData && !formLoading"
    v-model="formData.property"
    :title="formData.name"
    :libs="PAGE_LIBS"
    :show-page-config="true"
    :show-navigation-bar="true"
    :show-tab-bar="false"
    @save="submitForm"
  />
</template>
<script setup lang="ts">
import * as DiyPageApi from '@/api/mall/promotion/diy/page'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { PAGE_LIBS } from '@/components/DiyEditor/util'

/** 装修页面表单 */
defineOptions({ name: 'DiyPageDecorate' })

const message = useMessage() // 消息弹窗

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<DiyPageApi.DiyPageVO>()
const formRef = ref() // 表单 Ref

// 获取详情
const getPageDetail = async (id: any) => {
  formLoading.value = true
  try {
    formData.value = await DiyPageApi.getDiyPageProperty(id)
  } finally {
    formLoading.value = false
  }
}
// 提交表单
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  // 提交请求
  formLoading.value = true
  try {
    await DiyPageApi.updateDiyPageProperty(unref(formData)!)
    message.success('保存成功')
  } finally {
    formLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    id: undefined,
    templateId: undefined,
    name: '',
    remark: '',
    previewImageUrls: [],
    property: ''
  } as DiyPageApi.DiyPageVO
  formRef.value?.resetFields()
}

/** 初始化 **/
const { currentRoute } = useRouter() // 路由
const { delView } = useTagsViewStore() // 视图操作
const route = useRoute()
onMounted(() => {
  resetForm()
  if (!route.params.id) {
    message.warning('参数错误，页面编号不能为空！')
    delView(unref(currentRoute))
    return
  }
  getPageDetail(route.params.id)
})
</script>
