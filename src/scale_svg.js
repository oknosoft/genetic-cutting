/**
 *
 * Created 11.01.2019.
 */

/**
 * Масштабирует svg
 * @method scale_svg
 * @param svg_current {String} - исходная строка svg
 * @param size {Number|Object} - требуемый размер картинки
 * @param padding {Number} - отступ от границы viewBox
 * @return {String} - отмасштабированная строка svg
 */
module.exports = function scale_svg(svg_current, size, padding){
  let j, k, svg_head, svg_body, head_ind, svg_head_str, viewBox, svg_j = {};

  let height = typeof size == 'number' ? size : size.height,
    width = typeof size == 'number' ? (size * 1.5).round(0) : size.width,
    max_zoom = typeof size == 'number' ? Infinity : (size.zoom || Infinity);

  head_ind = svg_current.indexOf(">");
  svg_head_str = svg_current.substring(5, head_ind);
  svg_head = svg_head_str.split(' ');
  svg_body = svg_current.substring(head_ind+1);
  svg_body = purge_svg(svg_body.substring(0, svg_body.length - 6)
    .replace(/font-size=".+?"/g, (initial) => {
      return initial.replace(/\d{1,}/, (match) => {
        const d = parseFloat(match);
        return d ? (d * 1.2).round() : match;
      });
    }));

  // получаем w, h и формируем viewBox="0 0 400 100"
  for (j in svg_head) {
    svg_current = svg_head[j].split('=');
    if('width,height,x,y'.indexOf(svg_current[0]) != -1) {
      svg_current[1] = Number(svg_current[1].replace(/"/g, ''));
      svg_j[svg_current[0]] = svg_current[1];
    }
  }

  viewBox = 'viewBox="' + (svg_j.x || 0) + ' ' + (svg_j.y || 0) + ' ' + (svg_j.width - padding) + ' ' + (svg_j.height - padding) + '"';

  let init_height = svg_j.height,
    init_width = svg_j.width;

  k = (height - padding) / init_height;
  svg_j.height = height;
  svg_j.width = (init_width * k).round(0);

  if(svg_j.width > width){
    k = (width - padding) / init_width;
    svg_j.height = (init_height * k).round(0);
    svg_j.width = width;
  }

  if(k > max_zoom){
    k = max_zoom;
    svg_j.height = (init_height * k).round(0);
    svg_j.width = (init_width * k).round(0);
  }

  svg_j.x = (svg_j.x * k).round(0);
  svg_j.y = (svg_j.y * k).round(0);

  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ' +
    'width="' + svg_j.width + '" ' +
    'height="' + svg_j.height + '" ' +
    'x="' + svg_j.x + '" ' +
    'y="' + svg_j.y + '" ' +
    'xml:space="preserve" ' + viewBox + '>' + svg_body + '</svg>';
}

function purge_svg(svg) {
  return svg
    .replace(/font-family=".+?"/g, () => '')
    .replace(/font-weight=".+?"/g, () => '');
}
