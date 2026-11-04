<script lang="ts" setup>
import { PropType } from 'vue'
import { Editor, Toolbar } from '@wangeditor-next/editor-for-vue'
import { i18nChangeLanguage, IDomEditor, IEditorConfig } from '@wangeditor-next/editor'
import { propTypes } from '@/utils/propTypes'
import { isNumber } from '@/utils/is'
import { ElMessage } from 'element-plus'
import { useLocaleStore } from '@/store/modules/locale'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import merge from 'lodash-es/merge'
import { setupWangEditorPlugin } from '@/views/bpm/model/form/PrintTemplate'

defineOptions({ name: 'Editor' })

// wangEditor 插件注册：需在创建编辑器之前完成
setupWangEditorPlugin()

type InsertFnType = (url: string, alt: string, href: string) => void

const localeStore = useLocaleStore()

const currentLocale = computed(() => localeStore.getCurrentLocale)

i18nChangeLanguage(unref(currentLocale).lang)

const props = defineProps({
  editorId: propTypes.string.def('wangEditor-1'),
  height: propTypes.oneOfType([Number, String]).def('500px'),
  editorConfig: {
    type: Object as PropType<Partial<IEditorConfig>>,
    default: () => undefined
  },
  readonly: propTypes.bool.def(false),
  modelValue: propTypes.string.def(''),
  directory: propTypes.string.def('editor-default')
})

const emit = defineEmits(['change', 'update:modelValue'])

// 使用项目的上传方法，实现逐个文件上传
const { httpRequest: imageHttpRequest } = useUpload(`${props.directory}-image`)
const { httpRequest: videoHttpRequest } = useUpload(`${props.directory}-video`)

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>()

const valueHtml = ref('')

watch(
  () => props.modelValue,
  (val: string) => {
    if (!val) {
      val = ''
    }
    if (val === unref(valueHtml)) return
    valueHtml.value = val
  },
  {
    immediate: true
  }
)

// 外部清空兜底：内层 Editor 仅在 modelValue 与其 onChange 记录的值不同时才 setHtml，而初值经 createEditor 渲染、
// 不触发 onChange，导致初值后的首次外部清空被内层跳过。post 回调在本组件及内层 Editor（含其 watch）更新后执行，
// 此时编辑器仍非空才补一次清空；内层已正常清空时 isEmpty() 为 true，不会重复操作
watch(
  () => props.modelValue,
  (val) => {
    if (val) return
    const editor = editorRef.value
    if (!editor || editor.isEmpty()) return
    editor.setHtml('')
  },
  { flush: 'post' }
)

// 监听
watch(
  () => valueHtml.value,
  (val: string) => {
    emit('update:modelValue', val)
  }
)
watch(
  () => props.readonly,
  async (val) => {
    // 特殊：等待 editorRef 渲染完成
    if (!editorRef.value) {
      await nextTick()
    }
    if (val) {
      editorRef.value?.disable()
    } else {
      editorRef.value?.enable()
    }
  }
)

// 内层 Editor 在其 onMounted 中按当时的 modelValue 同步 createEditor，本组件 onMounted 紧随其后，记录创建所用内容
let createdHtml: string | undefined
onMounted(() => {
  createdHtml = valueHtml.value
})

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
  // onCreated 为异步触发：期间 modelValue 若已变化，内层 watch 因实例未就绪丢弃了 setHtml，这里补同步一次；
  // 初值未变化时不调用 setHtml，避免写入撤销栈、抢占焦点和多余的 change
  if (createdHtml !== undefined && valueHtml.value !== createdHtml) {
    editor.setHtml(valueHtml.value)
  }
}

// 编辑器配置
const editorConfig = computed((): IEditorConfig => {
  return merge(
    {
      placeholder: '请输入内容...',
      readOnly: props.readonly,
      customAlert: (s: string, t: string) => {
        switch (t) {
          case 'success':
            ElMessage.success(s)
            break
          case 'info':
            ElMessage.info(s)
            break
          case 'warning':
            ElMessage.warning(s)
            break
          case 'error':
            ElMessage.error(s)
            break
          default:
            ElMessage.info(s)
            break
        }
      },
      autoFocus: false,
      scroll: true,
      EXTEND_CONF: {
        mentionConfig: {
          showModal: () => {},
          hideModal: () => {}
        }
      },
      MENU_CONF: {
        ['uploadImage']: {
          // 单个文件的最大体积限制，默认为 2M
          maxFileSize: 10 * 1024 * 1024,
          // 最多可上传几个文件，默认为 100
          maxNumberOfFiles: 100,
          // 选择文件时的类型限制，默认为 ['image/*'] 。如不想限制，则设置为 []
          allowedFileTypes: ['image/*'],

          // 使用 customUpload 实现逐个文件上传，复用项目的 httpRequest
          async customUpload(file: File, insertFn: InsertFnType) {
            try {
              const res = await imageHttpRequest({
                file: file as any,
                onProgress: () => {},
                onSuccess: () => {},
                onError: () => {}
              } as any)
              // 兼容前端直连上传和后端上传两种模式的返回格式
              const url = (res as any).data?.data || (res as any).data
              insertFn(url, 'image', url)
            } catch (error: any) {
              ElMessage.error(error.msg || '图片上传失败')
              console.error('Upload error:', error)
            }
          }
        },
        ['uploadVideo']: {
          // 单个文件的最大体积限制，默认为 10M
          maxFileSize: 1024 * 1024 * 1024,
          // 最多可上传几个文件，默认为 100
          maxNumberOfFiles: 10,
          // 选择文件时的类型限制，默认为 ['video/*'] 。如不想限制，则设置为 []
          allowedFileTypes: ['video/*'],

          // 使用 customUpload 实现逐个文件上传，复用项目的 httpRequest
          async customUpload(file: File, insertFn: InsertFnType) {
            try {
              const res = await videoHttpRequest({
                file: file as any,
                onProgress: () => {},
                onSuccess: () => {},
                onError: () => {}
              } as any)
              // 兼容前端直连上传和后端上传两种模式的返回格式
              const url = (res as any).data?.data || (res as any).data
              insertFn(url, 'mp4', url)
            } catch (error: any) {
              ElMessage.error(error.msg || '视频上传失败')
              console.error('Upload error:', error)
            }
          }
        }
      },
      uploadImgShowBase64: true
    },
    props.editorConfig || {}
  )
})

const editorStyle = computed(() => {
  return {
    height: isNumber(props.height) ? `${props.height}px` : props.height,
    width: '100%'
  }
})

// 回调函数
const handleChange = (editor: IDomEditor) => {
  emit('change', editor)
}

// 组件销毁时，及时销毁编辑器
onBeforeUnmount(() => {
  const editor = unref(editorRef.value)

  // 销毁，并移除 editor
  editor?.destroy()
})

const getEditorRef = async (): Promise<IDomEditor> => {
  await nextTick()
  return unref(editorRef.value) as IDomEditor
}

defineExpose({
  getEditorRef
})
</script>

<template>
  <div class="w-full min-w-0 border-1 border-solid border-[var(--el-border-color)] z-10">
    <!-- 工具栏 -->
    <Toolbar
      :editor="editorRef"
      :editorId="editorId"
      class="border-0 b-b-1 border-solid border-[var(--el-border-color)]"
    />
    <!-- 编辑器 -->
    <Editor
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :editorId="editorId"
      :style="editorStyle"
      @on-change="handleChange"
      @on-created="handleCreated"
    />
  </div>
</template>

<style src="@wangeditor-next/editor/dist/css/style.css"></style>
