import { createApp } from 'vue'; // 引入 Vue 的 createApp 函数
import App from './App.vue'; // 引入主组件 App
import 'normalize.css'; // 引入 normalize.css 重置默认样式
import 'element-plus/dist/index.css'; // 引入 Element Plus 的 CSS
import router from './router'; // 引入路由配置
import ElementPlus from 'element-plus'; // 引入 Element Plus 库
import * as ElementPlusIconsVue from '@element-plus/icons-vue'; // 引入所有 Element Plus 图标

const app = createApp(App); // 创建 Vue 应用实例

// 注册所有 Element Plus 图标为全局组件
Object.entries(ElementPlusIconsVue).forEach(([key, component]) => {
    app.component(key, component);
});

app.use(router); // 使用路由
app.use(ElementPlus); // 使用 Element Plus
app.mount('#app'); // 挂载应用到 id 为 'app' 的 DOM 元素
