# 手把手教你实现 360° 全景图预览插件

## 目录

  - [原理](#原理)
  - [基础知识](#基础知识)
    - [平面坐标点](#平面坐标点)
    - [空间坐标点](#空间坐标点)
  - [实现过程](#实现过程)
    - [1. 定义用法](#1-定义用法)
    - [2. ThreeJS 渲染一个球体](#2-threejs-渲染一个球体)
      - [2.1 创建球体](#21-创建球体)
      - [2.2 渲染球体](#22-渲染球体)
      - [2.3 添加坐标轴观察](#23-添加坐标轴观察)
    - [3. 渲染全景图](#3-渲染全景图)
      - [3.1 球体添加纹理](#31-球体添加纹理)
      - [3.2 修改相机位置](#32-修改相机位置)
      - [3.3 修正渲染方向](#33-修正渲染方向)
    - [4. 事件处理](#4-事件处理)
      - [4.1 自旋转](#41-自旋转)
      - [4.2 鼠标拖拽](#42-鼠标拖拽)
    - [5. 全景标记](#5-全景标记)
      - [5.1 基本思路](#51-基本思路)
      - [5.2 记录标记的位置](#52-记录标记的位置)
      - [5.3 屏幕坐标点转经纬度](#53-屏幕坐标点转经纬度)
      - [5.4 经纬度转屏幕坐标点](#54-经纬度转屏幕坐标点)
      - [5.5 最终效果](#55-最终效果)
  - [后序](#后序)

## 原理

- 利用 `ThreeJS` 在 `canvas` 中画一个球体，将全景图作为球体的纹理填充，然后把相机 `camera` 置于坐标系原点即可看到全景图的渲染。
- 鼠标拖动修改 `camera` 的朝向，改变视野
- 利用 HTML 生成标签内容，通过屏幕坐标点和空间坐标的转换规则，保存标签位置，使得标记位置能够始终正确。

## 基础知识

### 平面坐标点

求圆上一点的坐标。

![圆.jpg](../assets/圆.jpg)

### 空间坐标点

高中数学知识，求球体表面一个点的空间坐标 `(x, y, z)` ，模型如下（`ThreeJS` 中坐标系 X 轴是朝右的，这里之所按这种方向建立坐标系，是因为实现过程中把 X 轴翻转了）：

![坐标系.jpg](../assets/坐标系.jpg)

_图是用 [drawio](https://www.diagrams.net/) 画的_

## 实现过程

以下每一步你都可以停下来自己去思考实现。

### 1. 定义用法

```js
new Viewer({
  container: "#demo",
  img: "./test.png"
})
```

基本代码结构如下：

```js
class PanoramasViewer {
  constructor(option) {
    this.option = option;

    this.render()
  }

  render(){
    console.log('rendered.')
  }
}
```

### 2. ThreeJS 渲染一个球体

这里你需要去学习一下 `three.js` 的基础知识(`scene`、`camera`、`renderer`)。

#### 2.1 创建球体

只后你大概可以像这样创建一个球体：

```js
const {
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
} = THREE;
_createBall() {
    // 创建一个球体，(半径，水平分段数，垂直分段数)
    const geometry = new SphereGeometry(1000, 100, 100);
    const material = new MeshBasicMaterial({color: 0x645d50});
    const mesh = new Mesh(geometry, material);
    return mesh;
  }
```

#### 2.2 渲染球体

把这个球体渲染出来，这里我们创建的球体半径是 1000，现在把相机位置定位于 Z 轴 2000 位置处观察。

```js
render(){
  this._scene = new Scene();
  this._scene.add(this._createBall());

  this._camera = new PerspectiveCamera(75,this.width / this.height,0.1,1100);
  this._camera.position.set(0, 0, 2000);
  this._camera.lookAt(new Vector3(0, 0, 0));

  this._renderer = new WebGLRenderer();
  this._renderer.setSize(this.width, this.height);
  this._container.appendChild(this._renderer.domElement);
  this._renderer.render(this._scene, this._camera);
  console.log('rendered.')
}
```

现在你看到的效果应该是这样：

![ball.png](../assets/t1.png)


#### 2.3 添加坐标轴观察

这一步也可以直接跳过。

由于没有加光照效果，所以这个球体看不出任何立体效果。现在我们调整一下镜头最远焦距和相机的位置，把坐标轴显示出来，方便理解。

```js
  render() {
    // ...
    
    this._addAxes(); // (*)
    this._camera = new PerspectiveCamera(75, this.width / this.height, 0.1, 1500); // (*)
    this._camera.position.set(1100, 1100, 1100); // (*)

    // ...
  }

  _addAxes() {
    const axesHelper = new THREE.AxesHelper(3000);
    this._scene.add(axesHelper);
  }
```

现在看到的效果如图所示：

![axes.png](../assets/t2.png)

### 3. 渲染全景图

#### 3.1 球体添加纹理

现在创建的球体是纯色纹理，通过 Three.js `MeshBasicMaterial` 方法的学习，可以知道参数有一个选项是 `map` 它接受一个 `Texture` 类型的值作为颜色贴图。

当前使用的 `three.js` 版本为 `r119`，加载图片资源需使用 `new THREE.TextureLoader().load` 方法，具体代码如下：

```js
_createBall() {
  const texture = new TextureLoader().load(this.option.img);
  const geometry = new SphereGeometry(1000, 100, 100);
  const material = new MeshBasicMaterial({ map: texture });
  const mesh = new Mesh(geometry, material);
  return mesh;
}
```

按照这种方法，我们刷新页面，发现之前的球体变成了黑色，似乎没有渲染出来。

![t3.png](../assets/t3.png)

这是由于 `_createBall` 方法中的 `new TextureLoader().load()` 是异步加载资源，按照当前的写法图片还没有加载完成，就执行了后续操作。我们修改 `.load` 为回调函数的用法，用 Promise 封装，对应的 `render` 函数也需要改成 `async function`，如下：

```js
async render() {
  this._scene = new Scene();
  const mesh = await this._createBall();
  this._scene.add(mesh);
  // ...
}
_createBall() {
  const loader = new TextureLoader();
  return new Promise(resolve => {
    loader.load(this.option.img, (texture) => {
      const geometry = new SphereGeometry(1000, 100, 100);
      const material = new MeshBasicMaterial({ map: texture });
      const mesh = new Mesh(geometry, material);
      resolve(mesh);
    });
  }).then(res => res);
}
```

Great ! 看起来舒服了。

![t4.png](../assets/t4.png)

_说明：用回调函数的形式先等待图片资源加载完成虽然实现了，但图片多了、大了会造成等待，虽然加个 Loading 初始化状态也不是什么大问题，但完全可以让其它代码先跑着。_


#### 3.2 修改相机位置

现在我们是在球体的外部观察整个球体，让我们把相机位置移到坐标系原点 `(0, 0, 0)`（为什么是原点？因为创建的球体没有指定坐标，默认就是从原点创建）。

```js
render() {
  // ...
  this._camera.position.set(0, 0, 0); // (*)
  // ...
}
```

现在刷新页面，可以看到一片漆黑，好像有点慌了。

不要慌，因为 Three.js 中 [Material](https://threejs.org/docs/#api/zh/materials/Material.side) 默认渲染正面，我们可以修改 `side` 的值为 `BackSide` 或 `DoubleSide` 来渲染背面。

```js
_createBall() {
  // 双面纹理
  const material = new MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
}
```

现在可以看到这样的效果了：

![t5.png](../assets/t5.png)

等等，好像哪里不对？这个渲染出来的图和原图是反方向啊！

#### 3.3 修正渲染方向

`Mesh` 有一个 `scale` 属性来对坐标进行缩放，我们设置 `scale.x = -1` 来翻转 X 轴的渲染。 

```js
_createBall() {
  const loader = new TextureLoader();
  return new Promise(resolve => {
    loader.load(this.option.img, (texture) => {
      const geometry = new SphereGeometry(1000, 100, 100);
      const material = new MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
      const mesh = new Mesh(geometry, material);
      mesh.scale.x = -1; // (*)
      resolve(mesh);
    });
  }).then(res => res);
}
```

现在内部的渲染方向符合预期，其实这个时候球体外部渲染是反方向的。

![t6.png](../assets/t6.png)

### 4. 事件处理

现在这个球体只是一次性渲染，为了让它动起来，我们需要增加持续渲染事件，我们用 `requestAnimationFrame` 来修改渲染函数。

```js
async render() {
  // ...
  this.draw()
}

draw(){
  requestAnimationFrame(() => {
    this.draw();
  });
  this._renderer.render(this._scene, this._camera);
}
```

#### 4.1 自旋转

有了前面的基础，我们如何让这个画面旋转起来呢？答案就是每次 `draw` 的时候修改相机的 `lookAt(x, y, z)` 坐标。

我们让视野水平旋转，这是一个数学知识，见[基础知识](#基础知识)，球体的半径固定，`y = 0` ，改变角度时求 `x` 和 `z` 的值。这里我们暂定每秒旋转 `3º` (即每帧旋转 `0.05º`)，当前相机默认观察 `(0, 0, 0)` ，这等效于看向 Z 轴的负方向。

```js
constructor(option){
  this.rotate = 0;
}

_computeLookAt(){
  // 这里需要把角度转化为弧度再计算 radian = (2π / 360) * degreee
  const x = this.r * Math.sin(THREE.MathUtils.degToRad(this.rotateX));
  const z = -this.r * Math.cos(THREE.MathUtils.degToRad(this.rotateX));
  this._camera.lookAt(x, 0 , z);
}

draw(){
  requestAnimationFrame(() => {
    this.draw();
  });

  this.rotate += 0.05;
  this._computeLookAt();
  this._renderer.render(this._scene, this._camera);
}
```

![t7.gif](../assets/t7.gif)


#### 4.2 鼠标拖拽

接下来我们实现鼠标拖拽改变视野的功能，有了上面自旋功能，我们可以很容易知道这里的实现只需要把鼠标移动的距离和旋转的角度结合起来就行了。

我们需要实现：

- 水平方向拖动
- 垂直方向拖动

首先我们需要确定，距离和角度应该是怎样的关系，比如鼠标移动了 `100px` ，那么角度算是旋转了多少度呢？这个其实随便定一个就行，假设你需要让鼠标更加灵敏，那设置为 `100px` 对应 `360º` 也行。这里我们简单粗暴认为 `100px = 10º`。

先搭起基本架子：

```js
constructor(option) {
  this.setup()
}

setup() {
  this.render();
  this.bindEvents();
}

onMouseDown(e){
  this.startX = e.clientX;
  this.startY = e.clientY;
  this.moving = true;
  // 上一次旋转的角度
  this.lastRotate = this.rotate;
}
onMouseMove(e){
  if(this.moving){
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    // 用 + 还是用 - 取决于你希望图片移动的方向和鼠标方向是否一致
    this.rotate = this.lastRotate - deltaX * 0.1; // 0.1 为约定的像素和角度比例系数
  }
}
onMouseUp(e){
  this.moving = false;
}

bindEvents() {
  this._container.addEventListener("mousedown", this.onMouseDown.bind(this));
  this._container.addEventListener("mousemove", this.onMouseMove.bind(this));
  this._container.addEventListener("mouseup", this.onMouseUp.bind(this));
}
```

就这么简单，你就实现了水平方向的拖动。垂直方向的旋转也是同样的道理，我们把 `rotate` 改成 `rotateX`，增加一段同样的逻辑处理一个叫做 `rotateY`（垂直旋转角度）的字段。如下：

```js
constructor(option){
  this.rotateX = 0;
  this.rotateY = 0;
}
onMouseDown(e){
  this.startX = e.clientX;
  this.startY = e.clientY;
  this.moving = true;
  // 上一次旋转的角度
  this.lastRotateX = this.rotateX;
  this.lastRotateY = this.rotateY;
}
onMouseMove(e){
  if(this.moving){
    const deltaX = e.clientX - this.startX;
    const deltaY = e.clientY - this.startY;

    // 用 + 还是用 - 取决于你希望图片移动的方向和鼠标方向是否一致
    this.rotateX = this.lastRotateX - deltaX * 0.1; // 0.1 为约定的像素和角度比例系数
    this.rotateY = this.lastRotateY - deltaY * 0.1;
  }
}
draw() {
  this.rotateX += 0.05;
  this.rotateY += 0.05;
}
```

现在垂直方向仍然不生效，因为在 `_computeLookAt` 函数中我们把 Y 轴坐标写固定为 `0` 了，这里知道水平角度和垂直角度，求点的空间坐标，见[空间坐标点](#基础知识)部分。现在修改代码如下：

```js
_computeLookAt() {
  let x, y, z;

  // 角度转弧度 radian = (2π / 360) * degreee
  const radianY = THREE.MathUtils.degToRad(this.rotateX);
  const radianX = THREE.MathUtils.degToRad(this.rotateY);
  x = this.r * Math.cos(radianY) * Math.cos(radianX);
  y = this.r * Math.sin(radianY);
  z = this.r * Math.cos(radianY) * Math.sin(radianX);
  this._camera.lookAt(x, y, z);
}
```

![t8.gif](../assets/t8.gif)

如图，已经实现了鼠标的拖拽效果，但是有一个问题，垂直拉到 90 度以后，会翻转到另一侧，这不符合预期，我们需要限制一下垂直方向视野的角度，大概设置为 `±85º` 即可。

```js
_computeLookAt() {
  let x, y, z;

  // 纬度方向旋转不能超过正负 85 度角（即接近南北极附近）
  this.rotateY = Math.max(-85, Math.min(85, this.rotateY));

  // 角度转弧度 radian = (2π / 360) * degreee
  const radianY = THREE.MathUtils.degToRad(this.rotateX);
  const radianX = THREE.MathUtils.degToRad(this.rotateY);
  x = this.r * Math.cos(radianY) * Math.cos(radianX);
  y = this.r * Math.sin(radianY);
  z = this.r * Math.cos(radianY) * Math.sin(radianX);
  this._camera.lookAt(x, y, z);
}
```

在球体上我们通常用 `longtitude` 和 `latitude` 即经纬度来表示点的坐标，所以你现在可以把代码中的 `rotateX` 和 `rotateY` 分别改成 `lon` 和 `lat` 了，当然也可以不用修改，这里我就不改了。

至此，已经完成了全景图的预览。

### 5. 全景标记

#### 5.1 基本思路

点击屏幕时记录鼠标的位置，然后把位置属性赋值给标记，标记绝对定位显示即可。这里我们绑定双击添加标记。

```js
onMouseClick(e){
  const text = prompt("请输入标记内容：") || "";
  if(text === "") return;
  const pos = {x: e.clientX, y: e.clientY};
  this.createLabel({ pos, text })
}

createLabel({ pos, text }){
  const labelDom = document.createElement("div");
  labelDom.classList.add("psv-label");
  labelDom.style.position = "absolute";
  labelDom.style.color = "#FFF";
  labelDom.style.backgroundColor = "rgba(0,0,0,0.6)";
  labelDom.style.padding = "5px";
  labelDom.style.left = pos.x + "px";
  labelDom.style.top = pos.y + "px";
  labelDom.innerText = text;
  this._container.appendChild(labelDom);
}

bindEvents() {
  this._container.addEventListener("dblclick", this.onMouseClick.bind(this));
}
```

如图，我们给屋顶增加来一个标记。

![t9.png](../assets/t9.png)

这段代码的实现有一个很明显的问题就是：当图拖动时，标记的位置没有跟随变。所以接下来需要把屏幕坐标点处理成经纬度。

#### 5.2 记录标记的位置

_注：本段内容仅为开发思路，是一个错误的结果，可以跳过进入下一段，也可以勉强看看。_

我们之前规定了鼠标移动 100px 表示视野旋转 10º ，那么我们是否可以通过这个关系来处理呢？试试看吧。

- 当前相机朝向对应的经纬度 `rotateX` 和 `rotateY`
- 当前相机朝向对应的屏幕坐标 `(0.5 * width, 0.5 * height)`
- 根据当前点击坐标和相机指向坐标的距离得到经纬度偏移量
- 纬度越大说明 y 越小，经度越大说明 x 越大

大概是这样：

```js
onMouseClick(e){
  const text = prompt("请输入标记内容：") || "";
  if(text === "") return;
  const pos = this.getLatLonFromScreen({ x: e.clientX, y: e.clientY });
  this.createLabel({ pos, text })
}

getLatLonFromScreen({ x, y }){
  const newLon = this.lastRotateX + 0.1 * (x - 0.5 * this.width);
  const newLat = this.lastRotateY - 0.1 * (y - 0.5 * this.height);
  return { x: newLon, y: newLat }
}
```

但是这样渲染出来的标记位置肯定是错误的，应该把这个经纬度反转化为屏幕坐标点后渲染出来。

```js
getScreenFromLatLon({ lon, lat }){
  const x = (lon - this.lastRotateX) * 10 + 0.5 * this.width;
  const y = 0.5 * this.height - (lat - this.lastRotateY) * 10;
  return { x, y}
}
createLabel({ pos, text }){
  const screen = this.getScreenFromLatLon(pos);
  labelDom.style.left = screen.x + "px";
  labelDom.style.top = screen.y + "px";
}
```

基本思路就是这样，然后我们在拖拽视野时，需要更新每个标记在屏幕上的位置。

- 把添加标记和渲染标记拆分
- 渲染标记时实时计算坐标

```js
onMouseClick(e){
  // ...
  this.labels.push({ pos, text});
}
renderLabel(label){
  // ...
  label._elem = labelDom;
}
_fixTooltipPos(){
  this.labels.forEach(l => {
    const screen = this.getScreenFromLatLon(l.pos);
    if(!l._rendered){
      this.renderLabel(l)
      l._rendered = true;
    }else{
      // 更新坐标
      l._elem.style.left = screen.x + "px";
      l._elem.style.top = screen.y + "px";
    }
  })
}
draw() {
  // ...
  this._fixTooltipPos();
}
```

现在我们拖拽画面，看一下标记的位置是否更新了。

![t10.png](../assets/t10.png)

可以看到，标记的位置确实更新了，但是却并不准确。这是因为视野内的方形区域并非是纯粹的二维坐标系，而是球体三维坐标，我们全部按照像素和角度 0.1 的关系（二维关系）去计算是错误的。


#### 5.3 屏幕坐标点转经纬度

我们创建标记时，在屏幕中的坐标是 `(x, y)`，需要将其转化为经纬度（或者经纬度对应的三维坐标 `(x, y, z)`）存储。

借助 Three.js 中的 `Vector3(x, y, z).unproject(camera)` 可以达成这种转化，代码如下：

```js
screenPos2WorldVector(x, y, width, height, camera) {
  const pX = (x / width) * 2 - 1;
  const pY = -(y / height) * 2 + 1;
  const vector = new Vector3(pX, pY, -1).unproject(camera);
  return vector;
}
```

#### 5.4 经纬度转屏幕坐标点

同样的，在渲染标记时，我们把存储的三维坐标转化为屏幕二维坐标，代码如下：

```js
worldVector2ScreenPos(worldVector, width, height, camera) {
  const vector = worldVector.clone().project(camera);
  return {
    x: Math.round(((vector.x + 1) * width) / 2),
    y: Math.round(((1 - vector.y) * height) / 2),
    z: vector.z
  };
}
```

#### 5.5 最终效果

我们把之前的 `getLatLonFromScreen` 和 `getScreenFromLatLon` 分别替换为 `screenPos2WorldVector` 和 `worldVector2ScreenPos` 方法，如下：

```js
onMouseClick(e){
  const text = prompt("请输入标记内容：") || "";
  if(text === "") return;
  const pos = this.screenPos2WorldVector(event.clientX, event.clientY, this.width, this.height, this._camera);
  this.labels.push({ pos, text});
}

_fixTooltipPos(){
  this.labels.forEach(l => {
    const screen = this.worldVector2ScreenPos(
      new Vector3(l.pos.x, l.pos.y, l.pos.z), 
      this.width, 
      this.height, 
      this._camera
  })
}
```

现在我们看一下效果：

![t11.gif](../assets/t11.gif)

还没完，当我们水平方向旋转超过 180 度时，诡异的情况发生了，标记在对立的位置出现了。

![t12.png](../assets/t12.png)

这是因为相机背面的点也被投射到了屏幕上，所以我们需要判断如果转到了对立面，则隐藏相应坐标。

```js
worldVector2ScreenPos(worldVector, width, height, camera) {
  const vector = worldVector.clone().project(camera);
  // vector.z > 1 表示在 camera 的背面同一个坐标点
  if(vector.z > 1){
    return { x: 9999, y: 9999 }
  }
  return {
    x: Math.round(((vector.x + 1) * width) / 2),
    y: Math.round(((1 - vector.y) * height) / 2),
    z: vector.z
  };
}
```

Great! 我们已经完成了全景图的预览和标记的创建。

## 后序

江湖再见。
