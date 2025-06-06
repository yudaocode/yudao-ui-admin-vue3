<template>
  <div>
    <el-select
      filterable
      placeholder="请选择租户"
      class="!w-180px"
      v-model="value"
      @change="handleChange"
      clearable
    >
      <el-option v-for="item in tenants" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import * as TenantApi from '@/api/system/tenant'
import { getVisitTenantId, setVisitTenantId } from '@/utils/auth'
import { useMessage } from '@/hooks/web/useMessage'
import { useTagsView } from '@/hooks/web/useTagsView'

const message = useMessage() // 消息弹窗
const tagsView = useTagsView() // 标签页操作

const value = ref(getVisitTenantId()) // 当前选中的租户 ID
const tenants = ref<any[]>([]) // 租户列表

const handleChange = (id: number) => {
  // 设置访问租户 ID
  setVisitTenantId(id)
  // 关闭其他标签页，只保留当前页
  tagsView.closeOther()
  // 刷新当前页面
  tagsView.refreshPage()
  // 提示切换成功
  const tenant = tenants.value.find((item) => item.id === id)
  if (tenant) {
    message.success(`切换当前租户为: ${tenant.name}`)
  }
}

onMounted(async () => {
  tenants.value = await TenantApi.getTenantList()
})
</script>
