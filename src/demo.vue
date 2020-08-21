<template>
  <div class="demo"></div>
</template>

<script>
import PanoramasViewer from "./viewer.ts";
import { onMounted } from "vue";
import imgP3 from "./img/p4.png"
export default {
  name: "Demo",
  components: {},
  setup() {
    onMounted(() => {
      const viewer = new PanoramasViewer({
        container: ".demo",
        img: imgP3
      });
      viewer.render();
    });

    return {
      url: imgP3
    }
  },
};
</script>
<style>
.demo {
  height: 100vh;
  width: 100vw;
}
</style>
