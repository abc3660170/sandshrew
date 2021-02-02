<template>
  <input type='text' @keyup="fetchPackageList" v-model="keyword">
  <div>
    <label>已选择的包：</label>
    {{ pcikedHtml }}
    <button v-if="picked.size > 0" @click="download">下载</button>
  </div>
  <package-list :list="list" @view-detail="fetchPackage" v-if="!detail"></package-list>
  <button v-if="detail" @click="handleReturn">返回</button>
  <package-detail v-bind="detail" v-if="detail" @pick="handlePicked"></package-detail>
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
      keyword:"",
      picked:new Set()
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
          const response = await axios.get(`/npmjs/package/${packageName}/document`);
          this.detail = response.data;
    },
    handleReturn(){
      this.detail = null
      this.keyword = "";
      this.list = []
    },
    handlePicked(val){
      this.picked.add(val);
      this.handleReturn();
    },
    zipFile(){
      const date = new Date().toISOString()
      const legalDateStr = date.replace(/[^0-9]*/g,"");
      return `to内网陈涛${legalDateStr}.zip`
    },
    async download(){
      alert('已经开始下载了，请不用关闭此页面！')
      const data = Array.from(this.picked);
      this.picked = new Set();
      const response = await axios.post('/npmjs/download', data, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      })
      const url = URL.createObjectURL(new Blob([response.data],{type:'application/zip'}));
      const link = document.createElement('a');
      link.href = url
      link.download = this.zipFile()
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
    }
  },
  computed:{
    pcikedHtml(){
      return Array.from(this.picked).join(',');
    }
  },
  created(){
    this.getSuggestion = debounce((q, callback) => {
            axios.get(`/npmjs/suggestions?q=${q}`).then(response => {
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
