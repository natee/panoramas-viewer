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
import dynamicPic from "./img/p7.jpg";
export default {
  name: "Demo",
  components: {},
  setup() {
    const schemaId: Ref<string> = ref("");
    onMounted(() => {
      let labels = getMarker();
      const viewer = new PanoramasViewer({
        container: ".demo",
        img: dynamicPic,
        auto: true,
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

