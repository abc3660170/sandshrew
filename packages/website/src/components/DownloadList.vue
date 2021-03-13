<template>
  <div class="downloadList" v-if="pkgArr.size > 0">
    <label>已选择的包：</label>
    <el-tag
      v-for="item in pkgArr"
      :key="item"
      type="success"
      closable
      @close="handleCloseTag(item)"
      class="tag"
      >{{ item }}</el-tag
    >
    <el-button type="primary" size="small" @click="download">下载</el-button>
  </div>
</template>

<script>
import mixins from "../mixins/mixins";
import { INUSED, MEMLOW } from "../../../../utils/errorCode";
export default {
  name: "DownloadList",
  mixins: [mixins],
  props: {
    pkgArr: Set,
  },
  emits: ["update:pkgArr"],
  data() {
    return {
      cloned: [],
    };
  },
  methods: {
    handleCloseTag(tag) {
      this.cloned = new Set(this.pkgArr);
      this.cloned.delete(tag);
      this.$emit("update:pkgArr", this.cloned);
    },
    defaultZipFile() {
      const date = new Date().toISOString();
      const legalDateStr = date.replace(/[^0-9]*/g, "");
      return `to内网陈涛${legalDateStr}.zip`;
    },
    async askForFileName() {
      return await this.$prompt("请输入下载的文件名称", "提示", {
        inputValue: this.defaultZipFile(),
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /(.+)\.zip$/,
        inputErrorMessage: "文件名称格式不对",
      });
    },
    async download() {
      const { value: zipFile } = await this.askForFileName();
      this.$emit("start-download");
      const data = Array.from(this.pkgArr);
      const response = await this.getAxios().post("/npmjs/download", data, {
        responseType: "blob",
        validateStatus: () => {
          return true; // I'm always returning true, you may want to do it depending on the status received
        },
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
      });
      if (response.status === 200) {
        const url = URL.createObjectURL(
          new Blob([response.data], { type: "application/zip" })
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = zipFile;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        this.$emit("update:pkgArr", new Set());
      } else if (response.status === 500) {
        var enc = new TextDecoder("utf-8");
        const ab = await response.data.arrayBuffer();
        const error = JSON.parse(enc.decode(new Uint8Array(ab)));
        if ([MEMLOW, INUSED].includes(error.code)) {
          this.$message.error(error.message);
        }
      }
      this.$emit("end-download");
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.downloadList {
  padding: 4px;
}
.tag {
  margin: 0 5px;
}
</style>
