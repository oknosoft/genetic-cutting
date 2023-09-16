
const paper = require('paper/dist/paper-core');

paper.Project.prototype.zoomFit = function zoomFit() {
  const bounds = this.activeLayer.bounds;
  const space = 160;
  const min = 900;
  let {width, height, center} = bounds;
  if (width < min) {
    width = min;
  }
  if (height < min) {
    height = min;
  }
  width += space;
  height += space;
  const {view} = this;
  const zoom = Math.min(view.viewSize.height / height, view.viewSize.width / width);
  const {scaling} = view._decompose();
  view.scaling = [Math.sign(scaling.x) * zoom, Math.sign(scaling.y) * zoom];

  const dx = view.viewSize.width - width * zoom;
  const dy = view.viewSize.height - height * zoom;
  view.center = center.add([Math.sign(scaling.x) * dx, -Math.sign(scaling.y) * dy]);
  return bounds;
};

paper.Project.prototype.getSvg = function getSvg() {
  this.deselectAll();
  const bounds = this.zoomFit();
  const svg = this.exportSVG({precision: 1});  

  svg.setAttribute('x', bounds.x);
  svg.setAttribute('y', bounds.y);
  svg.setAttribute('width', bounds.width + 40);
  svg.setAttribute('height', bounds.height);
  svg.querySelector('g').removeAttribute('transform');

  return svg.outerHTML;
}

const pathAttr = {
  strokeColor: 'black',
  strokeWidth: 1,
  strokeScaling: false,
};

module.exports = function svg(data) {
  
  if(!paper.project) {
    const canvas = paper.createCanvas(1000, 1000);
    paper.setup(canvas);
  }
  for(const scrap of data.scrapsIn) {
    paper.project.clear();
    const path = new paper.Path.Rectangle(0, 0, scrap.length, scrap.height);
    path.set(pathAttr);

    scrap.products = data.products.filter(v => v.blank === scrap.id);
    for(const product of scrap.products) {
      const path = new paper.Path.Rectangle(
        product.x,
        product.y,
        product.height,
        product.length);
      path.set(pathAttr);
    }
    
    scrap.svg = paper.project.getSvg();
  }
  return data;
}
