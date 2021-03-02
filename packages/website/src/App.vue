<template>
  <h1>FEE-NPM-SERVICE-PULL</h1>
  <div
    class="panel"
    v-loading="downloading"
    element-loading-text="下载中请不用关闭页面！！！"
  >
    <download-list
      v-model="picked"
      @start-download="downloading = true"
      @end-download="downloading = false"
      @in-download="handleInused"
    ></download-list>
    <el-select
      v-model="keyword"
      remote
      filterable
      placeholder="请输入你想要查找的包"
      :remote-method="fetchPackageList"
      :loading="loading"
      @change="fetchPackage"
      style="width:100%"
    >
      <el-option
        v-for="packageDoc in list"
        :key="packageDoc.name"
        :label="packageDoc.name"
        :value="packageDoc.name"
      >
      </el-option>
    </el-select>
    <package-detail
      v-model="detail"
      v-if="detail"
      @pick="handlePicked"
    ></package-detail>
  </div>
</template>

<script>
import PackageDetail from "./components/PackageDetail";
import debounce from "debounce";
import mixins from "./mixins/mixins";
import DownloadList from "./components/DownloadList";
export default {
  name: "App",
  mixins: [mixins],
  data() {
    return {
      list: [],
      loading: false,
      downloading: false,
      detail: null,
      keyword: [],
      picked: new Set()
    };
  },
  components: {
    PackageDetail,
    DownloadList
  },
  methods: {
    fetchPackageList(q) {
      this.loading = true;
      this.detail = null;
      this.getSuggestion(q, (error, data) => {
        this.loading = false;
        if (!error) {
          this.list = data;
        }
      });
    },
    handleInused() {
      this.$message({
        message: "有人在使用，待会再试试",
        type: "warning"
      });
    },
    async fetchPackage(packageName) {
      const response = await this.getAxios().get(
        `/npmjs/package/${encodeURIComponent(packageName)}/document`
      );
      this.detail = response.data;
    },

    handleReturn() {
      this.detail = null;
      this.keyword = "";
      this.list = [];
    },
    handlePicked(val) {
      this.picked.add(val);
      this.handleReturn();
    }
  },
  computed: {
    pcikedHtml() {
      return Array.from(this.picked).join(",");
    }
  },
  async created() {
    this.getSuggestion = debounce((q, callback) => {
      this.getAxios()
        .get(`/npmjs/suggestions?q=${q}`)
        .then(response => {
          callback(null, response.data);
        })
        .catch(e => {
          callback(e);
        });
    }, 400);
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
h1 {
  text-align: center;
}

.panel {
  width: 800px;
  height: 400px;
  background: #eeeeee;
  margin: 0 auto;
}
</style>
