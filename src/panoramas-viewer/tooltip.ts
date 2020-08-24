
export interface IPos {
  x: number,
  y: number
}
export interface ITooltipOption {
  container: HTMLElement | undefined,
  width: number,
  height: number,
  pos: IPos,
  data: string
}

export class Tooltip {
  option: ITooltipOption;
  
  element: HTMLElement | undefined

  constructor(option: ITooltipOption){
    this.option = {...option}

    this.setup()
  }

  setup(){
    this.createTooltip()
    this._computeTooltipPosition()
  }

  createTooltip(){
    this.element = document.createElement('div');
    this.element.className = 'psv-tooltip';
    if(this.option.container){
      this.option.container.appendChild(this.element);
    }

    this.element.innerHTML = this.option.data;
  }

  _computeTooltipPosition(){
    if(!this.element) return;
    console.log(this.option);
    const { pos: { x, y } } = this.option;
    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
  }
}