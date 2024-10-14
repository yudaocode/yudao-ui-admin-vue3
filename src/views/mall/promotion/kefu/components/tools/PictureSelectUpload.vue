<!-- 图片选择 -->
<template>
  <div>
    <img :src="Picture" class="w-35px h-35px" @click="selectAndUpload" />
  </div>
</template>

<script lang="ts" setup>
import Picture from '@/views/mall/promotion/kefu/components/asserts/picture.svg'
import * as FileApi from '@/api/infra/file'

defineOptions({ name: 'PictureSelectUpload' })

const message = useMessage() // 消息弹窗

/** 选择并上传文件 */
const emits = defineEmits<{
  (e: 'send-picture', v: string): void
}>()
const selectAndUpload = async () => {
  const files: any = await getFiles()
  message.success('图片发送中请稍等。。。')
  const res = await FileApi.updateFile({ file: files[0].file })
  emits('send-picture', res.data)
}

/**
 * 唤起文件选择窗口，并获取选择的文件
 *
 * @param {Object} options - 配置选项
 * @param {boolean} [options.multiple=true] - 是否支持多选
 * @param {string} [options.accept=''] - 文件上传格式限制
 * @param {number} [options.limit=1] - 单次上传最大文件数
 * @param {number} [options.fileSize=500] - 单个文件大小限制（单位：MB）
 * @returns {Promise<Array>} 选择的文件列表，每个文件带有一个uid
 */
async function getFiles(options = {}) {
  const { multiple, accept, limit, fileSize } = {
    multiple: true,
    accept: 'image/jpeg, image/png, image/gif', // 默认选择图片
    limit: 1,
    fileSize: 500,
    ...options
  }

  // 创建文件选择元素
  const input = document.createElement('input')
  input.type = 'file'
  input.style.display = 'none'
  if (multiple) input.multiple = true
  if (accept) input.accept = accept

  // 将文件选择元素添加到文档中
  document.body.appendChild(input)

  // 触发文件选择元素的点击事件
  input.click()

  // 等待文件选择元素的 change 事件
  try {
    return await new Promise((resolve, reject) => {
      input.addEventListener('change', (event: any) => {
        const filesArray = Array.from(event?.target?.files || [])

        // 从文档中移除文件选择元素
        document.body.removeChild(input)

        // 判断是否超出上传数量限制
        if (filesArray.length > limit) {
          reject({ errorType: 'limit', files: filesArray })
          return
        }

        // 判断是否超出上传文件大小限制
        const overSizedFiles = filesArray.filter((file: File) => file.size / 1024 ** 2 > fileSize)
        if (overSizedFiles.length > 0) {
          reject({ errorType: 'fileSize', files: overSizedFiles })
          return
        }

        // 生成文件列表，并添加 uid
        const fileList = filesArray.map((file, index) => ({ file, uid: Date.now() + index }))
        resolve(fileList)
      })
    })
  } catch (error) {
    console.error('选择文件出错:', error)
    throw error
  }
}
</script>

<style lang="scss" scoped></style>
