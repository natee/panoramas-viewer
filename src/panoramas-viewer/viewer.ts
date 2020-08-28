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
} from "three";

import {
  log,
  throttle,
  getLontitude,
  latLon2WorldVector,
  screenPos2WorldVector,
  worldVector2ScreenPos,
} from "./utils";
import { Tooltip } from "./tooltip";
import { Navbar, IMarkerOption } from "./navbar";

export interface IVectorPos {
  x: number;
  y: number;
  z: number;
}
export interface ILabel {
  pos: IVectorPos;
  data: string;
}

export interface IOption {
  container: string; // 容器的CSS选择器，不提供则默认 body
  img: string; // 图片的路径
  auto?: boolean; // 自动旋转
  sensitivity?: number; // 鼠标操作时的灵敏度，默认0.1（即鼠标滑动 100px，算作球体旋转角度为 10deg）
  minFocalLength?: number; // 镜头最小拉近距离，最小焦距
  maxFocalLength?: number; // 镜头最大拉近距离，最大焦距
  enableZoom?: boolean; // 允许缩放
  labels?: ILabel[];
  marker?: IMarkerOption
}

type IFullOption = Required<IOption>;

const defaultOption = {
  container: "body",
  auto: false,
  sensitivity: 0.1,
  minFocalLength: 8,
  maxFocalLength: 50,
  enableZoom: false,
  labels: [],
  marker: {
    enable: true,
    add() {},
    clear() {},
  }
};

export default class PanoramasViewer {
  // 想象一下脑海里有一个地球仪，球体半径
  private RADIUS: number = 1000;

  public option: IFullOption;

  private parentElement: HTMLElement;
  private element: HTMLElement | undefined;

  private width!: number;
  private height!: number;
  private _scene: Scene;
  private _camera: PerspectiveCamera;
  private _renderer: WebGLRenderer;

  private _pointer = {
    moving: false,
    startX: 0,
    startY: 0,
    lastLontidude: 0,
    lastLatidude: 0,
    // 水平旋转角度（经度），正值表示把地球仪往左滑，需要把 camera.lookAt 往右侧
    longtitude: 0,
    // 垂直旋转角度（纬度），正值表示把地球仪往下滑，需要把 camera.lookAt 往天空指，y 指向正
    latitude: 0,
  };
  private _cameraLookAt: Vector3 = new Vector3(0, 0, 0);

  _tooltip: Tooltip[] = [];

  public constructor(option: IOption) {
    this.option = { ...defaultOption, ...option };
    this.parentElement = document.querySelector(
      this.option.container
    ) as HTMLElement;
    this.updateSize();
    this.createView();
    this._scene = new Scene();
    this._camera = new PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1100
    );

    this._renderer = new WebGLRenderer();

