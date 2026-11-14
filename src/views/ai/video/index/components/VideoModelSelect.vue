<!-- AI 视频：服务商、模型选择 -->
<template>
  <el-form-item label="服务商">
    <el-select v-model="platform" placeholder="请选择服务商" class="!w-full">
      <el-option
        v-for="item in platformList"
        :key="item"
        :label="getDictLabel(DICT_TYPE.AI_PLATFORM, item) || item"
        :value="item"
      />
    </el-select>
  </el-form-item>
  <el-form-item label="模型" prop="modelId">
    <el-select
      v-model="modelId"
      placeholder="请选择视频模型"
      class="!w-full"
      @change="emit('change')"
    >
      <el-option v-for="item in modelList" :key="item.id" :label="item.name" :value="item.id">
        <span>{{ item.name }}</span>
        <span class="ml-8px text-12px text-[var(--el-text-color-secondary)]">{{
          item.model
        }}</span>
      </el-option>
    </el-select>
    <div
      v-if="!models.length"
      class="mt-4px text-12px leading-18px text-[var(--el-text-color-secondary)]"
    >
      暂无可用模型，请先在「模型配置」中添加类型为「视频」的模型
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { getDictLabel, DICT_TYPE } from '@/utils/dict'
import { ModelVO } from '@/api/ai/model/model'

/** AI 视频：服务商、模型选择；服务商跟随选中的模型，切换服务商时选中它的第一个模型 */
defineOptions({ name: 'AiVideoModelSelect' })

const props = defineProps<{
  models: ModelVO[] // 当前创作类型可用的模型
}>()
const modelId = defineModel<number>() // 选中的模型编号
const emit = defineEmits<{ change: [] }>() // 用户切换服务商、模型时触发

/** 可用的服务商 */
const platformList = computed(() => [...new Set(props.models.map((item) => item.platform))])

/** 当前服务商：取选中模型的服务商；切换时选中该服务商的第一个模型 */
const platform = computed({
  get: () => props.models.find((item) => item.id === modelId.value)?.platform,
  set: (value) => {
    modelId.value = props.models.find((item) => item.platform === value)?.id
    emit('change')
  }
})

/** 当前服务商的模型 */
const modelList = computed(() => props.models.filter((item) => item.platform === platform.value))
</script>
