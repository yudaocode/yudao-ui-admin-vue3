<!-- AI 短剧 3D 导演：右侧属性，场景对象（当前帧的位置、动作、姿态、动作片段）或摄影机（机位、跟随） -->
<template>
  <el-scrollbar class="director-inspector">
    <!-- 摄影机 -->
    <el-form
      v-if="selected === 'camera'"
      :model="formData"
      label-position="top"
      size="small"
      class="p-12px"
    >
      <div class="mb-8px text-14px font-600">摄影机 · 第 {{ frame }} 帧</div>
      <el-form-item v-for="field in CAMERA_VECTORS" :key="field.key" :label="field.label">
        <div class="flex gap-4px">
          <el-input-number
            v-for="i in AXES"
            :key="i"
            v-model="formData.camera[field.key][i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            class="!w-1/3"
            @change="commit('patch-camera', { [field.key]: [...formData.camera[field.key]] })"
          />
        </div>
      </el-form-item>
      <el-form-item label="视角（度）">
        <el-slider
          v-model="formData.camera.fov"
          :min="15"
          :max="100"
          @change="commit('patch-camera', { fov: formData.camera.fov })"
        />
      </el-form-item>
      <el-form-item label="横滚（度）">
        <el-slider
          v-model="formData.camera.roll"
          :min="-180"
          :max="180"
          @change="commit('patch-camera', { roll: formData.camera.roll })"
        />
      </el-form-item>
      <el-form-item label="到下一关键帧的插值">
        <el-select
          v-model="formData.camera.ease"
          @change="commit('patch-camera', { ease: formData.camera.ease })"
        >
          <el-option
            v-for="(label, value) in directorEases"
            :key="value"
            :label="label"
            :value="value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="跟随对象">
        <el-select
          v-model="formData.follow.objectId"
          @change="commit('follow', formData.follow.objectId)"
        >
          <el-option label="不跟随" value="" />
          <el-option
            v-for="item in document.objects"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <template v-if="document.camera.follow">
        <el-form-item label="跟随方式">
          <el-radio-group
            v-model="formData.follow.mode"
            @change="commit('patch-follow', { mode: formData.follow.mode })"
          >
            <el-radio-button value="aim">只瞄准</el-radio-button>
            <el-radio-button value="follow">跟拍</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="瞄准高度（米）">
          <el-input-number
            v-model="formData.follow.height"
            :min="0"
            :max="3"
            :step="0.1"
            @change="commit('patch-follow', { height: formData.follow.height })"
          />
        </el-form-item>
      </template>
      <el-button :disabled="!frame" @click="emit('delete-key')">删除本帧关键帧</el-button>
    </el-form>

    <!-- 场景对象 -->
    <el-form v-else-if="object" :model="formData" label-position="top" size="small" class="p-12px">
      <div class="mb-8px flex items-center justify-between">
        <span class="text-14px font-600">{{ directorKinds[object.kind] }}</span>
        <div>
          <el-button link @click="emit('duplicate')">复制</el-button>
          <el-button link type="danger" :disabled="object.locked" @click="emit('remove')">
            删除
          </el-button>
        </div>
      </div>
      <!-- 锁定：仍可查看全部属性，解锁后再调整 -->
      <el-alert
        v-if="object.locked"
        type="warning"
        :closable="false"
        show-icon
        title="已锁定：可查看属性，解锁后再调整"
        class="mb-8px"
      />
      <el-form-item label="名称">
        <el-input
          v-model="formData.name"
          maxlength="100"
          :disabled="object.locked"
          @change="commit('patch-object', { name: formData.name.trim() || object.name })"
        />
      </el-form-item>
      <el-form-item label="颜色 / 显示 / 锁定">
        <div class="flex items-center gap-12px">
          <el-color-picker
            v-model="formData.color"
            :clearable="false"
            :disabled="object.locked"
            @change="commit('patch-object', { color: formData.color || object.color })"
          />
          <el-switch
            v-model="formData.visible"
            active-text="显示"
            @change="commit('patch-object', { visible: formData.visible })"
          />
          <el-switch
            v-model="formData.locked"
            active-text="锁定"
            @change="commit('patch-object', { locked: formData.locked })"
          />
        </div>
      </el-form-item>
      <el-form-item label="缩放">
        <div class="flex gap-4px">
          <el-input-number
            v-for="i in AXES"
            :key="i"
            v-model="formData.scale[i]"
            :step="0.1"
            :min="0.1"
            :max="20"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @change="commit('patch-object', { scale: [...formData.scale] })"
          />
        </div>
      </el-form-item>
      <el-divider content-position="left">第 {{ frame }} 帧</el-divider>
      <el-form-item label="位置（米）">
        <div class="flex gap-4px">
          <el-input-number
            v-for="i in AXES"
            :key="i"
            v-model="formData.position[i]"
            :step="0.1"
            :min="-100"
            :max="100"
            :controls="false"
            :disabled="object.locked"
            class="!w-1/3"
            @change="commit('patch-key', { position: [...formData.position] })"
          />
        </div>
      </el-form-item>
      <el-form-item label="朝向（度）">
        <el-slider
          v-model="formData.yaw"
          :min="-180"
          :max="180"
          :disabled="object.locked"
          @change="commit('patch-key', { yaw: formData.yaw })"
        />
      </el-form-item>
      <div class="flex gap-8px">
        <el-form-item v-if="object.kind === 'actor'" label="基础动作" class="flex-1">
          <el-select
            v-model="formData.action"
            :disabled="object.locked"
            @change="commit('patch-key', { action: formData.action })"
          >
            <el-option
              v-for="(label, value) in directorActions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="插值" class="flex-1">
          <el-select
            v-model="formData.ease"
            :disabled="object.locked"
            @change="commit('patch-key', { ease: formData.ease })"
          >
            <el-option
              v-for="(label, value) in directorEases"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </div>
      <el-button :disabled="!frame || object.locked" class="mb-12px" @click="emit('delete-key')">
        删除本帧关键帧
      </el-button>

      <!-- 人物：朝向、注视、姿态、动作片段 -->
      <template v-if="object.kind === 'actor'">
        <el-form-item label="朝向与注视">
          <div class="w-full">
            <el-checkbox
              v-model="formData.autoFace"
              :disabled="object.locked"
              @change="commit('patch-object', { autoFace: formData.autoFace })"
            >
              沿移动方向自动转身
            </el-checkbox>
            <el-select
              v-model="formData.lookAtId"
              placeholder="注视对象"
              :disabled="object.locked"
              class="mt-4px !w-full"
              @change="commit('patch-object', { lookAtId: formData.lookAtId || undefined })"
            >
              <el-option label="不注视" value="" />
              <el-option
                v-for="item in others"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-divider content-position="left">关节姿态</el-divider>
        <el-form-item label="关节">
          <el-select :model-value="joint" @change="(value) => emit('joint', value)">
            <el-option
              v-for="(label, value) in directorJoints"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角度 X / Y / Z（度）">
          <div class="flex gap-4px">
            <el-input-number
              v-for="i in AXES"
              :key="i"
              v-model="formData.jointRotation[i]"
              :min="-180"
              :max="180"
              :controls="false"
              :disabled="object.locked"
              class="!w-1/3"
              @change="commit('joint-rotation', joint, [...formData.jointRotation])"
            />
          </div>
        </el-form-item>
        <div class="mb-12px flex flex-wrap gap-4px">
          <el-button @click="emit('copy-pose')">复制姿态</el-button>
          <el-button :disabled="!canPaste || object.locked" @click="emit('paste-pose')">
            粘贴姿态
          </el-button>
          <el-button :disabled="object.locked" @click="emit('mirror-pose')">左右镜像</el-button>
        </div>
        <el-divider content-position="left">动作片段</el-divider>
        <div class="mb-8px flex gap-4px">
          <el-select v-model="clipAction" class="flex-1">
            <el-option
              v-for="(label, value) in directorActions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
          <el-button :disabled="object.locked" @click="emit('add-clip', clipAction)">
            从当前帧添加
          </el-button>
        </div>
        <div
          v-for="clip in formData.clips"
          :key="clip.id"
          class="director-clip"
          :class="{ 'is-active': clip.id === selectedClip }"
        >
          <div class="flex items-center justify-between">
            <span class="text-13px"
              >{{ directorActions[clip.action] }} · {{ clip.start }}–{{ clip.end }} 帧</span
            >
            <el-button
              link
              type="danger"
              :disabled="object.locked"
              @click="emit('remove-clip', clip.id)"
            >
              删除
            </el-button>
          </div>
          <div class="grid grid-cols-3 gap-4px">
            <el-input-number
              v-for="field in CLIP_FIELDS"
              :key="field.key"
              v-model="clip[field.key]"
              :min="field.min"
              :max="field.key === 'end' ? end + 1 : field.max"
              :step="field.step"
              :controls="false"
              :disabled="object.locked"
              :placeholder="field.label"
              :title="field.label"
              @change="commit('patch-clip', clip.id, { [field.key]: clip[field.key] })"
            />
          </div>
          <div
            class="mt-2px grid grid-cols-3 gap-4px text-11px text-[var(--el-text-color-secondary)]"
          >
            <span v-for="field in CLIP_FIELDS" :key="field.key">{{ field.label }}</span>
          </div>
        </div>
      </template>
    </el-form>
    <el-empty v-else description="在视口或时间轴中选择对象、摄影机" :image-size="80" />
  </el-scrollbar>
