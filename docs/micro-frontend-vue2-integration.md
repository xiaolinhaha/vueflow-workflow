# 将本项目嵌入 Vue2 的前端微服务方案

本文档给出两条落地路径，并包含完整的接入步骤与示例代码：

- 方案 A（推荐）: 使用 Qiankun 将本项目作为子应用嵌入 Vue2 主应用
- 方案 B（轻量）: 将页面/组件封装为 Web Component，在 Vue2 中作为自定义元素使用

## 背景与目标
- 目标：在现有 Vue2 框架项目中嵌入本仓库（Vue3 + Vite）的能力模块/页面，保持开发与部署解耦。
- 本仓库当前默认入口为 `v2`，也可切换至 `v1`，两者均可作为子应用接入。
- Node/Vite 版本：当前使用官方 `vite@6.x`（Node 18+ 即可）。如需使用 `rolldown-vite`，请升级 Node 至 `20.19+` 或 `22.12+`。

---

## 方案 A：Qiankun 微前端（推荐）
适用于完整页面与路由的嵌入，子应用可独立开发与部署。Vue2 主应用作为基座，按路由或菜单加载子应用。

### 1）子应用改造（本仓库）
1. 安装插件（子应用，仅本仓库）：
   ```bash
   pnpm add vite-plugin-qiankun -D
   ```

2. 在 `vite.config.ts` 中启用 qiankun 子应用模式（示例）：
   ```ts
   // vite.config.ts
   import { defineConfig } from 'vite'
   import vue from '@vitejs/plugin-vue'
   import tailwindcss from '@tailwindcss/vite'
   import qiankun from 'vite-plugin-qiankun'

   export default defineConfig({
     base: './',
     plugins: [
       vue(),
       tailwindcss(),
       // 子应用名称可自定义：'workflow-app'
       qiankun('workflow-app', { useDevMode: true }),
     ],
     server: { port: 3000 },
   })
   ```

3. 新建子应用入口并导出生命周期（本仓库）：`src/micro/main-qiankun.ts`
   ```ts
   // src/micro/main-qiankun.ts
   import { createApp } from 'vue'
   import { createPinia } from 'pinia'
   import naive from 'naive-ui'
   import App from '@/v2/App.vue' // 或切换到 '@/v1/App.vue'
   import router from '@/v2/router' // 或切换到 '@/v1/router'

   let app: ReturnType<typeof createApp> | null = null

   function render(props: any = {}) {
     const { container } = props
     // 容器优先使用基座传入的节点，否则回退到默认 #app
     const mountEl = container?.querySelector('#app') || document.getElementById('app')
     if (!mountEl) throw new Error('Mount element not found')

     app = createApp(App)
     app.use(createPinia())
     app.use(router)
     app.use(naive)
     app.mount(mountEl)
   }

   // qiankun 生命周期
   export async function bootstrap() {
     // 可做一次性初始化，例如预加载资源
   }

   export async function mount(props: any) {
     render(props)
   }

   export async function unmount() {
     app?.unmount()
     app = null
   }

   // 独立运行（开发模式）
   // 当不在 qiankun 环境下时，直接渲染以方便本地开发
   // @ts-ignore
   if (!(window as any).__POWERED_BY_QIANKUN__) {
     render()
   }
   ```

4. 开发与本地调试：
   - 子应用独立启动：`pnpm run dev`（开发时仍可独立访问 `http://localhost:3000/`）
   - `useDevMode: true` 能确保子应用在 qiankun 与独立运行两种模式下都可正常工作。

5. 构建与部署（子应用）：
   - 构建：`pnpm run build`，将 `dist/` 部署到子应用域名或路径。
   - 生产环境中，基座以 `entry`（URL）形式远程加载子应用资源。

### 2）主应用（Vue2 基座）接入
1. 安装 qiankun（主应用）：
   ```bash
   npm i qiankun --save
   ```

