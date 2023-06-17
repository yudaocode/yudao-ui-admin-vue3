<template>
  <el-drawer v-model="drawerVisiable" width="50%">
    <el-form inline="true">
      <el-form-item>
        <div>
          <span text="普通订单:">普通订单:</span>
          <span text="订单号: ">1111112546</span>
        </div>
      </el-form-item>
      <el-form-item> <el-button type="primary" icon="search">发送货</el-button></el-form-item>
      <el-form-item><el-button type="success" icon="search">小票打印</el-button> </el-form-item>
      <el-form-item>
        <el-dropdown @command="handleCommand">
          <el-button> ... </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="remark">订单备注</el-dropdown-item>
              <el-dropdown-item command="b">立即退款</el-dropdown-item>
              <el-dropdown-item command="print">打印配货单</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>
    </el-form>

    <el-descriptions class="m-10" direction="vertical" column="4">
      <el-descriptions-item label="订单状态">未发货TODO</el-descriptions-item>
      <el-descriptions-item label="实际支付">1000 元 TODO</el-descriptions-item>
      <el-descriptions-item label="支付方式">手机支付</el-descriptions-item>
      <el-descriptions-item label="支付时间"> {{ formatDate(Date()) }}</el-descriptions-item>
    </el-descriptions>
    <el-tabs @tab-click="handleClick">
      <el-tab-pane label="订单信息">
        <el-descriptions title="订单信息">
          <el-descriptions-item label="用户UID: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="用户昵称: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="绑定电话: ">Suzhou</el-descriptions-item>
        </el-descriptions>
        <el-divider border-style="dashed" />
        <el-descriptions title="收货信息" column="1">
          <el-descriptions-item label="收货人: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="收货电话: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="收货地址: ">{{ detailData }}</el-descriptions-item>
        </el-descriptions>
        <el-divider border-style="dashed" />
        <el-descriptions title="供应商信息">
          <el-descriptions-item label="供应商: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="供应商姓名: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="联系方式: ">Suzhou</el-descriptions-item>
          <el-descriptions-item label="供应商邮箱: ">Suzhou</el-descriptions-item>
        </el-descriptions>
        <el-divider border-style="dashed" />
        <el-descriptions title="订单信息">
          <el-descriptions-item label="创建时间: "> {{ formatDate(Date()) }} </el-descriptions-item>
          <el-descriptions-item label="商品总数: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="商品总价: ￥">200.00 元</el-descriptions-item>
          <el-descriptions-item label="优惠券金额: ￥">200.00 元</el-descriptions-item>
          <el-descriptions-item label="积分抵扣: ">200.00</el-descriptions-item>
          <el-descriptions-item label="支付邮费: ￥">200.00 元</el-descriptions-item>
          <el-descriptions-item label="会员商品优惠: ￥">200.00 元</el-descriptions-item>
          <el-descriptions-item label="推广人: ￥">200.00 元</el-descriptions-item>
          <el-descriptions-item label="支付时间: "> {{ formatDate(Date()) }} </el-descriptions-item>
          <el-descriptions-item label="支付方式: ￥">200.00 元</el-descriptions-item>
        </el-descriptions>
        <el-divider v-if="true" border-style="dashed" />
        <el-descriptions v-if="true" title="订单备注">
          <el-descriptions-item label="备注: ">TODO</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="商品信息">
        <el-descriptions title="商品信息">
          <el-descriptions-item label="用户UID: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="用户昵称: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="绑定电话: ">Suzhou</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="订单记录">
        <el-descriptions title="订单记录">
          <el-descriptions-item label="用户UID: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="用户昵称: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="绑定电话: ">Suzhou</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="发货记录">
        <el-descriptions title="发货记录">
          <el-descriptions-item label="用户UID: ">kooriookami</el-descriptions-item>
          <el-descriptions-item label="用户昵称: ">18100000000</el-descriptions-item>
          <el-descriptions-item label="绑定电话: ">Suzhou</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </el-drawer>
</template>
<script lang="ts" name="tradeOrderDetail-crmeb" setup>
import { formatDate } from '@/utils/formatTime'
import * as TradeOrderApi from '@/api/mall/trade/order'
const message = useMessage() // 消息弹窗

const drawerVisiable = ref(false)
let detailData = reactive<any>({
  items: [],
  user: {}
}) //详情数据

const handleClick = () => {}

const handleCommand = (command: string) => {
  console.log(command)
}
//暂考虑一次性加载详情页面所有数据
const queryDetail = async (no: string) => {
  try {
    const res = await TradeOrderApi.getOrderDetail(no)
    console.log(res)
    detailData.value = res
    console.log(detailData.value)
  } catch {
    message.error('获取详情数据失败')
  }
}

//显示详情
const show = async (no: string) => {
  drawerVisiable.value = true
  try {
    queryDetail(no)
  } finally {
  }
}

defineExpose({ show }) //显示详情方法
</script>
<style>
.el-dropdown-link {
  cursor: pointer;
  color: #409eff;
}
.el-icon-arrow-down {
  font-size: 12px;
}
</style>
