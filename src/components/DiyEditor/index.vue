<template>
  <el-container class="editor">
    <!-- 顶部：工具栏 -->
    <el-header class="editor-header">
      <!-- 左侧操作区 -->
      <slot name="toolBarLeft"></slot>
      <!-- 中心操作区 -->
      <div class="header-center flex flex-1 items-center justify-center">
        <span>{{ title }}</span>
      </div>
      <!-- 右侧操作区 -->
      <el-button-group class="header-right">
        <el-tooltip content="重置">
          <el-button @click="handleReset">
            <Icon :size="24" icon="system-uicons:reset-alt" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="previewUrl" content="预览">
          <el-button @click="handlePreview">
            <Icon :size="24" icon="ep:view" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="保存">
          <el-button @click="handleSave">
            <Icon :size="24" icon="ep:check" />
          </el-button>
        </el-tooltip>
      </el-button-group>
    </el-header>

    <!-- 中心区域 -->
    <el-container class="editor-container">
      <!-- 左侧：组件库（ComponentLibrary） -->
      <ComponentLibrary v-if="libs && libs.length > 0" ref="componentLibrary" :list="libs" />
      <!-- 中心：设计区域（ComponentContainer） -->
      <div class="editor-center page-prop-area" @click="handlePageSelected">
        <!-- 手机顶部 -->
        <div class="editor-design-top">
          <!-- 手机顶部状态栏 -->
          <img alt="" class="status-bar" src="@/assets/imgs/diy/statusBar.png" />
          <!-- 手机顶部导航栏 -->
          <ComponentContainer
            v-if="showNavigationBar"
            :active="selectedComponent?.id === navigationBarComponent.id"
            :component="navigationBarComponent"
            :show-toolbar="false"
            class="cursor-pointer!"
            @click="handleNavigationBarSelected"
          />
        </div>
        <!-- 绝对定位的组件：例如 弹窗、浮动按钮等 -->
        <div
          v-for="(component, index) in pageComponents"
          :key="index"
          @click="handleComponentSelected(component, index)"
        >
          <component
            :is="component.id"
            v-if="component.position === 'fixed' && selectedComponent?.uid === component.uid"
            :property="component.property"
          />
        </div>
        <!-- 手机页面编辑区域 -->
        <el-scrollbar
          :view-style="{
            backgroundColor: pageConfigComponent.property.backgroundColor,
            backgroundImage: `url(${pageConfigComponent.property.backgroundImage})`
          }"
          height="100%"
          view-class="phone-container"
          wrap-class="editor-design-center page-prop-area"
        >
          <draggable
            v-model="pageComponents"
            :animation="200"
            :force-fallback="true"
            class="page-prop-area drag-area"
            filter=".component-toolbar"
            ghost-class="draggable-ghost"
            group="component"
            item-key="index"
            @change="handleComponentChange"
          >
            <template #item="{ element, index }">
              <ComponentContainer
                v-if="!element.position || element.position === 'center'"
                :active="selectedComponentIndex === index"
                :can-move-down="index < pageComponents.length - 1"
                :can-move-up="index > 0"
                :component="element"
                @click="handleComponentSelected(element, index)"
                @copy="handleCopyComponent(index)"
                @delete="handleDeleteComponent(index)"
                @move="(direction) => handleMoveComponent(index, direction)"
              />
            </template>
          </draggable>
        </el-scrollbar>
        <!-- 手机底部导航 -->
        <div v-if="showTabBar" :class="['editor-design-bottom', 'component', 'cursor-pointer!']">
          <ComponentContainer
            :active="selectedComponent?.id === tabBarComponent.id"
            :component="tabBarComponent"
            :show-toolbar="false"
            @click="handleTabBarSelected"
          />
        </div>
        <!-- 固定布局的组件 操作按钮区 -->
        <div class="fixed-component-action-group">
          <el-tag
            v-if="showPageConfig"
            :effect="selectedComponent?.uid === pageConfigComponent.uid ? 'dark' : 'plain'"
            :type="selectedComponent?.uid === pageConfigComponent.uid ? 'primary' : 'info'"
            size="large"
            @click="handleComponentSelected(pageConfigComponent)"
          >
            <Icon :icon="pageConfigComponent.icon" :size="12" />
            <span>{{ pageConfigComponent.name }}</span>
          </el-tag>
          <template v-for="(component, index) in pageComponents" :key="index">
            <el-tag
              v-if="component.position === 'fixed'"
              :effect="selectedComponent?.uid === component.uid ? 'dark' : 'plain'"
              :type="selectedComponent?.uid === component.uid ? 'primary' : 'info'"
              closable
              size="large"
              @click="handleComponentSelected(component)"
              @close="handleDeleteComponent(index)"
            >
              <Icon :icon="component.icon" :size="12" />
              <span>{{ component.name }}</span>
            </el-tag>
          </template>
        </div>
      </div>
      <!-- 右侧：属性面板（ComponentContainerProperty） -->
      <el-aside v-if="selectedComponent?.property" class="editor-right" width="350px">
        <el-card
          body-class="h-[calc(100%-var(--el-card-padding)-var(--el-card-padding))]"
          class="h-full"
          shadow="never"
        >
          <!-- 组件名称 -->
          <template #header>
            <div class="flex items-center gap-8px">
              <Icon :icon="selectedComponent?.icon" color="gray" />
              <span>{{ selectedComponent?.name }}</span>
            </div>
          </template>
          <el-scrollbar
            class="m-[calc(0px-var(--el-card-padding))]"
            view-class="p-[var(--el-card-padding)] p-b-[calc(var(--el-card-padding)+var(--el-card-padding))] property"
          >
            <component
              :is="selectedComponent?.id + 'Property'"
              :key="selectedComponent?.uid || selectedComponent?.id"
              v-model="selectedComponent.property"
            />
          </el-scrollbar>
        </el-card>
      </el-aside>
    </el-container>
  </el-container>

  <!-- 预览弹框 -->
  <Dialog v-model="previewDialogVisible" title="预览" width="700">
    <div class="flex justify-around">
      <IFrame
        :src="previewUrl"
        class="w-375px border-4px border-rounded-8px border-solid p-2px h-667px!"
      />
      <div class="flex flex-col">
        <el-text>手机扫码预览</el-text>
        <Qrcode :text="previewUrl" logo="/logo.gif" />
      </div>
    </div>
  </Dialog>
