<template>
<div class="packageDetail">
    <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="包名：">
            {{modelValue.name}}
        </el-form-item>
        <el-form-item v-if="modelValue.description" label="描述：">
            {{modelValue.description}}
        </el-form-item>
        <el-form-item label="作者：">
            {{modelValue?.author?.name || '无'}}
        </el-form-item>
        <el-form-item label="主页：" v-if="modelValue.homepage">
            <el-link type="primary" :href="modelValue.homepage">{{modelValue.homepage}}</el-link>
        </el-form-item>
        <el-form-item label="版本：">
            <el-select v-model="version" placeholder="请选择">
                <el-option
                v-for="(version, index) in sortedVersions"
                :key="index"
                :label="version"
                :value="version">
                </el-option>
            </el-select>
        </el-form-item>
        <el-form-item>
            <el-button size="mini" type="primary" @click="handlePick">选择此版本</el-button>
            <el-button size="mini" @click="handleReturn">返回</el-button>
        </el-form-item>
    </el-form>
</div>
</template>

<script>
export default {
  name: 'PackageDetail',

  props: {
    modelValue: {
        type:Object
    },
    // name: String,
    // author: Object,
    // versions: Array,
    // distTags: Object,

  },
  data(){
      return {
          version: this.modelValue['dist-tags'].latest
      }
  },
  computed:{
      sortedVersions(){
          return Object.keys(this.modelValue.versions).reverse()
      }
  },
  methods:{
      handlePick(){
          this.$emit('pick', `${this.modelValue.name}@${this.version}`)
      },
      handleReturn() {
        this.$emit('update:modelValue', null);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
