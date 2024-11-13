import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useMenuQueryStore = defineStore('menuQuery', () => {
  const menuQuery = ref<any>({});

  function setMenuQuery(data: any) {
    menuQuery.value = data;
  }

  function clearMenuQuery() {
    menuQuery.value = null;
  }

  return { menuQuery, setMenuQuery, clearMenuQuery };
});