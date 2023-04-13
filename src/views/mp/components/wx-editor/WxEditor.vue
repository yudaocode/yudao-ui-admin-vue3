<script setup>
import { ref, reactive } from 'vue'
import { getAccessToken } from '@/utils/auth'
import { Editor } from '@/components/Editor'

const BASE_URL = import.meta.env.VITE_BASE_URL
const actionUrl = BASE_URL + '/admin-api/mp/material/upload-news-image' // 这里写你要上传的图片服务器地址
const headers = { Authorization: 'Bearer ' + getAccessToken() } // 设置上传的请求头部

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
const uploadData = reactive({
  type: 'image', // TODO 芋艿：试试要不要换成 thumb
  accountId: props.accountId
})

const onEditorChange = (text) => {
  //内容改变事件
  emit('input', text)
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
      <Editor
        editor-id="wxEditor"
        ref="quillEditorRef"
        :modelValue="content"
        @change="(editor) => onEditorChange(editor.getText())"
      />
    </div>
  </div>
</template>
