<!-- AI 短剧：3D 导演。画布预演节点的白模场景、人物动作、机位与时间轴；保存为导演工程，导出白模视频后可加入项目的动作参考 -->
<template>
  <Dialog
    v-model="dialogVisible"
    :title="`3D 导演 · ${title}`"
    :fullscreen="false"
    default-fullscreen
    :before-close="handleClose"
  >
    <div v-loading="loading" class="h-[calc(100vh-120px)] flex flex-col">
      <!-- 工具栏：编辑在左，保存在右；添加对象在左侧场景栏 -->
      <div class="flex flex-wrap items-center justify-between gap-8px pb-8px">
        <div class="flex flex-wrap items-center gap-8px">
          <el-radio-group v-model="tool" size="default">
            <el-radio-button value="translate">移动</el-radio-button>
            <el-radio-button value="rotate">旋转</el-radio-button>
            <el-radio-button value="scale">缩放</el-radio-button>
            <el-radio-button value="pose" :disabled="object?.kind !== 'actor'">
              姿态
            </el-radio-button>
          </el-radio-group>
          <el-checkbox v-model="guides">辅助线</el-checkbox>
          <el-button-group>
            <el-button :disabled="!undoStack.length || busy" @click="handleHistory('undo')"
              ><Icon icon="ep:refresh-left"
            /></el-button>
            <el-button :disabled="!redoStack.length || busy" @click="handleHistory('redo')"
              ><Icon icon="ep:refresh-right"
            /></el-button>
          </el-button-group>
          <span class="text-13px">时长</span>
          <el-input-number
            v-model="durationInput"
            :min="2"
            :max="directorMaxDuration"
            :precision="0"
            :disabled="busy"
            controls-position="right"
            class="!w-100px"
            @change="handleDuration"
          />
          <el-select
            :model-value="doc.aspect"
            :disabled="busy"
            class="!w-110px"
            @change="(value) => mutate((next) => (next.aspect = value))"
          >
            <el-option label="16:9 横屏" value="16:9" />
            <el-option label="9:16 竖屏" value="9:16" />
          </el-select>
          <el-dropdown :disabled="busy" @command="(command) => handlePreset(command)">
            <el-button :disabled="busy">
              导入 / 导出 <Icon icon="ep:arrow-down" class="ml-5px" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="export">下载工程文件</el-dropdown-item>
                <el-dropdown-item command="import">导入工程文件</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :disabled="busy" @click="captureRef.open()">参考视频动作</el-button>
        </div>
        <div class="flex items-center gap-8px">
          <span
            class="text-12px"
            :class="
              autoSave.paused.value
                ? 'text-[var(--el-color-danger)]'
                : 'text-[var(--el-text-color-secondary)]'
            "
          >
            {{ saveStatus }}
          </span>
          <el-checkbox v-model="autoSave.enabled.value">自动保存</el-checkbox>
          <el-button
            type="primary"
            :loading="saving"
            :disabled="!dirty || busy"
            @click="handleSave"
          >
            保存工程
          </el-button>
        </div>
      </div>

      <div
        class="min-h-0 flex flex-1 overflow-hidden border border-[var(--el-border-color-lighter)] border-solid"
      >
        <!-- 场景栏：直接添加对象；列表中选择，就地显示、隐藏、锁定、解锁；底部载入示例、清空场景 -->
        <div
          class="w-220px flex flex-col border-r border-r-[var(--el-border-color-lighter)] border-r-solid bg-[var(--el-bg-color)]"
        >
          <div class="flex items-center justify-between px-12px pb-4px pt-10px">
            <span class="text-13px font-600">场景</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              {{ doc.objects.length }} 个对象
            </span>
          </div>
          <div class="grid grid-cols-2 gap-4px px-8px pb-8px">
            <el-button
              v-for="(label, kind) in directorKinds"
              :key="kind"
              size="small"
              class="!ml-0"
              :disabled="busy"
              @click="handleAdd(kind as DirectorKind)"
            >
              + {{ label }}
            </el-button>
          </div>
          <el-scrollbar
            class="min-h-0 flex-1 border-t border-t-[var(--el-border-color-lighter)] border-t-solid"
          >
            <div
              class="director-object"
              :class="{ 'is-selected': selected === 'camera' }"
              @click="handleSelect('camera')"
            >
              <Icon icon="ep:camera" class="mr-6px" />
              <span class="flex-1">摄影机</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ doc.camera.keys.length }} 帧
              </span>
            </div>
            <div
              v-for="item in doc.objects"
              :key="item.id"
              class="director-object"
              :class="{ 'is-selected': selected === item.id, 'is-hidden': !item.visible }"
              @click="handleSelect(item.id)"
            >
              <span
                class="mr-6px inline-block h-10px w-10px shrink-0 rounded-2px"
                :style="{ background: item.color }"
              ></span>
              <span class="flex-1 truncate">{{ item.name }}</span>
              <el-tooltip :content="item.visible ? '隐藏' : '显示'" placement="top">
                <el-button
                  link
                  :disabled="busy"
                  @click.stop="patchObject(item.id, { visible: !item.visible })"
                >
                  <Icon :icon="item.visible ? 'ep:view' : 'ep:hide'" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                :content="item.locked ? '解锁' : '锁定：仍可查看，解锁后再调整'"
                placement="top"
              >
                <el-button
                  link
                  class="!ml-4px"
                  :type="item.locked ? 'warning' : undefined"
                  :disabled="busy"
                  @click.stop="patchObject(item.id, { locked: !item.locked })"
                >
                  <Icon :icon="item.locked ? 'ep:lock' : 'ep:unlock'" />
                </el-button>
              </el-tooltip>
            </div>
            <el-empty
              v-if="!doc.objects.length"
              description="添加人物白模、道具后，沿时间轴设置动作与机位"
              :image-size="60"
            />
          </el-scrollbar>
          <div
            class="border-t border-t-[var(--el-border-color-lighter)] border-t-solid px-8px py-8px"
          >
            <div v-if="sceneSummary" class="mb-6px text-12px text-[var(--el-text-color-secondary)]">
              {{ sceneSummary }}
            </div>
            <div class="flex gap-4px">
              <el-dropdown
                class="flex-1"
                :disabled="busy"
                @command="(command) => handlePreset(command)"
              >
                <el-button size="small" class="w-full" :disabled="busy">
                  载入示例 <Icon icon="ep:arrow-down" class="ml-4px" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="sample">走位示例</el-dropdown-item>
                    <el-dropdown-item command="performance">表演示例</el-dropdown-item>
                    <el-dropdown-item command="battle">攻城示例</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                size="small"
                :disabled="busy || !doc.objects.length"
                @click="handlePreset('clear')"
              >
                清空场景
              </el-button>
            </div>
          </div>
        </div>
        <DirectorViewport
          v-if="dialogVisible && !loading"
          class="flex-1"
          :document="doc"
          :frame="frame"
          :selected="selected"
          :joint="joint"
          :tool="tool"
          :playing="playing"
          :guides="guides"
          @select="handleSelect"
          @joint="(value) => (joint = value)"
          @joint-rotation="handleJointRotation"
          @seek="seek"
          @transform="handleTransform"
        />
        <DirectorInspector
          :document="doc"
          :selected="selected"
          :frame="frame"
          :joint="joint"
          :selected-clip="selectedClip"
          :can-paste="!!poseClipboard"
          @patch-object="(patch) => patchObject(selected, patch)"
          @patch-key="patchKey"
          @patch-camera="patchCamera"
          @delete-key="handleDeleteKey"
          @remove="handleRemove"
          @duplicate="handleDuplicate"
          @joint="(value) => (joint = value)"
          @joint-rotation="handleJointRotation"
          @copy-pose="poseClipboard = cloneDirector(objectAt(object!, frame).pose || {})"
          @paste-pose="patchKey({ pose: cloneDirector(poseClipboard!) })"
          @mirror-pose="patchKey({ pose: mirrorDirectorPose(objectAt(object!, frame).pose || {}) })"
          @add-clip="handleAddClip"
          @patch-clip="handlePatchClip"
          @remove-clip="
            (id) =>
              mutateObject((item) => (item.clips = item.clips?.filter((clip) => clip.id !== id)))
          "
          @follow="handleFollow"
          @patch-follow="
            (patch) =>
              mutate((next) => next.camera.follow && Object.assign(next.camera.follow, patch))
          "
        />
      </div>

      <div
        class="mb-8px h-200px border border-t-0 border-[var(--el-border-color-lighter)] border-solid"
      >
        <DirectorTimeline
          :document="doc"
          :frame="frame"
          :selected="selected"
          :selected-clip="selectedClip"
          :playing="playing"
          @seek="seek"
          @play="handlePlay"
          @select="handleSelect"
          @add-key="selected === 'camera' ? patchCamera({}) : patchKey({})"
          @clip="handleSelectClip"
          @move-key="handleMoveKey"
        />
      </div>

      <!-- 导出：独立的底部区域 -->
      <div
        class="flex items-center justify-between gap-12px border-t border-t-[var(--el-border-color-lighter)] border-t-solid pt-10px"
      >
        <div class="flex min-w-0 flex-1 items-center gap-12px">
          <el-progress v-if="exporting" :percentage="Math.round(progress * 100)" class="w-300px" />
          <el-button v-if="exporting" link @click="controller?.abort()">取消导出</el-button>
          <span v-else class="text-12px text-[var(--el-text-color-secondary)]">
            按摄影机监看的构图逐帧导出 24 fps H.264 视频，辅助线不进入画面；导出依赖浏览器 WebCodecs
          </span>
        </div>
        <el-button :disabled="busy" @click="handleExportFrame">导出当前帧</el-button>
        <el-button type="primary" :disabled="busy" @click="handleExportVideo">
          导出白模视频
        </el-button>
      </div>
    </div>
  </Dialog>

  <!-- 导出的白模视频：下载、加入动作参考 -->
  <Dialog v-model="videoVisible" title="白模视频" width="640px">
    <video v-if="videoUrl" :src="videoUrl" controls class="max-h-420px w-full bg-black"></video>
    <div class="mt-8px text-12px text-[var(--el-text-color-secondary)]">
      加入动作参考后，可在分镜编辑的“动作参考视频”中选用；动作参考限 2~30 秒
    </div>
    <template #footer>
      <el-button @click="handleDownloadVideo">下载</el-button>
      <el-button
        type="primary"
        :loading="referenceSaving"
        :disabled="doc.duration > 30 || referenceSaved"
        @click="handleSaveReference"
      >
        {{ referenceSaved ? '已加入动作参考' : '加入动作参考' }}
      </el-button>
    </template>
  </Dialog>

  <DirectorCaptureDialog ref="captureRef" :detail="detail" @import="handleReplace" />
  <input
    ref="fileRef"
    type="file"
    accept="application/json,.json"
    class="hidden"
    @change="handleImportFile"
  />
