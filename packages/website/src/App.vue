<template>
  <input type='text' @keyup="fetchPackageList" v-model="keyword">
  <package-list :list="list" @view-detail="fetchPackage" v-if="!detail"></package-list>
  <button v-if="detail" @click="handleReturn">返回</button>
  <package-detail v-bind="detail" v-if="detail"></package-detail>
</template>

<script>
import axios from "axios";
import PackageList from "./components/PackageList";
import PackageDetail from './components/PackageDetail';
import debounce from "debounce";
export default {
  name: 'App',
  data(){
    return {
      list:[],
      detail:null,
      keyword:""
    }
  },
  components: {
    PackageList,
    PackageDetail
  },
  methods:{
    async fetchPackageList(ev){
         this.detail = null;
         const q = ev.target.value;
         this.getSuggestion(q, (error, data) => {
           if(!error){
             this.list = data;
           }
           
         });
    },
    async fetchPackage(packageName){
          const response = await axios.get(`http://127.0.0.1:3000/npmjs/package/${packageName}/document`);
          this.detail = response.data;
    },
    handleReturn(){
      this.detail = null
      this.keyword = "";
      this.list = []
    }
  },
  created(){
    this.getSuggestion = debounce((q, callback) => {
            axios.get(`http://127.0.0.1:3000/npmjs/suggestions?q=${q}`).then(response => {
                callback(null, response.data)
            }).catch(e => {
              callback(e)
            })
    },400)
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