2. 在 Vue2 基座注册子应用：
   ```js
   // main.js（Vue2 基座）
   import Vue from 'vue'
   import App from './App.vue'
   import router from './router'
   import { registerMicroApps, start } from 'qiankun'

   // 基座页面中准备容器：<div id="subapp-container"></div>

   registerMicroApps([
     {
       name: 'workflow-app',
       entry: 'http://localhost:3000/', // 子应用地址（开发环境）
       container: '#subapp-container',
       // 如果基座采用 hash 路由，可用函数激活规则：
       activeRule: (location) => location.hash.startsWith('#/workflow'),
     },
   ])

   start({
     sandbox: { experimentalStyleIsolation: true },
   })

   new Vue({ router, render: h => h(App) }).$mount('#app')
   ```

3. 基座路由示例（Vue2）：
   ```js
   // router.js（Vue2 基座）
   export default new Router({
     mode: 'hash',
     routes: [
       {
         path: '/workflow',
         name: 'Workflow',
         component: { template: '<div id="subapp-container" style="height:100%"></div>' },
       },
     ],
   })
   ```

4. 通信方式（常见）：
   - Props 传递：基座在 `mount(props)` 中传给子应用，自定义 `props` 字段（如 `userInfo`、`token`）。
   - 事件通信：子应用 `window.dispatchEvent(new CustomEvent('workflow:event', { detail }))`，基座监听 `window.addEventListener('workflow:event', handler)`。
   - 全局状态：避免直接共享全局变量，建议通过消息或 props 注入。

5. 常见问题与建议：
   - 路由模式：子应用默认使用 hash 路由，通常与基座 hash 路由兼容；如需 history 路由，建议为子应用设置独立 `base` 前缀。
   - 样式隔离：启用 `sandbox.experimentalStyleIsolation` 或在子应用使用命名空间样式，避免 CSS 污染。
   - 跨域与静态资源：生产环境需正确配置子应用部署路径与跨域策略；建议开启资源版本化与缓存控制。

---

## 方案 B：Web Component（自定义元素，适合小部件）
适用于单页面/组件的嵌入，不依赖复杂路由与全局插件。

### 1）子应用封装为自定义元素
1. 创建一个独立的可视组件（例如 `WorkflowWidget.vue`），尽量避免依赖路由；
2. 注册为自定义元素：
   ```ts
   // src/ce/register.ts
   import { defineCustomElement } from 'vue'
   import WorkflowWidget from '@/v2/components/WorkflowWidget.vue'

   const Element = defineCustomElement(WorkflowWidget)
   customElements.define('workflow-widget', Element)
   ```

3. 使用 Vite library 模式打包：
   ```bash
   vite build --config vite.config.ts --outDir dist-ce
   ```
   - 或在 `vite.config.ts` 配置 `build.lib` 并输出单文件 bundle；注意样式与 Shadow DOM。

### 2）在 Vue2 主应用中使用
1. 通过 `<script src="/path/to/workflow-widget.js"></script>` 引入自定义元素脚本；
2. 在任何模板中直接使用：
   ```html
   <workflow-widget data-token="xxx" style="width:100%;height:600px"></workflow-widget>
   ```
3. 事件与通信：
   - 通过属性/自定义事件（`CustomEvent`）传递参数与监听结果；
   - 复杂状态建议改为 Qiankun 方案。

### 对比与适用性
- Web Component：集成成本最低、对主应用友好；但不适合复杂路由与跨模块状态。
- Qiankun：适合完整页面与模块，多路由、状态管理、接口代理更灵活；部署与调试成本略高。

---

## 快速决策建议
- 若希望嵌入“完整页面/工作流编辑器”：选择 方案 A（Qiankun）。
- 若只嵌入“小型组件/Widget”：选择 方案 B（Web Component）。

---

## 参考与后续
- Qiankun 官方文档：https://qiankun.umijs.org/
- Vue3 自定义元素（Web Components）：https://vuejs.org/guide/extras/web-components.html
- 需要我将本仓库直接改造为 Qiankun 子应用（插件安装、入口创建、配置调优）或输出 Web Component 打包脚本，可告知你的偏好路径，我将按上述步骤落地并协助联调。