</template>

<script setup lang="ts">
import * as FileApi from '@/api/infra/file'
import type { DramaProjectDetailVO } from '@/api/ai/drama/project'
import { DramaCanvasApi } from '@/api/ai/drama/canvas'
import { DramaAssetApi } from '@/api/ai/drama/asset'
import {
  battleDirector,
  cameraAt,
  cloneDirector,
  directorKinds,
  directorMaxDuration,
  emptyDirector,
  mirrorDirectorPose,
  moveDirectorKey,
  newActionClip,
  newDirectorObject,
  objectAt,
  performanceDirector,
  resizeDirector,
  sampleDirector,
  totalFrames,
  upsertKey,
  validateDirector,
  type ActionClip,
  type CameraKey,
  type DirectorAction,
  type DirectorDocument,
  type DirectorJoint,
  type DirectorKind,
  type DirectorObject,
  type DirectorPose,
  type ObjectKey,
  type Vec3
} from './director'
import DirectorViewport from './DirectorViewport.vue'
import DirectorTimeline from './DirectorTimeline.vue'
import DirectorInspector from './DirectorInspector.vue'
import DirectorCaptureDialog from './DirectorCaptureDialog.vue'
import { useDramaAutoSave } from '../canvas/useAutoSave'
import { until } from '@vueuse/core'