</template>
<script lang="ts">
// 注册所有的组件
import { components } from './components/mobile/index'

export default {
  components: { ...components }
}
</script>
<script lang="ts" setup>
import draggable from 'vuedraggable'
import ComponentLibrary from './components/ComponentLibrary.vue'
import { cloneDeep, includes } from 'lodash-es'
import { component as PAGE_CONFIG_COMPONENT } from '@/components/DiyEditor/components/mobile/PageConfig/config'
import { component as NAVIGATION_BAR_COMPONENT } from './components/mobile/NavigationBar/config'
import { component as TAB_BAR_COMPONENT } from './components/mobile/TabBar/config'
import { isEmpty, isString } from '@/utils/is'
import { DiyComponent, DiyComponentLibrary, PageConfig } from '@/components/DiyEditor/util'
import { componentConfigs } from '@/components/DiyEditor/components/mobile'
import { array, oneOfType } from 'vue-types'
import { propTypes } from '@/utils/propTypes'

/** 页面装修详情页 */
defineOptions({ name: 'DiyPageDetail' })

// 左侧组件库
const componentLibrary = ref()
// 页面设置组件
const pageConfigComponent = ref<DiyComponent<any>>(cloneDeep(PAGE_CONFIG_COMPONENT))
// 顶部导航栏
const navigationBarComponent = ref<DiyComponent<any>>(cloneDeep(NAVIGATION_BAR_COMPONENT))
// 底部导航菜单
const tabBarComponent = ref<DiyComponent<any>>(cloneDeep(TAB_BAR_COMPONENT))

// 选中的组件，默认选中顶部导航栏
const selectedComponent = ref<DiyComponent<any>>()
// 选中的组件索引
const selectedComponentIndex = ref<number>(-1)
// 组件列表
const pageComponents = ref<DiyComponent<any>[]>([])
// 定义属性
const props = defineProps({
  // 页面配置，支持Json字符串
  modelValue: oneOfType<string | PageConfig>([String, Object]).isRequired,
  // 标题
  title: propTypes.string.def(''),
  // 组件库
  libs: array<DiyComponentLibrary>(),
  // 是否显示顶部导航栏
  showNavigationBar: propTypes.bool.def(true),
  // 是否显示底部导航菜单
  showTabBar: propTypes.bool.def(false),
  // 是否显示页面配置
  showPageConfig: propTypes.bool.def(true),
  // 预览地址：提供了预览地址，才会显示预览按钮
  previewUrl: propTypes.string.def('')
})

