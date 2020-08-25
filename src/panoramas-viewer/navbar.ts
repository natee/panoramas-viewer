/**
 * 这里可以把放大缩小、移动、删除标记等功能用按钮的形式实现
 */

import { ILabel, IVectorPos } from './viewer';

export interface INavbarOption {
  container: HTMLElement | undefined;
  marker: IMarkerOption
}

export interface IMarkerOption {
  enable?: boolean;
  add?: (label: { pos: IVectorPos; data: string }) => void;
  clear?: () => void;
}

type IFullMarkerOption = Required<IMarkerOption>

const defaultOption = {
  marker: {
    enable: true,
    add() {},
    clear() {},
  }
}

export class Navbar {
  container: HTMLElement | undefined;
  element: HTMLElement | undefined;
  marker: IFullMarkerOption;

  constructor(option: INavbarOption) {
    this.container = option.container;
    this.marker = {...defaultOption.marker, ...option.marker};
    this.setup();
  }

  setup() {
    this.createNavbar();
  }

  createNavbar() {
    this.element = document.createElement("div");
    this.element.className = "psv-navbar";
    if(this.container){
      this.container.appendChild(this.element);
    }

    if(this.marker.enable){
      this._createMarkerIcon()
    }
  }

  _createMarkerIcon(){
    const elem = document.createElement("div");
    elem.className = "psv-navbar-icon psv-navbar-icon--marker";
    elem.innerText = "清除标记";
    this.element?.appendChild(elem);

    elem.addEventListener("click", this.marker.clear)
  }
}
