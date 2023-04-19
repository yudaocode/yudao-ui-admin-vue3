<template>
  <el-tab-pane name="news">
    <template #label>
      <el-row align="middle"><Icon icon="ep:reading" /> 图文</el-row>
    </template>
    <el-row>
      <div class="select-item" v-if="objData.articles?.length > 0">
        <WxNews :articles="objData.articles" />
        <el-col class="ope-row">
          <el-button type="danger" circle @click="onDelete">
            <Icon icon="ep:delete" />
          </el-button>
        </el-col>
      </div>
      <!-- 选择素材 -->
      <el-col :span="24" v-if="!objData.content">
        <el-row style="text-align: center" align="middle">
          <el-col :span="24">
            <el-button type="success" @click="showDialog = true">
              {{ newsType === NewsType.Published ? '选择已发布图文' : '选择草稿箱图文' }}
              <Icon icon="ep:circle-check" />
            </el-button>
          </el-col>
        </el-row>
      </el-col>
      <el-dialog title="选择图文" v-model="showDialog" width="90%" append-to-body destroy-on-close>
        <WxMaterialSelect
          :objData="objData"
          @select-material="selectMaterial"
          :newsType="newsType"
        />
      </el-dialog>
    </el-row>
  </el-tab-pane>
</template>

<script setup lang="ts">
import WxNews from '@/views/mp/components/wx-news/main.vue'
import WxMaterialSelect from '@/views/mp/components/wx-material-select/main.vue'
import { ObjData, NewsType } from './types'

const props = defineProps<{
  modelValue: ObjData
  newsType: NewsType
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: ObjData)
}>()
const objData = computed<ObjData>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showDialog = ref(false)

const selectMaterial = (item: any) => {
  showDialog.value = false
  objData.value.articles = item.content.newsItem
}

const onDelete = () => {
  objData.value.articles = []
}
</script>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px auto;
  border: 1px solid #eaeaea;

  .ope-row {
    padding-top: 10px;
    text-align: center;
  }
}
</style>
