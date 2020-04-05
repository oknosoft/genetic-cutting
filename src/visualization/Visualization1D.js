/**
 *
 *
 * @module Visualization1D
 *
 * Created by Evgeniy Malyarov on 05.04.2020.
 */

class Visualization1D {

  draw (userData, decision) {

    var x=0, y, w, h=88,
      path;

    for(var i=0; i<decision.workpieces.length; i++){

      if(i<userData.workpieces.length)
        w = userData.workpieces[i];
      else
        w = userData.sticklength;

      y = Math.round(h * 1.3) * i;

      path = new paper.Path({
        segments: [[x, y], [x+w, y], [x+w, y+h], [x, y+h]],
        strokeColor: 'grey',
        strokeScaling: false,
        strokeWidth: 1,
        closed: true
      });

      var res = [];
      decision.res.forEach(function (val, index) {
        if(val == i){
          res.push(userData.products[index]);
        }
      });
      res.sort(function (a,b) {
        return b-a
      });
      res.reduce(function (sum, curr) {
        new paper.Path({
          segments: [[x+sum+h/2, y+4], [x+sum+curr-h/2, y+4], [x+sum+curr, y+h-4], [x+sum, y+h-4]],
          fillColor: new paper.Color(Math.random() * 0.1 + 0.7, Math.random() * 0.3 + 0.66, Math.random() * 0.2 + 0.77),
          closed: true
        });
        new paper.PointText({
          point: [x+sum+curr/2, y+24+h/2],
          content: curr,
          fillColor: 'black',
          justification: 'center',
          fontSize: 72
        });
        return sum + curr + userData.knifewidth;
      }, 0);

    }
  }
}

module.exports = Visualization1D;