</template>

<script setup lang="ts">
import {
  cameraAt,
  cloneDirector,
  directorActions,
  directorEases,
  directorJoints,
  directorKinds,
  objectAt,
  totalFrames,
  type ActionClip,
  type DirectorAction,
  type DirectorDocument,
  type DirectorEase,
  type DirectorJoint,
  type Vec3
} from './director'

/** AI 短剧 3D 导演：属性 */
defineOptions({ name: 'AiDramaDirectorInspector' })

const props = defineProps<{
  document: DirectorDocument
  selected: string
  frame: number
  joint: DirectorJoint
  selectedClip: string
  canPaste: boolean
}>()
const emit = defineEmits([
  'patch-object',
  'patch-key',
  'patch-camera',
  'delete-key',
  'remove',
  'duplicate',
  'joint',
  'joint-rotation',
  'copy-pose',
  'paste-pose',
  'mirror-pose',
  'add-clip',
  'patch-clip',
  'remove-clip',
  'follow',
  'patch-follow'
])

const AXES = [0, 1, 2] as const
const CAMERA_VECTORS = [
  { key: 'position', label: '机位（米）' },
  { key: 'target', label: '拍摄目标（米）' }
] as const
const CLIP_FIELDS: {
  key: keyof ActionClip & ('start' | 'end' | 'speed' | 'strength' | 'blend')
  label: string
  min: number
  max: number
  step: number
}[] = [
  { key: 'start', label: '开始帧', min: 0, max: 1440, step: 1 },
  { key: 'end', label: '结束帧', min: 1, max: 1440, step: 1 },
  { key: 'blend', label: '过渡帧', min: 0, max: 720, step: 1 },
  { key: 'speed', label: '速度', min: 0.25, max: 3, step: 0.05 },
  { key: 'strength', label: '幅度', min: 0, max: 1.5, step: 0.05 }
]

