<template>
  <div id="app">
    <header>
      <div class="inner">
        <div class="logo"></div>
      <div class="title">{{ title }}</div>
      <npmrc></npmrc>
      </div>
    </header>
    <div class="main">
      <router-view @title-change="handleChange"></router-view>
    </div>
  </div>
</template>
<script lang="ts">
import Npmrc from "./components/Npmrc.vue";
export default {
  name: "App",
  components:{
    Npmrc
  },
  data(){
    return {
      title: ''
    }
  },
  methods: {
    handleChange(title: string){
      this.title = title
    }
  }
};
</script>
<style>
html{
  background: #E9EBEF;
}
ul{
  list-style: none;
  -webkit-padding-start: 0;
}
li{
  list-style: none;
}
</style>
<style lang="scss" scoped>
header{
  background-color: #8691A7;
  min-height: 60px;
  box-shadow: 1px 0px 8px rgba(#1b2538, 0.4);
  .inner{
    position: relative;
    width: 1200px;
    margin: 0 auto;
    display: flex;
  }
  .logo{
    margin: 10px;
    width: 40px;
    height: 40px;
    background: url('./assets/logo.svg');
  }

  .title{
    line-height: 60px;
    color: #fff;
    font-size: 20px;
  }
}

.main{
    width: 1200px;
    margin: 0 auto;
  }
</style>
