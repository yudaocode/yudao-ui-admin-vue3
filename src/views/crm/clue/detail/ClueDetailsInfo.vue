<template>
  <ContentWrap>
    <el-collapse v-model="activeNames" class="">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="线索名称">
            {{ clue.name }}
          </el-descriptions-item>
          <el-descriptions-item label="客户来源">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="clue.source" />
          </el-descriptions-item>
          <el-descriptions-item label="手机">{{ clue.mobile }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ clue.telephone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ clue.email }}</el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ clue.areaName }} {{ clue.detailAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="QQ">{{ clue.qq }}</el-descriptions-item>
          <el-descriptions-item label="微信">{{ clue.wechat }}</el-descriptions-item>
          <el-descriptions-item label="客户行业">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="clue.industryId" />
          </el-descriptions-item>
          <el-descriptions-item label="客户级别">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="clue.level" />
          </el-descriptions-item>
          <el-descriptions-item label="下次联系时间">
            {{ formatDate(clue.contactNextTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ clue.remark }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="负责人">{{ clue.ownerUserName }}</el-descriptions-item>
          <el-descriptions-item label="最后跟进记录">
            {{ clue.contactLastContent }}
          </el-descriptions-item>
          <el-descriptions-item label="最后跟进时间">
            {{ formatDate(clue.contactLastTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ clue.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(clue.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(clue.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'CrmClueDetailsInfo' })
const { clue } = defineProps<{
  clue: ClueApi.ClueVO // 线索明细
}>()

const activeNames = ref(['basicInfo', 'systemInfo']) // 展示的折叠面板
</script>
<style lang="scss" scoped></style>
