<template>
  <Dialog v-model="dialogVisible" title="印章详情" width="900px">
    <!-- 印章信息 -->
    <el-descriptions v-loading="detailLoading" :column="2" border>
      <el-descriptions-item label="所属部门" :span="2">
        {{ detailData.deptName }}
      </el-descriptions-item>
      <el-descriptions-item label="印章编号">{{ detailData.no }}</el-descriptions-item>
      <el-descriptions-item label="印章名称">{{ detailData.name }}</el-descriptions-item>
      <el-descriptions-item label="保管人">{{ detailData.keeperName }}</el-descriptions-item>
      <el-descriptions-item label="保管部门">{{ detailData.keeperDeptName }}</el-descriptions-item>
      <el-descriptions-item label="购买时间">
        {{ detailData.purchaseTime ? formatDate(detailData.purchaseTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="启用时间">
        {{ detailData.enableTime ? formatDate(detailData.enableTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="停用时间">
        {{ detailData.disableTime ? formatDate(detailData.disableTime) : '' }}
      </el-descriptions-item>
      <el-descriptions-item label="备注">{{ detailData.remark }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <DictTag :type="DICT_TYPE.OA_SEAL_STATUS" :value="detailData.status ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="类型">
        <DictTag :type="DICT_TYPE.OA_SEAL_TYPE" :value="detailData.type ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="分类">
        <DictTag :type="DICT_TYPE.OA_SEAL_CATEGORY" :value="detailData.category ?? ''" />
      </el-descriptions-item>
      <el-descriptions-item label="照片">
        <el-image
          v-if="detailData.picUrl"
          :src="detailData.picUrl"
          :preview-src-list="[detailData.picUrl]"
          preview-teleported
          class="h-100px w-100px"
          fit="contain"
        />
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import * as SealApi from '@/api/oa/seal'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'OaSealDetail' })

const dialogVisible = ref(false) // 弹窗是否展示
const detailLoading = ref(false) // 详情的加载中
const detailData = ref<SealApi.SealVO>({}) // 详情数据

/** 打开弹窗 */
async function open(id: number) {
  dialogVisible.value = true
  // 加载印章详情
  detailLoading.value = true
  detailData.value = {}
  try {
    detailData.value = await SealApi.getSeal(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
