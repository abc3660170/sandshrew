<template>
  <el-container>
    <el-main>
      <div class="uploadArea" v-show="showUploadBtn">
        <input type="file" id="upload" @change="handleChange" accept="application/zip" />
        <button @click="triggerUpload" class="uploadBtn">
          点我上传
        </button>
      </div>
      <div class="message" v-show="!showUploadBtn">
        <div class="title">错误日志：</div>
        <div v-html="errors"></div>
      </div>
      <div class="mask" v-show="uploading">
        <div class="text">正在导入...</div>
      </div>
    </el-main>
    <el-footer class="footer">
      <a href="javascript:;" class="backToUpload" v-if="!showUploadBtn" @click="showUploadBtn = true">返回上传</a>
      <router-link to="/pull">
        去导出界面
      </router-link>
    </el-footer>
  </el-container>
</template>

<script lang="ts">
import { ElNotification } from 'element-plus';
import { defineComponent, ref } from 'vue';
import { getAxios } from '../utils';

export default defineComponent({
  name: 'Push',
  setup(_, { emit }) {
    const uploading = ref(false);
    const showUploadBtn = ref(true);
    const errors = ref('');

    const triggerUpload = () => {
      const uploadInput = document.querySelector<HTMLInputElement>('#upload');
      if (uploadInput) {
        uploadInput.click();
      }
    };

    const upload = async (file: File) => {
      uploading.value = true;
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      try {
        const res = await getAxios().post('/push/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 0,
        });

        uploading.value = false;
        if (res.data.code === 200) {
          alert('上传成功！');
        } else if (res.status === 226) {
          ElNotification.error({
            title: '上传失败',
            message: '有人在上传，你先等等还行啊',
            duration: 0,
          });
        } else {
          showUploadBtn.value = false;
          errors.value = res.data.errors.join('\n').replace(/\n/g, '<br/>');
        }
      } catch (error) {
        uploading.value = false;
        console.error('Upload failed:', error);
      }
    };

    const handleChange = (ev: Event) => {
      const target = ev.target as HTMLInputElement;
      const fileList = target.files;
      if (fileList && fileList[0]) {
        upload(fileList[0]);
      }
      target.value = '';
    };

    emit('title-change', 'NPM包-导入');

    return {
      uploading,
      showUploadBtn,
      errors,
      triggerUpload,
      handleChange,
    };
  },
});
</script>

<style scoped>
.uploadArea {
  margin-top: 200px;
}

a {
  color: #00b7ff;
}

#main {
  width: 900px;
  margin: 60px auto;
}

#upload {
  display: none;
}

.uploadBtn {
  display: block;
  margin: 0 auto;
  height: 60px;
  line-height: 60px;
  font-size: 28px;
  width: 280px;
  text-align: center;
  color: #fff;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 2px;
  outline: none;
  transition: background, box-shadow, color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background-color: #8691a7;
  border-color: none;
}

.uploadBtn:hover {
  background-color: #a3b3d1;
}

.uploadBtn:active {
  background-color: #b9c6dd;
}

.backToUpload {
  margin-right: 10px;
}

.message {
  padding: 20px;
  margin-top: 20px;
  color: #e51717;
  background-color: rgba(229, 23, 23, 0.08);
}

.mask {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background-color: rgba(0, 0, 0, 0.8);
}

.mask .text {
  text-align: center;
  color: #fff;
  margin-top: 40%;
}

.footer {
  text-align: center;
}
</style>
