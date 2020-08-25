<style>
@import url("./panoramas-viewer/viewer.css");
.demo {
  height: 100vh;
  width: 100vw;
}
</style>
<template>
  <div class="demo"></div>
</template>

<script lang="ts">
import * as THREE from "three";
import { onMounted, Ref, ref } from "vue";
import PanoramasViewer, { ILabel } from "./panoramas-viewer/viewer";
import { getMarker, saveMarker, removeMarker } from "./js/fetch";
import imgP3 from "./img/p4.png";
export default {
  name: "Demo",
  components: {},
  setup() {
    const schemaId: Ref<string> = ref("");
    onMounted(() => {
      let labels = getMarker();
      const viewer = new PanoramasViewer({
        container: ".demo",
        img: imgP3,
        labels: labels,
        marker: {
          add: saveLabel,
          clear: removeLabelFromAPI
        }
      });
    });

    function saveLabel(data: ILabel[]){
      console.log('save')
      saveMarker(data)
    }

    function removeLabelFromAPI(){
      removeMarker();
      console.log('remove')
    }

  },
};
</script>