    this._setup();
  }

  _setup() {
    this._initScene();
    this._initRenderer();
    this._initCamera();
    this._bindEvents();
    this._initTooltip();
    this._initNavbar();
    this.draw();
  }

  updateSize(){
    const { width, height }: DOMRect = this.parentElement.getBoundingClientRect()
    this.width = width;
    this.height = height;
  }

  createView() {
    this.element = document.createElement("div");
    this.element.classList.add("psv-container");
    this.parentElement.appendChild(this.element);
  }

  _initScene() {
    this._scene.add(this._createEntry());
  }

  _createEntry() {
    const texture = new TextureLoader().load(this.option.img);

    // 创建一个球体，(半径，水平分段数，垂直分段数)
    const geometry = new SphereGeometry(this.RADIUS, 100, 100);

    // 基础网格材质，不受光照影响，球体的纹理，双面纹理
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
    if (!this.element) return;
    this._renderer.setSize(this.width, this.height);
    this.element.appendChild(this._renderer.domElement);
  }

  _initCamera() {
    // 相机位于球体中心
    this._camera.position.set(0, 0, 0);

    // 相机对准坐标系原点
    this._camera.lookAt(this._cameraLookAt);
  }

  onMouseDown(event: MouseEvent) {
    log(event)
    event.preventDefault();
    this._pointer.moving = true;
    this._pointer.startX = event.clientX;
    this._pointer.startY = event.clientY;
    this._pointer.lastLontidude = this._pointer.longtitude;
    this._pointer.lastLatidude = this._pointer.latitude;
  }

  onMouseMove(event: MouseEvent) {
    if (this._pointer.moving) {
      // 全景图创建纹理时，翻转了 x 轴，所以这里需要反向计算
      this._pointer.longtitude = getLontitude(
        (this._pointer.startX - event.clientX) * this.option.sensitivity +
          this._pointer.lastLontidude
      );
      this._pointer.latitude =
        (event.clientY - this._pointer.startY) * this.option.sensitivity +
        this._pointer.lastLatidude;
    }
  }

  onMouseUp(event: MouseEvent) {
    this._pointer.moving = false;
  }

  // 直接忽略多指操作的情况
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    this._pointer.moving = true;
    this._pointer.startX = event.touches[0].clientX;
    this._pointer.startY = event.touches[0].clientY;
    this._pointer.lastLontidude = this._pointer.longtitude;
    this._pointer.lastLatidude = this._pointer.latitude;
  }

  onTouchMove(event: TouchEvent) {
    if (this._pointer.moving) {
      // 全景图创建纹理时，翻转了 x 轴，所以这里需要反向计算
      this._pointer.longtitude = getLontitude(
        (this._pointer.startX - event.touches[0].clientX) * this.option.sensitivity +
          this._pointer.lastLontidude
      );
      this._pointer.latitude =
        (event.touches[0].clientY - this._pointer.startY) * this.option.sensitivity +
        this._pointer.lastLatidude;
    }
  }

  onTouchEnd(event: TouchEvent) {
    this._pointer.moving = false;
  }

  // 鼠标缩放
  onMouseWheel(event: WheelEvent) {
    const { minFocalLength, maxFocalLength } = this.option;
    // 往下滚动表示缩放，即焦距变近
    const down = event.deltaY > 0;
    let currentFocal = this._camera.getFocalLength();
    if (down) {
      if (currentFocal > minFocalLength) {
        currentFocal -= currentFocal * 0.05;
        this._camera.setFocalLength(currentFocal);
      }
    } else {
      if (currentFocal < maxFocalLength) {
        currentFocal += currentFocal * 0.05;
        this._camera.setFocalLength(currentFocal);
      }
    }
  }

  async onMouseDoubleClick(event: MouseEvent) {
    const text: string = prompt("请输入标记内容：") || "";
    if(text === "") return;

    const tooltipPos = screenPos2WorldVector(
      event.clientX,
      event.clientY,
      this.width,
      this.height,
      this._camera
    );
    const data = {
      pos: tooltipPos,
      data: text,
    };
    const marker = this.option.marker

    try {
      if (marker.add) {
        marker.add([...this.option.labels, data]);
      }
      this.addLabel(data);
    } catch (err) {
      throw `添加失败:${err}`;
    }
  }

  addLabel(option: ILabel) {
    this.option.labels.push({
      pos: option.pos,
      data: option.data,
    });

    this._tooltip.push(
      new Tooltip({
        container: this.element,
        pos: option.pos,
        data: option.data,
      })
    );

    this._renderTooltip();
  }

  _bindEvents() {
    if (!this.element) return;

    this.element.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.element.addEventListener("mousemove", throttle(this.onMouseMove.bind(this), 30));
    this.element.addEventListener("mouseup", this.onMouseUp.bind(this));

    if (this.option.enableZoom) {
      // mousewheel事件已经废弃了
      this.element.addEventListener("wheel", this.onMouseWheel.bind(this));
    }

    this.element.addEventListener("dblclick", this.onMouseDoubleClick.bind(this));

    // 移动端事件
    this.element.addEventListener("touchstart", this.onTouchStart.bind(this));
    this.element.addEventListener("touchmove", throttle(this.onTouchMove.bind(this), 30));
    this.element.addEventListener("touchend", this.onTouchEnd.bind(this));

    window.addEventListener("resize", throttle(() => {
      this.updateSize();
      this._camera.aspect = this.width / this.height;
      this._camera.updateProjectionMatrix();
      this._renderer.setSize( this.width, this.height );
    }, 30));
  }

  /**
   * 鼠标拖动，计算 camera 朝向
   * 已知一个向量和 X 轴和 Y 轴的夹角，求该向量和 球体相交点的坐标
   */
  _computeMousePosition() {
    this._cameraLookAt = latLon2WorldVector(
      this.RADIUS,
      this._pointer.latitude,
      this._pointer.longtitude
    );
    this._camera.lookAt(this._cameraLookAt);
  }

  draw() {
    requestAnimationFrame(() => {
      this.draw();
    });
    this._computeMousePosition();
    this._renderer.render(this._scene, this._camera);
    this._renderTooltip();

    if(this.option.auto === true) {
      this._pointer.longtitude += 0.05
    }
  }

  _initTooltip() {
    this._tooltip = [];
    this.option.labels.forEach((item) => {
      this._tooltip.push(
        new Tooltip({
          container: this.element,
          // 存的是Vector3(x,y,z)的参数，需转化
          pos: new Vector3(item.pos.x, item.pos.y, item.pos.z),
          data: item.data,
        })
      );
    });

    setTimeout(() => {
      this._renderTooltip();
    }, 200);
  }

  _renderTooltip() {
    this._tooltip.forEach((tooltip) => {
      tooltip.coordinate = worldVector2ScreenPos(
        new Vector3(tooltip.pos.x, tooltip.pos.y, tooltip.pos.z),
        this.width,
        this.height,
        this._camera
      );
      tooltip.show();
    });
  }

  // 从画布中移除标签
  clearLabels() {
    this._tooltip.forEach((tooltip) => {
      tooltip.destroy()
    });
    this._tooltip = [];
    this.option.labels = [];
  }

  _initNavbar() {
    const marker = this.option.marker
    
    new Navbar({
      container: this.element,
      marker: {
        ...marker,
        clear: () => {
          if(marker.clear) {
            marker.clear()
          }
          this.clearLabels();
        }
      }
    })
  }
}
