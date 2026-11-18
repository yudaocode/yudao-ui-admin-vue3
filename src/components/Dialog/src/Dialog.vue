<script lang="ts" setup>
import { isNumber } from '@/utils/is'

// 关闭自动透传：attrs 只经模板中的 getBindValue() 转发一次，避免透传在显式 align-center 之后再次合并原始值
defineOptions({ name: 'Dialog', inheritAttrs: false })

const { t } = useI18n()
const slots = useSlots()
const emits = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Dialog' },
  fullscreen: { type: Boolean, default: true },
  defaultFullscreen: { type: Boolean, default: false },
  // 未传时不设默认值，由 ElDialog 使用 Element Plus 默认宽度 50%
  width: { type: [String, Number] },
  scroll: { type: Boolean, default: false }, // 是否开启滚动条。如果是的话，按照 maxHeight 设置最大高度
  maxHeight: { type: [String, Number], default: '400px' },
  loading: { type: Boolean, default: false },
  // 点击遮罩是否关闭：默认 false。声明为 prop 后，未传与显式 undefined 都取默认值，
  // close-on-click-modal / closeOnClickModal 由 Vue 统一归一化，空布尔属性按 true 处理
  closeOnClickModal: { type: Boolean, default: false }
})

const attrs = useAttrs()

// 转发给 ElDialog 的 attrs + props（class/style/事件/aria/append-to-body 等原样转发）。
// 在渲染时调用而非 computed：attrs 起初为空时整体展开不会建立依赖，渲染时读取总能拿到最新 attrs。
// align-center 由下方 alignCenter 单独传入，这里剔除原始值
const getBindValue = () => {
  const delArr: string[] = [
    'fullscreen',
    'defaultFullscreen',
    'title',
    'maxHeight',
    'loading',
    'closeOnClickModal',
    'alignCenter',
    'align-center'
  ]
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
}

// 默认垂直居中：用 ElDialog 自带 align-center，不改全局遮罩样式，原生 el-dialog 不受影响。
// 调用方传了 align-center（含 false）时原样透传；传了 top 时交回 ElDialog 默认；值为 undefined 视为未传。
// 按键读取 attrs 会被追踪，动态增删这些属性时同样更新
const alignCenter = computed(() => {
  const explicit = attrs.alignCenter !== undefined ? attrs.alignCenter : attrs['align-center']
  if (explicit !== undefined) return explicit as boolean
  return attrs.top !== undefined ? undefined : true
})

const isFullscreen = ref(props.defaultFullscreen)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      isFullscreen.value = props.defaultFullscreen
    }
  }
)

const toggleFull = () => {
  isFullscreen.value = !unref(isFullscreen)
}

const dialogHeight = ref(isNumber(props.maxHeight) ? `${props.maxHeight}px` : props.maxHeight)

watch(
  () => isFullscreen.value,
  async (val: boolean) => {
    await nextTick()
    if (val) {
      const windowHeight = document.documentElement.offsetHeight
      dialogHeight.value = `${windowHeight - 55 - 60 - (slots.footer ? 63 : 0)}px`
    } else {
      dialogHeight.value = isNumber(props.maxHeight) ? `${props.maxHeight}px` : props.maxHeight
    }
  },
  {
    immediate: true
  }
)

// maxHeight 变化时同步高度；全屏时保持全屏高度，退出全屏时由上方 watch 取最新 maxHeight
watch(
  () => props.maxHeight,
  (val) => {
    if (unref(isFullscreen)) return
    dialogHeight.value = isNumber(val) ? `${val}px` : val
  }
)

const dialogStyle = computed(() => {
  return {
    height: unref(dialogHeight)
  }
})

const closing = ref(false)

function closeHandler() {
  emits('update:modelValue', false)
  closing.value = true
}

function closedHandler() {
  closing.value = false
}
</script>

<template>
  <!-- 顺序即合并优先级：v-bind 之前是可被调用方 attrs 覆盖的默认值（与原自动透传后合并的效果一致），之后是组件自身决定的值 -->
  <ElDialog
    destroy-on-close
    lock-scroll
    draggable
    :show-close="false"
    v-bind="getBindValue()"
    :align-center="alignCenter"
    :close-on-click-modal="closeOnClickModal"
    :fullscreen="isFullscreen"
    :width="width"
    class="com-dialog"
    @close="closeHandler"
    @closed="closedHandler"
  >
    <template #header="{ close }">
      <div class="relative h-54px flex items-center justify-between pl-15px pr-15px">
        <slot name="title">
          {{ title }}
        </slot>
        <div
          class="absolute right-15px top-[50%] h-54px flex translate-y-[-50%] items-center justify-between"
        >
          <!-- 原生 button，可键盘聚焦并带可访问名称（与布局工具栏一致） -->
          <button
            v-if="fullscreen"
            :aria-label="t(isFullscreen ? 'layout.exitFullscreen' : 'layout.enterFullscreen')"
            :aria-pressed="isFullscreen"
            class="com-dialog__action mr-10px"
            type="button"
            @click="toggleFull"
          >
            <Icon
              class="is-hover cursor-pointer"
              :icon="
                isFullscreen ? 'radix-icons:exit-full-screen' : 'radix-icons:enter-full-screen'
              "
              color="var(--el-color-info)"
              hover-color="var(--el-color-primary)"
            />
          </button>
          <button
            :aria-label="t('common.close')"
            class="com-dialog__action"
            type="button"
            @click.stop="close"
          >
            <Icon
              class="is-hover cursor-pointer"
              icon="ep:close"
              hover-color="var(--el-color-primary)"
              color="var(--el-color-info)"
            />
          </button>
        </div>
      </div>
    </template>

    <div v-loading="loading" :style="loading ? { minHeight: '120px' } : undefined">
      <template v-if="!loading">
        <ElScrollbar v-if="scroll" :style="dialogStyle">
          <slot></slot>
        </ElScrollbar>
        <slot v-else></slot>
      </template>
    </div>
    <template v-if="slots.footer" #footer>
      <div :style="{ 'pointer-events': closing ? 'none' : 'auto' }">
        <slot name="footer"></slot>
      </div>
    </template>
  </ElDialog>
</template>

<style lang="scss">
// :where 不增加优先级，只重置原生 button 默认样式，保留 focus outline
:where(.com-dialog__action) {
  display: inline-flex;
  align-items: center;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.com-dialog {
  .#{$elNamespace}-overlay-dialog {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .#{$elNamespace}-dialog {
    margin: 0 !important;

    &__header {
      height: 54px;
      padding: 0;
      margin-right: 0 !important;
      border-bottom: 1px solid var(--el-border-color);
    }

    &__body {
      padding: 15px !important;
    }

    &__footer {
      border-top: 1px solid var(--el-border-color);
    }

    &__headerbtn {
      top: 0;
    }
  }
}
</style>
