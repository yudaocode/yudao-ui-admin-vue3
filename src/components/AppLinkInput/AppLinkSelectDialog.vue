<template>
  <Dialog v-model="dialogVisible" title="选择链接" width="65%">
    <div class="h-500px flex gap-8px">
      <!-- 左侧分组列表 -->
      <el-scrollbar wrap-class="h-full" ref="groupScrollbar" view-class="flex flex-col">
        <el-button
          v-for="(group, groupIndex) in APP_LINK_GROUP_LIST"
          :key="groupIndex"
          :class="[
            'm-r-16px m-l-0px! justify-start! w-90px',
            { active: activeGroup === group.name }
          ]"
          ref="groupBtnRefs"
          :text="activeGroup !== group.name"
          :type="activeGroup === group.name ? 'primary' : 'default'"
          @click="handleGroupSelected(group.name)"
        >
          {{ group.name }}
        </el-button>
      </el-scrollbar>
      <!-- 右侧链接列表 -->
      <el-scrollbar class="h-full flex-1" @scroll="handleScroll" ref="linkScrollbar">
        <div v-for="(group, groupIndex) in APP_LINK_GROUP_LIST" :key="groupIndex">
          <!-- 分组标题 -->
          <div class="font-bold" ref="groupTitleRefs">{{ group.name }}</div>
          <!-- 链接列表 -->
          <el-tooltip
            v-for="(appLink, appLinkIndex) in group.links"
            :key="appLinkIndex"
            :content="appLink.path"
            placement="bottom"
            :show-after="300"
          >
            <el-button
              class="m-b-8px m-r-8px m-l-0px!"
              :type="isSameLink(appLink.path, activeAppLink.path) ? 'primary' : 'default'"
              @click="handleAppLinkSelected(appLink)"
            >
              {{ appLink.name }}
            </el-button>
          </el-tooltip>
        </div>
      </el-scrollbar>
    </div>
    <!-- 底部对话框操作按钮 -->
    <template #footer>
      <el-button type="primary" @click="handleSubmit">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
  <Dialog v-model="detailSelectDialog.visible" title="" width="50%">
    <el-form class="min-h-200px">
      <el-form-item
        label="选择分类"
        v-if="detailSelectDialog.type === APP_LINK_TYPE_ENUM.PRODUCT_CATEGORY_LIST"
      >
        <ProductCategorySelect
          v-model="detailSelectDialog.id"
          :parent-id="0"
          @update:model-value="handleProductCategorySelected"
        />
      </el-form-item>
    </el-form>
  </Dialog>
</template>
<script lang="ts" setup>
import { APP_LINK_GROUP_LIST, APP_LINK_TYPE_ENUM, AppLink } from './data'
import { ButtonInstance, ScrollbarInstance } from 'element-plus'
import { split } from 'lodash-es'
import ProductCategorySelect from '@/views/mall/product/category/components/ProductCategorySelect.vue'
import { getUrlNumberValue } from '@/utils'

// APP 链接选择弹框
defineOptions({ name: 'AppLinkSelectDialog' })
// 选中的分组，默认选中第一个
const activeGroup = ref(APP_LINK_GROUP_LIST[0].name)
// 选中的 APP 链接
const activeAppLink = ref({} as AppLink)

/** 打开弹窗 */
const dialogVisible = ref(false)
const open = (link: string) => {
  // 进入页面时先重置 activeAppLink
  activeAppLink.value = { name: '', path: '' }
  dialogVisible.value = true

  // 滚动到当前的链接
  const group = APP_LINK_GROUP_LIST.find((group) =>
    group.links.some((linkItem) => {
      const sameLink = isSameLink(linkItem.path, link)
      if (sameLink) {
        activeAppLink.value = { ...linkItem, path: link }
      }
      return sameLink
    })
  )
  if (group) {
    // 使用 nextTick 的原因：可能 Dom 还没生成，导致滚动失败
    nextTick(() => handleGroupSelected(group.name))
  }
}
defineExpose({ open })

