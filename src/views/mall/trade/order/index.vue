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
            :key="dict.value as string"
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
            :key="dict.value as string"
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
        <el-select class="!w-280px" v-model="queryParams.terminal" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TERMINAL)"
            :key="dict.value as string"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select class="!w-280px" v-model="queryParams.type" clearable placeholder="全部">
          <el-option
            v-for="dict in getStrDictOptions(DICT_TYPE.TRADE_ORDER_TYPE)"
            :key="dict.value as string"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="订单搜索">
        <el-input
          v-show="true"
          class="!w-280px"
          v-model="queryType.v"
          clearable
          placeholder="请输入"
        >
          <template #prepend>
            <el-select style="width: 110px" v-model="queryType.k" clearable placeholder="全部">
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
      <el-form-item>
        <el-button @click="handleQuery" v-hasPermi="['trade:order:query']">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery" v-hasPermi="['trade:order:query']">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <el-button type="success" plain @click="handleExport" :loading="exportLoading">
          <!--           v-hasPermi="['trade:order:export']"        -->
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
              '￥ ' +
              parseFloat((scope.row.originalPrice / 100) as unknown as string).toFixed(2) +
              ' 元'
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
      <el-table-column width="100" fixed="left">
        <template #header>
          <el-dropdown icon="eq:search" @command="handleDropType">
            <el-button link type="primary">全选({{ orderSelect.selectTotal }}) </el-button>

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
      <el-table-column label="用户信息" align="center" min-width="100">
        <template #default="scope">
          <el-button link type="primary" @click="goUserDetail(scope.row)"
            >{{ scope.row.userId }}{{ '[' + scope.row.user.nickname + ']' }}</el-button
          >
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="创建时间"
        prop="createTime"
        min-width="180"
      />
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
                <!-- TODO xiaobai: 是不是 (item.payPrice / 100.0).toFixed(2) -->
                <p>{{
                  '￥ ' +
                  parseFloat((item.payPrice / 100) as unknown as string).toFixed(2) +
                  '元 x ' +
                  item.count
                }}</p>
              </div>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="实际支付(元)" align="center" prop="payPrice" min-width="100">
        <template #default="scope">
          {{ '￥ ' + parseFloat((scope.row.payPrice / 100) as unknown as string).toFixed(2) }}
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
            v-if="scope.row.status !== ''"
            :type="DICT_TYPE.TRADE_ORDER_STATUS"
            :value="scope.row.status"
          />
          <span v-else>{{ scope.status }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" fixed="right" min-width="150">
        <template #default="scope">
          <!-- <el-button v-if="scope.row.status == '0'" link type="primary" @click="sendXX(scope.row)"
            >待支付</el-button> -->
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
import {
  TradeOrderPageReqVO,
  SelectType,
  TradeOrderPageItemRespVO
} from '@/api/mall/trade/order/type/orderType'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import download from '@/utils/download'

const message = useMessage()
const { push } = useRouter()
const imgViewVisible = ref(false) // 商品图预览
const imageViewerList = ref<string[]>([]) // 商品图预览列表
const queryFormRef = ref()
const loading = ref(false)
const exportLoading = ref(false)
const total = ref(0) // 总记录数
const list = ref<Array<TradeOrderPageItemRespVO | any>>([]) //表数据

// 选中状态选中处理
const orderSelect: SelectType = reactive({
  queryParams: {} as TradeOrderPageReqVO,
  selectTotal: 0,
  selectAllFlag: false,
  selectData: new Map<number, Set<string>>(),
  unSelectList: new Set<string>()
})

//表单搜索
const queryParams: TradeOrderPageReqVO = reactive({
  pageNo: 1, //首页
  pageSize: 10 //页面大小
})

const queryType = reactive({ k: '', v: '' }) // 订单搜索类型kv

/*
 * 订单搜索
 * 商品名称  商品件数 全部  需要后端支持TODO
 */
const searchList = ref([
  { value: 'no', label: '订单号' },
  { value: 'userId', label: '用户UID' },
  { value: 'userNickname', label: '用户昵称' },
  { value: 'userMobile', label: '用户电话' },
  { value: 'spuName', label: '商品名称TODO' },
  { value: 'itemCount', label: '商品件数TODO' }
])

/**

 当前页/？ 如果pageNo存在，则将但前数据全部按照单个选中模式取消 ,不存在，则新增全页 增加 Map.pageNo Map.roderNoList
 单个选中  如果pagelist存在，订单号选中状态取反，并对总数按选中状态加减。如果pagelist不存在，订单号选中状态取反，并对总数按选中状态加减，增加 Map.pageNo，
 如果当前Map.pageNo 所对应list 为空 ，清除pageNo
 * @param command ===1 当前页 选中 ===2 所有页面选中
 */
const handleDropType = (command: string) => {
  let i = 0
  //当前页按钮
  if (command === '1') {
    //如果该页面有选中数据 则选中事件触发时 取消该页面
    if (orderSelect.selectData && orderSelect.selectData.has(queryParams.pageNo)) {
      for (i = 0; i < list.value.length; i++) {
        if (orderSelect.selectData.get(queryParams.pageNo)!.has(list.value[i].id)) {
          //选中数量减少
          orderSelect.selectTotal -= 1
          //考虑全选中，针对某一页面选中当前页时 会将所有数据中去掉该页面， 需要登记到 orderSelect.unSelectList
          unSelectListRecord(list.value[i].id, 'add')
        }
        list.value[i]['itemSelect'] = false
      }
      orderSelect.selectData.delete(queryParams.pageNo) //移除该页面
    } else {
      //当前页选中状态中 默认全选中
      orderSelect.selectData.set(queryParams.pageNo, new Set<string>())
      for (i = 0; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = true
        orderSelect.selectData.get(queryParams.pageNo)!.add(list.value[i].id)
        //选中数量增加
        orderSelect.selectTotal += 1
        //对于登记过取消状态中的数据排除
        unSelectListRecord(list.value[i].id, 'del')
      }
    }
  }
  //所有页按钮
  if (command === '2') {
    orderSelect.selectAllFlag = !orderSelect.selectAllFlag

    if (orderSelect.selectAllFlag) {
      //打勾勾 //全选
      orderSelect.selectData?.set(queryParams.pageNo, new Set<string>())
      for (i = 0; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = true
        orderSelect.selectData?.get(queryParams.pageNo)?.add(list.value[i].id) //id是主键不重复
      }
      orderSelect.selectTotal = total.value
    } else {
      //取消勾勾
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = false
      }
      initSelect() //重置之前选中的类容清空
    }
  }
}

