export interface ICoordinate {
  x: number,
  y: number
}
export interface ITooltipOption {
  container: HTMLElement | undefined,
  width?: number,
  height?: number,
  pos: Vector3,
  data: string
}

import { Vector3 } from "three";
import { uuidv4 } from "./utils";

export class Tooltip {
  _id: string;
  container: HTMLElement | undefined;
  coordinate: ICoordinate;
  pos: Vector3;
  data: string;
  
  element: HTMLElement | undefined

  constructor(option: ITooltipOption){
    this._id = "t_" + uuidv4();
    this.container = option.container;
    this.coordinate = { x: 0, y: 0};
    this.pos = option.pos;
    this.data = option.data;
    this.setup()
  }

  setup(){
    this.createTooltip()
  }

  createTooltip(){
    this.element = document.createElement("div");
    this.element.className = "psv-tooltip";
    if(this.container){
      this.container.appendChild(this.element);
    }

    this.element.innerHTML = this.data;
  }

  show(){
    this._computeTooltipPosition();
  }

  _computeTooltipPosition(){
    if(!this.element) return;

    this.element.style.left = `${this.coordinate.x}px`
    this.element.style.top = `${this.coordinate.y}px`
  }
}