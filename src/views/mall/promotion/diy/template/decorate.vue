<template>
  <DiyEditor
    v-if="formData && !formLoading"
    v-model="currentFormData!.property"
    :title="templateItems[selectedTemplateItem].name"
    :libs="libs"
    :show-page-config="selectedTemplateItem !== 0"
    :show-tab-bar="selectedTemplateItem === 0"
    :show-navigation-bar="selectedTemplateItem !== 0"
    :preview-url="previewUrl"
    @save="submitForm"
    @reset="handleEditorReset"
  >
    <template #toolBarLeft>
      <el-radio-group
        v-model="selectedTemplateItem"
        class="h-full!"
        @change="handleTemplateItemChange"
      >
        <el-tooltip v-for="(item, index) in templateItems" :key="index" :content="item.name">
          <el-radio-button :label="index">
            <Icon :icon="item.icon" :size="24" />
          </el-radio-button>
        </el-tooltip>
      </el-radio-group>
    </template>
  </DiyEditor>
</template>
<script setup lang="ts">
// TODO @疯狂：要不要建个 decorate 目录，然后挪进去，改成 index.vue，这样可以更明确看到是个独立界面哈，更好找
import * as DiyTemplateApi from '@/api/mall/promotion/diy/template'
import * as DiyPageApi from '@/api/mall/promotion/diy/page'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DiyComponentLibrary, PAGE_LIBS } from '@/components/DiyEditor/util' // 商城的 DIY 组件，在 DiyEditor 目录下
import { toNumber } from 'lodash-es'

/** 装修模板表单 */
defineOptions({ name: 'DiyTemplateDecorate' })

// 左上角工具栏操作按钮
const selectedTemplateItem = ref(0)
const templateItems = reactive([
  { name: '基础设置', icon: 'ep:iphone' },
  { name: '首页', icon: 'ep:home-filled' },
  { name: '我的', icon: 'ep:user-filled' }
])

const message = useMessage() // 消息弹窗

const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref<DiyTemplateApi.DiyTemplatePropertyVO>()
const formRef = ref() // 表单 Ref
// 当前编辑的属性
const currentFormData = ref<DiyTemplateApi.DiyTemplatePropertyVO | DiyPageApi.DiyPageVO>()
// 商城 H5 预览地址
const previewUrl = ref('')

// 获取详情
const getPageDetail = async (id: any) => {
  formLoading.value = true
  try {
    formData.value = await DiyTemplateApi.getDiyTemplateProperty(id)
    currentFormData.value = formData.value

    // 拼接手机预览链接
    const domain = import.meta.env.VITE_MALL_H5_DOMAIN
    previewUrl.value = `${domain}/#/pages/index/index?templateId=${formData.value.id}`
  } finally {
    formLoading.value = false
  }
}

// 模板组件库
const templateLibs = [] as DiyComponentLibrary[]
// 当前组件库
const libs = ref<DiyComponentLibrary[]>(templateLibs)
// 模板选项切换
const handleTemplateItemChange = () => {
  // 编辑模板
  if (selectedTemplateItem.value === 0) {
    libs.value = templateLibs
    currentFormData.value = formData.value
    return
  }

  // 编辑页面
  libs.value = PAGE_LIBS
  currentFormData.value = formData.value!.pages.find(
    (page: DiyPageApi.DiyPageVO) => page.name === templateItems[selectedTemplateItem.value].name
  )
}

// 提交表单
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  // 提交请求
  formLoading.value = true
  try {
    if (selectedTemplateItem.value === 0) {
      // 提交模板属性
      await DiyTemplateApi.updateDiyTemplateProperty(unref(formData)!)
    } else {
      // 提交页面属性
      await DiyPageApi.updateDiyPageProperty(unref(currentFormData)!)
    }
    message.success('保存成功')
  } finally {
    formLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    used: false,
    usedTime: undefined,
    remark: '',
    previewPicUrls: [],
    property: '',
    pages: []
  } as DiyTemplateApi.DiyTemplatePropertyVO
  formRef.value?.resetFields()
}

// 重置时记录当前编辑的页面
const handleEditorReset = () => storePageIndex()

//#region 无感刷新
// 记录标识
const DIY_PAGE_INDEX_KEY = 'diy_page_index'
// 1. 记录
const storePageIndex = () =>
  sessionStorage.setItem(DIY_PAGE_INDEX_KEY, `${selectedTemplateItem.value}`)
// 2. 恢复
const recoverPageIndex = () => {
  // 恢复重置前的页面，默认是第一个页面
  const pageIndex = toNumber(sessionStorage.getItem(DIY_PAGE_INDEX_KEY)) || 0
  // 移除标记
  sessionStorage.removeItem(DIY_PAGE_INDEX_KEY)
  // 切换页面
  if (pageIndex !== selectedTemplateItem.value) {
    selectedTemplateItem.value = pageIndex
    handleTemplateItemChange()
  }
}
//#endregion

/** 初始化 **/
const { currentRoute } = useRouter() // 路由
const { delView } = useTagsViewStore() // 视图操作
onMounted(async () => {
  resetForm()
  if (!currentRoute.value.params.id) {
    message.warning('参数错误，页面编号不能为空！')
    delView(unref(currentRoute))
    return
  }

  // 查询详情
  await getPageDetail(currentRoute.value.params.id)
  // 恢复重置前的页面
  recoverPageIndex()
})
</script>
