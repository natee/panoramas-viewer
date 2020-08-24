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
    var container; //创建容器
    var camera, scene, raycaster, renderer;

    var mouse = new THREE.Vector2(),
      INTERSECTED;
    var k = window.innerWidth / window.innerHeight; //窗口宽高比
    var s = 100; //三维场景显示范围控制系数，系数越大，显示的范围越大

    var textBox;

    //初始化
    function init() {
      //容器
      container = document.getElementById("container");
      textBox = document.querySelector(".text");

      document.body.appendChild(container);
      //场景
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      //相机
      camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
      camera.position.set(300, 300, 800); //设置相机位置
      camera.lookAt(scene.position); //设置相机方向(指向的场景对象)

      //光源
      var point = new THREE.PointLight(0xffffff, 1);
      point.position.set(300, 500, 300);
      scene.add(point);

      //创建网格模型  立方缓冲几何体
      var geometry = new THREE.BoxGeometry(20, 20, 20);

      for (var i = 0; i < 3; i++) {
        //给创建的几何体添加随机颜色
        var object = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff })
        );
        object.name = "物体" + (i + 1);
        //随机位置
        object.position.x = i * 25;
        //添加到场景中
        scene.add(object);
        console.log("add");
      }
      // 光线投射Raycaster
      // 这个类用于进行raycasting（光线投射）。 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体）。
      // http://www.webgl3d.cn/threejs/docs/#api/zh/core/Raycaster
      raycaster = new THREE.Raycaster();

      // 创建渲染器对象
      renderer = new THREE.WebGLRenderer();
      // window.devicePixelRatio 获取更清晰的图像
      // https://www.w3cschool.cn/fetch_api/fetch_api-atvq2nma.html
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight); //设置渲染区域尺寸

      //容器中插入canvas对象
      container.appendChild(renderer.domElement);

      //监听鼠标的位置移动，进而获取到指向物体
      document.addEventListener("mousedown", onDocumentMouseDown, false);
      //监听窗口发生改变时的方法
      window.addEventListener("resize", onWindowResize, false);
    }

    //窗口改变时重新进行渲染
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //鼠标点击
    function onDocumentMouseDown(event) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    //三维坐标转屏幕坐标的方法
    function transPosition(position) {
      let world_vector = new THREE.Vector3(position.x, position.y, position.z);
      let vector = world_vector.project(camera);
      let halfWidth = window.innerWidth / 2,
        halfHeight = window.innerHeight / 2;
      return {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight),
      };
    }

    //执行动画
    function animate() {
      requestAnimationFrame(animate);
      render();
    }

    // 渲染动画
    function render() {
      // 通过摄像机和鼠标位置更新射线
      raycaster.setFromCamera(mouse, camera);
      // 计算物体和射线的焦点
      var intersects = raycaster.intersectObjects(scene.children);

      //选中物体时
      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          if (INTERSECTED) {
            INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
          }
          INTERSECTED = intersects[0].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();

          //鼠标选中物体时的颜色
          INTERSECTED.material.emissive.setHex(0x001aff);
          //获取到当前物体的相关属性值
          console.log(INTERSECTED);

          //将选中物体的三维坐标转化
          var position = new THREE.Vector3(
            INTERSECTED.position.x,
            INTERSECTED.position.y,
            INTERSECTED.position.z
          );
          console.log(transPosition(position));
          textBox.style.display = "inline-block";
          textBox.style.left = transPosition(position).x + "px";
          textBox.style.top = transPosition(position).y + "px";
          textBox.innerHTML = INTERSECTED.name;
        }
      } else {
        //未选中物体时
        if (INTERSECTED) {
          INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
          textBox.style.display = "none";
        }
        INTERSECTED = null;
      }
      renderer.render(scene, camera);
    }


    onMounted(() => {
      // init();
      //   animate();

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
