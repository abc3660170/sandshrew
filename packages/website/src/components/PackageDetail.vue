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
        <el-select v-model="version" placeholder="请选择">
          <el-option
            v-for="(version, index) in sortedVersions"
            :key="index"
            :label="version"
            :value="version"
          >
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button size="default" type="primary" @click="handlePick"
          >选择此版本</el-button
        >
        <el-button size="default" @click="handleReturn">返回</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from 'vue';
import { getValidVersions } from '../utils';
import type { Packument } from '@npm/types';

export default defineComponent({
  name: "PackageDetail",
  props: {
    modelValue: {
      type: Object as PropType<Packument>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const version = ref(props.modelValue["dist-tags"].latest);

    const sortedVersions = computed(() => {
      return getValidVersions(props.modelValue);
    });

    const handlePick = () => {
      emit("pick", `${props.modelValue.name}@${version.value}`);
    };

    const handleReturn = () => {
      emit("update:modelValue", null);
    };

    return {
      version,
      sortedVersions,
      handlePick,
      handleReturn,
    };
  },
});
</script>

<style scoped>
</style>
