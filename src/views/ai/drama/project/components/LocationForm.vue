<!-- AI 短剧：新增 / 编辑场景 -->
<template>
  <Dialog v-model="dialogVisible" :title="formData.id ? '编辑场景' : '新增场景'" width="600px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
      <el-form-item label="场景名称" prop="name">
        <el-input v-model="formData.name" maxlength="64" />
      </el-form-item>
      <el-form-item label="场景设定">
        <el-input v-model="formData.description" type="textarea" :rows="3" maxlength="2000" />
      </el-form-item>
      <el-form-item label="出图提示词">
        <el-input v-model="formData.prompt" type="textarea" :rows="3" placeholder="为空时使用场景设定" maxlength="2000" />
      </el-form-item>
      <el-form-item label="参考图">
        <UploadImg v-model="formData.referenceImageUrl" height="96px" width="96px" :file-size="10" />
      </el-form-item>
      <el-form-item v-if="currentLocation?.candidates?.length" label="选用候选">
        <div class="flex flex-wrap gap-8px">
          <div
            v-for="(candidate, index) in currentLocation.candidates"
            :key="index"
            class="cursor-pointer rounded-6px p-2px"
            :class="formData.selectedIndex === index ? 'outline outline-2 outline-[var(--el-color-primary)]' : ''"
            @click="candidate.url && (formData.selectedIndex = index)"
          >
            <AssetImage :url="candidate.url" :status="candidate.url ? undefined : currentLocation.status" size="80px" />
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DramaAssetApi, DramaLocationVO } from '@/api/ai/drama/asset'
import AssetImage from './AssetImage.vue'

/** AI 短剧：场景表单 */
defineOptions({ name: 'AiDramaLocationForm' })

const props = defineProps<{
  projectId: number // 项目编号
  locations: DramaLocationVO[] // 项目的场景：用于展示编辑中场景的最新候选图
}>()
const emit = defineEmits<{ success: [] }>()
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false)
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  description: '',
  prompt: '',
  referenceImageUrl: '',
  selectedIndex: undefined as number | undefined
})
const formRules = reactive({ name: [{ required: true, message: '名称不能为空', trigger: 'blur' }] })
const currentLocation = computed(() => props.locations.find((item) => item.id === formData.id))

/** 打开：传入场景时为编辑 */
const open = (location?: DramaLocationVO) => {
  dialogVisible.value = true
  formData.id = location?.id
  formData.name = location?.name || ''
  formData.description = location?.description || ''
  formData.prompt = location?.prompt || ''
  formData.referenceImageUrl = location?.referenceImageUrl || ''
  formData.selectedIndex = location?.selectedIndex
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  if (formData.id) {
    await DramaAssetApi.updateLocation({ ...formData })
  } else {
    await DramaAssetApi.createLocation({ ...formData, projectId: props.projectId })
  }
  message.success('保存成功')
  dialogVisible.value = false
  emit('success')
}
</script>
