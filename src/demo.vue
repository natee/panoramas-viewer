<template>
  <div class="demo"></div>
</template>

<script>
import * as THREE from "three";
import PanoramasViewer from "./panoramas-viewer/viewer.ts";
import { onMounted } from "vue";
import imgP3 from "./img/p4.png";
export default {
  name: "Demo",
  components: {},
  setup() {
    onMounted(() => {
      const viewer = new PanoramasViewer({
        container: ".demo",
        img: imgP3,
      });
    });
  },
};
</script>
<style>
@import url("./panoramas-viewer/viewer.css");
.demo {
  height: 100vh;
  width: 100vw;
}
</style>
