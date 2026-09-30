<template>
  <!-- 联系人详情 -->
  <Dialog v-model="dialogVisible" title="联系人详情" width="720px">
    <el-descriptions v-loading="loading" :column="1" border>
      <el-descriptions-item label="姓名">
        <div class="flex items-center gap-8px">
          <el-avatar :src="detailData.avatar" :size="32" />
          <span>{{ detailData.name }}</span>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="性别">
        <dict-tag
          v-if="detailData.sex != null"
          :type="DICT_TYPE.SYSTEM_USER_SEX"
          :value="detailData.sex"
        />
      </el-descriptions-item>
      <el-descriptions-item label="手机号码">{{ detailData.mobile }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ detailData.email }}</el-descriptions-item>
      <el-descriptions-item label="分类">
        {{
          detailData.handleStatus != null ? detailData.sharedCategoryName : detailData.categoryName
        }}
      </el-descriptions-item>
      <el-descriptions-item label="创建人">{{ detailData.ownerUserName }}</el-descriptions-item>
      <el-descriptions-item label="公司名称">{{ detailData.companyName }}</el-descriptions-item>
      <el-descriptions-item label="公司电话">{{ detailData.companyPhone }}</el-descriptions-item>
      <el-descriptions-item label="联系地址">{{ detailData.address }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detailData.remark }}</el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script setup lang="ts">
import * as ContactApi from '@/api/oa/contact'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'OaContactDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 详情加载中
const detailData = ref<ContactApi.OaContactVO>({ name: '' }) // 联系人详情

/** 打开详情 */
async function open(id: number) {
  dialogVisible.value = true
  detailData.value = { name: '' }
  loading.value = true
  try {
    detailData.value = await ContactApi.getContact(id)
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