/** AI 短剧：3D 导演 */
defineOptions({ name: 'AiDramaDirector' })

const props = defineProps<{ detail: DramaProjectDetailVO }>()
const emit = defineEmits<{ saved: [nodeId: string, summary: string]; refresh: [] }>()
const message = useMessage() // 消息弹窗

const HISTORY_LIMIT = 50

const dialogVisible = ref(false)
const loading = ref(false)
const loaded = ref(false) // 当前代次的工程是否已加载成功：只有加载成功的工程才能保存
const saving = ref(false)
const nodeId = ref('')
const title = ref('')
const revision = ref(0)
const doc = ref<DirectorDocument>(emptyDirector())
const savedJson = ref('')
const docJson = computed(() => JSON.stringify(doc.value))
const dirty = computed(() => docJson.value !== savedJson.value)
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])

const selected = ref('')
const selectedClip = ref('')
const joint = ref<DirectorJoint>('rightArm')
const frame = ref(0)
const playing = ref(false)
const tool = ref<'translate' | 'rotate' | 'scale' | 'pose'>('translate')
const guides = ref(true)
const poseClipboard = ref<DirectorPose>()
const captureRef = ref()
const fileRef = ref<HTMLInputElement>()

const exporting = ref(false)
const progress = ref(0)
let controller: AbortController | undefined
const busy = computed(() => exporting.value || loading.value)

