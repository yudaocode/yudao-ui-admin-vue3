<template>
  <!-- 操作栏 -->
  <el-row v-if="showAction" justify="end">
    <el-button v-if="validateOwnerUser" type="primary" @click="openForm">
      <Icon class="mr-5px" icon="ep:plus" />
      新增
    </el-button>
    <el-button v-if="validateOwnerUser" @click="handleUpdate">
      <Icon class="mr-5px" icon="ep:edit" />
      编辑
    </el-button>
    <el-button v-if="validateOwnerUser" @click="handleDelete">
      <Icon class="mr-5px" icon="ep:delete" />
      移除
    </el-button>
    <el-button v-if="!validateOwnerUser && list.length > 0" type="danger" @click="handleQuit">
      退出团队
    </el-button>
  </el-row>
  <!-- 团队成员展示 -->
  <el-table
    ref="elTableRef"
    v-loading="loading"
    :data="list"
    :show-overflow-tooltip="true"
    :stripe="true"
    class="mt-20px"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" />
    <el-table-column align="center" label="姓名" prop="nickname" />
    <el-table-column align="center" label="部门" prop="deptName" />
    <el-table-column align="center" label="岗位" prop="postNames" />
    <el-table-column align="center" label="权限级别" prop="level">
      <template #default="{ row }">
        <dict-tag :type="DICT_TYPE.CRM_PERMISSION_LEVEL" :value="row.level" />
      </template>
    </el-table-column>
    <el-table-column :formatter="dateFormatter" align="center" label="加入时间" prop="createTime" />
  </el-table>

  <!-- 表单弹窗：添加/修改 -->
  <CrmPermissionForm ref="formRef" @success="getList" />
</template>
<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import { ElTable } from 'element-plus'
import * as PermissionApi from '@/api/crm/permission'
import { useUserStoreWithOut } from '@/store/modules/user'
import CrmPermissionForm from './PermissionForm.vue'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'CrmPermissionList' })

const message = useMessage() // 消息

const props = defineProps<{
  bizType: number // 模块类型
  bizId: number | undefined // 模块数据编号
  showAction: boolean //是否展示操作按钮
}>()
const loading = ref(true) // 列表的加载中
const list = ref<PermissionApi.PermissionVO[]>([]) // 列表的数据
const formData = ref({
  ownerUserId: 0
})
const userStore = useUserStoreWithOut() // 用户信息缓存

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await PermissionApi.getPermissionList({
      bizType: props.bizType,
      bizId: props.bizId
    })
    list.value = data
    const permission = list.value.find(
      (item) =>
        item.userId === userStore.getUser.id &&
        item.level === PermissionApi.PermissionLevelEnum.OWNER
    )
    if (permission) {
      formData.value.ownerUserId = userStore.getUser.id
    }
  } finally {
    loading.value = false
  }
}
const multipleSelection = ref<PermissionApi.PermissionVO[]>([]) // 选择的团队成员
const elTableRef = ref<InstanceType<typeof ElTable>>()
const handleSelectionChange = (val: PermissionApi.PermissionVO[]) => {
  if (val.findIndex((item) => item.level === PermissionApi.PermissionLevelEnum.OWNER) !== -1) {
    message.warning('不能选择负责人！')
    elTableRef.value?.clearSelection()
    return
  }
  multipleSelection.value = val
}

/** 编辑团队成员 */
const formRef = ref<InstanceType<typeof CrmPermissionForm>>() // 权限表单 Ref
const handleUpdate = () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  if (multipleSelection.value?.length > 1) {
    message.warning('编辑团队成员时只能选择一个！')
    return
  }
  formRef.value?.open0(
    'update',
    props.bizType,
    props.bizId!,
    multipleSelection.value[0].id!,
    multipleSelection.value[0].level
  )
}

/** 移除团队成员 */
const handleDelete = async () => {
  if (multipleSelection.value?.length === 0) {
    message.warning('请先选择团队成员后操作！')
    return
  }
  await message.delConfirm()
  const ids = multipleSelection.value?.map((item) => item.id) as unknown as number[]
  await PermissionApi.deletePermissionBatch(ids)
  message.success('移除团队成员成功！')
  await getList()
}

/** 添加团队成员 */
const openForm = () => {
  formRef.value?.open('create', props.bizType, props.bizId!)
}

// 校验负责人权限和编辑权限
const validateOwnerUser = ref(false)
const validateWrite = ref(false)
const isPool = ref(false)
watch(
  list,
  (newArr) => {
    isPool.value = false
    if (newArr?.length > 0) {
      isPool.value = !list.value.some(
        (item) => item.level === PermissionApi.PermissionLevelEnum.OWNER
      )
      validateOwnerUser.value = false
      validateWrite.value = false
      const userId = userStore.getUser?.id
      list.value
        .filter((item) => item.userId === userId)
        .forEach((item) => {
          if (item.level === PermissionApi.PermissionLevelEnum.OWNER) {
            validateOwnerUser.value = true
            validateWrite.value = true
          } else if (item.level === PermissionApi.PermissionLevelEnum.WRITE) {
            validateWrite.value = true
          }
        })
    } else {
      isPool.value = true
    }
  },
  {
    immediate: true
  }
)

defineExpose({ openForm, validateOwnerUser, validateWrite, isPool })
const emits = defineEmits<{
  (e: 'quitTeam'): void
}>()
/** 退出团队 */
const handleQuit = async () => {
  const permission = list.value.find(
    (item) =>
      item.userId === userStore.getUser.id && item.level === PermissionApi.PermissionLevelEnum.OWNER
  )
  if (permission) {
    message.warning('负责人不能退出团队！')
    return
  }
  const userPermission = list.value.find((item) => item.userId === userStore.getUser.id)
  if (!userPermission) {
    return
  }
  await PermissionApi.deleteSelfPermission(userPermission.id!)
  message.success('退出团队成员成功！')
  emits('quitTeam')
}

watch(
  () => props.bizId,
  (bizId) => {
    if (!bizId) {
      return
    }
    getList()
  },
  { immediate: true, deep: true }
)
</script>
