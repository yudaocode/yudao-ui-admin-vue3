<template>
  <ContentWrap>
    <el-table :data="contract.products" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column
        align="center"
        label="产品名称"
        fixed="left"
        prop="productName"
        min-width="160"
      >
        <template #default="scope">
          {{ scope.row.productName }}
        </template>
      </el-table-column>
      <el-table-column label="产品条码" align="center" prop="productNo" min-width="120" />
      <el-table-column align="center" label="产品单位" prop="productUnit" min-width="160">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.CRM_PRODUCT_UNIT" :value="row.productUnit" />
        </template>
      </el-table-column>
      <el-table-column
        label="产品价格（元）"
        align="center"
        prop="productPrice"
        min-width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        label="合同价格（元）"
        align="center"
        prop="contractPrice"
        min-width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        align="center"
        label="数量"
        prop="count"
        min-width="100px"
        :formatter="erpPriceTableColumnFormatter"
      />
      <el-table-column
        label="合计金额（元）"
        align="center"
        prop="totalPrice"
        min-width="140"
        :formatter="erpPriceTableColumnFormatter"
      />
    </el-table>
    <el-row class="mt-10px" justify="end">
      <el-col :span="3"> 整单折扣：{{ erpPriceInputFormatter(contract.discountPercent) }}% </el-col>
      <el-col :span="4">
        产品总金额：{{ erpPriceInputFormatter(contract.totalProductPrice) }} 元
      </el-col>
    </el-row>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as ContractApi from '@/api/crm/contract'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'

const { contract } = defineProps<{
  contract: ContractApi.ContractVO
}>()
</script>
