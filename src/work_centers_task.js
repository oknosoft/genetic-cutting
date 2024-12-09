"use strict";

const {headers} = require('./server');


module.exports = function work_centers_task($p, log) {

  const {doc, cat, adapters: {pouch}, utils: {moment, hrtime, getBody, end}} = $p;

  return function taskListener (req, res) {
    if(req.method !== 'POST') {
      res.writeHead(400);
      return res.end('only POST allowed');
    }
    const odoc = doc.work_centers_task.create({}, false, true);
    getBody(req)
      .then(JSON.parse)
      .then(({set, opts}) => {
        if(!res.headersSent) {
          res.writeHead(200, headers);
        }
        odoc.set.load(set);
        return odoc.load_keys()
          .then(() => {
            const refs = [];
            for(const {obj} of odoc.set) {
              refs.push(obj._obj.obj);
            }
            return pouch.load_array(cat.characteristics, refs)
              .then(() => opts);
          })
      })
      .then((opts) => {
        odoc.fill_by_keys(opts);
        res.end(JSON.stringify(odoc.cutting));
        for(const row of odoc.set) {
          row.obj?.obj?.unload();
          row.obj?.unload();
        }
        odoc.unload();
      })
      .catch((err) => {
        odoc.unload();
        end.end500({req, res, err, log});
      });
  }
};
