<template>
<div class="packageDetail">
    <div>
        <label>包名：</label>
        {{modelValue.name}}
    </div>
    <div>
        <label>作者：</label>
        {{modelValue?.author?.name || '无'}}
    </div>
    <div>
        <label>版本：</label>
        <select v-model="version">
            <option v-for="(version, index) in sortedVersions" :key="index" :value="version">
                {{ version }}
            </option>
        </select>
    </div>
    <button @click="handlePick">选择此版本</button>
    <button @click="handleReturn">返回</button>
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
  created(){
    console.log(this.modelValue)
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
