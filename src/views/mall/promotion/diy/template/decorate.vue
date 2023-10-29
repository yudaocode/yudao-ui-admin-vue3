<template>
  <DiyEditor
    v-if="formData && !formLoading"
    v-model="formData.property"
    :title="templateItems[selectedTemplateItem].name"
    :libs="libs"
    :show-tab-bar="selectedTemplateItem === 0"
    :show-navigation-bar="selectedTemplateItem > 0"
    @save="submitForm"
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
import * as DiyTemplateApi from '@/api/mall/promotion/diy/template'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { DiyComponentLibrary } from '@/components/DiyEditor/util'

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
const formData = ref<DiyTemplateApi.DiyTemplateVO>()
const formRef = ref() // 表单 Ref

// 获取详情
const getPageDetail = async (id: any) => {
  formLoading.value = true
  try {
    formData.value = await DiyTemplateApi.getDiyTemplate(id)
  } finally {
    formLoading.value = false
  }
}

// 模板组件库
const templateLibs = [] as DiyComponentLibrary[]
// 页面组件库
const pageLibs = [
  {
    name: '基础组件',
    extended: true,
    components: [
      'SearchBar',
      'NoticeBar',
      'GridNavigation',
      'ListNavigation',
      'Divider',
      'TitleBar'
    ]
  },
  { name: '图文组件', extended: true, components: ['Carousel'] },
  { name: '商品组件', extended: true, components: ['ProductCard'] },
  {
    name: '会员组件',
    extended: true,
    components: ['UserCard', 'OrderCard', 'WalletCard', 'CouponCard']
  },
  { name: '营销组件', extended: true, components: ['Combination', 'Seckill', 'Point', 'Coupon'] }
] as DiyComponentLibrary[]
// 当前组件库
const libs = ref<DiyComponentLibrary[]>(templateLibs)
const handleTemplateItemChange = () => {
  if (selectedTemplateItem.value === 0) {
    libs.value = templateLibs
  } else {
    libs.value = pageLibs
  }
}

// 提交表单
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  // 提交请求
  formLoading.value = true
  try {
    await DiyTemplateApi.updateDiyTemplate(unref(formData)!)
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
    previewImageUrls: [],
    property: ''
  } as DiyTemplateApi.DiyTemplateVO
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
