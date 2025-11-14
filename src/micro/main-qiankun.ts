import { createApp } from "vue";
import { createPinia } from "pinia";
import naive from "naive-ui";
import App from "@/v2/App.vue"; // 如需使用 v1，可改为 '@/v1/App.vue'
import router from "@/v2/router"; // 如需使用 v1 路由，可改为 '@/v1/router'

let app: ReturnType<typeof createApp> | null = null;

function render(props: any = {}) {
  const { container } = props;
  const mountEl = container?.querySelector("#app") || document.getElementById("app");
  if (!mountEl) throw new Error("Mount element #app not found");

  app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.use(naive);
  app.mount(mountEl);
}

export async function bootstrap() {
  // 可选：执行一次性初始化逻辑
}

export async function mount(props: any) {
  render(props);
}

export async function unmount() {
  app?.unmount();
  app = null;
}

// 独立运行（非 qiankun 环境）
// @ts-ignore
if (!(window as any).__POWERED_BY_QIANKUN__) {
  render();
}