const clipAction = ref<DirectorAction>('walk')

const end = computed(() => totalFrames(props.document) - 1)
const object = computed(() => props.document.objects.find((item) => item.id === props.selected))
const others = computed(() => props.document.objects.filter((item) => item.id !== props.selected))

/**
 * 编辑中的属性：输入框双向绑定这里，change 时提交到导演工程；
 * 工程、选中对象、当前帧变化时按工程重新填充，校验未通过时也回到工程中的实际值
 */
const formData = reactive({
  name: '',
  color: '',
  visible: true,
  locked: false,
  scale: [1, 1, 1] as Vec3,
  autoFace: false,
  lookAtId: '',
  position: [0, 0, 0] as Vec3,
  yaw: 0,
  action: 'idle' as DirectorAction,
  ease: 'linear' as DirectorEase,
  jointRotation: [0, 0, 0] as Vec3,
  clips: [] as ActionClip[],
  camera: {
    position: [0, 0, 0] as Vec3,
    target: [0, 0, 0] as Vec3,
    fov: 45,
    roll: 0,
    ease: 'linear' as DirectorEase
  },
  follow: { objectId: '', mode: 'aim' as 'aim' | 'follow', height: 0 }
})

const resetFormData = () => {
  const item = object.value
  if (item) {
    const key = objectAt(item, props.frame)
    Object.assign(formData, {
      name: item.name,
      color: item.color,
      visible: item.visible,
      locked: item.locked,
      scale: [...item.scale],
      autoFace: !!item.autoFace,
      lookAtId: item.lookAtId || '',
      position: [...key.position],
      yaw: key.yaw,
      action: key.action,
      ease: key.ease || 'linear',
      jointRotation: [...(key.pose?.[props.joint] || [0, 0, 0])],
      clips: cloneDirector(item.clips || [])
    })
  }
  const camera = cameraAt(props.document, props.frame)
  const follow = props.document.camera.follow
  formData.camera = {
    position: [...camera.position],
    target: [...camera.target],
    fov: camera.fov,
    roll: camera.roll,
    ease: camera.ease || 'linear'
  }
  formData.follow = {
    objectId: follow?.objectId || '',
    mode: follow?.mode || 'aim',
    height: follow?.height ?? 0
  }
}
watch(() => [props.document, props.selected, props.frame, props.joint], resetFormData, {
  immediate: true
})

/** 提交修改：父组件更新工程后重新填充，校验未通过（工程未变）时回到实际值 */
const commit = (event: string, ...args: any[]) => {
  emit(event as any, ...args)
  nextTick(resetFormData)
}
</script>

<style lang="scss" scoped>
.director-inspector {
  width: 320px;
  height: 100%;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}

.director-clip {
  padding: 8px;
  margin-bottom: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;

  &.is-active {
    border-color: var(--el-color-primary);
  }
}
</style>
