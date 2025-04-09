<template>
  <div class="packageDetail">
    <el-form label-width="100px">
      <el-form-item label="包名：">
        {{ value.name }}
      </el-form-item>
      <el-form-item label="版本：">
        <el-select style="width: 440px" v-model="version" placeholder="请选择" filterable :filter-method="filterMethod">
          <el-option v-for="(_version, index) in sortedVersions" :key="index" :label="_version" :value="_version" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作系统：" v-if="version">
        <el-select style="width: 440px" v-model="os" placeholder="请选择" filterable :filter-method="filterMethod">
          <el-option v-for="(_os, index) in osList" :key="index" :label="_os" :value="_os" />
        </el-select>
      </el-form-item>
      <el-form-item label="架构：" v-if="os">
        <el-select style="width: 440px" v-model="arch" placeholder="请选择" filterable :filter-method="filterMethod">
          <el-option v-for="(_arch, index) in archList" :key="index" :label="_arch" :value="_arch" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button size="default" type="primary" @click="handlePick" :disabled="!canPick">选择此版本</el-button>

        <el-button size="default" @click="handleReturn">返回</el-button>
      </el-form-item>
    </el-form>
  </div>

</template>

<script lang="ts" setup>
import { ref, computed, PropType, watch } from 'vue';
import { getAxios } from '../utils';
import type { DockerHubAPIVersion } from "@sandshrew/types";

const keyword = ref('');

const props = defineProps({
  value: {
    type: Object as PropType<{
      name: string;
      tags: string[];
    }>,
    required: true,
  },
});

const filterMethod = (q:string) => {
  keyword.value = q;
}

const canPick = computed(() => {
  return version.value && os.value && arch.value;
});

const emit = defineEmits(['pick', 'model-value']);

// onBeforeMount(async () => {
//   const { fronttype } = await getEnv();
// });

const version = ref(null);
const os = ref(null);
const arch = ref(null);

const sortedVersions = computed(() => {
  if(keyword.value.trim() === '') {
    return props.value.tags.toReversed().slice(0, 20);

  }
  return props.value.tags.filter((item) => {
    return item.toLowerCase().indexOf(keyword.value.toLowerCase()) > -1;
  }).slice(0, 20);
});

const document = ref<DockerHubAPIVersion | null>(null);

const osList = computed(() => {
  if (document.value) {
    return Array.from(new Set(document.value.images.map(d => d.os)))
  }
  return [];
});

const archList = computed(() => {
  if (document.value) {
    return Array.from(new Set(document.value.images.map(d => d.architecture && d.os === os.value ? d.architecture : null))).filter(d => d !== null);
  }
  return [];
});


watch(version, async (tag) => {
  os.value = null;
  arch.value = null;
  const response = await getAxios().get<DockerHubAPIVersion>(`/docker/package/${encodeURIComponent(props.value.name)}/${tag}/document`);
  document.value = response.data;
});

watch(os, async (tag) => {
  arch.value = null;
});

const handlePick = () => {
  emit("pick", {
    id: props.value.name,
    tag: version.value,
    platform: `${os.value}/${arch.value}`,
  });
};

const handleReturn = () => {
  emit("model-value", null);
};
</script>

<style lang="scss">
.md-content {
  li, p {
    white-space: break-spaces;
  }
}
</style>
