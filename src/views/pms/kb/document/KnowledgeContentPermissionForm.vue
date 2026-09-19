<template>
  <Dialog v-model="dialogVisible" title="内容协作权限" width="820px">
    <div v-loading="formLoading">
      <el-alert :closable="false" class="!mb-16px" type="info">
        子文件夹和子文档默认继承同一套权限；知识库创建人和管理员始终拥有管理权限。
      </el-alert>

      <el-form label-width="100px">
        <el-form-item label="访问范围">
          <el-radio-group v-model="formData.openStatus">
            <el-radio-button :value="true">知识库内公开</el-radio-button>
            <el-radio-button :value="false">仅协作者可见</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="formData.openStatus" label="公开权限">
          <el-select v-model="formData.openLevel" class="!w-280px">
            <el-option
              v-for="option in getIntDictOptions(DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <div class="mb-8px flex items-center justify-between">
        <span class="font-600">协作者</span>
        <el-button @click="addMember">添加协作者</el-button>
      </div>
      <el-table :data="memberList">
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.ownerStatus" type="success">拥有者</el-tag>
            <el-select
              v-else
              v-model="scope.row.identityType"
              @change="handleIdentityTypeChange(scope.row)"
            >
              <el-option label="成员" :value="PmsKnowledgeContentIdentityType.USER" />
              <el-option label="部门" :value="PmsKnowledgeContentIdentityType.DEPT" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="协作者" min-width="250">
          <template #default="scope">
            <span v-if="scope.row.ownerStatus">{{ scope.row.userName }}</span>
            <UserSelectV2
              v-else-if="
                scope.row.identityType === PmsKnowledgeContentIdentityType.USER && libraryOpenStatus
              "
              v-model="scope.row.userId"
              :multiple="false"
              placeholder="请选择成员"
            />
            <el-select
              v-else-if="scope.row.identityType === PmsKnowledgeContentIdentityType.USER"
              v-model="scope.row.userId"
              class="!w-1/1"
              filterable
              placeholder="请选择知识库成员"
            >
              <el-option
                v-for="member in availableUserMembers"
                :key="member.userId"
                :label="member.nickname || `用户 ${member.userId}`"
                :value="member.userId"
              />
            </el-select>
            <DeptSelect
              v-else-if="libraryOpenStatus"
              v-model="scope.row.deptId"
              class="!w-1/1"
              placeholder="请选择部门"
            />
            <el-select
              v-else
              v-model="scope.row.deptId"
              class="!w-1/1"
              filterable
              placeholder="请选择知识库部门"
            >
              <el-option
                v-for="member in availableDeptMembers"
                :key="member.deptId"
                :label="member.deptName || `部门 ${member.deptId}`"
                :value="member.deptId"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="权限" width="170">
          <template #default="scope">
            <el-tag v-if="scope.row.ownerStatus" type="success">管理员</el-tag>
            <el-select v-else v-model="scope.row.level">
              <el-option
                v-for="option in getIntDictOptions(DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL)"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="scope">
            <el-button
              v-if="!scope.row.ownerStatus"
              link
              type="danger"
              @click="memberList.splice(scope.$index, 1)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeContentPermissionApi from '@/api/pms/kb/content/permission'
import * as KnowledgeLibraryApi from '@/api/pms/kb/library'
import * as KnowledgeLibraryMemberApi from '@/api/pms/kb/library/member'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import {
  PmsKnowledgeContentIdentityType,
  PmsKnowledgeContentLevel
} from '@/views/pms/kb/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'PmsKnowledgeContentPermissionForm' })

interface EditableMember
  extends KnowledgeContentPermissionApi.PmsKnowledgeContentPermissionMemberVO {
  identityType: PmsKnowledgeContentIdentityType
  ownerStatus?: boolean
}

