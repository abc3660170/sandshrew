<template>
  <el-container>
    <el-main>
      <div class="uploadArea" v-show="showUploadBtn">
        <input
          type="file"
          id="upload"
          @change="handleChange"
          accept="application/zip"
        />
        <button @click="trggerUpload" class="uploadBtn">
          点我上传
        </button>
      </div>
      <div class="message" v-show="!showUploadBtn">
        <div class="title">错误日志：</div>
        <div v-html="errors"></div>
      </div>
      <div class="mask"  v-show="uploading">
        <div class="text">正在导入...</div>
      </div>
    </el-main>
    <el-footer class="footer"
      >
      <a href="javascript:;" class="backToUpload" v-if="!showUploadBtn" @click="showUploadBtn = true">返回上传</a>
      <router-link to="/pull">
        去导出界面
      </router-link></el-footer
    >
  </el-container>
</template>

<script>
import mixins from "../mixins/mixins";
export default {
  name: "Push",
  mixins: [mixins],
  data(){
    return {
      uploading: false,
      showUploadBtn: true,
      errors:''
    }
  },
  methods: {
    trggerUpload() {
      this.$el.querySelector("#upload").click();
    },
    upload(file) {
      this.uploading = true;
      const uploadFormData = new FormData(); //创建form对象
      uploadFormData.append("file", file); //通过append向form对象添加数据
      this.getAxios()
        .post("/push/upload", uploadFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 0,
        })
        .then((res) => {
          this.uploading = false;
          if (res.data.code === 200) {
            alert("上传成功！");
          } else if(res.data.code === 226){
            this.$notify.error({
              title: '上传失败',
              message: '有人在上传，你先等等还行啊',
              duration: 0
            });
          } else {
            this.showUploadBtn = false;
            this.errors = res.data.errors.join("\n").replace(/\n/g, "<br/>");
          }
        });
    },

    handleChange(ev) {
      const fileList = ev.target.files;
      this.upload(fileList[0]);
      ev.target.value = "";
    },
  },
  created(){
    this.$emit('title-change', 'NPM包-导入');
  }
};
</script>

<style scoped>
.uploadArea{
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
  transition: background, box-shadow,
    color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  background-color: #8691A7;
  border-color: none;
}

.uploadBtn:hover {
  background-color: #a3b3d1;
}

.uploadBtn:active {
  background-color: #b9c6dd;
}

.backToUpload{
  margin-right: 10px;
}

.message {
  padding: 20px;
  margin-top: 20px;
  color: #e51717;
  background-color: rgba(229, 23, 23,0.08);
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
