import { uuidv4 } from "./utils";
import { IVectorPos } from "./viewer";

export interface ICoordinate {
  x: number;
  y: number;
}
export interface ITooltipOption {
  container: HTMLElement | undefined;
  width?: number;
  height?: number;
  pos: IVectorPos;
  data: string;
}

export class Tooltip implements ITooltipOption {
  _id: string;
  container: HTMLElement | undefined;
  coordinate: ICoordinate;
  pos: IVectorPos;
  data: string;

  element: HTMLElement | undefined;

  constructor(option: ITooltipOption) {
    this._id = "t_" + uuidv4();
    this.container = option.container;
    this.coordinate = { x: 0, y: 0 };
    this.pos = option.pos;
    this.data = option.data;
    this.setup();
  }

  setup() {
    this.createTooltip();
  }

  createTooltip() {
    this.element = document.createElement("div");
    this.element.className = "psv-tooltip";
    if (this.container) {
      this.container.appendChild(this.element);
    }

    this.element.innerHTML = this.data;
  }

  show() {
    this._computeTooltipPosition();
  }

  _computeTooltipPosition() {
    if (!this.element) return;

    this.element.style.left = `${this.coordinate.x}px`;
    this.element.style.top = `${this.coordinate.y}px`;
  }

  destroy() {
    if (this.element) {
      this.container?.removeChild(this.element);
    }
  }
}
