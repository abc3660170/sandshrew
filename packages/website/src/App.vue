<template>
  <input type='text' @keyup="fetchPackageList">
  <package-list :list="list" @view-detail="fetchPackage"></package-list>
</template>

<script>
import axios from "axios";
import PackageList from "./components/PackageList";
export default {
  name: 'App',
  data(){
    return {
      list:[]
    }
  },
  components: {
    PackageList
  },
  methods:{
     async fetchPackageList(ev){
         const q = ev.target.value;
         const response = await axios.get(`http://127.0.0.1:3000/npmjs/suggestions?q=${q}`);
         this.list = response.data;
    },
    async fetchPackage(packageName){
          const response = await axios.get(`http://127.0.0.1:3000/npmjs/package/${packageName}/document`);
          console.log(response.data)
          return response.data;
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
