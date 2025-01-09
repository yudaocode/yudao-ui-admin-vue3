<template>
  <el-dialog
    v-model="signDialogVisible"
    title="签名"
    width="935"
  >
    <div class="position-relative">
      <Vue3Signature class="b b-solid b-gray" ref="signature" w="900px" h="400px"/>
      <el-button
        style="position: absolute; bottom: 20px; right: 10px"
        type="primary"
        text
        size="small"
        @click="signature.clear()"
      >
        <Icon icon="ep:delete" class="mr-5px"/>
        清除
      </el-button>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">
          提交
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import Vue3Signature from "vue3-signature"
import * as FileApi from '@/api/infra/file'

const message = useMessage() // 消息弹窗
const signDialogVisible = ref(false)
const signature = ref()

const open = async () => {
  signDialogVisible.value = true
}
defineExpose({open})

const emits = defineEmits(['success'])
const submit = async () => {
  message.success('签名上传中请稍等。。。')
  const res = await FileApi.updateFile({file: base64ToFile(signature.value.save('image/png'), '签名')})
  emits('success', res.data)
  signDialogVisible.value = false
}

const base64ToFile = (base64, fileName) => {
  // 将base64按照 , 进行分割 将前缀  与后续内容分隔开
  let data = base64.split(',');
  // 利用正则表达式 从前缀中获取图片的类型信息（image/png、image/jpeg、image/webp等）
  let type = data[0].match(/:(.*?);/)[1];
  // 从图片的类型信息中 获取具体的文件格式后缀（png、jpeg、webp）
  let suffix = type.split('/')[1];
  // 使用atob()对base64数据进行解码  结果是一个文件数据流 以字符串的格式输出
  const bstr = window.atob(data[1]);
  // 获取解码结果字符串的长度
  let n = bstr.length
  // 根据解码结果字符串的长度创建一个等长的整形数字数组
  // 但在创建时 所有元素初始值都为 0
  const u8arr = new Uint8Array(n)
  // 将整形数组的每个元素填充为解码结果字符串对应位置字符的UTF-16 编码单元
  while (n--) {
    // charCodeAt()：获取给定索引处字符对应的 UTF-16 代码单元
    u8arr[n] = bstr.charCodeAt(n)
  }
  // 利用构造函数创建File文件对象
  // new File(bits, name, options)
  const file = new File([u8arr], `${fileName}.${suffix}`, {
    type: type
  })
  // 将File文件对象返回给方法的调用者
  return file;
}

</script>

<style scoped>

</style>
