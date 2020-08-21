/**
 * WebGL
 * 场景 scene
 * 元素 geometry
 * 材质 material
 * 相机 camera
 * 渲染器 renderer
 */
import * as THREE from "three";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Vector3,
  MathUtils
} from "three";

const log = console.log;

interface IOption {
  container?: string;         // 容器的CSS选择器，不提供则默认 body
  img: string;                // 图片的路径
  sensitivity: number;        // 鼠标操作时的灵敏度，默认0.1（即鼠标滑动 100px，算作球体旋转角度为 10deg）
  minFocalLength: number;     // 镜头最小拉近距离，最小焦距
  maxFocalLength: number;        // 镜头最大拉近距离，最大焦距
}

const defaultOption = {
  contianer: "body",
  sensitivity: 0.1,
  minFocalLength: 8,
  maxFocalLength: 50,
}

export default class PanoramasViewer {
  // 想象一下脑海里有一个地球仪，球体半径
  private RADIUS: number = 1000;

  public option: IOption;

  private _elem: HTMLElement;
  private width: number;
  private height: number;
  private _scene: Scene;
  private _camera: PerspectiveCamera;
  private _renderer: WebGLRenderer;

  private _pointer = {
    moving: false,
    startX: 0,
    startY: 0,
    lastXDegree: 0,
    lastYDegree: 0,
    // 水平旋转角度，正值表示把地球仪往左滑，需要把 camera.lookAt 往右侧
    xDegree: 0,
    // 垂直旋转角度，正值表示把地球仪往下滑，需要把 camera.lookAt 往天空指，y 指向正
    yDegree: 0
  };
  private _cameraLookAt: Vector3 = new Vector3(0, 0, 0)

  public constructor(option: IOption) {
    this.option = {...defaultOption, ...option};
    this._elem = document.querySelector(this.option.container || "body") as HTMLElement;
    const { width, height }: DOMRect = this._elem.getBoundingClientRect();
    this.width = width;
    this.height = height;

    this._scene = new Scene();
    this._camera = new PerspectiveCamera(75, this.width / this.height, 0.1, 1100);
    this._renderer = new WebGLRenderer();

    this._setup();
  }

  _setup() {

    this._initScene();
    this._initRenderer();
    this._initCamera();

    this._bindEvents();
  }

  _initScene() {
    this._scene.add(this._createEntry());
  }

  _createEntry() {
    const texture = new TextureLoader().load(this.option.img);

    // 创建一个球体，(半径，水平分段数，垂直分段数)
    const geometry = new SphereGeometry(this.RADIUS, 100, 100);

    // 球体的纹理，双面纹理
    const material = new MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new Mesh(geometry, material);

    // 翻转 x 轴
    mesh.scale.x = -1;
    return mesh;
  }

  _initRenderer() {
    this._renderer.setSize(this.width, this.height);
    this._elem.appendChild(this._renderer.domElement);
  }

  _initCamera() {
    
    // 相机位于球体中心
    this._camera.position.set(0, 0, 0);

    // 相机对准坐标系原点
    this._camera.lookAt(this._cameraLookAt);
  }

  onMouseDown(event: MouseEvent){
    event.preventDefault();
    this._pointer.moving = true;
    this._pointer.startX = event.clientX;
    this._pointer.startY = event.clientY;
    this._pointer.lastXDegree = this._pointer.xDegree;
    this._pointer.lastYDegree = this._pointer.yDegree;
  }

  onMouseMove(event: MouseEvent){
    if (this._pointer.moving) {
      // 全景图创建纹理时，翻转了 x 轴，所以这里需要反向计算
      this._pointer.xDegree = (this._pointer.startX - event.clientX) * this.option.sensitivity + this._pointer.lastXDegree;
      this._pointer.yDegree = (event.clientY - this._pointer.startY) * this.option.sensitivity + this._pointer.lastYDegree;
    }
  }

  onMouseUp(event: MouseEvent){
    this._pointer.moving = false;
  }

  // 鼠标缩放
  onMouseWheel(event: WheelEvent){
    const { minFocalLength, maxFocalLength } = this.option;
    // 往下滚动表示缩放，即焦距变近
    const down = event.deltaY > 0;
    let currentFocal = this._camera.getFocalLength();
    if (down) {
      if (currentFocal > minFocalLength) {
        currentFocal -= currentFocal * 0.05
        this._camera.setFocalLength(currentFocal);
      }
    } else {
      if (currentFocal < maxFocalLength) {
        currentFocal += currentFocal * 0.05
        this._camera.setFocalLength(currentFocal);
      }
    }
  }

  _bindEvents() {
    this._elem.addEventListener("mousedown", this.onMouseDown.bind(this));
    this._elem.addEventListener("mousemove", this.onMouseMove.bind(this));
    this._elem.addEventListener("mouseup", this.onMouseUp.bind(this));
    // mousewheel事件已经废弃了
    this._elem.addEventListener("wheel", this.onMouseWheel.bind(this));
  }

  /**
   * 鼠标拖动，计算 camera 朝向
   * 已知一个向量和 X 轴和 Y 轴的夹角，求该向量和 球体相交点的坐标
   */
  _calPosition() {
    // 纬度方向旋转不能超过正负 85 度角（即接近南北极附近）
    this._pointer.yDegree = Math.max(-85, Math.min(85, this._pointer.yDegree));

    // 角度转弧度 radian = (2π / 360) * degreee
    const radianY = MathUtils.degToRad(this._pointer.yDegree);
    const radianX = MathUtils.degToRad(this._pointer.xDegree);
    this._cameraLookAt.x = this.RADIUS * Math.cos(radianY) * Math.cos(radianX);
    this._cameraLookAt.y = this.RADIUS * Math.sin(radianY);
    this._cameraLookAt.z = this.RADIUS * Math.cos(radianY) * Math.sin(radianX);
    this._camera.lookAt(this._cameraLookAt);
  }

  render() {
    requestAnimationFrame(() => {
      this.render();
    });
    this._calPosition();
    this._renderer.render(this._scene, this._camera);
  }
}
