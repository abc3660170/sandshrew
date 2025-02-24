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
    <el-footer class="footer">
      <div class="uploadArea">
        <input
          type="file"
          id="uploadPkg"
          @change="handleChange"
          style="display: none"
        />
        <el-button type="primary" @click="triggerUpload">上传package.json</el-button>
      </div>
      <router-link to="/push" v-if="showPushLink">
        去导入界面
      </router-link>
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import PackageDetail from "../components/PackageDetail.vue";
import debounce from "debounce";
import DownloadList from "../components/DownloadList.vue";
import { getAxios, getEnv } from "../utils";
import { ElNotification } from 'element-plus';

export default defineComponent({
  name: "Pull",
  components: {
    PackageDetail,
    DownloadList,
  },
  setup(_, { emit }) {
    const list = ref<any[]>([]);
    const loading = ref(false);
    const downloading = ref(false);
    const detail = ref<any>(null);
    const keyword = ref('');
    const picked = ref<Set<string>>(new Set());
    const showPushLink = ref(false);
    const uploading = ref(false);

    const getSuggestion = debounce(async (q: string, callback: any) => {
      try {
        const response = await getAxios().get(`/npmjs/suggestions?q=${q}`);
        callback(null, response.data);
      } catch (e) {
        callback(e);
      }
    }, 400);

    const triggerUpload = () => {
      document.getElementById("uploadPkg")?.click();
    };

    const handleChange = (ev: Event) => {
      const input = ev.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        const fileList = input.files;
        upload(fileList[0]);
        input.value = "";
      }
    };

    const upload = (file: File) => {
      uploading.value = true;
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      getAxios()
        .post("/npmjs/resolvePkg", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 0,
        })
        .then((res) => {
          picked.value = new Set(res.data);
        })
        .catch(() => {
          ElNotification.error({
            title: '解析失败',
            message: '你上传的package.json有问题啊',
            duration: 0,
          });
        })
        .finally(() => {
          uploading.value = false;
        });
    };

    const fetchPackageList = (q: string) => {
      loading.value = true;
      detail.value = null;
      getSuggestion(q, (error: Error, data: any) => {
        loading.value = false;
        if (!error) {
          list.value = data;
        }
      });
    };

    const fetchPackage = async (packageName: string) => {
      const response = await getAxios().get(
        `/npmjs/package/${encodeURIComponent(packageName)}/document`
      );
      detail.value = response.data;
    };

    const handleReturn = () => {
      detail.value = null;
      keyword.value = "";
      list.value = [];
    };

    const handlePicked = (val: string) => {
      picked.value.add(val);
      handleReturn();
    };

    onMounted(async () => {
      const { fronttype } = await getEnv();
      showPushLink.value = fronttype === 'npmjs';
      emit('title-change', 'NPM包-导出');
    });

    return {
      list,
      loading,
      downloading,
      detail,
      keyword,
      picked,
      showPushLink,
      uploading,
      triggerUpload,
      handleChange,
      fetchPackageList,
      fetchPackage,
      handleReturn,
      handlePicked,
    };
  },
});
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
