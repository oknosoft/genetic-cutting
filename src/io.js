"use strict";

const fs = require('fs');
const join = require('path').join;
const tmpdir = require('os').tmpdir;

module.exports = {

  body(req) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => data += chunk);
      req.on('end', () => {
        if(data.length > 0 && data.charCodeAt(0) == 65279) {
          data = data.substring(1);
        }
        resolve(data);
      });
      req.on('error', reject);
    });
  },

  rimraf(tmpPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(tmpPath, (err, files) => {
        if (!err) {
          try {
            for (let file of files) {
              fs.unlinkSync(join(tmpPath, file));
            }
            resolve(fs.rmdirSync(tmpPath));
          }
          catch (err) {
            reject(err);
          }
        }
        else {
          reject(err);
        }
      });
    })
  },

  tmpdir() {
    return new Promise((resolve, reject) =>  fs.mkdtemp(join(tmpdir(), 'cut-'), (err, tmpPath) => {
      if(err) {
        reject(err);
      }
      else {
        resolve(tmpPath);
      }
    }))
  },

  write(name, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(name, data, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  
  read(name) {
    return new Promise((resolve, reject) => {
      fs.readFile(name, (err, data) => {
        if (err) {
          reject(err)
        }
        else {
          resolve(data);
        }
      });
    });
  },
  
  cpdir(src, dst) {
    return new Promise((resolve, reject) => {
      fs.readdir(src, (err, files) => {
        if (err) {
          reject(err)
        }
        else {
          let res = Promise.resolve();
          for(const file of files) {
            if(file.startsWith('result')) {
              continue;
            }
            res = res.then(() => this.link(join(src, file), join(dst, file)));
          }
          res
            .then(resolve)
            .catch(reject);
        }
      });
    });
  },
  
  link(src, dst) {
    return new Promise((resolve, reject) => {
      fs.link(src, dst, (err) => {
        if (err) {
          reject(err)
        }
        else {
          resolve();
        }
      });
    });
  },
  
  prepare(products, scraps, tmpPath) {
    if (!products.length || !scraps.length) {
      throw new Error('Пустой список изделий или заготовок');
    }
    let zag = `\n\n`;
    for (const product of products) {
      zag += `${product.length}\t${product.height}\t${product.quantity || 1}\t+\n`;
    }
    return this.write(join(tmpPath, 'ZAG.CFG'), zag)
      .then(() => {
        let list = '0\n0\n10\t500\t300\n';
        let othod = new Uint8Array(scraps.length);
        scraps.forEach((scrap, index) => {
          scrap.id = 0;
          scrap.blank = index + 1;
          list += `${scrap.length}\t${scrap.height}\t${scrap.quantity || 1}\n`;
          if (scrap.scrap) {
            othod[index] = 1;
          }
        });
        return this.write(join(tmpPath, 'LIST.CFG'), list)
          .then(() => this.write(join(tmpPath, 'OTHOD.THN'), othod));
      });
  },
  
};
