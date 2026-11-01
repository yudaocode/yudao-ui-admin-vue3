<script lang="tsx">
import { defineComponent, unref, computed, PropType, ref } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import type { ComponentSize } from 'element-plus'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'
import { useAppStore } from '@/store/modules/app'
import type { ColumnPreference, TableColumn } from '../types'
import ColumnSetting from './ColumnSetting.vue'

// 让 div 形式的操作按钮支持键盘 Enter / 空格触发
const onKeyActivate = (handler: () => void) => (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handler()
  }
}

export default defineComponent({
  name: 'TableActions',
  components: {
    ColumnSetting
  },
  props: {
    // 当前列（已叠加用户偏好的渲染列）
    columns: {
      type: Array as PropType<TableColumn[]>,
      default: () => []
    },
    // 列设置“还原”使用的默认列
    defaultColumns: {
      type: Array as PropType<TableColumn[]>,
      default: undefined
    }
  },
  // confirm 事件参数为 ColumnPreference[]（按草稿顺序，仅 key / hidden / fixed）
  emits: ['refresh', 'changSize', 'confirm'],
  setup(props, { emit }) {
    const appStore = useAppStore()
    const { t } = useI18n()
    const sizeMap = computed(() => appStore.sizeMap)
    const showSetting = ref(false)

    const refresh = () => {
      emit('refresh')
    }

    const changSize = (size: ComponentSize) => {
      emit('changSize', size)
    }

    const confirm = (preferences: ColumnPreference[]) => {
      emit('confirm', preferences)
    }

    const showColumnSetting = () => {
      showSetting.value = true
    }

    return () => (
      <>
        <div class="text-right h-28px flex items-center justify-end">
          <div
            title="刷新"
            aria-label="刷新"
            role="button"
            tabindex={0}
            class="w-30px h-20px flex items-center justify-end cursor-pointer"
            onClick={refresh}
            onKeydown={onKeyActivate(refresh)}
          >
            <Icon icon="ant-design:sync-outlined" />
          </div>

          <ElDropdown trigger="click" onCommand={changSize}>
            {{
              default: () => {
                return (
                  <div
                    title="尺寸"
                    aria-label="尺寸"
                    class="w-30px h-20px flex items-center justify-end cursor-pointer"
                  >
                    <Icon icon="ant-design:column-height-outlined" />
                  </div>
                )
              },
              dropdown: () => {
                return (
                  <ElDropdownMenu>
                    {{
                      default: () => {
                        return unref(sizeMap).map((v) => {
                          return (
                            <ElDropdownItem key={v} command={v}>
                              {t(`size.${v}`)}
                            </ElDropdownItem>
                          )
                        })
                      }
                    }}
                  </ElDropdownMenu>
                )
              }
            }}
          </ElDropdown>

          <div
            title="列设置"
            aria-label="列设置"
            role="button"
            tabindex={0}
            class="w-30px h-20px flex items-center justify-end cursor-pointer"
            onClick={showColumnSetting}
            onKeydown={onKeyActivate(showColumnSetting)}
          >
            <Icon icon="ant-design:setting-outlined" />
          </div>
        </div>
        <ColumnSetting
          v-model={showSetting.value}
          columns={props.columns}
          defaultColumns={props.defaultColumns}
          onConfirm={confirm}
        />
      </>
    )
  }
})
</script>
