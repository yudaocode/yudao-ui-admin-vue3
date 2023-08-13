<template>
  <doc-alert title="功能开启" url="https://doc.iocoder.cn/mall/build/" />

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @reset="setSearchParams" @search="setSearchParams">
      <!-- 新增等操作按钮 -->
      <template #actionMore>
        <el-button
          v-hasPermi="['promotion:seckill-activity:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" /> 新增
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
      :expand="true"
      :loading="tableObject.loading"
      :pagination="{
        total: tableObject.total
      }"
      @expand-change="expandChange"
    >
      <template #expand> 展示活动商品和商品相关属性活动配置</template>
      <template #spuId="{ row }">
        <el-image
          :src="row.picUrl"
          class="w-30px h-30px align-middle mr-5px"
          @click="imagePreview(row.picUrl)"
        />
        <span class="align-middle">{{ row.spuName }}</span>
      </template>
      <template #configIds="{ row }">
        <el-tag v-for="(name, index) in convertSeckillConfigNames(row)" :key="index" class="mr-5px">
          {{ name }}
        </el-tag>
      </template>
      <template #action="{ row }">
        <el-button
          v-hasPermi="['promotion:seckill-activity:update']"
          link
          type="primary"
          @click="openForm('update', row.id)"
        >
          编辑
        </el-button>
        <el-button
          v-hasPermi="['promotion:seckill-activity:delete']"
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
  <SeckillActivityForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { allSchemas } from './seckillActivity.data'
import { getSimpleSeckillConfigList } from '@/api/mall/promotion/seckill/seckillConfig'
import * as SeckillActivityApi from '@/api/mall/promotion/seckill/seckillActivity'
import SeckillActivityForm from './SeckillActivityForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { sortTableColumns } from '@/hooks/web/useCrudSchemas'

defineOptions({ name: 'PromotionSeckillActivity' })

// tableObject：表格的属性对象，可获得分页大小、条数等属性
// tableMethods：表格的操作对象，可进行获得分页、删除记录等操作
// 详细可见：https://doc.iocoder.cn/vue3/crud-schema/
const { tableObject, tableMethods } = useTable({
  getListApi: SeckillActivityApi.getSeckillActivityPage, // 分页接口
  delListApi: SeckillActivityApi.deleteSeckillActivity // 删除接口
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

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

const configList = ref([]) // 时段配置精简列表
const convertSeckillConfigNames = computed(
  () => (row) =>
    configList.value
      ?.filter((item) => row.configIds.includes(item.id))
      ?.map((config) => config.name)
)

const expandChange = (row, expandedRows) => {
  // TODO puhui：等 CRUD 完事后弄
  console.log(row, expandedRows)
}

/** 初始化 **/
onMounted(async () => {
  // 获得活动列表
  sortTableColumns(allSchemas.tableColumns, 'spuId')
  await getList()
  // 获得秒杀时间段
  configList.value = await getSimpleSeckillConfigList()
})
</script>
