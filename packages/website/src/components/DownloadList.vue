<template>
<div class="downloadList" v-if="modelValue.size > 0">
  <label>已选择的包：</label>
    {{ pickedHtml }}
  <button @click="download">下载</button>
</div>
</template>

<script>
import mixins from "../mixins/mixins";
export default {
  name: 'DownloadList',
  mixins:[mixins],
  props: {
    modelValue: Set
  },
  computed: {
    pickedHtml() {
      return Array.from(this.modelValue).join(",");
    }
  },
  methods:{
    defaultZipFile() {
      const date = new Date().toISOString();
      const legalDateStr = date.replace(/[^0-9]*/g, "");
      return `to内网陈涛${legalDateStr}.zip`;
    },
    async askForFileName(){
      return await this.$prompt('请输入下载的文件名称', '提示', {
          inputValue: this.defaultZipFile(),
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /(.+)\.zip$/,
          inputErrorMessage: '文件名称格式不对'
        })
    },
    async download() {
      const {value: zipFile} = await this.askForFileName();
      this.$emit('start-download');
      const data = Array.from(this.modelValue);
      const response = await this.getAxios().post("/npmjs/download", data, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json;charset=UTF-8"
        }
      });
      if (response.status === 226) {
        this.$emit('in-download');
      } else if (response.status === 200) {
        const url = URL.createObjectURL(
          new Blob([response.data], { type: "application/zip" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = zipFile;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        this.$emit('update:modelValue', new Set());
      }
      this.$emit('end-download');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
