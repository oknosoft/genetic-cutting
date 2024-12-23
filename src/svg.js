
const scale_svg = require('./scale_svg');

function getSvg(options) {
  
  const {_scope: {document}, activeLayer: {bounds}} = this;
  const svg = this.exportSVG({
    precision: 1,
    onExport: (item, node) => {
      if (item._class === 'PointText') {
        node.textContent = null;
        for (let i = 0; i < item._lines.length; i++) {
          let tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
          tspan.textContent = `\u200b${item._lines[i]}`;
          let dy = item.leading;
          if (i === 0) {
            dy = 0;
          }
          tspan.setAttributeNS(null, 'x', node.getAttribute('x'));
          tspan.setAttributeNS(null, 'dy', dy);
          node.appendChild(tspan);
        }
      }
      return node;
    }
  });

  svg.setAttribute('x', bounds.x.round() - 40);
  svg.setAttribute('y', bounds.y.round() - 20);
  svg.setAttribute('width', bounds.width.round() + 80);
  svg.setAttribute('height', bounds.height.round() + 40);
  svg.querySelector('g').removeAttribute('transform');

  return options?.scale ? scale_svg(svg.outerHTML, options.scale.size, options.scale.padding) : svg.outerHTML;
}

const fontSize = 70;

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
  
  return function svg(data) {
    const editor = new EditorInvisible();
    const {Path, PointText, project} = editor;
    const {scrapsIn, scrapsOut, products, options} = data;
    if(!scrapsIn) {
      throw new Error(data.message || JSON.stringify(data));
    }
    const dx = options?.edges?.dx || 0;
    const dy = options?.edges?.dy || 0;
    for(const scrap of scrapsIn) {
      project.clear();
      project.activeLayer.removeChildren();
      const path = new Path.Rectangle(-0.5, -0.5 - dy, scrap.length + 1 + dx /2, scrap.height + 1 + dy /2);
      path.set(Object.assign({}, pathAttr, {strokeWidth: 2}));

      scrap.products = products.filter(v => v.stick === scrap.id);
      for(const product of scrap.products) {
        const path = new Path.Rectangle(
          product.x + dx,
          scrap.height - product.y - dy,
          product.height,
          -product.length);
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
            point: bounds.center,
            content: product.info,
            justification: 'center',
            fontSize: fontSize * 0.8,             
          });
        }
      }

      scrap.scraps = scrapsOut.filter(v => v.id === scrap.id);
      for(const product of scrap.scraps) {
        const path = new Path.Rectangle(
          product.x + dx,
          scrap.height - product.y - dy,
          product.length,
          -product.height
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
    editor.unload();
    return data;
  };  
}
