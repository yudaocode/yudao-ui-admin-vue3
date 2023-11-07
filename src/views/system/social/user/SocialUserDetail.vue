<template>
  <Dialog v-model="dialogVisible" title="详情" width="800">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="社交平台" min-width="160">
        <dict-tag :type="DICT_TYPE.SYSTEM_SOCIAL_TYPE" :value="detailData.type" />
      </el-descriptions-item>
      <el-descriptions-item label="用户昵称" min-width="120">
        {{ detailData.nickname }}
      </el-descriptions-item>
      <el-descriptions label="用户头像" min-width="120">
        <el-image :src="detailData.avatar" class="h-30px w-30px" />
      </el-descriptions>
      <el-descriptions-item label="社交 token" min-width="120">
        {{ detailData.token }}
      </el-descriptions-item>
      <el-descriptions-item label="原始 Token 数据" min-width="120">
        <el-input
          v-model="detailData.rawTokenInfo"
          :autosize="{ maxRows: 20 }"
          :readonly="true"
          type="textarea"
        />
      </el-descriptions-item>
      <el-descriptions-item label="原始 User 数据" min-width="120">
        <el-input
          v-model="detailData.rawUserInfo"
          :autosize="{ maxRows: 20 }"
          :readonly="true"
          type="textarea"
        />
      </el-descriptions-item>
      <el-descriptions-item label="最后一次的认证 code" min-width="120">
        {{ detailData.code }}
      </el-descriptions-item>
      <el-descriptions-item label="最后一次的认证 state" min-width="120">
        {{ detailData.state }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as SocialUserApi from '@/api/system/social/user'

const dialogVisible = ref(false) // 弹窗的是否展示
const detailLoading = ref(false) // 表单的加载中
const detailData = ref({}) // 详情数据

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  // 设置数据
  try {
    detailData.value = await SocialUserApi.getSocialUser(id)
  } finally {
    detailLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
