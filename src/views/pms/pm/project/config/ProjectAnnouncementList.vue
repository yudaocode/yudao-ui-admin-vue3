<template>
  <div>
    <!-- 公告列表标题与操作 -->
    <div class="mb-16px flex items-center justify-between">
      <h3 class="m-0 text-18px font-600">项目公告（{{ list.length }}）</h3>
      <el-button
        v-if="editable"
        v-hasPermi="['pms:pm:project:update']"
        type="primary"
        @click="openForm('create')"
      >
        发布公告
      </el-button>
    </div>

    <!-- 公告列表 -->
    <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
      <el-table-column label="公告内容" min-width="360">
        <template #default="scope">
          <div class="line-clamp-2 whitespace-pre-wrap leading-22px">
            {{ scope.row.content }}
          </div>
        </template>
      </el-table-column>
      <el-table-column align="center" label="附件" width="110">
        <template #default="scope">
          <el-dropdown v-if="scope.row.fileUrls?.length" trigger="click">
            <el-button link type="primary">{{ scope.row.fileUrls.length }} 个附件</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="(url, index) in scope.row.fileUrls" :key="url">
                  <el-link :href="url" target="_blank">附件 {{ Number(index) + 1 }}</el-link>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="发布人" min-width="140" prop="creatorUserName" />
      <el-table-column :formatter="dateFormatter" label="发布时间" prop="createTime" width="180" />
      <el-table-column v-if="editable" align="center" fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button
            v-hasPermi="['pms:pm:project:update']"
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['pms:pm:project:update']"
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改项目公告对话框 -->
    <ProjectAnnouncementForm ref="formRef" @success="getList" />
  </div>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as ProjectAnnouncementApi from '@/api/pms/pm/project/announcement'
import ProjectAnnouncementForm from './ProjectAnnouncementForm.vue'

defineOptions({ name: 'PmsProjectAnnouncementList' })

const props = defineProps<{ projectId: number; editable: boolean }>()

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化
const loading = ref(true) // 列表的加载中
const list = ref<ProjectAnnouncementApi.PmsProjectAnnouncementVO[]>([]) // 列表的数据
const formRef = ref<InstanceType<typeof ProjectAnnouncementForm>>() // 公告表单 Ref

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    list.value = await ProjectAnnouncementApi.getProjectAnnouncementList(props.projectId)
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
function openForm(type: string, id?: number) {
  formRef.value?.open(type, props.projectId, id)
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ProjectAnnouncementApi.deleteProjectAnnouncement(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
