<script setup>
import { ref, reactive } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { getAccessToken } from '@/utils/auth'
import editorOptions from './quill-options'

const BASE_URL = import.meta.env.VITE_BASE_URL

const message = useMessage()

const props = defineProps({
  /* 公众号账号编号 */
  accountId: {
    type: Number,
    required: true
  },
  /* 编辑器的内容 */
  value: {
    type: String,
    default: ''
  },
  /* 图片大小 */
  maxSize: {
    type: Number,
    default: 4000 // kb
  }
})

const emit = defineEmits(['input'])

const myQuillEditorRef = ref()

const content = ref(props.value.replace(/data-src/g, 'src'))

const loading = ref(false) // 根据图片上传状态来确定是否显示loading动画，刚开始是false,不显示

const actionUrl = ref(BASE_URL + '/admin-api/mp/material/upload-news-image') // 这里写你要上传的图片服务器地址
const headers = ref({ Authorization: 'Bearer ' + getAccessToken() }) // 设置上传的请求头部
const uploadData = reactive({
  type: 'image', // TODO 芋艿：试试要不要换成 thumb
  accountId: props.accountId
})

const onEditorChange = () => {
  //内容改变事件
  emit('input', content.value)
}

// 富文本图片上传前
const beforeUpload = () => {
  // 显示 loading 动画
  loading.value = true
}

// 图片上传成功
// 注意！由于微信公众号的图片有访问限制，所以会显示“此图片来自微信公众号，未经允许不可引用”
const uploadSuccess = (res) => {
  // res为图片服务器返回的数据
  // 获取富文本组件实例
  const quill = myQuillEditorRef.value.quill
  // 如果上传成功
  const link = res.data
  if (link) {
    // 获取光标所在位置
    let length = quill.getSelection().index
    // 插入图片  res.info为服务器返回的图片地址
    quill.insertEmbed(length, 'image', link)
    // 调整光标到最后
    quill.setSelection(length + 1)
  } else {
    message.error('图片插入失败')
  }
  // loading 动画消失
  loading.value = false
}

// 富文本图片上传失败
const uploadError = () => {
  // loading 动画消失
  loading.value = false
  message.error('图片插入失败')
}
</script>

<template>
  <div id="wxEditor">
    <div v-loading="loading" element-loading-text="请稍等，图片上传中">
      <!-- 图片上传组件辅助-->
      <el-upload
        class="avatar-uploader"
        name="file"
        :action="actionUrl"
        :headers="headers"
        :show-file-list="false"
        :data="uploadData"
        :on-success="uploadSuccess"
        :on-error="uploadError"
        :before-upload="beforeUpload"
      />
      <QuillEditor
        class="editor"
        v-model="content"
        ref="quillEditorRef"
        :options="editorOptions"
        @change="onEditorChange($event)"
      />
    </div>
  </div>
</template>

<style>
.editor {
  line-height: normal !important;
  height: 500px;
}

.ql-snow .ql-tooltip[data-mode='link']::before {
  content: '请输入链接地址:';
}

.ql-snow .ql-tooltip.ql-editing a.ql-action::after {
  border-right: 0;
  content: '保存';
  padding-right: 0;
}

.ql-snow .ql-tooltip[data-mode='video']::before {
  content: '请输入视频地址:';
}

.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '14px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='small']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='small']::before {
  content: '10px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='large']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='large']::before {
  content: '18px';
}

.ql-snow .ql-picker.ql-size .ql-picker-label[data-value='huge']::before,
.ql-snow .ql-picker.ql-size .ql-picker-item[data-value='huge']::before {
  content: '32px';
}

.ql-snow .ql-picker.ql-header .ql-picker-label::before,
.ql-snow .ql-picker.ql-header .ql-picker-item::before {
  content: '文本';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='1']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='1']::before {
  content: '标题1';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='2']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='2']::before {
  content: '标题2';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='3']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='3']::before {
  content: '标题3';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='4']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='4']::before {
  content: '标题4';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='5']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='5']::before {
  content: '标题5';
}

.ql-snow .ql-picker.ql-header .ql-picker-label[data-value='6']::before,
.ql-snow .ql-picker.ql-header .ql-picker-item[data-value='6']::before {
  content: '标题6';
}

.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '标准字体';
}

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='serif']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='serif']::before {
  content: '衬线字体';
}

.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='monospace']::before,
.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='monospace']::before {
  content: '等宽字体';
}
</style>
