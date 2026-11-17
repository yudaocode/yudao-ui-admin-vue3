<!-- AI 短剧：新增 / 编辑道具 -->
<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑道具' : '新增道具'" width="560px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
      <el-form-item label="道具名称" prop="title">
        <el-input v-model="formData.title" maxlength="128" />
      </el-form-item>
      <el-form-item label="出图提示词">
        <el-input v-model="formData.prompt" type="textarea" :rows="4" maxlength="2000" />
      </el-form-item>
      <el-form-item label="参考图">
        <UploadImg
          v-model="formData.referenceImageUrl"
          height="96px"
          width="96px"
          :file-size="10"
        />
      </el-form-item>
      <el-form-item label="出现的镜头">
        <el-select
          v-model="formData.shotNumbers"
          multiple
          filterable
          placeholder="镜头未单独指定道具时，按这里关联"
          class="!w-full"
        >
          <el-option v-for="item in sceneNos" :key="item" :label="`镜头 ${item}`" :value="item" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaAssetApi, DramaVisualAssetVO } from '@/api/ai/drama/asset'

/** AI 短剧：道具表单；道具即类型为道具的视觉资产 */
defineOptions({ name: 'AiDramaPropForm' })

const props = defineProps<{
  projectId: number // 项目编号
  sceneNos: number[] // 当前分镜的镜头序号
}>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  title: '',
  prompt: '',
  referenceImageUrl: '',
  shotNumbers: [] as number[]
})
const formRules = reactive({
  title: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
})

/** 打开：传入道具时为编辑 */
const open = (asset?: DramaVisualAssetVO) => {
  dialogVisible.value = true
  formData.id = asset?.id
  formData.title = asset?.title || ''
  formData.prompt = asset?.prompt || ''
  formData.referenceImageUrl = asset?.referenceImages?.referenceImageUrl || ''
  formData.shotNumbers = asset?.referenceImages?.shotNumbers || []
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  const data = { ...formData }
  if (formData.id) {
    await DramaAssetApi.updateVisualAsset(data)
  } else {
    await DramaAssetApi.createVisualAsset({ ...data, projectId: props.projectId })
  }
  message.success('保存成功')
  dialogVisible.value = false
  emit('success')
}
</script>