const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单加载中
const creatorUserId = ref(0) // 权限拥有者用户编号
const libraryOpenStatus = ref(true) // 知识库是否公开
const libraryMembers = ref<KnowledgeLibraryMemberApi.PmsKnowledgeLibraryMemberVO[]>([]) // 私有知识库可选成员
const formData = reactive<KnowledgeContentPermissionApi.PmsKnowledgeContentPermissionVO>({
  id: 0,
  libraryId: 0,
  openStatus: true,
  openLevel: PmsKnowledgeContentLevel.PREVIEW as number,
  creatorUserId: 0,
  currentUserLevel: 0,
  members: [] as KnowledgeContentPermissionApi.PmsKnowledgeContentPermissionMemberVO[]
}) // 表单数据
const memberList = ref<EditableMember[]>([]) // 协作者列表
// 可选用户成员
const availableUserMembers = computed(() =>
  libraryMembers.value.filter(
    (
      member
    ): member is KnowledgeLibraryMemberApi.PmsKnowledgeLibraryMemberVO & {
      userId: number
    } => member.userId !== undefined && member.userId !== creatorUserId.value
  )
)
// 可选部门成员
const availableDeptMembers = computed(() =>
  libraryMembers.value.filter(
    (
      member
    ): member is KnowledgeLibraryMemberApi.PmsKnowledgeLibraryMemberVO & {
      deptId: number
    } => member.deptId !== undefined
  )
)

/** 打开弹窗 */
async function open(permissionId: number) {
  dialogVisible.value = true
  formLoading.value = true
  try {
    // 1. 查询内容权限
    const data = await KnowledgeContentPermissionApi.getKnowledgeContentPermission(permissionId)
    // 2. 并行加载知识库和成员上下文
    const [library, fetchedLibraryMembers] = await Promise.all([
      KnowledgeLibraryApi.getKnowledgeLibrary(data.libraryId),
      KnowledgeLibraryMemberApi.getKnowledgeLibraryMemberList(data.libraryId)
    ])
    // 3. 初始化权限表单和协作者列表
    Object.assign(formData, data)
    creatorUserId.value = data.creatorUserId
    libraryOpenStatus.value = library.openStatus
    libraryMembers.value = fetchedLibraryMembers
    memberList.value = data.members.map((member) => ({
      ...member,
      identityType: member.userId
        ? PmsKnowledgeContentIdentityType.USER
        : PmsKnowledgeContentIdentityType.DEPT,
      ownerStatus: member.userId === data.creatorUserId
    }))
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 添加成员 */
function addMember() {
  memberList.value.push({
    identityType: PmsKnowledgeContentIdentityType.USER,
    level: PmsKnowledgeContentLevel.PREVIEW
  })
}

/** 处理成员身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined
  member.deptId = undefined
}

/** 提交表单 */
async function submitForm() {
  // 1.1 校验协作者已选择用户或部门
  const editableMembers = memberList.value.filter((member) => !member.ownerStatus)
  if (
    editableMembers.some(
      (member) =>
        (member.identityType === PmsKnowledgeContentIdentityType.USER && !member.userId) ||
        (member.identityType === PmsKnowledgeContentIdentityType.DEPT && !member.deptId)
    )
  ) {
    message.warning('请选择协作成员或部门')
    return
  }
  // 1.2 校验用户和部门不能重复
  const userIds = editableMembers
    .filter((member) => member.identityType === PmsKnowledgeContentIdentityType.USER)
    .map((member) => member.userId)
  const deptIds = editableMembers
    .filter((member) => member.identityType === PmsKnowledgeContentIdentityType.DEPT)
    .map((member) => member.deptId)
  if (new Set(userIds).size !== userIds.length || new Set(deptIds).size !== deptIds.length) {
    message.warning('协作成员或部门不能重复')
    return
  }
  // 2. 提交权限更新请求
  formLoading.value = true
  try {
    const data: KnowledgeContentPermissionApi.PmsKnowledgeContentPermissionVO = {
      ...formData,
      members: editableMembers.map((member) => ({
        id: member.id,
        userId:
          member.identityType === PmsKnowledgeContentIdentityType.USER ? member.userId : undefined,
        deptId:
          member.identityType === PmsKnowledgeContentIdentityType.DEPT ? member.deptId : undefined,
        level: member.level
      }))
    }
    await KnowledgeContentPermissionApi.updateKnowledgeContentPermission(data)
    message.success('协作权限更新成功')
    // 3. 关闭弹窗并通知父组件刷新
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