// 监听传入的页面配置
// 解析出 pageConfigComponent 页面整体的配置，navigationBarComponent、pageComponents、tabBarComponent 页面上、中、下的配置
watch(
  () => props.modelValue,
  () => {
    const modelValue =
      isString(props.modelValue) && !isEmpty(props.modelValue)
        ? (JSON.parse(props.modelValue) as PageConfig)
        : props.modelValue
    pageConfigComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.page) || PAGE_CONFIG_COMPONENT.property
    navigationBarComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.navigationBar) ||
      NAVIGATION_BAR_COMPONENT.property
    tabBarComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.tabBar) || TAB_BAR_COMPONENT.property
    // 查找对应的页面组件
    pageComponents.value = ((typeof modelValue !== 'string' && modelValue?.components) || []).map(
      (item) => {
        const component = componentConfigs[item.id]
        return { ...component, property: item.property }
      }
    )
  },
  {
    immediate: true
  }
)

/** 选择组件修改其属性后更新它的配置 */
watch(
  selectedComponent,
  (val: any) => {
    if (!val || selectedComponentIndex.value === -1) {
      return
    }
    // 如果是基础设置页，默认选中的索引改成 -1，为了防止删除组件后切换到此页导致报错
    // https://gitee.com/yudaocode/yudao-ui-admin-vue3/pulls/792
    if (props.showTabBar) {
      selectedComponentIndex.value = -1
    }
    pageComponents.value[selectedComponentIndex.value] = selectedComponent.value!
  },
  { deep: true }
)

// 保存
const handleSave = () => {
  // 发送保存通知
  emits('save')
}
// 监听配置修改
const pageConfigChange = () => {
  const pageConfig = {
    page: pageConfigComponent.value.property,
    navigationBar: navigationBarComponent.value.property,
    tabBar: tabBarComponent.value.property,
    components: pageComponents.value.map((component) => {
      // 只保留APP有用的字段
      return { id: component.id, property: component.property }
    })
  } as PageConfig
  if (!props.showTabBar) {
    delete pageConfig.tabBar
  }
  // 发送数据更新通知
  const modelValue = isString(props.modelValue) ? JSON.stringify(pageConfig) : pageConfig
  emits('update:modelValue', modelValue)
}
watch(
  () => [
    pageConfigComponent.value.property,
    navigationBarComponent.value.property,
    tabBarComponent.value.property,
    pageComponents.value
  ],
  () => {
    pageConfigChange()
  },
  { deep: true }
)
// 处理页面选中：显示属性表单
const handlePageSelected = (event: any) => {
  if (!props.showPageConfig) return

  // 配置了样式 page-prop-area 的元素，才显示页面设置
  if (includes(event?.target?.classList, 'page-prop-area')) {
    handleComponentSelected(unref(pageConfigComponent))
  }
}

/**
 * 选中组件
 *
 * @param component 组件
 * @param index 组件的索引
 */
const handleComponentSelected = (component: DiyComponent<any>, index: number = -1) => {
  selectedComponent.value = component
  selectedComponentIndex.value = index
}

// 选中顶部导航栏
const handleNavigationBarSelected = () => {
  handleComponentSelected(unref(navigationBarComponent))
}

// 选中底部导航菜单
const handleTabBarSelected = () => {
  handleComponentSelected(unref(tabBarComponent))
}

// 组件变动（拖拽）
const handleComponentChange = (dragEvent: any) => {
  // 新增，即从组件库拖拽添加组件
  if (dragEvent.added) {
    const { element, newIndex } = dragEvent.added
    handleComponentSelected(element, newIndex)
  } else if (dragEvent.moved) {
    // 拖拽排序
    const { newIndex } = dragEvent.moved
    // 保持选中
    selectedComponentIndex.value = newIndex
  }
}

// 交换组件
const swapComponent = (oldIndex: number, newIndex: number) => {
  ;[pageComponents.value[oldIndex], pageComponents.value[newIndex]] = [
    pageComponents.value[newIndex],
    pageComponents.value[oldIndex]
  ]
  // 保持选中
  selectedComponentIndex.value = newIndex
}

/** 移动组件（上移、下移） */
const handleMoveComponent = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= pageComponents.value.length) return

  swapComponent(index, newIndex)
}

/** 复制组件 */
const handleCopyComponent = (index: number) => {
  const component = cloneDeep(pageComponents.value[index])
  component.uid = new Date().getTime()
  pageComponents.value.splice(index + 1, 0, component)
}

/**
 * 删除组件
 * @param index 当前组件index
 */
