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
      <div class="uploadArea">
        <input
          type="file"
          id="uploadPkg"
          @change="handleChange"
          style="display: none"
        />
        <el-button type="text" @click="trggerUpload">上传package.json</el-button>
      </div>
      <router-link to="/push" v-if="showPushLink">
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
      showPushLink: process.env.FRONT_TYPE === 'pelipper'
    };
  },
  components: {
    PackageDetail,
    DownloadList,
  },
  methods: {
    trggerUpload() {
      this.$el.querySelector("#uploadPkg").click();
    },
    handleChange(ev) {
      const fileList = ev.target.files;
      this.upload(fileList[0]);
      ev.target.value = "";
    },
    upload(file) {
      this.uploading = true;
      const uploadFormData = new FormData(); //创建form对象
      uploadFormData.append("file", file); //通过append向form对象添加数据
      this.getAxios()
        .post("/npmjs/resolvePkg", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 0,
        })
        .then((res) => {
          this.picked = new Set(res.data);
        }).catch(() => {
          this.$notify.error({
              title: '解析失败',
              message: '你上传的package.json有问题啊',
              duration: 0
          });
        })
    },
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
  background: rgba(115,153,230,0.08);
  margin: 0 auto;
}
.footer {
  text-align: center;
}
</style>
