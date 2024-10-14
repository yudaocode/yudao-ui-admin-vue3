<template>
  <div>
    <Title title="音乐/歌词说明" desc="描述您想要的音乐风格和主题，使用流派和氛围而不是特定的艺术家和歌曲">
      <el-input
        v-model="formData.desc"
        :autosize="{ minRows: 6, maxRows: 6}"
        resize="none"
        type="textarea"
        maxlength="1200"
        show-word-limit
        placeholder="一首关于糟糕分手的欢快歌曲"
      />
    </Title>

    <Title title="纯音乐" desc="创建一首没有歌词的歌曲">
      <template #extra>
        <el-switch v-model="formData.pure" size="small"/>
      </template>
    </Title>

    <Title title="版本" desc="描述您想要的音乐风格和主题，使用流派和氛围而不是特定的艺术家和歌曲">
      <el-select v-model="formData.version" placeholder="请选择">
        <el-option
          v-for="item in [{
            value: '3',
            label: 'V3'
          }, {
            value: '2',
            label: 'V2'
          }]"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </Title>
  </div>
</template>

<script lang="ts" setup>
import Title from '../title/index.vue'

defineOptions({ name: 'Desc' })

const formData = reactive({
  desc: '',
  pure: false,
  version: '3'
})

defineExpose({
  formData
})

</script>
