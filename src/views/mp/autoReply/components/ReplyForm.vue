<template>
  <div>
    <el-form ref="formRef" :model="replyForm" :rules="rules" label-width="80px">
      <el-form-item label="消息类型" prop="requestMessageType" v-if="msgType === MsgType.Message">
        <el-select v-model="replyForm.requestMessageType" placeholder="请选择">
          <template v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)" :key="dict.value">
            <el-option
              v-if="RequestMessageTypes.includes(dict.value)"
              :label="dict.label"
              :value="dict.value"
            />
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="匹配类型" prop="requestMatch" v-if="msgType === MsgType.Keyword">
        <el-select v-model="replyForm.requestMatch" placeholder="请选择匹配类型" clearable>
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词" prop="requestKeyword" v-if="msgType === MsgType.Keyword">
        <el-input v-model="replyForm.requestKeyword" placeholder="请输入内容" clearable />
      </el-form-item>
      <el-form-item label="回复消息">
        <WxReplySelect v-model="reply" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import WxReplySelect, { type Reply } from '@/views/mp/components/wx-reply'
import type { FormInstance } from 'element-plus'
import { MsgType } from './types'
import { DICT_TYPE, getDictOptions, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'ReplyForm' })

const props = defineProps<{
  modelValue: any
  reply: Reply
  msgType: MsgType
}>()

const emit = defineEmits<{
  (e: 'update:reply', v: Reply)
  (e: 'update:modelValue', v: any)
}>()

const reply = computed<Reply>({
  get: () => props.reply,
  set: (val) => emit('update:reply', val)
})

const replyForm = computed<any>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance | null>(null) // 表单 ref

const RequestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link'] // 允许选择的请求消息类型

// 表单校验
const rules = {
  requestKeyword: [{ required: true, message: '请求的关键字不能为空', trigger: 'blur' }],
  requestMatch: [{ required: true, message: '请求的关键字的匹配不能为空', trigger: 'blur' }]
}

defineExpose({
  resetFields: () => formRef.value?.resetFields(),
  validate: async () => formRef.value?.validate()
})
</script>

<style scoped></style>
