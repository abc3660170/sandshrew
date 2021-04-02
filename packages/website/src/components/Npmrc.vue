<template>
    <el-popover
      class="npmrcTip"
      placement="bottom"
      title="把下面的内容贴到你项目的.npmrc文件里"
      width="500"
      trigger="click">
      <template v-slot:reference>
          <span class="el-icon-s-opportunity npmrcTipIcon" title=".npmrc的配置"></span>
      </template>
      <ul>
        <li v-for="(item, index) in configs" :key="index">
          <code>{{item}}</code>
        </li>
      </ul>
    </el-popover>
</template>

<script>
import mixins from "../mixins/mixins";
export default {
  name: "Npmrc",
  mixins: [mixins],
  data() {
    return {
      configs: []
    };
  },
  created() {
      this.getAxios()
        .get(`/npmrc/`)
        .then((response) => {
          this.configs = response.data
        })
        .catch((e) => {
         console.log(e)
        });
  }
};
</script>

<style lang="scss" scoped>
h1 {
  text-align: center;
}

li{
  background: #fcedea;
  color: #c0341d;
  padding: 4px;
  margin: 10px;
  border-radius: 6px;
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

.npmrcTip{
  font-size: 24px;
  color: #333;
  position: absolute;
  right: 0px;
  top: 18px;
}

.npmrcTipIcon{
  color: #ffc040;
  &:hover{
    color: #ffe08b;
    cursor: pointer;
  }
}
</style>
