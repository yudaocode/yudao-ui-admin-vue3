<template>
  <doc-alert title="【营销】秒杀活动" url="https://doc.iocoder.cn/mall/promotion-seckill/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @reset="setSearchParams" @search="setSearchParams">
      <!-- 新增等操作按钮 -->
      <template #actionMore>
        <el-button
          v-hasPermi="['promotion:seckill-config:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
      </template>
    </Search>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="allSchemas.tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
    >
      <template #sliderPicUrls="{ row }">
        <el-image
          v-for="(item, index) in row.sliderPicUrls"
          :key="index"
          :src="item"
          class="mr-10px h-60px w-60px"
          @click="imagePreview(row.sliderPicUrls)"
        />
      </template>
      <template #status="{ row }">
        <el-switch
          v-model="row.status"
          :active-value="0"
          :inactive-value="1"
          @change="handleStatusChange(row)"
        />
      </template>
      <template #action="{ row }">
        <el-button
          v-hasPermi="['promotion:seckill-config:update']"
          link
          type="primary"
          @click="openForm('update', row.id)"
        >
          编辑
        </el-button>
        <el-button
          v-hasPermi="['promotion:seckill-config:delete']"
          link
          type="danger"
          @click="handleDelete(row.id)"
        >
          删除
        </el-button>
      </template>
    </Table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <SeckillConfigForm ref="formRef" @success="getList" />
</template>
<script lang="ts" name="PromotionSeckillConfig" setup>
import { allSchemas } from './seckillConfig.data'
import * as SeckillConfigApi from '@/api/mall/promotion/seckill/seckillConfig'
import SeckillConfigForm from './SeckillConfigForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { CommonStatusEnum } from '@/utils/constants'

const message = useMessage() // 消息弹窗
// tableObject：表格的属性对象，可获得分页大小、条数等属性
// tableMethods：表格的操作对象，可进行获得分页、删除记录等操作
// 详细可见：https://doc.iocoder.cn/vue3/crud-schema/
const { tableObject, tableMethods } = useTable({
  getListApi: SeckillConfigApi.getSeckillConfigPage, // 分页接口
  delListApi: SeckillConfigApi.deleteSeckillConfig // 删除接口
})
// 获得表格的各种操作
const { getList, setSearchParams } = tableMethods

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = (id: number) => {
  tableMethods.delList(id, false)
}

/** 修改用户状态 */
const handleStatusChange = async (row: SeckillConfigApi.SeckillConfigVO) => {
  try {
    // 修改状态的二次确认
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm('确认要"' + text + '""' + row.name + '?')
    // 发起修改状态
    await SeckillConfigApi.updateSeckillConfigStatus(row.id, row.status)
    // 刷新列表
    await getList()
  } catch {
    // 取消后，进行恢复按钮
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

/** 轮播图预览预览 */
const imagePreview = (args) => {
  createImageViewer({
    urlList: args
  })
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