const end = computed(() => totalFrames(doc.value) - 1)
const object = computed(() => doc.value.objects.find((item) => item.id === selected.value))
/** 场景栏底部：已锁定、已隐藏的对象数 */
const sceneSummary = computed(() => {
  const locked = doc.value.objects.filter((item) => item.locked).length
  const hidden = doc.value.objects.filter((item) => !item.visible).length
  return [locked ? `${locked} 个已锁定` : '', hidden ? `${hidden} 个已隐藏` : '']
    .filter(Boolean)
    .join(' · ')
})

// ========== 打开、保存 ==========

/** 等待进行中的保存结束：多个等待者依次醒来时，重新检查，保证同一时间只有一次保存 */
const waitSaved = async () => {
  while (saving.value) {
    await until(saving).toBe(false)
  }
}

/** 打开代次：每次打开递增；保存的回包只在代次不变（仍是同一次打开的同一节点）时写入修订号与保存基线 */
let generation = 0

/** 打开预演节点的导演工程；复制来的节点首次打开时，以来源节点的工程为初稿 */
const open = async (id: string, nodeTitle: string, sourceNodeId?: string) => {
  const current = ++generation
  autoSave.cancel()
  dialogVisible.value = true
  nodeId.value = id
  title.value = nodeTitle
  loading.value = true
  loaded.value = false
  try {
    // 先等上一个工程在途的保存结束，再加载：不被旧的回包覆盖修订号
    await waitSaved()
    const projectId = props.detail.project.id
    const data = await DramaCanvasApi.getDirector(projectId, id)
    let document = data.document
    if (!document && sourceNodeId) {
      document = (await DramaCanvasApi.getDirector(projectId, sourceNodeId)).document
    }
    if (current !== generation) {
      return
    }
    revision.value = data.revision
    doc.value = document ? validateDirector(document) : emptyDirector()
    savedJson.value = data.document ? JSON.stringify(doc.value) : ''
    autoSave.reset()
    undoStack.value = []
    redoStack.value = []
    selected.value = ''
    frame.value = 0
    loaded.value = true
  } catch {
    // 加载失败（错误提示由请求拦截器展示）：清掉上一个工程的内容并关闭窗口，不以旧工程编辑、保存到该节点
    if (current === generation) {
      doc.value = emptyDirector()
      savedJson.value = JSON.stringify(doc.value)
      autoSave.reset()
      dialogVisible.value = false
    }
  } finally {
    if (current === generation) {
      loading.value = false
    }
  }
}

/**
 * 保存工程：修订号不一致时后端拒绝
 *
 * 手动保存、自动保存依次进行：上一次未结束时先等待，避免以同一修订号重复提交；自动保存不弹成功提示；
 * 调用时记录打开代次与节点：等待期间打开了（同一或另一节点的）工程、或正在加载时放弃保存，不把旧工程提交到新节点；
 * 保存期间关闭后又打开了工程时，回包不再写入当前工程的修订号与保存基线
 */
