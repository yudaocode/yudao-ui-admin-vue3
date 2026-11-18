<script lang="ts" setup>
defineOptions({ name: 'ThemeSwitch' })

const isDark = defineModel<boolean>({ required: true })

const { t } = useI18n()
</script>

<template>
  <ElSwitch
    v-model="isDark"
    inline-prompt
    active-text="☾"
    inactive-text="☀"
    :aria-label="t('layout.toggleDarkMode')"
  />
</template>
