<template>
  <!-- 头部 -->
  <ContentWrap>
    <el-page-header @back="close">
      <template #content>
        <span class="text-16px font-600">文件管理</span>
        <span class="ml-12px text-14px text-[var(--el-text-color-secondary)]">
          技能：{{ skill?.name || '-' }}
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
import { parseId } from '@/utils/id'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { SkillApi, SkillFileVO, SkillVO } from '@/api/ai/skill'
import SkillFileTree from './SkillFileTree.vue'
import SkillFileEditor from './SkillFileEditor.vue'

/** AI 技能文件管理 */
defineOptions({ name: 'AiSkillFile' })

const message = useMessage() // 消息弹窗
const { params } = useRoute() // 路由参数

const skillId = parseId(params.skillId) // 技能编号
const skill = ref<SkillVO>() // 技能信息
const selectedNode = ref<SkillFileVO>() // 选中的节点

/** 选中节点 */
const handleSelect = (node?: SkillFileVO) => {
  selectedNode.value = node
}

/** 关闭 */
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由
const close = () => {
  delView(unref(currentRoute))
  push({ name: 'AiSkill' })
}

/** 初始化 **/
onMounted(async () => {
  if (!skillId) {
    message.warning('参数错误，技能不能为空！')
    close()
    return
  }
  skill.value = await SkillApi.getSkill(skillId)
})
</script>
