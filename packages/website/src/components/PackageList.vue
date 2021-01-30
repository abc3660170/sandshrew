<template>
<ul>
    <li v-for="(brief, index) in list" :key="index">
        <a @click="handleClick">{{ brief.name }}</a>
    </li>
</ul>
</template>

<script>
export default {
  name: 'PackageList',
  props: {
    list: {
        type: Array,
        default(){
            return []
        }
    }
  },
  methods:{
      handleClick(ev){
          const name = ev.target.innerText
          this.$emit('view-detail', name.replace('/',"%2f"));
      }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