const persist = async (silent = false) => {
  const current = generation
  const id = nodeId.value
  // 检查与占用在同一同步段内完成：多个等待者醒来时，只有第一个能占用，其余继续等待
  while (saving.value) {
    await until(saving).toBe(false)
  }
  if (current !== generation || id !== nodeId.value || loading.value || !loaded.value) {
    return false
  }
  saving.value = true
  try {
    // 以本次提交的文档为保存基线：保存期间的后续修改仍为未保存，回包只更新修订号
    const json = JSON.stringify(doc.value)
    const snapshot: DirectorDocument = JSON.parse(json)
    const nextRevision = await DramaCanvasApi.saveDirector({
      projectId: props.detail.project.id,
      nodeId: id,
      revision: revision.value,
      document: snapshot
    })
    if (current === generation) {
      revision.value = nextRevision
      savedJson.value = json
    }
    if (!silent) {
      message.success('导演工程已保存')
    }
    // 摘要写入保存的那个预演节点
    emit(
      'saved',
      id,
      `${snapshot.objects.length} 个场景对象 · ${snapshot.camera.keys.length} 个机位关键帧 · ${snapshot.duration} 秒 ${snapshot.aspect}`
    )
    return true
  } catch {
    return false
  } finally {
    saving.value = false
  }
}

const handleSave = async () => {
  if (await persist()) {
    autoSave.resume()
  }
}

/** 自动保存：默认关闭，勾选后编辑停顿时保存；失败后暂停，手动保存成功后恢复 */
const autoSave = useDramaAutoSave({
  storageKey: 'ai-drama-director-auto-save',
  snapshot: () => docJson.value,
  dirty,
  saving,
  ready: () => dialogVisible.value && !busy.value && !saving.value,
  save: () => persist(true)
})

const saveStatus = computed(() => {
  if (saving.value) {
    return '保存中…'
  }
  if (autoSave.paused.value && dirty.value) {
    return '自动保存失败，已暂停，请检查后手动保存'
  }
  if (dirty.value) {
    return '有未保存的修改'
  }
  return revision.value ? `已保存 · 修订 ${revision.value}` : '尚未保存'
})

/**
 * 关闭工程前（关闭对话框、离开画布）：开启自动保存时立即保存，保存成功后直接关闭；
 * 手动保存模式、自动保存失败时仍有未保存的修改，确认后关闭
 *
 * @return 是否可以关闭
 */
const confirmLeave = async () => {
  if (!dialogVisible.value) {
    return true
  }
  if (exporting.value) {
    message.warning('视频正在导出，请先取消导出')
    return false
  }
  stop()
  if (dirty.value && !loading.value && autoSave.enabled.value) {
    await autoSave.flush()
  }
  if (!dirty.value) {
    return true
  }
  try {
    await message.confirm('导演工程有未保存的修改，确认关闭？')
    return true
  } catch {
    return false
  }
}

const handleClose = async (done: () => void) => {
  if (await confirmLeave()) {
    done()
  }
}

/** 是否有未保存的修改：只算打开中的工程（关闭时已确认放弃的不算） */
const unsaved = computed(() => dialogVisible.value && dirty.value)
defineExpose({ open, confirmLeave, dirty: unsaved })

// ========== 编辑：每次修改先校验，再记入撤销 ==========

const mutate = (action: (next: DirectorDocument) => void) => {
  if (busy.value) {
    return false
  }
  stop()
  try {
    const next = cloneDirector(doc.value)
    action(next)
    replace(validateDirector(next))
    return true
  } catch (e) {
    message.warning(e instanceof Error ? e.message : '编辑未完成')
    return false
  }
}

const replace = (next: DirectorDocument) => {
  undoStack.value = [...undoStack.value, JSON.stringify(doc.value)].slice(-HISTORY_LIMIT)
  redoStack.value = []
  doc.value = next
}

const handleHistory = (type: 'undo' | 'redo') => {
  stop()
  const from = type === 'undo' ? undoStack : redoStack
  const to = type === 'undo' ? redoStack : undoStack
  const previous = from.value[from.value.length - 1]
  if (!previous) {
    return
  }
  from.value = from.value.slice(0, -1)
  to.value = [...to.value, JSON.stringify(doc.value)]
  doc.value = JSON.parse(previous)
  frame.value = Math.min(frame.value, end.value)
  if (selected.value !== 'camera' && !object.value) {
    selected.value = ''
  }
}

