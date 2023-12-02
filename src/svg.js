
const scale_svg = require('./scale_svg');

function getSvg(options) {

  const bounds = this.activeLayer.bounds;
  const svg = this.exportSVG({precision: 1});

  svg.setAttribute('x', bounds.x.round() - 40);
  svg.setAttribute('y', bounds.y.round());
  svg.setAttribute('width', bounds.width.round() + 80);
  svg.setAttribute('height', bounds.height.round());
  svg.querySelector('g').removeAttribute('transform');

  return options?.scale ? scale_svg(svg.outerHTML, options.scale.size, options.scale.padding) : svg.outerHTML;
}

const fontSize = 90;

const pathAttr = {
  strokeColor: 'black',
  strokeWidth: 1,
  strokeScaling: false,
};
const cutAttr = {
  strokeColor: 'blue',
  strokeWidth: 1,
  strokeScaling: false,
  dashArray: [6, 8],
}

module.exports = function wrapper(EditorInvisible) {
  
  const editor = new EditorInvisible();
  const {Path, PointText, project} = editor;
  
  
  return function svg(data) {
    const {scrapsIn, scrapsOut, products, options} = data;
    if(!scrapsIn) {
      throw new Error(data.message || JSON.stringify(data));
    }
    for(const scrap of scrapsIn) {
      project.clear();
      const path = new Path.Rectangle(-0.5, -0.5, scrap.length + 0.5, scrap.height + 0.5);
      path.set(Object.assign({}, pathAttr, {strokeWidth: 2}));

      scrap.products = products.filter(v => v.stick === scrap.id);
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

      scrap.scraps = scrapsOut.filter(v => v.id === scrap.id);
      for(const product of scrap.scraps) {
        const path = new Path.Rectangle(
          product.x,
          product.y,
          product.length,
          product.height
        );
        path.set(cutAttr);
        const {bounds} = path;
        let text = new PointText({
          content: product.length.toFixed(),
          fontSize,
          fillColor: 'blue',
        });
        text.position = bounds.bottomCenter.add([0, -text.bounds.height/2]);
        text = new PointText({
          content: product.height.toFixed(),
          rotation: -90,
          fontSize,
          fillColor: 'blue',
        });
        text.position = bounds.leftCenter.add([text.bounds.width/2 + 8, 0]);
      }
      
      scrap.svg = getSvg.call(project, options);
    }
    return data;
  };  
}