//对全选状态中的 单选或者当前页面单选时登记取消的数据
const unSelectListRecord = (id: string, op: string) => {
  if (!orderSelect.selectAllFlag) {
    return
  }
  if (op == 'add') {
    orderSelect.unSelectList.add(id)
  } else {
    orderSelect.unSelectList.delete(id)
  }
}
/***复选框选中 */
const handcheckclick = (row: any) => {
  if (row.itemSelect) {
    orderSelect.selectTotal += 1
    if (!orderSelect.selectData.has(queryParams.pageNo)) {
      orderSelect.selectData?.set(queryParams.pageNo, new Set<string>())
    }
    orderSelect.selectData?.get(queryParams.pageNo)?.add(row.id)
    unSelectListRecord(row.id, 'del')
  } else {
    orderSelect.selectTotal -= 1
    orderSelect.selectData.get(queryParams.pageNo)?.delete(row.id)
    unSelectListRecord(row.id, 'add')
  }
}
/**
 * 导出数据
 */

const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    //增加查询条件 用于全选时后台查询数据
    orderSelect.queryParams = queryParams

    // 发起导出
    exportLoading.value = true
    //全选时 根据上送的条件查询所有数据，在排除unseleectList 数据，
    //非全选时， 根据上送的selectData 直接查询数据 后台实现导出数据接口即可
    console.log(orderSelect)
    download.excel(orderSelect as any, '订单信息.xls') //?
  } catch {
  } finally {
    exportLoading.value = false
  }
  //TODO
  exportLoading.value = false
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryType.v = '' //重置
  queryType.k = ''
  //休眠0.1s 等待watch响应
  setTimeout(() => {
    initSelect() //重置对选中设置恢复初始状态
    handleQuery()
  }, 100)
}

/**选中状态初始化**/
const initSelect = () => {
  orderSelect.queryParams = {} as TradeOrderPageReqVO
  orderSelect.selectTotal = 0
  orderSelect.selectAllFlag = false
  orderSelect.selectData?.clear()
  orderSelect.unSelectList?.clear()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await TradeOrderApi.getOrderList(queryParams)
    list.value = data.list
    total.value = data.total
    let i = 0
    if (orderSelect.selectData && orderSelect.selectData.has(queryParams.pageNo)) {
      //该页面已经加载过了。直接按照之前状态设置选中状态值
      for (i = 0; i < list.value.length; i++) {
        if (orderSelect.selectData.get(queryParams.pageNo)!.has(list.value[i].id)) {
          list.value[i]['itemSelect'] = true //之前已经选取过了
        } else {
          list.value[i]['itemSelect'] = false
        }
      }
    } else if (orderSelect.selectAllFlag) {
      //全选状态中 首次加载页面 默认全部选中
      orderSelect.selectData.set(queryParams.pageNo, new Set<string>())
      for (i = 0; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = true
        orderSelect.selectData.get(queryParams.pageNo)!.add(list.value[i].id)
      }
    } else {
      //非全选状态中  首次加载默认非选中状态
      for (i; i < list.value.length; i++) {
        list.value[i]['itemSelect'] = false //设置状态为未选中状态
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

//针对订单搜索类型和值进行调整 使用监听器
watch(
  () => [queryType.k, queryType.v],
  ([newK, newV], [oldK]) => {
    //重置oldK对应得value
    if (oldK != newK) {
      if (oldK == 'no' && queryParams.no != '') {
        queryParams.no = ''
      } else if (oldK == 'userId' && queryParams.userId != '') {
        queryParams.userId = ''
      } else if (oldK == 'userNickname' && queryParams.userNickname != '') {
        queryParams.userNickname = ''
      } else if (oldK == 'userMobile' && queryParams.userMobile !== '') {
        queryParams.userMobile = ''
      } else if (oldK == 'spuName' && queryParams.spuName !== '') {
        queryParams.spuName = ''
      } else if (oldK == 'itemCount' && queryParams.itemCount !== '') {
        queryParams.itemCount = ''
      } else if (oldK == '' && queryParams.all !== '') {
        queryParams.all = ''
      }
    }
    // 根据选中得k设置Value
    if (newK == 'no') {
      queryParams.no = newV
    } else if (newK == 'userId') {
      queryParams.userId = newV
    } else if (newK == 'userNickname') {
      queryParams.userNickname = newV
    } else if (newK == 'userMobile') {
      queryParams.userMobile = newV
    } else if (newK == 'spuName') {
      queryParams.spuName = newV
    } else if (newK == 'itemCount') {
      queryParams.itemCount = newV
    } else if (newK == '') {
      queryParams.all = newV
    }
  }
)

/** 初始化 **/
onMounted(() => {
  initSelect()
  getList()
})
</script>