const handleDeleteComponent = (index: number) => {
  // 删除组件
  pageComponents.value.splice(index, 1)
  if (index < pageComponents.value.length) {
    // 1. 不是最后一个组件时，删除后选中下面的组件
    let bottomIndex = index
    handleComponentSelected(pageComponents.value[bottomIndex], bottomIndex)
  } else if (pageComponents.value.length > 0) {
    // 2. 不是第一个组件时，删除后选中上面的组件
    let topIndex = index - 1
    handleComponentSelected(pageComponents.value[topIndex], topIndex)
  } else {
    // 3. 组件全部删除之后，显示页面设置
    handleComponentSelected(unref(pageConfigComponent))
  }
}

// 工具栏操作
const emits = defineEmits(['reset', 'preview', 'save', 'update:modelValue'])

// 注入无感刷新页面函数
const reload = inject<() => void>('reload')
// 重置
const handleReset = () => {
  if (reload) reload()
  emits('reset')
}

// 预览
const previewDialogVisible = ref(false)
const handlePreview = () => {
  previewDialogVisible.value = true
  emits('preview')
}

// 设置默认选中的组件
const setDefaultSelectedComponent = () => {
  if (props.showPageConfig) {
    selectedComponent.value = unref(pageConfigComponent)
  } else if (props.showNavigationBar) {
    selectedComponent.value = unref(navigationBarComponent)
  } else if (props.showTabBar) {
    selectedComponent.value = unref(tabBarComponent)
  }
}

watch(
  () => [props.showPageConfig, props.showNavigationBar, props.showTabBar],
  () => setDefaultSelectedComponent()
)

onMounted(() => setDefaultSelectedComponent())
</script>
<style lang="scss" scoped>
/* 手机宽度 */
$phone-width: 375px;
$toolbar-height: 42px;

/* 根节点样式 */
.editor {
  display: flex;
  height: 100%;
  margin: calc(0px - var(--app-content-padding));
  flex-direction: column;

  /* 顶部：工具栏 */
  .editor-header {
    display: flex;
    height: $toolbar-height;
    padding: 0;
    background-color: var(--el-bg-color);
    border-bottom: solid 1px var(--el-border-color);
    align-items: center;
    justify-content: space-between;

    /* 工具栏：右侧按钮 */
    .header-right {
      height: 100%;

      .el-button {
        height: 100%;
      }
    }

    /* 隐藏工具栏按钮的边框 */
    :deep(.el-radio-button__inner),
    :deep(.el-button) {
      border-top: none !important;
      border-bottom: none !important;
      border-radius: 0 !important;
    }
  }

  /* 中心操作区 */
  .editor-container {
    height: calc(
      100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-footer-height) -
        $toolbar-height
    );

    /* 右侧属性面板 */
    .editor-right {
      overflow: hidden;
      box-shadow: -8px 0 8px -8px rgb(0 0 0 / 12%);
      flex-shrink: 0;

      /* 属性面板顶部：减少内边距 */
      :deep(.el-card__header) {
        padding: 8px 16px;
      }

      /* 属性面板分组 */
      :deep(.property-group) {
        margin: 0 -20px;

        &.el-card {
          border: none;
        }

        /* 属性分组名称 */
        .el-card__header {
          padding: 8px 32px;
          background: var(--el-bg-color-page);
          border: none;
        }

        .el-card__body {
          border: none;
        }
      }
    }

    /* 中心区域 */
    .editor-center {
      position: relative;
      display: flex;
      width: 100%;
      margin: 16px 0 0;
      overflow: hidden;
      background-color: var(--app-content-bg-color);
      flex: 1 1 0;
      flex-direction: column;
      justify-content: center;

      /* 手机顶部 */
      .editor-design-top {
        display: flex;
        width: $phone-width;
        margin: 0 auto;
        flex-direction: column;

        /* 手机顶部状态栏 */
        .status-bar {
          width: $phone-width;
          height: 20px;
          background-color: #fff;
        }
      }

      /* 手机底部导航 */
      .editor-design-bottom {
        width: $phone-width;
        margin: 0 auto;
      }

      /* 手机页面编辑区域 */
      :deep(.editor-design-center) {
        width: 100%;

        /* 主体内容 */
        .phone-container {
          position: relative;
          width: $phone-width;
          height: 100%;
          margin: 0 auto;
          background-repeat: no-repeat;
          background-size: 100% 100%;

          .drag-area {
            width: 100%;
            height: 100%;
          }
        }
      }

      /* 固定布局的组件 操作按钮区 */
      .fixed-component-action-group {
        position: absolute;
        top: 0;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        :deep(.el-tag) {
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
          border: none;

          .el-tag__content {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: flex-start;

            .el-icon {
              margin-right: 4px;
            }
          }
        }
      }
    }
  }
}
</style>