/** 修改选中的对象：锁定的对象不能修改 */
const mutateObject = (action: (item: DirectorObject) => void) =>
  mutate((next) => {
    const item = next.objects.find((value) => value.id === selected.value)
    if (item && !item.locked) {
      action(item)
    }
  })

const patchObject = (id: string, patch: Partial<DirectorObject>) =>
  mutate((next) => {
    const item = next.objects.find((value) => value.id === id)
    // 锁定时只能改名称、颜色、显示、锁定
    if (
      item &&
      !(
        item.locked &&
        Object.keys(patch).some((key) => !['locked', 'visible', 'name', 'color'].includes(key))
      )
    ) {
      Object.assign(item, patch)
      if ('lookAtId' in patch && !patch.lookAtId) {
        delete item.lookAtId
      }
    }
  })

const patchKey = (patch: Partial<ObjectKey>) =>
  mutateObject(
    (item) =>
      (item.keys = upsertKey(item.keys, {
        ...objectAt(item, frame.value),
        ...patch,
        frame: frame.value
      }))
  )

const patchCamera = (patch: Partial<CameraKey>) =>
  mutate(
    (next) =>
      (next.camera.keys = upsertKey(next.camera.keys, {
        ...cameraAt(next, frame.value),
        ...patch,
        frame: frame.value
      }))
  )

const handleAdd = (kind: DirectorKind) => {
  let id = ''
  if (
    mutate((next) => {
      const item = newDirectorObject(
        kind,
        next.objects.filter((value) => value.kind === kind).length
      )
      next.objects.push(item)
      id = item.id
    })
  ) {
    selected.value = id
    frame.value = 0
  }
}

const handleSelect = (id: string) => {
  stop()
  if (tool.value === 'pose' && doc.value.objects.find((item) => item.id === id)?.kind !== 'actor') {
    tool.value = 'translate'
  }
  selected.value = id
  selectedClip.value = ''
}

const handleDeleteKey = () => {
  if (!frame.value) {
    return
  }
  if (selected.value === 'camera') {
    mutate(
      (next) => (next.camera.keys = next.camera.keys.filter((key) => key.frame !== frame.value))
    )
  } else {
    mutateObject((item) => (item.keys = item.keys.filter((key) => key.frame !== frame.value)))
  }
}

/** 删除对象：一并清除其它对象对它的注视、命中目标，以及相机跟随 */
const handleRemove = () => {
  const id = selected.value
  if (
    mutate((next) => {
      next.objects = next.objects.filter((item) => item.id !== id)
      next.objects.forEach((item) => {
        if (item.lookAtId === id) delete item.lookAtId
        if (item.targetId === id) delete item.targetId
      })
      if (next.camera.follow?.objectId === id) delete next.camera.follow
    })
  ) {
    selected.value = ''
  }
}

const handleDuplicate = () => {
  let id = ''
  if (
    mutate((next) => {
      const item = next.objects.find((value) => value.id === selected.value)
      if (!item) return
      const clone = cloneDirector(item)
      clone.id = crypto.randomUUID()
      clone.name = `${item.name.slice(0, 90)} · 副本`
      clone.locked = false
      clone.keys.forEach((key) => (key.position[0] += 1))
      next.objects.push(clone)
      id = clone.id
    }) &&
    id
  ) {
    selected.value = id
  }
}

/** 视口中拖动：对象写入当前帧的位置、朝向和缩放；“view”为当前视角设为机位 */
const handleTransform = (id: string, position: Vec3, yaw: number, scale: Vec3) => {
  if (id === 'view') {
    selected.value = 'camera'
    patchCamera({ position, target: scale })
    return
  }
  selected.value = id
  if (id === 'camera') {
    patchCamera({ position })
    return
  }
  mutateObject((item) => {
    item.keys = upsertKey(item.keys, {
      ...objectAt(item, frame.value),
      frame: frame.value,
      position: position.map((value) => Math.max(-100, Math.min(100, value))) as Vec3,
      yaw
    })
    item.scale = scale.map((value) => Math.max(0.1, Math.min(20, value))) as Vec3
  })
}

