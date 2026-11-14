<!-- AI 视频：生成参数；按模型的表单能力展示 -->
<template>
  <template v-if="type === AiVideoTypeEnum.GENERATE">
    <div class="flex gap-8px">
      <el-form-item v-if="hasField('size')" label="尺寸" class="flex-1">
        <el-select v-model="options.size">
          <el-option v-for="item in capability.sizes" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="capability.resolutions.length" label="分辨率" class="flex-1">
        <el-select v-model="resolution" filterable allow-create>
          <el-option v-for="item in capability.resolutions" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="capability.ratios.length" label="比例" class="flex-1">
        <el-select v-model="ratio" filterable allow-create>
          <el-option v-for="item in capability.ratios" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="capability.durations.length" label="时长（秒）" class="flex-1">
        <el-select v-model="duration">
          <el-option v-for="item in capability.durations" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
    </div>
    <el-form-item v-if="hasField('negativePrompt')" label="反向提示词">
      <el-input v-model="options.negativePrompt" maxlength="500" placeholder="不希望出现的内容" />
    </el-form-item>
    <el-form-item v-if="hasField('quality')" label="生成模式">
      <el-radio-group v-model="options.quality">
        <el-radio-button
          v-for="item in AiVideoQualityOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="hasField('promptExpansionMode')" label="提示词扩写">
      <el-radio-group v-model="options.promptExpansionMode">
        <el-radio-button
          v-for="item in AiVideoPromptExpansionModeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item v-if="hasField('shotType')" label="镜头类型">
      <el-radio-group v-model="options.shotType">
        <el-radio-button
          v-for="item in AiVideoShotTypeOptions"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <div class="flex flex-wrap gap-x-16px">
      <el-form-item v-if="hasField('generateAudio')" label="生成音频">
        <el-switch v-model="options.generateAudio" />
      </el-form-item>
      <el-form-item v-if="hasField('promptExtend')" label="优化提示词">
        <el-switch v-model="options.promptExtend" />
      </el-form-item>
      <el-form-item v-if="hasField('cameraFixed')" label="固定镜头">
        <el-switch v-model="options.cameraFixed" />
      </el-form-item>
      <el-form-item v-if="hasField('watermark')" label="水印">
        <el-switch v-model="options.watermark" />
      </el-form-item>
    </div>
    <el-form-item v-if="hasField('seed')" label="随机种子">
      <el-input-number
        v-model="options.seed"
        :min="0"
        :controls="false"
        placeholder="留空为随机"
        class="!w-full"
      />
    </el-form-item>
  </template>
</template>

<script setup lang="ts">
import { VideoOptionsVO } from '@/api/ai/video'
import {
  AiVideoPromptExpansionModeOptions,
  AiVideoQualityOptions,
  AiVideoShotTypeOptions,
  AiVideoTypeEnum
} from '@/views/ai/utils/constants'
import type { VideoModelCapability } from '@/views/ai/utils/video'

/** AI 视频：生成参数；取值范围由服务端按模型校验 */
defineOptions({ name: 'AiVideoParamsForm' })

const props = defineProps<{
  type: number // 创作类型
  capability: VideoModelCapability // 模型的表单能力
}>()
const resolution = defineModel<string>('resolution') // 分辨率
const ratio = defineModel<string>('ratio') // 比例
const duration = defineModel<number>('duration') // 时长（秒）
const options = defineModel<VideoOptionsVO>('options', { required: true }) // 其它生成参数

/** 模型是否支持某个额外参数 */
const hasField = (field: string) => props.capability.fields.includes(field)
</script>
