<!-- MES 编码规则分段列表 -->
<template>
  <ContentWrap>
    <el-button type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 新增分段
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="排序" align="center" prop="sort" width="80" />
      <el-table-column label="分段类型" align="center" prop="type" width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="长度" align="center" prop="length" width="80" />
      <el-table-column label="日期格式" align="center" prop="dateFormat" width="150" />
      <el-table-column label="固定字符" align="center" prop="fixCharacter" width="120" />
      <el-table-column label="流水号起始" align="center" prop="serialStartNo" width="100" />
      <el-table-column label="流水号步长" align="center" prop="serialStep" width="100" />
      <el-table-column label="是否循环" align="center" prop="cycleFlag" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.cycleFlag" />
        </template>
      </el-table-column>
      <el-table-column label="循环方式" align="center" prop="cycleMethod" width="120">
        <template #default="scope">
          <dict-tag
            v-if="scope.row.cycleFlag"
            :type="DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD"
            :value="scope.row.cycleMethod"
          />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <AutoCodePartForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { AutoCodePartApi, AutoCodePartVO } from '@/api/mes/md/autocode/part'
import AutoCodePartForm from './AutoCodePartForm.vue'

defineOptions({ name: 'AutoCodePartList' })

const message = useMessage()
const { t } = useI18n()

const props = defineProps({
  ruleId: {
    type: Number,
    required: true
  }
})

const loading = ref(true)
const list = ref<AutoCodePartVO[]>([])

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await AutoCodePartApi.getAutoCodePartListByRuleId(props.ruleId)
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id, props.ruleId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await AutoCodePartApi.deleteAutoCodePart(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  await getList()
})
</script>
