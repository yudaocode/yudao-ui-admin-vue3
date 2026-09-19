<template>
  <Dialog v-model="dialogVisible" title="知识库成员" width="680px">
    <div v-loading="formLoading">
      <el-alert class="mb-16px" :closable="false" type="info">
        创建人固定保留；管理员可维护知识库信息和成员，普通成员可新增内容，具体操作受内容协作权限控制。
      </el-alert>
      <!-- 成员列表 -->
      <el-table :data="memberList">
        <el-table-column label="类型" width="100">
          <template #default="scope">
            <el-tag
              v-if="scope.row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
              type="success"
            >
              创建人
            </el-tag>
            <el-select
              v-else
              v-model="scope.row.identityType"
              @change="handleIdentityTypeChange(scope.row)"
            >
              <el-option label="成员" value="user" />
              <el-option label="部门" value="dept" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="成员" min-width="260">
          <template #default="scope">
            <div
              v-if="scope.row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
              class="flex items-center gap-8px"
            >
              <el-avatar :size="28" :src="scope.row.avatar">
                {{ (scope.row.nickname || `用户 ${scope.row.userId}`).slice(0, 1) }}
              </el-avatar>
              <span>{{ scope.row.nickname || `用户 ${scope.row.userId}` }}</span>
            </div>
            <UserSelectV2
              v-else-if="scope.row.identityType === 'user'"
              v-model="scope.row.userId"
              :multiple="false"
              placeholder="请选择成员"
            />
            <div v-else>
              <DeptSelect v-model="scope.row.deptId" class="!w-1/1" placeholder="请选择部门" />
              <div
                v-if="scope.row.deptName"
                class="mt-4px text-12px text-[var(--el-text-color-secondary)]"
              >
                {{ scope.row.parentDeptName ? `${scope.row.parentDeptName} / ` : ''
                }}{{ scope.row.deptName }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="160">
          <template #default="scope">
            <el-tag
              v-if="scope.row.level === PmsKnowledgeLibraryMemberLevel.CREATOR"
              type="success"
            >
              创建人
            </el-tag>
            <el-select v-else v-model="scope.row.level">
              <el-option label="管理员" :value="PmsKnowledgeLibraryMemberLevel.ADMIN" />
              <el-option label="普通成员" :value="PmsKnowledgeLibraryMemberLevel.MEMBER" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="scope">
            <el-button
              v-if="scope.row.level !== PmsKnowledgeLibraryMemberLevel.CREATOR"
              link
              type="danger"
              @click="memberList.splice(scope.$index, 1)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button class="mt-12px" @click="addMember"> 添加成员 </el-button>
    </div>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeLibraryMemberApi from '@/api/pms/kb/library/member'
import DeptSelect from '@/views/system/dept/components/DeptSelect.vue'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import { PmsKnowledgeLibraryMemberLevel } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeMemberForm' })

interface EditableMember extends KnowledgeLibraryMemberApi.PmsKnowledgeLibraryMemberVO {
  identityType: 'user' | 'dept'
}

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单加载中：加载成员列表或提交表单
const libraryId = ref(0) // 知识库编号
const memberList = ref<EditableMember[]>([]) // 成员列表
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(id: number) {
  dialogVisible.value = true
  libraryId.value = id
  memberList.value = []
  // 加载知识库成员
  formLoading.value = true
  try {
    const data = await KnowledgeLibraryMemberApi.getKnowledgeLibraryMemberList(id)
    memberList.value = data.map((member) => ({
      ...member,
      identityType: member.userId ? 'user' : 'dept'
    }))
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 添加成员 */
function addMember() {
  memberList.value.push({
    id: 0,
    identityType: 'user',
    level: PmsKnowledgeLibraryMemberLevel.MEMBER
  })
}

/** 处理成员身份变化 */
function handleIdentityTypeChange(member: EditableMember) {
  member.userId = undefined
  member.deptId = undefined
}

/** 提交表单 */
async function submitForm() {
  // 校验成员或部门是否已选择
  const editableMemberList = memberList.value.filter(
    (member) => member.level !== PmsKnowledgeLibraryMemberLevel.CREATOR
  )
  if (
    editableMemberList.some(
      (member) =>
        (member.identityType === 'user' && !member.userId) ||
        (member.identityType === 'dept' && !member.deptId)
    )
  ) {
    message.warning('请选择成员或部门')
    return
  }
  // 校验成员或部门是否重复
  const userIds = editableMemberList
    .filter((member) => member.identityType === 'user')
    .map((member) => member.userId)
  const deptIds = editableMemberList
    .filter((member) => member.identityType === 'dept')
    .map((member) => member.deptId)
  if (new Set(userIds).size !== userIds.length || new Set(deptIds).size !== deptIds.length) {
    message.warning('成员或部门不能重复')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    await KnowledgeLibraryMemberApi.updateKnowledgeLibraryMemberList({
      libraryId: libraryId.value,
      members: editableMemberList.map((member) => ({
        userId: member.identityType === 'user' ? member.userId : undefined,
        deptId: member.identityType === 'dept' ? member.deptId : undefined,
        level: member.level
      }))
    })
    message.success('成员更新成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
