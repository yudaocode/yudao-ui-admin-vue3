<template>
  <div class="h-full box-border py-6 px-7">
    <div class="w-full h-full relative bg-white box-border p-3 sm:p-16 pr-0">
      <!-- 展示在右上角 -->
      <el-button
        color="#846af7"
        v-show="showCopy"
        @click="copyMsg"
        class="absolute top-2 right-2 copy-btn"
        :data-clipboard-target="inputId"
      >
        复制
      </el-button>
      <!-- 展示在下面中间的位置 -->
      <el-button
        v-show="isWriting"
        class="absolute bottom-2 left-1/2 -translate-x-1/2"
        @click="emits('stopStream')"
      >
        终止生成
      </el-button>
      <div ref="contentRef" class="w-full h-full pr-3 sm:pr-16 overflow-y-auto">
        <el-input
          id="inputId"
          type="textarea"
          v-model="compMsg"
          autosize
          :input-style="{ boxShadow: 'none' }"
          resize="none"
          placeholder="生成的内容……"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useClipboard } from '@vueuse/core'
  const message = useMessage()
  const props = defineProps({
    msg: {
      type: String,
      default: ''
    },
    isWriting: {
      type: Boolean,
      default: false
    }
  })

  const emits = defineEmits(['update:msg', 'stopStream'])

  const { copied, copy } = useClipboard()

  const compMsg = computed({
    get() {
      return props.msg
    },
    set(val) {
      emits('update:msg', val)
    }
  })

  const showCopy = computed(() => props.msg && !props.isWriting)

  const inputId = computed(() => getCurrentInstance()?.uid)

  const contentRef = ref<HTMLDivElement>()
  defineExpose({
    scrollToBottom() {
      contentRef.value?.scrollTo(0, contentRef.value?.scrollHeight)
    }
  })

  // 点击复制的时候复制msg
  const copyMsg = () => {
    copy(props.msg)
  }

  watch(copied, (val) => {
    console.log({ copied: val })
    if (val) {
      message.success('复制成功')
    }
  })
</script>
