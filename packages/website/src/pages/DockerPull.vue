<template>
  <el-container>
    <el-main>
      <div
        class="panel"
        v-loading="downloading"
        element-loading-text="下载中请不用关闭页面！！！"
      >
        <docker-download-list
          v-model:pkgArr="picked"
          @start-download="downloading = true"
          @end-download="downloading = false"
        ></docker-download-list>
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
            :key="packageDoc.id"
            :label="packageDoc.name"
            :value="packageDoc.id"
          >
          </el-option>
        </el-select>
        <docker-detail
          :value="detail"
          v-if="detail"
          @pick="handlePicked"
        ></docker-detail>
      </div>
    </el-main>
  </el-container>
</template>

<script lang="ts" setup name="DockerPull">
import { ref, onMounted } from 'vue';
import DockerDetail from "../components/DockerDetail.vue";
import debounce from "debounce";
import DockerDownloadList from "../components/DockerDownloadList.vue";
import { getAxios, getEnv } from "../utils";
import { ElNotification } from 'element-plus';
import { DockerHubAPIRepo, Platform } from "@sandshrew/types";

const list = ref<any[]>([]);
const loading = ref(false);
const downloading = ref(false);
const detail = ref<{
      name: string;
      tags: string[];
    } | null>(null);
const keyword = ref('');
const picked = ref<{
  id: string;
  tag: string;
  platform: Platform;
}[]>([]);
const showPushLink = ref(false);
const uploading = ref(false);

const getSuggestion = debounce(async (q: string, callback: any) => {
  try {
    const response = await getAxios().get<DockerHubAPIRepo[]>(`/docker/suggestions?q=${q}`);
    callback(null, response.data);
  } catch (e) {
    callback(e);
  }
}, 400);

const triggerUpload = () => {
  document.getElementById("uploadPkg")?.click();
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
  const response = await getAxios().get<{
      name: string;
      tags: string[];
    }>(
    `/docker/package/${encodeURIComponent(packageName)}/versions`
  );
  detail.value = response.data;
};

const handleReturn = () => {
  detail.value = null;
  keyword.value = "";
  list.value = [];
};

const handlePicked = (val: {
  id: string;
  tag: string;
  platform: Platform;
}) => {
  if(picked.value.find((item) => item.id === val.id && item.tag === val.tag && item.platform === val.platform)) {
    return ElNotification.error({
      title: '重复选择',
      message: '你已经选择过这个包了',
      duration: 0,
    });
  }
  picked.value.push(val);
};

const emit = defineEmits(['title-change']);

onMounted(async () => {
  const { fronttype } = await getEnv();
  showPushLink.value = fronttype === 'pelipper';
  emit('title-change', 'Docker包-导出');
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
