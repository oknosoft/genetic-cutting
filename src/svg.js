
function getSvg() {

  const bounds = this.activeLayer.bounds;
  const svg = this.exportSVG({precision: 1});

  svg.setAttribute('x', bounds.x.round() - 40);
  svg.setAttribute('y', bounds.y.round());
  svg.setAttribute('width', bounds.width.round() + 80);
  svg.setAttribute('height', bounds.height.round());
  svg.querySelector('g').removeAttribute('transform');

  return svg.outerHTML;
}

const fontSize = 90;

const pathAttr = {
  strokeColor: 'black',
  strokeWidth: 1,
  strokeScaling: false,
};

module.exports = function wrapper(EditorInvisible) {
  
  const editor = new EditorInvisible();
  const {Path, PointText, project} = editor;
  
  
  return function svg(data) {
    for(const scrap of data.scrapsIn) {
      project.clear();
      const path = new Path.Rectangle(0, 0, scrap.length, scrap.height);
      path.set(pathAttr);

      scrap.products = data.products.filter(v => v.stick === scrap.id);
      for(const product of scrap.products) {
        const path = new Path.Rectangle(
          product.x,
          product.y,
          product.height,
          product.length);
        path.set(pathAttr);
        const {bounds} = path;
        let text = new PointText({
          content: product.height.toFixed(),
          fontSize,
        });
        text.position = bounds.bottomCenter.add([0, -text.bounds.height/2]);
        text = new PointText({
          content: product.length.toFixed(),
          rotation: -90,
          fontSize,
        });
        text.position = bounds.leftCenter.add([text.bounds.width/2 + 8, 0]);
        if(product.info) {
          text = new PointText({
            content: product.info,
            fontSize: fontSize * 1.3,
          });
          text.position = bounds.center;
        }
      }
      
      scrap.svg = getSvg.call(project);
    }
    return data;
  };  
}
