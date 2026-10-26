<template>
  <RecruitPostDetailsHeader :loading="loading" :post="post">
    <el-button
      v-hasPermi="['hrm:recruit:post:update']"
      :disabled="!post.id"
      type="primary"
      @click="openForm"
    >
      <Icon class="mr-5px" icon="ep:edit" />
      编辑
    </el-button>
  </RecruitPostDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="详细资料">
        <RecruitPostDetailsInfo :post="post" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <RecruitPostForm ref="formRef" @success="getPost" />
</template>

<script lang="ts" setup>
import { parseId, isPositiveId } from '@/utils/id'

import { useTagsViewStore } from '@/store/modules/tagsView'
import type { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/hrm/operate-log'
import * as RecruitPostApi from '@/api/hrm/recruit/post'
import RecruitPostForm from '@/views/hrm/recruit/post/RecruitPostForm.vue'
import { HrmBizType } from '@/views/hrm/utils/constants'
import RecruitPostDetailsHeader from './RecruitPostDetailsHeader.vue'
import RecruitPostDetailsInfo from './RecruitPostDetailsInfo.vue'

defineOptions({ name: 'HrmRecruitPostDetail' })

const route = useRoute() // 路由
const message = useMessage() // 消息弹窗
const { currentRoute, push } = useRouter() // 路由操作
const { delView } = useTagsViewStore() // 视图操作
const postId = (parseId(route.params.id) as number) // 招聘职位编号
const loading = ref(true) // 详情的加载中
const post = ref<RecruitPostApi.HrmRecruitPostVO>({} as RecruitPostApi.HrmRecruitPostVO) // 招聘职位详情

/** 关闭窗口 */
function close() {
  delView(unref(currentRoute))
  push({ name: 'HrmRecruitPost' })
}

/** 获取详情 */
async function getPost() {
  loading.value = true
  try {
    const data = await RecruitPostApi.getRecruitPost(postId)
    if (!data) {
      message.warning('招聘职位不存在')
      close()
      return
    }
    post.value = data
    await getOperateLog()
  } finally {
    loading.value = false
  }
}

const logList = ref<OperateLogVO[]>([]) // 操作日志列表

/** 获取操作日志 */
async function getOperateLog() {
  const data = await getOperateLogPage({
    bizType: HrmBizType.RECRUIT_POST,
    bizId: postId
  })
  logList.value = data.list
}

const formRef = ref<InstanceType<typeof RecruitPostForm>>() // 表单 Ref

/** 编辑 */
function openForm() {
  formRef.value?.open('update', postId)
}

/** 初始化 */
onMounted(async () => {
  if (!isPositiveId(postId)) {
    message.warning('参数错误，招聘职位不能为空！')
    close()
    return
  }
  await getPost()
})
</script>
