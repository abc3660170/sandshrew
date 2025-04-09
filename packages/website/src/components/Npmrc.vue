<template>
  <el-popover :width="500" class="npmrcTip" placement="bottom" title="" trigger="click">
    <template #reference>
      <el-icon title="提示" class="npmrcTip npmrcTipIcon">
        <Lightning />
      </el-icon>
    </template>
    <div v-if="routePart === 'docker'">
      docker镜像比较大，所以pull的时候请耐心等待
    </div>
    <div v-else-if="routePart === 'npmjs'">
      <p>把下面的内容贴到你项目的.npmrc文件里</p>
      <ul>
        <li v-for="(item, index) in configs" :key="index">
          <code>{{ item }}</code>
        </li>
      </ul>
    </div>

  </el-popover>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, getCurrentInstance } from 'vue';
import { getAxios } from '../utils';

export default defineComponent({
  name: 'Npmrc',
  setup() {
    const configs = ref<string[]>([]);
    const app = getCurrentInstance()?.proxy!;

    const routePart = computed(() => app.$route.path.split('/')[1]);

    onMounted(() => {
      getAxios().get('/npmrc')
        .then((response) => {
          configs.value = response.data;
        })
        .catch((e) => {
          console.log(e);
        });
    });

    return {
      routePart,
      configs
    };
  }
});
</script>

<style lang="scss" scoped>
h1 {
  text-align: center;
}

li {
  background: #fcedea;
  color: #c0341d;
  padding: 4px;
  margin: 10px;
  border-radius: 6px;
}

.panel {
  width: 800px;
  min-height: 400px;
  background: rgba(115, 153, 230, 0.08);
  margin: 0 auto;
}

.footer {
  text-align: center;
}

.npmrcTip {
  font-size: 24px;
  color: #333;
  position: absolute;
  right: 0px;
  top: 18px;
}

.npmrcTipIcon {
  color: #ffc040;

  &:hover {
    color: #ffe08b;
    cursor: pointer;
  }
}
</style>
