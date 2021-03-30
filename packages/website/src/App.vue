<template>
  <div id="app">
    <header>
      <div class="inner">
        <div class="logo"></div>
      <div class="title">{{ title }}</div>
      </div>
      
    </header>
    <div class="main">
      <router-view @title-change="handleChange"></router-view>
    </div>
  </div>
</template>
<script>
export default {
  name: "App",
  data(){
    return {
      title: ''
    }
  },
  methods: {
    handleChange(title){
      console.log(title)
      this.title = title
    }
  }
};
</script>
<style>
html{
  background: #E9EBEF;
}
</style>
<style lang="scss" scoped>
header{
  background-color: #8691A7;
  min-height: 60px;
  box-shadow: 1px 0px 7px #000;
  .inner{
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
