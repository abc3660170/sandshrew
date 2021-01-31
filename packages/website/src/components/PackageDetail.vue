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
        <select :value="defaultVersion">
            <option v-for="(version, index) in sortedVersions" :key="index" :value="version">
                {{ version }}
            </option>
        </select>
        {{author.name}}
    </div>
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
  computed:{
      sortedVersions(){
          return Object.keys(this.versions).reverse()
      },
      defaultVersion(){
          return this.distTags.latest;
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
