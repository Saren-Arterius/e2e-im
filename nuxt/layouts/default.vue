<template lang="pug">
v-app#inspire
  v-content
    .container
      v-card(style="padding: 2em; margin-top: 3em;")
        nuxt
</template>

<script>
export default {
  data () {
    return {
      drawer: false,
      keywordField: "",
      searchSection: "place"
    };
  },
  async mounted () {
  }
};
</script>

<style global>
.direction-column {
  flex-direction: column;
}
.v-toolbar__content {
  height: 64px !important;
}
.editor-preview img, .editor-preview-side img {
  max-width: 100%;
}
.theme--light.v-data-table {
  background-color: initial;
}
</style>

<style scoped>
.admin {
  position: absolute;
  right: 1em;
  color: red;
}
.form {
  margin-top: 30px;
}
</style>
