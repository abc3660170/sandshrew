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
          const response = await this.getAxios().get(`/npmjs/package/${packageName}/document`);
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
      const response = await this.getAxios().post('/npmjs/download', data, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8'
        }
      })
      console.log(response)
      if(response.status === 226){
        alert('有人在用，你先等等');
      } else if(response.status === 200){
        const url = URL.createObjectURL(new Blob([response.data],{type:'application/zip'}));
        const link = document.createElement('a');
        link.href = url
        link.download = this.zipFile()
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
      } 
      
    },
    getAxios(){
      return axios.create({
        baseURL:`${location.protocol}//${location.hostname}:3000`
      })
    }
  },
  computed:{
    pcikedHtml(){
      return Array.from(this.picked).join(',');
    }
  },
  async created(){
    this.getSuggestion = debounce((q, callback) => {
            this.getAxios().get(`/npmjs/suggestions?q=${q}`).then(response => {
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
