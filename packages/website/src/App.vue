<template>
  <div id="app">
    <header>
      <div class="inner">
        <div class="logoWrap"> <div class="logo"></div>
        <div class="title">{{ title }}</div></div>
       
        <el-menu router :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
          <el-sub-menu index="/npmjs">
        <template #title>Npmjs</template>
          <el-menu-item index="/npmjs/pull">pull</el-menu-item>
          <el-menu-item index="/npmjs/push">push</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/docker">
        <template #title>Docker</template>
          <el-menu-item index="/docker/pull">pull</el-menu-item>
          <el-menu-item index="/docker/push">push</el-menu-item>
        </el-sub-menu>
        </el-menu>
        <npmrc></npmrc>
      </div>
    </header>
    <div class="main">
      <router-view @title-change="handleChange"></router-view>
    </div>
  </div>
</template>
<script lang="ts" setup name="App">
import { computed, ref, watch } from "vue";
import Npmrc from "./components/Npmrc.vue";
import router from "./router";

const activeIndex = ref('')
const xx = computed(() => {
  return router.currentRoute.value.path
})

watch(xx, (newVal) => {
  activeIndex.value = newVal
})
const title = ref('');
const handleChange = (newTitle: string) => {
  title.value = newTitle;
};
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>
<style lang="scss">
html {
  background: #E9EBEF;
}

ul {
  list-style: none;
  -webkit-padding-start: 0;
}

li {
  list-style: none;
}
:root {
  --el-bg-color-overlay: #fff !important;
  --el-menu-text-color: #fff !important;
  --el-menu-bg-color: #8691A7 !important;
  --el-menu-active-color: #ffc040 !important;
  --el-menu-hover-bg-color: transparent !important;
  --el-menu-border-color: transparent !important;
}
</style>
<style lang="scss" scoped>

header {
  background-color: #8691A7;
  min-height: 60px;
  box-shadow: 1px 0px 8px rgba(#1b2538, 0.4);

  .inner {
    position: relative;
    width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-flow: row nowrap;
    .logoWrap {
      display: flex;
      flex-flow: row nowrap;
      align-items: center;
    }
    .el-menu-demo {
      margin-inline: 25px;
      flex: 1;
    }
  }

  .logo {
    margin: 10px;
    width: 40px;
    height: 40px;
    background: url('./assets/logo.svg');
  }

  .title {
    line-height: 60px;
    color: #fff;
    font-size: 20px;
  }
}

.main {
  width: 1200px;
  margin: 0 auto;
}
</style>
