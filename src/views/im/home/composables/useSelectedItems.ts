import { computed, type ComputedRef, type Ref } from 'vue'

/**
 * 三态选择面板的「已选数 + 已选项列表」派生
 *
 * - 三态优先级（与 dialog-picker-contract 对齐）：hide > locked > disabled
 *   - hide：永远剔除，不计数 / 不进已选列表
 *   - locked：默认勾选 + 计数 + 优先排在前面；即使被外部塞进 disabledIds 也胜出
 *   - disabled：仅过滤 selectedIds，不计数 / 不进已选列表
 * - 顺序：lockedIds 在前，selectedIds 紧随；按数组顺序即为「点击顺序」
 *
 * FriendPickerPanel / GroupMemberPickerPanel 共用，避免两侧 25 行同构 computed 各写一份；
 * Panel 内部的 isLocked / isDisabled / isSelected 等模板判定函数仍各自维护，本 composable 只承担派生量
 */
export function useSelectedItems<T>(
  selectedIds: () => readonly number[],
  lockedIds: () => readonly number[],
  disabledIds: () => readonly number[],
  hideIds: () => readonly number[],
  byId: Ref<Map<number, T>> | ComputedRef<Map<number, T>>
): {
  selectedCount: ComputedRef<number>
  selectedItems: ComputedRef<T[]>
} {
  const hideSet = computed(() => new Set(hideIds()))
  const disabledSet = computed(() => new Set(disabledIds()))

  const selectedCount = computed(() => {
    const merged = new Set<number>()
    for (const id of selectedIds()) {
      if (hideSet.value.has(id) || disabledSet.value.has(id)) {
        continue
      }
      merged.add(id)
    }
    // locked 仅被 hide 过滤；契约里 locked 胜过 disabled，确保锁定项始终计入
    for (const id of lockedIds()) {
      if (hideSet.value.has(id)) {
        continue
      }
      merged.add(id)
    }
    return merged.size
  })

  const selectedItems = computed(() => {
    const seen = new Set<number>()
    const result: T[] = []
    // locked 在前；仅被 hide 过滤
    for (const id of lockedIds()) {
      if (seen.has(id) || hideSet.value.has(id)) {
        continue
      }
      const item = byId.value.get(id)
      if (item) {
        seen.add(id)
        result.push(item)
      }
    }
    // selectedIds 紧随；额外过滤 disabled
    for (const id of selectedIds()) {
      if (seen.has(id) || disabledSet.value.has(id) || hideSet.value.has(id)) {
        continue
      }
      const item = byId.value.get(id)
      if (item) {
        seen.add(id)
        result.push(item)
      }
    }
    return result
  })

  return { selectedCount, selectedItems }
}
