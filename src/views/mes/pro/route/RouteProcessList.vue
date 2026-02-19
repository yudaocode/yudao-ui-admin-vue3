<!-- MES 工艺路线工序列表 -->
<template>
  <div>
    <!-- 操作栏 -->
    <el-row class="mb-10px">
      <el-button type="primary" plain @click="openForm('create')">
        <Icon icon="ep:plus" class="mr-5px" /> 添加工序
      </el-button>
    </el-row>
    <!-- 列表 -->
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" align="center" prop="sort" width="70" />
      <el-table-column label="工序编码" align="center" prop="processCode" width="120" />
      <el-table-column label="工序名称" align="center" prop="processName" width="120" />
      <el-table-column label="下一道工序" align="center" prop="nextProcessName" width="120" />
      <el-table-column label="工序关系" align="center" prop="linkType" width="130">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_PRO_LINK_TYPE" :value="scope.row.linkType" />
        </template>
      </el-table-column>
      <el-table-column label="关键工序" align="center" prop="keyFlag" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.keyFlag ? 'danger' : 'info'" size="small">
            {{ scope.row.keyFlag ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="质检工序" align="center" prop="checkFlag" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.checkFlag ? 'warning' : 'info'" size="small">
            {{ scope.row.checkFlag ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="准备时间" align="center" prop="prepareTime" width="90">
        <template #default="scope">
          {{ scope.row.prepareTime ? scope.row.prepareTime + '分钟' : '' }}
        </template>
      </el-table-column>
      <el-table-column label="等待时间" align="center" prop="waitTime" width="90">
        <template #default="scope">
          {{ scope.row.waitTime ? scope.row.waitTime + '分钟' : '' }}
        </template>
      </el-table-column>
      <el-table-column label="颜色" align="center" prop="colorCode" width="70">
        <template #default="scope">
          <div
            v-if="scope.row.colorCode"
            :style="{
              backgroundColor: scope.row.colorCode,
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              margin: '0 auto'
            }"
          ></div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单弹窗：添加/修改 -->
    <Dialog :title="formTitle" v-model="formVisible" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="序号" prop="sort">
              <el-input-number v-model="formData.sort" :min="1" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序" prop="processId">
              <el-select v-model="formData.processId" placeholder="请选择工序" filterable>
                <el-option
                  v-for="item in processList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序关系" prop="linkType">
              <el-select v-model="formData.linkType" placeholder="请选择">
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_LINK_TYPE)"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色" prop="colorCode">
              <el-color-picker v-model="formData.colorCode" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关键工序" prop="keyFlag">
              <el-switch v-model="formData.keyFlag" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质检工序" prop="checkFlag">
              <el-switch v-model="formData.checkFlag" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="准备时间" prop="prepareTime">
              <el-input-number v-model="formData.prepareTime" :min="0" controls-position="right" />
              <span class="ml-5px">分钟</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等待时间" prop="waitTime">
              <el-input-number v-model="formData.waitTime" :min="0" controls-position="right" />
              <span class="ml-5px">分钟</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm" :loading="formLoading">确 定</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { ProRouteProcessApi, ProRouteProcessVO } from '@/api/mes/pro/route/process'
import { ProProcessApi } from '@/api/mes/pro/process'

defineOptions({ name: 'RouteProcessList' })

const props = defineProps<{
  routeId: number
}>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(false) // 列表的加载中
const list = ref<ProRouteProcessVO[]>([]) // 列表的数据
const processList = ref<any[]>([]) // 工序下拉列表

// 表单相关
const formVisible = ref(false) // 表单弹窗的是否展示
const formTitle = ref('') // 表单弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formRef = ref() // 表单 Ref
const formData = ref<any>({}) // 表单数据
const formRules = reactive({
  sort: [{ required: true, message: '序号不能为空', trigger: 'blur' }],
  processId: [{ required: true, message: '工序不能为空', trigger: 'change' }],
  linkType: [{ required: true, message: '工序关系不能为空', trigger: 'change' }]
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await ProRouteProcessApi.getRouteProcessListByRoute(props.routeId)
  } finally {
    loading.value = false
  }
}

/** 加载工序列表 */
const loadProcessList = async () => {
  processList.value = await ProProcessApi.getProcessSimpleList()
}

/** 添加/修改操作 */
const openForm = (type: string, row?: ProRouteProcessVO) => {
  formVisible.value = true
  formTitle.value = type === 'create' ? '添加工序' : '编辑工序'
  formType.value = type
  if (type === 'create') {
    const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
    formData.value = {
      routeId: props.routeId,
      sort: maxSort + 1,
      linkType: 3,
      colorCode: '#00AEF3',
      keyFlag: false,
      checkFlag: false,
      prepareTime: 0,
      waitTime: 0
    }
  } else {
    formData.value = { ...row }
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const submitForm = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ProRouteProcessApi.createRouteProcess(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProRouteProcessApi.updateRouteProcess(formData.value)
      message.success(t('common.updateSuccess'))
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProRouteProcessApi.deleteRouteProcess(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 监听路线编号变化 */
watch(
  () => props.routeId,
  (val) => {
    if (val) {
      getList()
    }
  },
  { immediate: true }
)

/** 初始化 */
onMounted(() => {
  loadProcessList()
})
</script>
