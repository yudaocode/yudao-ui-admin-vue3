<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { isNumber } from '@/utils/is'

defineOptions({ name: 'Dialog' })

const { t } = useI18n()
const slots = useSlots()
const emits = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: propTypes.bool.def(false),
  title: propTypes.string.def('Dialog'),
  fullscreen: propTypes.bool.def(true),
  defaultFullscreen: propTypes.bool.def(false),
  width: propTypes.oneOfType([String, Number]).def('40%'),
  scroll: propTypes.bool.def(false), // 是否开启滚动条。如果是的话，按照 maxHeight 设置最大高度
  maxHeight: propTypes.oneOfType([String, Number]).def('400px'),
  loading: propTypes.bool.def(false)
})

const getBindValue = computed(() => {
  const delArr: string[] = [
    'fullscreen',
    'defaultFullscreen',
    'title',
    'maxHeight',
    'appendToBody',
    'loading'
  ]
  const attrs = useAttrs()
  const obj = { ...attrs, ...props }
  for (const key in obj) {
    if (delArr.indexOf(key) !== -1) {
      delete obj[key]
    }
  }
  return obj
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
  <ElDialog
    v-bind="getBindValue"
    :close-on-click-modal="true"
    :fullscreen="isFullscreen"
    :width="width"
    destroy-on-close
    lock-scroll
    draggable
    class="com-dialog"
    :show-close="false"
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