const handleJointRotation = (name: DirectorJoint, rotation: Vec3) => {
  if (object.value) {
    patchKey({ pose: { ...objectAt(object.value, frame.value).pose, [name]: rotation } })
  }
}

const handleMoveKey = (id: string, from: number, to: number, copy: boolean) => {
  selected.value = id
  if (
    mutate((next) => {
      if (id === 'camera') {
        next.camera.keys = moveDirectorKey(next.camera.keys, from, to, end.value, copy)
        return
      }
      const item = next.objects.find((value) => value.id === id)
      if (item && !item.locked) {
        item.keys = moveDirectorKey(item.keys, from, to, end.value, copy)
      }
    })
  ) {
    seek(to)
  }
}

// ========== 动作片段、相机跟随 ==========

const handleAddClip = (action: DirectorAction) => {
  let id = ''
  mutateObject((item) => {
    const clip = newActionClip(item, frame.value, end.value, action)
    item.clips = [...(item.clips || []), clip].sort((a, b) => a.start - b.start)
    id = clip.id
  })
  selectedClip.value = id
}

const handlePatchClip = (id: string, patch: Partial<ActionClip>) =>
  mutateObject((item) => {
    item.clips = item.clips
      ?.map((clip) => (clip.id === id ? { ...clip, ...patch, id } : clip))
      .sort((a, b) => a.start - b.start)
  })

const handleSelectClip = (objectId: string, id: string) => {
  selected.value = objectId
  selectedClip.value = id
  const clip = object.value?.clips?.find((item) => item.id === id)
  if (clip) {
    seek(clip.start)
  }
}

/** 相机跟随：取消时把当前画面记为关键帧，避免机位跳变 */
const handleFollow = (id: string) =>
  mutate((next) => {
    if (!id) {
      const current = cameraAt(next, frame.value)
      delete next.camera.follow
      next.camera.keys = upsertKey(next.camera.keys, current)
      return
    }
    const item = next.objects.find((value) => value.id === id)
    if (!item) return
    const position = objectAt(item, frame.value).position
    const camera = cameraAt(next, frame.value)
    next.camera.follow = {
      objectId: id,
      mode: 'aim',
      height: item.kind === 'actor' ? 1.3 : 0.5,
      offset: camera.position.map((value, i) => value - position[i]) as Vec3
    }
  })

// ========== 时长、示例、工程文件 ==========

/** 时长输入：双向绑定，change 时调整工程；无效值回到工程的时长 */
const durationInput = ref(8)
watch(
  () => doc.value.duration,
  (value) => (durationInput.value = value),
  { immediate: true }
)
const handleDuration = () => {
  const value = durationInput.value
  if (!value || !Number.isInteger(value) || value === doc.value.duration || busy.value) {
    durationInput.value = doc.value.duration
    return
  }
  stop()
  replace(resizeDirector(doc.value, value))
  frame.value = Math.min(frame.value, end.value)
}

/** 替换整个工程（示例、导入、动作提取）：有未保存的修改时先下载备份 */
const handleReplace = (next: DirectorDocument) => {
  if (dirty.value) {
    downloadDocument()
  }
  stop()
  replace(next)
  frame.value = 0
  selected.value = next.objects[0]?.id || ''
}

const handlePreset = (command: string) => {
  if (command === 'export') {
    downloadDocument()
  } else if (command === 'import') {
    fileRef.value?.click()
  } else if (command === 'clear') {
    handleReplace(emptyDirector())
  } else {
    handleReplace(
      command === 'performance'
        ? performanceDirector()
        : command === 'battle'
          ? battleDirector()
          : sampleDirector()
    )
  }
}

const filename = () => title.value.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)

/** 下载到本地：工程文件、当前帧、白模视频 */
const saveBlob = (blob: Blob, name: string) => {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = name
  link.click()
  URL.revokeObjectURL(href)
}

