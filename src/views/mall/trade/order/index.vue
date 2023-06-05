<template>
  <!-- 搜索 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
      :inline="true"
    >
      <el-form-item label="订单状态" prop="status">
        <el-select class="!w-280px" v-model="queryParams.status" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="支付方式" prop="payChannelCode">
        <el-select
          v-model="queryParams.payChannelCode"
          class="!w-280px"
          clearable
          placeholder="全部"
        >
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-280px"
          start-placeholder="自定义时间"
          end-placeholder="自定义时间"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="订单来源" prop="terminal">
        <el-select class="!w-280px" v-model="queryParams.terminal" clearable placeholder="全部TODO">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TERMINAL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select class="!w-280px" v-model="queryParams.type" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="订单搜索" prop="searchValue">
        <!-- 双item绑定2个变量用于reset时没法重置 -->
        <el-form-item class="!w-280px" prop="searchType">
          <el-input
            class="!w-280px"
            v-model="queryParams.searchValue"
            clearable
            placeholder="请输入TODO"
          >
            <template #prepend>
              <el-select
                style="width: 100px"
                v-model="queryParams.searchType"
                clearable
                placeholder="全部"
              >
                <el-option
                  v-for="dict in searchList"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <!-- v-hasPermi="['trade:order:export']"
           需要将选中的数据存入orderSelect.multipleSelection中 
          需要考虑全选时数据如何处理-->
        <el-button type="success" plain @click="handleExport" :loading="exportLoading">
          <Icon icon="ep:download" class="mr-5px" /> 导出TODO
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 表格 -->
  <ContentWrap>
    <!-- 表单 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column type="expand" fixed="left">
        <template #default="scope">
          <el-descriptions class="mx-40">
            <el-descriptions-item label="商品原价(总): ">{{
              '￥ ' + parseFloat(scope.row.originalPrice / 100).toFixed(2) + ' 元'
            }}</el-descriptions-item>
            <el-descriptions-item label="下单时间: ">
              {{ formatDate(scope.row.createTime) }}</el-descriptions-item
            >
            <el-descriptions-item label="推广人: ">TODO</el-descriptions-item>
            <el-descriptions-item label="用户备注: ">{{
              scope.row.userRemark
            }}</el-descriptions-item>
            <el-descriptions-item label="商家备注: ">{{ scope.row.remark }}</el-descriptions-item>
          </el-descriptions>
        </template>
      </el-table-column>
      <!-- <el-table-column label="全选" type="selection" width="55" fixed="left">x</el-table-column> -->
      <el-table-column width="100" fixed="left">
        <template #header>
          <el-dropdown icon="eq:search" @command="handleDropType">
            <el-button link type="primary">全选({{ orderSelect.checkTotal }}) </el-button>

            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="1">当前页</el-dropdown-item>
                <el-dropdown-item command="2">所有页</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #default="scope">
          <el-checkbox v-model="scope.row.itemSelect" @change="handcheckclick(scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="订单号" align="center" min-width="110">
        <template #default="scope">
          <el-button link type="primary" @click="showOrderDetail(scope.row)">{{
            scope.row.no
          }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="订单类型" align="center" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.TRADE_ORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>

      <el-table-column label="订单来源" align="center" min-width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.terminal"
            :type="DICT_TYPE.TERMINAL"
            :value="scope.row.terminal"
          />
          <span v-else>{{ scope.terminal }}</span>
        </template>
      </el-table-column>

      <el-table-column label="用户信息(id)" align="center" min-width="100">
        <template #default="scope">
          <el-button link type="primary" @click="goUserDetail(scope.row)">{{
            scope.row.userId
          }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="商品信息" align="left" min-width="200" prop="items">
        <template #default="scope">
          <el-popover
            ref="popover"
            placement="bottom"
            :title="'订单:' + scope.row.no"
            :width="400"
            trigger="hover"
          >
            <template #reference>
              <div>
                <div v-for="item in scope.row.items" :key="item">
                  <el-image
                    style="width: 36px; height: 36px"
                    :src="item.picUrl"
                    :preview-src-list="[item.picUrl]"
                    fit="cover"
                    @click="imagePreview(item.picUrl)"
                  />
                  <span class="m-2">{{ item.spuName }}</span>
                </div>
              </div>
            </template>
            <div v-for="item in scope.row.items" :key="item">
              <div>
                <p>{{ item.spuName }}</p>
                <p>{{
                  '￥ ' + parseFloat(item.payPrice / 100).toFixed(2) + '元 x ' + item.count
                }}</p>
              </div>
            </div>
          </el-popover>
        </template>
      </el-table-column>

      <el-table-column label="实际支付(元)" align="center" prop="payPrice" min-width="100">
        <template #default="scope">
          {{ '￥ ' + parseFloat(scope.row.payPrice / 100).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="支付时间"
        prop="payTime"
        min-width="180"
      />
      <el-table-column label="支付类型" align="center" min-width="100" prop="payChannelCode">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.payChannelCode"
            :type="DICT_TYPE.PAY_CHANNEL_CODE_TYPE"
            :value="scope.row.payChannelCode"
          />
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="status" min-width="100">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.status == ''"
            :type="DICT_TYPE.TRADE_ORDER_STATUS"
            :value="scope.row.status"
          />
          <span v-else>{{ scope.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" min-width="150">
        <template #default="scope">
          <el-button v-if="scope.row.status == '0'" link type="primary" @click="sendXX(scope.row)"
            >待支付</el-button
          >
          <el-button v-if="scope.row.status == '10'" link type="primary" @click="sendXX(scope.row)"
            >发货</el-button
          >
          <el-button link type="primary" @click="showOrderDetail(scope.row)">详情</el-button>
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
  <el-image-viewer
    v-if="imgViewVisible"
    :url-list="imageViewerList"
    @close="imgViewVisible = false"
  />
</template>
<script setup lang="ts" name="OrderList">
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import * as TradeOrderApi from '@/api/mall/trade/order'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
// import TradeOrderDetail from './tradeOrderDetail.vue'
interface CurrentType {
  checkTotal: number //选中的数量
  currentType: string //页面选中类型, 0-noPage无选中页面 1-currentPage 当前页面 2-allPage所有页面
  selectAll: boolean //全选标识
  multipleSelection: [] // 选中的数据  暂未记录,需考虑全选时数据应该如何处理 ,部分选中可以使用该数据,需要登记
  pageNoList: [] //当前页面选中的页号 如果再次选中当前页将取消本页面的选中数据 全选时 将所有的页面list 都放进去 再次全选时 全部清空
}
const orderSelect: CurrentType = reactive({
  checkTotal: 0,
  currentType: '0',
  selectAll: false,
  multipleSelection: [],
  pageNoList: []
})

const message = useMessage()

const { push } = useRouter()
const queryFormRef = ref() //表单搜索
const queryParams = ref({
  pageNo: 1, //首页
  pageSize: 10, //页面大小
  tabIndex: 0 //详情页面数据
})

const loading = ref(false)
const exportLoading = ref(false)
// 总记录数
const total = ref(0)

//表数据
const list = ref<any>([])
//订单搜索
const searchList = ref([
  {
    value: 'orderNo',
    label: '订单号'
  },
  {
    value: 'userId',
    label: '用户UID'
  },
  {
    value: 'userName',
    label: '用户姓名'
  },
  {
    value: 'userTel',
    label: '用户电话'
  },
  {
    value: 'itemName',
    label: '商品名称'
  },
  {
    value: 'itemCount',
    label: '商品件数'
  }
])

const imgViewVisible = ref(false) // 商品图预览

const imageViewerList = ref<string[]>([]) // 商品图预览列表

/**当前页 所有页  暂不考虑数据本地化 会导致选中当前页 从后台重新拉取数据时出现数据不一致*/
const handleDropType = (command: string) => {
  orderSelect.currentType = command
  let i = 0
  if (command === '1') {
    // pageNoList 当前页面选中的页号 如果再次选中当前页将取消本页面的选中数据
    //取消本页面记录
    var index = orderSelect.pageNoList.indexOf(queryParams.value.pageNo)
    if (index > -1) {
      for (i; i < list.value.length; i++) {
        if (list.value[i]['itemSelect'] === true) {
          list.value[i]['itemSelect'] = false
          orderSelect.checkTotal = orderSelect.checkTotal - 1
        }
      }
      orderSelect.pageNoList.splice(index, 1)
    } else {
      for (i; i < list.value.length; i++) {
        if (list.value[i]['itemSelect'] === false) {
          list.value[i]['itemSelect'] = true
          orderSelect.checkTotal = orderSelect.checkTotal + 1
        }
      }
      orderSelect.pageNoList.splice(0, 0, queryParams.value.pageNo)
    }
  }
  if (command === '2') {
    orderSelect.selectAll = !orderSelect.selectAll
    //全选时 将所有的页面list 都放进去 再次全选时 全部清空
    if (orderSelect.selectAll) {
      //打勾勾
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = true
      }
      // 初始化页面数组
      const array1: [] = Array.from(
        { length: total.value / queryParams.value.pageSize + 1 },
        (item, idx) => idx + 1
      )
      orderSelect.pageNoList = [] //清空原有的
      orderSelect.pageNoList = [].concat(array1)
      orderSelect.checkTotal = total.value
    } else {
      //取消勾勾
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = false
      }
      orderSelect.pageNoList = [] //清空
      orderSelect.checkTotal = 0
    }
  }
}
/***复选框选中 */
const handcheckclick = (row: any) => {
  //选中增加1
  if (!row.itemSelect) {
    // 取消 -1
    orderSelect.checkTotal = orderSelect.checkTotal - 1
    //
  } else {
    //选中 +1
    orderSelect.checkTotal = orderSelect.checkTotal + 1
  }
}
/**
 * 导出数据
 */

const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    //TODO导出的数据是后台导出还是从前端中获取数据(全选时数据怎么打印?)
    download.excel(orderSelect.multipleSelection as any, '订单信息.xls') //
  } catch {
  } finally {
    exportLoading.value = false
  }
  //TODO
  exportLoading.value = false
}

/** 搜索按钮操作 */
const handleQuery = () => {
  //选中状态初始化
  orderSelect.checkTotal = 0
  orderSelect.currentType = '0'
  orderSelect.multipleSelection = []
  orderSelect.pageNoList = []
  orderSelect.selectAll = false

  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  //选中状态初始化
  orderSelect.checkTotal = 0
  orderSelect.currentType = '0'
  orderSelect.multipleSelection = []
  orderSelect.pageNoList = []
  orderSelect.selectAll = false

  queryFormRef.value.resetFields()
  handleQuery()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await TradeOrderApi.getOrderList(queryParams.value)
    list.value = data.list
    total.value = data.total

    let i = 0
    //给数组添加选中属性 itemSelect 默认为false 当前状态如果时全选 则新加载的页面都为选中状态
    if (
      orderSelect.currentType === '2' || //全选状态加载状态设置为选中
      orderSelect.pageNoList.indexOf(queryParams.value.pageNo) > -1 //已选择页面加载状态设置为默认选中，会存在选中当前页面后手动取消该页面部分数据，再重新加载该页面时设置为选中状态，但是没有增加选中的数量
    ) {
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = true
      }
    } else {
      //还需要判断当前页面是否已经选中了? 而且还要出来选中的数据是否后来手动一行行取消了处理
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = false //暂定为未选中状态, 实际情况需要考虑已选中状态,后期优化
      }
    }
  } finally {
    loading.value = false
  }
}

/**
 * 跳转订单详情
 */
const showOrderDetail = (row: any) => {
  console.log('TODO Order Detail: ' + row.id)
  push({ name: 'TradeOrderDetail', query: { id: row.id } })
}

/**
 * 跳转用户详情
 */
const goUserDetail = (row: any) => {
  console.log('TODO User Detail: ' + row.userId)
}
/**
 * 发货
 */
const sendXX = (row: any) => {
  console.log('TODO Send XX: ' + row.no)
}

/**
 * 商品图预览
 * @param imgUrl
 */
const imagePreview = (imgUrl: string) => {
  imageViewerList.value = [imgUrl]
  imgViewVisible.value = true
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
