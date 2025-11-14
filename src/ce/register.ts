import { createApp } from "vue";
import WorkflowWidgetRoot from "./WorkflowWidgetRoot.vue";
import { createPinia } from "pinia";
import NaiveUI from "naive-ui";

class WorkflowWidgetElement extends HTMLElement {
  private _app: any | null = null;
  private _root: ShadowRoot | null = null;
  connectedCallback() {
    // 防重复挂载
    if (this._app) return;
    this._root = this.attachShadow({ mode: "open" });
    const mountPoint = document.createElement("div");
    mountPoint.style.cssText = "width:100%;height:100%";
    this._root.appendChild(mountPoint);

    const app = createApp(WorkflowWidgetRoot);
    app.use(createPinia());
    app.use(NaiveUI);
    this._app = app;
    app.mount(mountPoint);
  }
  disconnectedCallback() {
    if (this._app) {
      this._app.unmount();
      this._app = null;
    }
    this._root = null;
  }
}

customElements.define("workflow-widget", WorkflowWidgetElement);
