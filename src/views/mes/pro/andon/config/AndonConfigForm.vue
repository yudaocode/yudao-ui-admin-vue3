<!-- 安灯呼叫配置弹窗（内联编辑表格） -->
<template>
  <Dialog title="安灯呼叫设置" v-model="dialogVisible" width="900px">
    <div class="mb-10px">
      <el-button
        type="primary"
        plain
        @click="handleAdd"
        v-hasPermi="['mes:pro-andon-config:create']"
      >
        <Icon icon="ep:plus" class="mr-5px" /> 新增配置
      </el-button>
    </div>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="呼叫原因" align="center" min-width="200">
        <template #default="scope">
          <el-input
            v-if="scope.row.editing"
            v-model="scope.row.reason"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 3 }"
            placeholder="请输入呼叫原因"
          />
          <span v-else>{{ scope.row.reason }}</span>
        </template>
      </el-table-column>
      <el-table-column label="级别" align="center" width="120">
        <template #default="scope">
          <el-select v-if="scope.row.editing" v-model="scope.row.level" placeholder="请选择级别">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_ANDON_LEVEL)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
          <dict-tag v-else :type="DICT_TYPE.MES_PRO_ANDON_LEVEL" :value="scope.row.level" />
        </template>
      </el-table-column>
      <el-table-column label="处置人" align="center" width="200">
        <template #default="scope">
          <UserSelect
            v-if="scope.row.editing"
            v-model="scope.row.handlerUserId"
            placeholder="请选择处置人"
          />
          <span v-else>{{ scope.row.handlerUserNickname || scope.row.handlerUserId || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" width="150">
        <template #default="scope">
          <el-input
            v-if="scope.row.editing"
            v-model="scope.row.remark"
            placeholder="请输入备注"
          />
          <span v-else>{{ scope.row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <template v-if="scope.row.editing">
            <el-button link type="success" @click="handleSave(scope.row)">保存</el-button>
            <el-button link type="info" @click="handleCancel(scope.row, scope.$index)">
              取消
            </el-button>
          </template>
          <template v-else>
            <el-button
              link
              type="primary"
              @click="handleEdit(scope.row)"
              v-hasPermi="['mes:pro-andon-config:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['mes:pro-andon-config:delete']"
            >
              删除
            </el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>
  </Dialog>
</template>

<script setup lang="ts">
import { ProAndonConfigApi, ProAndonConfigVO } from '@/api/mes/pro/andon/config'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesProAndonLevelEnum } from '@/views/mes/utils/constants'
import UserSelect from '@/views/system/user/components/UserSelect.vue'

/** 安灯呼叫配置弹窗（内联编辑表格） */
defineOptions({ name: 'AndonConfigDialog' })

const message = useMessage()
const { t } = useI18n()

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 列表的加载中
const list = ref<any[]>([]) // 配置列表

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  await getList()
}
defineExpose({ open })

/** 加载列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProAndonConfigApi.getAndonConfigList()
    list.value = data.map((item: ProAndonConfigVO) => ({ ...item, editing: false }))
  } finally {
    loading.value = false
  }
}

/** 新增行 */
const handleAdd = () => {
  list.value.unshift({
    id: undefined,
    reason: '',
    level: MesProAndonLevelEnum.LEVEL3,
    handlerRoleId: undefined,
    handlerUserId: undefined,
    remark: '',
    editing: true,
    isNew: true
  })
}

/** 编辑行 */
const handleEdit = (row: any) => {
  row._backup = { ...row }
  row.editing = true
}

/** 保存行 */
const handleSave = async (row: any) => {
  if (!row.reason) {
    message.warning('呼叫原因不能为空')
    return
  }
  if (!row.level) {
    message.warning('级别不能为空')
    return
  }
  try {
    if (row.isNew) {
      await ProAndonConfigApi.createAndonConfig(row)
      message.success(t('common.createSuccess'))
    } else {
      await ProAndonConfigApi.updateAndonConfig(row)
      message.success(t('common.updateSuccess'))
    }
    await getList()
  } catch {}
}

/** 取消编辑 */
const handleCancel = (row: any, index: number) => {
  if (row.isNew) {
    list.value.splice(index, 1)
  } else {
    Object.assign(row, row._backup)
    row.editing = false
  }
}

/** 删除行 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProAndonConfigApi.deleteAndonConfig(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}
</script>
