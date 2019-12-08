import Vue from 'vue';
import Vuetify from 'vuetify/lib';

import 'vuetify/dist/vuetify.min.css';
import '@mdi/font/css/materialdesignicons.css';

Vue.use(Vuetify);

export default ctx => {
  const vuetify = new Vuetify({
    icons: {
      iconfont: 'md' // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4'
    },
    theme: {
      dark: false
    },
    themes: {
      light: {
        primary: "#4682b4",
        secondary: "#b0bec5",
        accent: "#8c9eff",
        error: "#b71c1c"
      }
    }
  });
  ctx.app.vuetify = vuetify;
  ctx.$vuetify = vuetify.framework;
};

// import Vue from 'vue'
// import Vuetify from 'vuetify'
// import 'vuetify/dist/vuetify.min.css'

// Vue.use(Vuetify)
