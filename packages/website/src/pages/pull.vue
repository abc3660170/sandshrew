<template>
  <el-container>
    <el-main>
      <div
        class="panel"
        v-loading="downloading"
        element-loading-text="下载中请不用关闭页面！！！"
      >
        <download-list
          v-model:pkgArr="picked"
          @start-download="downloading = true"
          @end-download="downloading = false"
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
    </el-main>
    <el-footer class="footer"
      >
      <router-link to="/push">
        去导入界面
      </router-link>
      </el-footer
    >
  </el-container>
</template>

<script>
import PackageDetail from "../components/PackageDetail";
import debounce from "debounce";
import mixins from "../mixins/mixins";
import DownloadList from "../components/DownloadList";
export default {
  name: "Pull",
  mixins: [mixins],
  data() {
    return {
      list: [],
      loading: false,
      downloading: false,
      detail: null,
      keyword: '',
      picked: new Set(),
    };
  },
  components: {
    PackageDetail,
    DownloadList,
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
    },
  },
  async created() {
    this.$emit('title-change',  'NPM包-导出');
    this.getSuggestion = debounce((q, callback) => {
      this.getAxios()
        .get(`/npmjs/suggestions?q=${q}`)
        .then((response) => {
          callback(null, response.data);
        })
        .catch((e) => {
          callback(e);
        });
    }, 400);
  },
};
</script>

<style>
h1 {
  text-align: center;
}

.panel {
  width: 800px;
  min-height: 400px;
  background: #eeeeee;
  margin: 0 auto;
}
.footer {
  text-align: center;
}
</style>
