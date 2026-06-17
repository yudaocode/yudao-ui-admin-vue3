<script lang="ts" setup>
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import type { VbenLayoutType } from '@/types/layout'

defineOptions({ name: 'LayoutRadioPicker' })

const { t } = useI18n()
const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('layout-radio-picker')

const appStore = useAppStore()

const layout = computed(() => appStore.getLayout)

const layouts: { className: string; label: string; type: VbenLayoutType }[] = [
  {
    className: 'sidebar-nav',
    label: t('setting.vertical'),
    type: 'sidebar-nav'
  },
  {
    className: 'sidebar-mixed-nav',
    label: t('setting.twoColumn'),
    type: 'sidebar-mixed-nav'
  },
  {
    className: 'header-nav',
    label: t('setting.horizontal'),
    type: 'header-nav'
  },
  {
    className: 'header-sidebar-nav',
    label: t('setting.headerSidebarNav'),
    type: 'header-sidebar-nav'
  },
  {
    className: 'mixed-nav',
    label: t('setting.mixedMenu'),
    type: 'mixed-nav'
  },
  {
    className: 'header-mixed-nav',
    label: t('setting.headerTwoColumn'),
    type: 'header-mixed-nav'
  }
]
</script>

<template>
  <div :class="prefixCls" class="grid grid-cols-3 gap-14px">
    <div
      v-for="item in layouts"
      :key="item.type"
      class="flex cursor-pointer flex-col items-center gap-6px"
      @click="appStore.setLayout(item.type)"
    >
      <div
        :aria-label="item.label"
        :class="[
          `${prefixCls}__${item.className}`,
          'relative h-48px w-56px bg-gray-300',
          {
            'is-acitve': layout === item.type
          }
        ]"
        :title="item.label"
      >
        <div
          v-if="item.type === 'sidebar-mixed-nav' || item.type === 'header-mixed-nav'"
          class="absolute left-[10%] top-0 h-full w-[33%] bg-gray-200"
        ></div>
      </div>
      <span class="max-w-76px truncate text-12px text-[var(--el-text-color-regular)]">
        {{ item.label }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-layout-radio-picker;

.#{$prefix-cls} {
  &__sidebar-nav {
    border: 2px solid #e5e7eb;
    border-radius: 4px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 33%;
      height: 100%;
      background-color: #273352;
      border-radius: 4px 0 0 4px;
      content: '';
    }

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 25%;
      background-color: #fff;
      border-radius: 4px 4px 0;
      content: '';
    }
  }

  &__header-sidebar-nav,
  &__mixed-nav {
    border: 2px solid #e5e7eb;
    border-radius: 4px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 33%;
      background-color: #273352;
      border-radius: 4px 4px 0 0;
      content: '';
    }

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 33%;
      height: 100%;
      background-color: #fff;
      border-radius: 4px 0 0 4px;
      content: '';
    }
  }

  &__header-nav {
    border: 2px solid #e5e7eb;
    border-radius: 4px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 33%;
      background-color: #273352;
      border-radius: 4px 4px 0 0;
      content: '';
    }
  }

  &__header-mixed-nav,
  &__sidebar-mixed-nav {
    border: 2px solid #e5e7eb;
    border-radius: 4px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 100%;
      height: 33%;
      background-color: #273352;
      border-radius: 4px 4px 0 0;
      content: '';
    }

    &::after {
      position: absolute;
      top: 0;
      left: 0;
      width: 10%;
      height: 100%;
      background-color: #fff;
      border-radius: 4px 0 0 4px;
      content: '';
    }
  }

  &__mixed-nav::after {
    position: absolute;
    top: 33%;
    left: 0;
    width: 33%;
    height: 67%;
    background-color: #fff;
    border-radius: 0 0 0 4px;
    content: '';
  }

  &__header-mixed-nav::after {
    background-color: #273352;
  }

  &__sidebar-mixed-nav::before {
    display: none;
  }

  .is-acitve {
    border-color: var(--el-color-primary);
  }
}
</style>
