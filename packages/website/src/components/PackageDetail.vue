<template>
<div class="packageDetail">
    <div>
        <label>包名：</label>
        {{name}}
    </div>
    <div>
        <label>作者：</label>
        {{author.name}}
    </div>
    <div>
        <label>版本：</label>
        <select v-model="version">
            <option v-for="(version, index) in sortedVersions" :key="index" :value="version">
                {{ version }}
            </option>
        </select>
        {{author.name}}
    </div>
    <button @click="handlePick">选择此版本</button>
</div>
</template>

<script>
export default {
  name: 'PackageDetail',
  props: {
    name: String,
    author: Object,
    versions: Array,
    distTags: Object
  },
  data(){
      return {
          version: this.distTags.latest
      }
  },
  computed:{
      sortedVersions(){
          return Object.keys(this.versions).reverse()
      }
  },
  methods:{
      handlePick(){
          this.$emit('pick', `${this.name}@${this.version}`)
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
