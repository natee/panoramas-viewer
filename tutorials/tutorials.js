const {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Vector3,
  DirectionalLight,
} = THREE;

class PanoramasViewer {
  constructor(option) {
    this.option = option;
    this._container = document.querySelector(this.option.container);

    // 宽高暂时写死
    this.width = 1000;
    this.height = 600;
    this.r = 1000;

    this.rotateX = 0;
    this.rotateY = 0;

    this.setup();
  }

  setup() {
    this.render();
    this.bindEvents();
  }

  async render() {
    this._scene = new Scene();
    const mesh = await this._createBall();
    this._scene.add(mesh);
    this._addAxes();

    this._camera = new PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1500
    );
    this._camera.position.set(0, 0, 0);
    this._camera.lookAt(new Vector3(0, 0, -1000));

    this._renderer = new WebGLRenderer();
    this._renderer.setSize(this.width, this.height);
    this._container.appendChild(this._renderer.domElement);

    this.draw();
  }

  _createBall() {
    const loader = new TextureLoader();
    return new Promise((resolve) => {
      loader.load(this.option.img, (texture) => {
        const geometry = new SphereGeometry(this.r, 100, 100);
        const material = new MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });
        const mesh = new Mesh(geometry, material);
        mesh.scale.x = -1;
        resolve(mesh);
      });
    }).then((res) => res);
  }

  _addAxes() {
    const axesHelper = new THREE.AxesHelper(3000);
    this._scene.add(axesHelper);
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
      this.rotateY = this.lastRotateY + deltaY * 0.1;
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

  _computeLookAt() {
    let x, y, z;

    // 纬度方向旋转不能超过正负 85 度角（即接近南北极附近）
    this.rotateY = Math.max(-85, Math.min(85, this.rotateY));
    
    // 角度转弧度 radian = (2π / 360) * degreee
    const radianX = THREE.MathUtils.degToRad(this.rotateX);
    const radianY = THREE.MathUtils.degToRad(this.rotateY);
    x = this.r * Math.cos(radianY) * Math.cos(radianX);
    y = this.r * Math.sin(radianY);
    z = this.r * Math.cos(radianY) * Math.sin(radianX);
    this._camera.lookAt(x, y, z);
  }

  draw() {
    requestAnimationFrame(() => {
      this.draw();
    });

    // this.rotateX += 0.05;
    // this.rotateY += 0.05;
    this._computeLookAt();
    this._renderer.render(this._scene, this._camera);
  }
}