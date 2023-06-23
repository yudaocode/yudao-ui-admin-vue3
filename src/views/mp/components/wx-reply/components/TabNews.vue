<template>
  <div>
    <el-row>
      <div class="select-item" v-if="reply.articles && reply.articles.length > 0">
        <WxNews :articles="reply.articles" />
        <el-col class="ope-row">
          <el-button type="danger" circle @click="onDelete">
            <Icon icon="ep:delete" />
          </el-button>
        </el-col>
      </div>
      <!-- 选择素材 -->
      <el-col :span="24" v-if="!reply.content">
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
          type="news"
          :account-id="reply.accountId"
          :newsType="newsType"
          @select-material="selectMaterial"
        />
      </el-dialog>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
import WxNews from '@/views/mp/components/wx-news'
import WxMaterialSelect from '@/views/mp/components/wx-material-select'
import { Reply, NewsType } from './types'

const props = defineProps<{
  modelValue: Reply
  newsType: NewsType
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply)
}>()
const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showDialog = ref(false)

const selectMaterial = (item: any) => {
  showDialog.value = false
  reply.value.articles = item.content.newsItem
}

const onDelete = () => {
  reply.value.articles = []
}
</script>

<style lang="scss" scoped>
.select-item {
  width: 280px;
  padding: 10px;
  margin: 0 auto 10px;
  border: 1px solid #eaeaea;

  .ope-row {
    padding-top: 10px;
    text-align: center;
  }
}
</style>