// 处理 APP 链接选中
const handleAppLinkSelected = (appLink: AppLink) => {
  // 只有不同链接时才更新（避免重复触发）
  if (!isSameLink(appLink.path, activeAppLink.value.path)) {
    // 如果新链接的 path 为空，则沿用当前 activeAppLink 的 path
    const path = appLink.path || activeAppLink.value.path
    activeAppLink.value = { ...appLink, path: path }
  }
  switch (appLink.type) {
    case APP_LINK_TYPE_ENUM.PRODUCT_CATEGORY_LIST:
      detailSelectDialog.value.visible = true
      detailSelectDialog.value.type = appLink.type
      // 返显
      detailSelectDialog.value.id =
        getUrlNumberValue('id', 'http://127.0.0.1' + activeAppLink.value.path) || undefined
      break
    default:
      break
  }
}

// 处理绑定值更新
const emit = defineEmits<{
  change: [link: string]
  appLinkChange: [appLink: AppLink]
}>()
const handleSubmit = () => {
  dialogVisible.value = false
  emit('change', activeAppLink.value.path)
  emit('appLinkChange', activeAppLink.value)
}

// 分组标题引用列表
const groupTitleRefs = ref<HTMLInputElement[]>([])
/**
 * 处理右侧链接列表滚动
 * @param scrollTop 滚动条的位置
 */
const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
  const titleEl = groupTitleRefs.value.find((titleEl: HTMLInputElement) => {
    // 获取标题的位置信息
    const { offsetHeight, offsetTop } = titleEl
    // 判断标题是否在可视范围内
    return scrollTop >= offsetTop && scrollTop < offsetTop + offsetHeight
  })
  // 只需处理一次
  if (titleEl && activeGroup.value !== titleEl.textContent) {
    activeGroup.value = titleEl.textContent || ''
    // 同步左侧的滚动条位置
    scrollToGroupBtn(activeGroup.value)
  }
}

// 右侧滚动条
const linkScrollbar = ref<ScrollbarInstance>()
// 处理分组选中
const handleGroupSelected = (group: string) => {
  activeGroup.value = group
  const titleRef = groupTitleRefs.value.find((item: HTMLInputElement) => item.textContent === group)
  if (titleRef) {
    // 滚动分组标题
    linkScrollbar.value?.setScrollTop(titleRef.offsetTop)
  }
}

// 分组滚动条
const groupScrollbar = ref<ScrollbarInstance>()
// 分组引用列表
const groupBtnRefs = ref<ButtonInstance[]>([])
// 自动滚动分组按钮，确保分组按钮保持在可视区域内
const scrollToGroupBtn = (group: string) => {
  const groupBtn = groupBtnRefs.value
    .map((btn: ButtonInstance) => btn['ref'])
    .find((ref: HTMLButtonElement) => ref.textContent === group)
  if (groupBtn) {
    groupScrollbar.value?.setScrollTop(groupBtn.offsetTop)
  }
}

// 是否为相同的链接（不比较参数，只比较链接）
const isSameLink = (link1: string, link2: string) => {
  return split(link1, '?', 1)[0] === split(link2, '?', 1)[0]
}

// 详情选择对话框
const detailSelectDialog = ref<{
  visible: boolean
  id?: number
  type?: APP_LINK_TYPE_ENUM
}>({
  visible: false,
  id: undefined,
  type: undefined
})
// 处理详情选择
const handleProductCategorySelected = (id: number) => {
  const url = new URL(activeAppLink.value.path, 'http://127.0.0.1')
  // 修改 id 参数
  url.searchParams.set('id', `${id}`)
  // 排除域名
  activeAppLink.value.path = `${url.pathname}${url.search}`
  // 关闭对话框
  detailSelectDialog.value.visible = false
  // 重置 id
  detailSelectDialog.value.id = undefined
}
</script>
<style lang="scss" scoped></style>
