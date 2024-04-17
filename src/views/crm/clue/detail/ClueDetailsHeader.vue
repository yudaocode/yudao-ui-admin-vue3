<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：线索基本信息 -->
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ clue.name }}</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <slot></slot>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="线索来源">
        <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="clue.source" />
      </el-descriptions-item>
      <el-descriptions-item label="手机"> {{ clue.mobile }} <el-button l link type="danger" @click="call(clue.id)">呼出</el-button></el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ clue.ownerUserName }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(clue.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as ClueApi from '@/api/crm/clue'
import { formatDate } from '@/utils/formatTime'
import makercall from '@/utils/callUtils'



defineOptions({ name: 'CrmClueDetailsHeader' })
defineProps<{
  clue: ClueApi.ClueVO // 线索信息
  loading: boolean // 加载中
}>()

const call = async (callid: number)=>{
  // await CallCenterApi.callCenterUserbyPhone("19223142566")
  try{
    makercall(callid,1)
  }catch {

  } 
}

</script>
