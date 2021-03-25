<template>
  <el-container>
    <el-header>
      <h1>FEE-NPM-SERVICE-PUSH</h1>
    </el-header>
    <el-main>
      <div class="uploadArea">
        <input
          type="file"
          id="upload"
          @change="handleChange"
          accept="application/zip"
        />
        <button @click="trggerUpload" class="uploadBtn">
          上传npm包
        </button>
      </div>
      <div class="message hide"></div>
      <div class="mask hide">
        <div class="text">正在导入...</div>
      </div>
    </el-main>
    <el-footer class="footer"
      ><router-link to="/pull">
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
  methods: {
    trggerUpload() {
      this.$el.querySelector("#upload").click();
    },
    upload(file) {
      document.querySelector(".mask").classList.remove("hide");
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
          document.querySelector(".mask").classList.add("hide");
          if (res.data.code === 200) {
            alert("上传成功！");
          } else if(res.data.code === 226){
            this.$notify.error({
              title: '上传失败',
              message: '有人在上传，你先等等还行啊',
              duration: 0
            });
          } else {
            alert("上传失败，下面是错误原因！");
            document.querySelector(".message").classList.remove("hide");
            const $html =
              "<span>错误信息:</span><br/>" +
              res.data.errors.join("\n").replace(/\n/g, "<br/>");
            document.querySelector(".message").innerHTML = $html;
          }
        });
    },

    handleChange(ev) {
      this.$el.querySelector(".message").classList.add("hide");
      this.$el.querySelector(".message").innerHTML = "";
      const fileList = ev.target.files;
      this.upload(fileList[0]);
      ev.target.value = "";
    },
  },
};
</script>

<style scoped>
h1 {
  text-align: center;
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
  background-color: #007fff;
  border-color: #007fff;
}

.uploadBtn:hover {
  background-color: #409fff;
  border-color: #409fff;
}

.uploadBtn:active {
  background-color: #006cd9;
  border-color: #006cd9;
}

.message {
  padding: 10px;
  margin-top: 20px;
  color: purple;
  background-color: tomato;
}

.hide {
  display: none;
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
