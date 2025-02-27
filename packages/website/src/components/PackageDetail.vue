<template>
  <div class="packageDetail">
    <el-form label-width="80px">
      <el-form-item label="包名：">
        {{ modelValue.name }}
      </el-form-item>
      <el-form-item v-if="modelValue.description" label="描述：">
        {{ modelValue.description }}
      </el-form-item>
      <el-form-item label="作者：">
        {{ modelValue?.author?.name || "无" }}
      </el-form-item>
      <el-form-item label="主页：" v-if="modelValue.homepage">
        <el-link type="primary" :href="modelValue.homepage">{{
          modelValue.homepage
          }}</el-link>
      </el-form-item>
      <el-form-item label="版本：">
        <el-select style="width: 440px" v-model="version" placeholder="请选择">
          <el-option v-for="(version, index) in sortedVersions" :key="index" :label="version" :value="version">
          </el-option>
        </el-select>
        <el-link type="primary" @click="viewReadme" v-if="showAPI">API</el-link>
      </el-form-item>
      <el-form-item>
        <el-button size="default" type="primary" @click="handlePick">选择此版本</el-button>

        <el-button size="default" @click="handleReturn">返回</el-button>
      </el-form-item>
    </el-form>
    <el-dialog title="Readme" v-model="dialogVisible" width="900" :before-close="() => (dialogVisible = false)">
      <code class="md-content"><pre v-html="readmeHtml"></pre></code>
    </el-dialog>
  </div>

</template>

<script lang="ts">
import { defineComponent, ref, PropType, onBeforeMount, computed } from 'vue';
import { getAxios, getEnv, getValidVersions, isDev } from '../utils';
import type { Packument } from '@npm/types';
import { marked  } from "marked";


export default defineComponent({
  name: "PackageDetail",
  props: {
    modelValue: {
      type: Object as PropType<Packument>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const showAPI = ref(false);
    onBeforeMount(async () => {
      const { fronttype } = await getEnv();
      showAPI.value = fronttype === 'pelipper' || isDev();
    });
    const version = ref(props.modelValue["dist-tags"].latest);
    const readmeHtml = ref('');
    const dialogVisible = ref(false);
    const sortedVersions = computed(() => {
      return getValidVersions(props.modelValue);
    });

    const handlePick = () => {
      emit("pick", `${props.modelValue.name}@${version.value}`);
    };

    const viewReadme = async () => {
      const name = encodeURIComponent(props.modelValue.name);
      const _version = version.value;
      const res = isDev() ? await getAxios().get(`/npmjs/test/vue/3.5.13/readme`) : await getAxios().get(`/npmjs/${name}/${_version}/readme`);
      const readmeContent = await res.data;
      readmeHtml.value = await marked.parse(readmeContent);
      dialogVisible.value = true;
    };

    const handleReturn = () => {
      emit("update:modelValue", null);
    };

    return {
      version,
      sortedVersions,
      handlePick,
      handleReturn,
      viewReadme,
      readmeHtml,
      showAPI,
      dialogVisible
    };
  },
});
</script>

<style lang="scss">
.md-content {
  li, p {
    white-space: break-spaces;
  }
}
</style>
