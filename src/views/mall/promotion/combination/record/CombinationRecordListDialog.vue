<template>
  <Dialog v-model="dialogVisible" title="拼团列表">
    <!-- 列表 -->
    <ContentWrap>
      <el-table v-loading="loading" :data="list">
        <el-table-column align="center" label="编号" prop="id" />
        <el-table-column align="center" label="头像" prop="avatar" />
        <el-table-column align="center" label="昵称" prop="nickname" />
        <el-table-column align="center" label="开团团长" prop="headId">
          <template #default="{ row }: { row: CombinationRecordApi.CombinationRecordVO }">
            {{ row.headId ? list.find((item) => item.id === row.headId)?.nickname : row.nickname }}
          </template>
        </el-table-column>
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="开团时间"
          prop="startTime"
          width="180"
        />
        <el-table-column
          align="center"
          label="拼团商品"
          prop="type"
          show-overflow-tooltip
          width="300"
        >
          <template #defaul="{ row }">
            <el-image
              :src="row.picUrl"
              class="mr-5px h-30px w-30px align-middle"
              @click="imagePreview(row.picUrl)"
            />
            <span class="align-middle">{{ row.spuName }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="几人团" prop="userSize" />
        <el-table-column align="center" label="参与人数" prop="userCount" />
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="参团时间"
          prop="createTime"
          width="180"
        />
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="结束时间"
          prop="endTime"
          width="180"
        />
        <el-table-column align="center" label="拼团状态" prop="status">
          <template #default="scope">
            <dict-tag
              :type="DICT_TYPE.PROMOTION_COMBINATION_RECORD_STATUS"
              :value="scope.row.status"
            />
          </template>
        </el-table-column>
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
  </Dialog>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as CombinationRecordApi from '@/api/mall/promotion/combination/combinationRecord'
import { DICT_TYPE } from '@/utils/dict'
import { createImageViewer } from '@/components/ImageViewer'

/** 助力列表 */
defineOptions({ name: 'CombinationRecordListDialog' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  headId: undefined
})

/** 打开弹窗 */
const dialogVisible = ref(false) // 弹窗的是否展示
const open = async (headId: any) => {
  dialogVisible.value = true
  queryParams.headId = headId
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CombinationRecordApi.getCombinationRecordPageByHeadId(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}
</script>
