<template>
  <div class="w-full h-full">
    <n-config-provider>
      <n-message-provider>
        <CanvasView />
      </n-message-provider>
    </n-config-provider>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { createPinia, setActivePinia } from "pinia";
import CanvasView from "@/v2/features/canvas/CanvasView.vue";

// 在组件作用域内启用 Pinia（无需 app.use）
onMounted(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
});
</script>
<style scoped>
:host {
  display: block;
}
</style>