const downloadDocument = () =>
  saveBlob(
    new Blob([JSON.stringify(doc.value, null, 2)], { type: 'application/json' }),
    `${filename()}-导演工程.json`
  )

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  try {
    const file = input.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      message.warning('工程文件不能超过 1MB')
      return
    }
    handleReplace(validateDirector(JSON.parse(await file.text())))
  } catch (e) {
    message.warning(e instanceof Error ? e.message : '导入失败')
  } finally {
    input.value = ''
  }
}

// ========== 播放 ==========

let playback = 0
const stop = () => {
  playing.value = false
  cancelAnimationFrame(playback)
}
const seek = (value: number) => {
  stop()
  frame.value = Math.max(0, Math.min(end.value, Math.round(Number.isFinite(value) ? value : 0)))
}
const handlePlay = () => {
  if (busy.value) return
  if (playing.value) {
    stop()
    return
  }
  if (frame.value >= end.value) {
    frame.value = 0
  }
  playing.value = true
  const startFrame = frame.value
  const startTime = performance.now()
  const tick = (now: number) => {
    frame.value = Math.min(
      end.value,
      startFrame + Math.floor(((now - startTime) / 1000) * doc.value.fps)
    )
    if (frame.value >= end.value) {
      stop()
      return
    }
    playback = requestAnimationFrame(tick)
  }
  playback = requestAnimationFrame(tick)
}

// ========== 导出：白模视频、当前帧；视频可加入动作参考 ==========

const videoVisible = ref(false)
const videoUrl = ref('')
const videoBlob = ref<Blob>()
const referenceSaving = ref(false)
const referenceSaved = ref(false)

const handleExportVideo = async () => {
  stop()
  exporting.value = true
  progress.value = 0
  controller = new AbortController()
  try {
    const { exportDirectorVideo } = await import('./directorExport')
    videoBlob.value = await exportDirectorVideo(
      doc.value,
      (value) => (progress.value = value),
      controller.signal
    )
    if (videoUrl.value) {
      URL.revokeObjectURL(videoUrl.value)
    }
    videoUrl.value = URL.createObjectURL(videoBlob.value)
    referenceSaved.value = false
    videoVisible.value = true
  } catch (e) {
    message.error(e instanceof Error ? e.message : '导出失败，请确认浏览器支持 H.264 WebCodecs')
  } finally {
    exporting.value = false
    controller = undefined
  }
}

const handleExportFrame = async () => {
  stop()
  exporting.value = true
  try {
    const { exportDirectorFrame } = await import('./directorExport')
    saveBlob(
      await exportDirectorFrame(doc.value, frame.value),
      `${filename()}-第${frame.value}帧.png`
    )
  } catch (e) {
    message.error(e instanceof Error ? e.message : '导出失败')
  } finally {
    exporting.value = false
  }
}

const handleDownloadVideo = () => saveBlob(videoBlob.value!, `${filename()}-白模预演.mp4`)

/** 上传白模视频，加入项目的动作参考 */
const handleSaveReference = async () => {
  referenceSaving.value = true
  try {
    const file = new File([videoBlob.value!], `${filename()}-白模预演.mp4`, { type: 'video/mp4' })
    const { data: fileUrl } = await FileApi.updateFile({ file })
    await DramaAssetApi.createMotionReference({
      projectId: props.detail.project.id,
      name: `${title.value.slice(0, 40)} · 白模预演`,
      fileUrl
    })
    referenceSaved.value = true
    message.success('已加入动作参考，可在分镜编辑中选用')
    emit('refresh')
  } finally {
    referenceSaving.value = false
  }
}

watch(dialogVisible, (value) => {
  if (!value) {
    stop()
    controller?.abort()
    // 关闭时放弃排队中的自动保存：未保存的修改已由用户确认放弃
    autoSave.cancel()
  }
})
onBeforeUnmount(() => {
  stop()
  controller?.abort()
  if (videoUrl.value) {
    URL.revokeObjectURL(videoUrl.value)
  }
})
// DONE @AI：unocsss（布局容器改为 UnoCSS；对象列表项有悬停、选中、隐藏状态，复用 2 处，保留）
</script>

<style lang="scss" scoped>
.director-object {
  display: flex;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  align-items: center;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-selected {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.is-hidden {
    opacity: 0.5;
  }
}
</style>
