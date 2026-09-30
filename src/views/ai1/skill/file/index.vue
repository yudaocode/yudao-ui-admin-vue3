<template>
  <!-- 头部 -->
  <ContentWrap>
    <el-page-header @back="close">
      <template #content>
        <span class="text-16px font-600">内容管理</span>
        <span class="ml-12px text-14px text-[var(--el-text-color-secondary)]">
          SKILL：{{ skill?.name || '-' }}
        </span>
        <el-tag type="info" class="ml-12px">
          仅 SKILL.md 与 scripts/、reference/ 固定，其余可自由扩展
        </el-tag>
      </template>
    </el-page-header>
  </ContentWrap>

  <!-- 文件树 + 编辑器 -->
  <ContentWrap>
    <div v-if="skillId" class="flex items-stretch gap-12px">
      <SkillFileTree :skill-id="skillId" @select="handleSelect" />
      <SkillFileEditor :file="selectedNode" />
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { useTagsViewStore } from '@/store/modules/tagsView'
import { SkillApi, SkillFile, Skill } from '@/api/ai1/skill'
import SkillFileTree from './SkillFileTree.vue'
import SkillFileEditor from './SkillFileEditor.vue'

/** AI1 SKILL 内容管理 */
defineOptions({ name: 'Ai1SkillFile' })

const message = useMessage() // 消息弹窗
const { params } = useRoute() // 路由参数

const skillId = Number(params.skillId) // SKILL 编号
const skill = ref<Skill>() // SKILL 信息
const selectedNode = ref<SkillFile>() // 选中的节点

/** 选中节点 */
const handleSelect = (node?: SkillFile) => {
  selectedNode.value = node
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'Ai1Skill' })
}

/** 初始化 **/
onMounted(async () => {
  if (!skillId) {
    message.warning('参数错误，SKILL 不能为空！')
    close()
    return
  }
  skill.value = await SkillApi.getSkill(skillId)
})
</script>
