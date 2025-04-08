<template>
  <div class="downloadList" v-if="pkgArr.length > 0">
    <label>已选择的包：</label>
    <el-tag
      v-for="item in pkgArr"
      :key="item"
      type="success"
      closable
      @close="handleCloseTag(item)"
      class="tag"
    >{{ itemDesc(item) }}</el-tag>
    <el-button type="primary" size="small" @click="download">下载</el-button>
  </div>
  <el-dialog v-model="dialogVisible" title="下载失败" fullscreen top="40vh" width="70%">
    <code><pre v-html="errorMsg"></pre></code>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="errorMsg = null">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import hljs from 'highlight.js/lib/core';
import shell from 'highlight.js/lib/languages/swift';
import "highlight.js/styles/atom-one-light.css";
import { getAxios } from '../utils';
import { ElMessageBox } from 'element-plus';
import type { Platform } from '@sandshrew/types';
import  { cloneDeep } from 'lodash-es';

hljs.registerLanguage('shell', shell);

const props = defineProps<{
  pkgArr: {
    id: string;
    tag: string;
    platform: Platform;
  }[];
}>();

const itemDesc =  (item: {
    id: string;
    tag: string;
    platform: Platform;
  }) => {
    return `${item.id}(${item.platform})@${item.tag}`;
}

const emit = defineEmits<{
  (e: 'update:pkgArr', value: {
    id: string;
    tag: string;
    platform: Platform;
  }[]): void;
  (e: 'start-download'): void;
  (e: 'end-download'): void;
}>();

const cloned = ref<{
    id: string;
    tag: string;
    platform: Platform;
  }[]>([]);
const errorMsg = ref<string | null>(null);

const dialogVisible = computed(() => !!errorMsg.value);

const handleCloseTag = (tag: {
    id: string;
    tag: string;
    platform: Platform;
  }) => {
  cloned.value = cloneDeep(props.pkgArr);
  cloned.value = cloned.value.filter(item => item.id !== tag.id || item.tag !== tag.tag || item.platform !== tag.platform);
  emit('update:pkgArr', cloned.value);
};

const defaultZipFile = () => {
  const date = new Date().toISOString();
  const legalDateStr = date.replace(/[^0-9]*/g, "");
  return `to内网陈涛${legalDateStr}.tar.gz`;
};

const askForFileName = async () => {
  return await ElMessageBox.prompt("请输入下载的文件名称", "提示", {
    inputValue: defaultZipFile(),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /(.+)\.tar\.gz$/,
    inputErrorMessage: "文件名称格式不对",
  });
};

const blob2ArrayBuffer = async (blob: Blob) => {
  return new Promise<ArrayBuffer>(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(blob);
  });
};

const download = async () => {
  const { value: zipFile } = await askForFileName();
  emit('start-download');
  const response = await getAxios().post("/docker/download", props.pkgArr, {
    responseType: "blob",
    validateStatus: () => true,
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
  });

  if (response.status === 200) {
    const url = URL.createObjectURL(new Blob([response.data], { type: "application/gzip" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = zipFile;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    emit('update:pkgArr', []);
  } else if (response.status === 500) {
    const enc = new TextDecoder("utf-8");
    const ab = await blob2ArrayBuffer(response.data);
    const error = JSON.parse(enc.decode(new Uint8Array(ab)));
    errorMsg.value = hljs.highlight(error.message, { language: 'shell' }).value;
  }
  emit('end-download');
};
</script>

<style scoped>
.downloadList {
  padding: 4px;
}
.tag {
  margin: 0 5px 5px 0;
}
</style>
