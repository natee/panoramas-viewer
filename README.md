# panoramas-viewer

panoramas-viewer 是一个全景图浏览插件，你可以在现代浏览器上使用该插件预览 360 x 180 的全景图。

说明：本项目为学习使用，不用于生产环境，如果你需要在生产环境使用类似功能，强烈建议你使用优秀开源项目 [Photo-Sphere-Viewer](https://github.com/mistic100/Photo-Sphere-Viewer) 。


## 示例

![demo.gif](assets/demo.gif)

[在线 DEMO](https://natee.github.io/panoramas-viewer/)，源码看 `src/demo.vue`。


## 使用方法

拷贝 `src/panoramas-viewer` 目录。

依赖 
- `TypeScript`
- `ThreeJS`，参看官网怎么配置 `tsconfig.json`

```js
import PanoramasViewer from "./panoramas-viewer/viewer";
import dynamicImg from "./img/p4.png";
const viewer = new PanoramasViewer({
  container: ".demo",
  img: dynamicImg,
  labels: [{
    pos: {
      x: 0.09452310737984349
      y: -0.004897297889980296
      z: -0.032380310262542754
    }, 
    data: "我是一个标记"
  }]
});
```

## 配置项

`new PanoramasViewer(option)`

- **container**

  `type: string`，必填

  全景图容器的 CSS 选择器。

- **img**

  `type: string`，必填

  全景图使用图片的 URL ，如果你是用动态路径，需要用 `require` 或 `import` 方法导入。

- **auto**

  `type: boolean`，可选

  `默认值: false`

  是否自动移动全景图。

- **labels**

  `type: ILabel`，可选

  ```typescript
  export interface IVectorPos {
    x: number;
    y: number;
    z: number;
  }
  export interface ILabel {
    pos: IVectorPos;
    data: string;
  }
  ```

  全景图中已经添加的标记列表。

- **sensitivity**

  `type: number`，可选

  `默认值: 0.1`

  鼠标操作时的灵敏度，默认0.1（即鼠标滑动 100px，算作球体旋转角度为 10deg）。

- **minFocalLength**

  `type: number`，可选

  `默认值: 8`

  镜头最小拉近距离，最小焦距。

- **maxFocalLength**

  `type: number`，可选

  `默认值: 50`

  镜头最大拉近距离，最大焦距。

- **enableZoom**

  `type: boolean`，可选

  `默认值: false`

  是否允许鼠标滚动缩放。

- **marker**

  `type: IMarkerOption`，可选

  ```typescript
  export interface IMarkerOption {
    enable?: boolean;
    add?: (label: ILabel[]) => void;
    clear?: () => void;
  }
  ```

  `默认值: false`

  全景图标记相关的操作。

- **marker.enable**

  `type: boolean`，可选

  `默认值: true`

  是否在工具栏上显示清除标记的功能，默认显示。_这个自动叫 enable 不合适，应该挪到一个 `navbar` 的配置项中。_

- **marker.add**

  `type: Function`，可选

  `默认值: noop`

  添加标记时的函数，如果需要把标记存到数据库，则在 `add` 函数中执行 API 操作。默认为空函数，则只会临时显示设置的标签，刷新页面恢复。

- **marker.clear**

  `type: Function`，可选

  `默认值: noop`

  清空标记时的函数，如果需要从数据库中清除标记，则在 `clear` 函数中执行 API 操作。

### 未实现

以下配置未实现，但你可以尝试这实现。

- **marker.remove(label)**

  `type: Function`，可选

  `默认值: noop`

  删除指定标记。

- **navbar.zoomIn**

  `type: boolean`，可选

  `默认值: true`

  是否在工具栏上显示放大的功能，默认显示。

- **navbar.zoomOut**

  `type: boolean`，可选

  `默认值: true`

  是否在工具栏上显示缩小的功能，默认显示。

  ...
  

## 教程

[手把手教你实现 360° 全景图预览插件](./tutorials/tutorials.md)

## 许可证

[MIT](LICENSE)