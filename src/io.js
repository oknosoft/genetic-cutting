"use strict";

const fs = require('fs');
const join = require('path').join;
const tmpdir = require('os').tmpdir;
const decode = require('./866');

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
          list += `${scrap.length}\t${scrap.height}\t${scrap.quantity || 1}\n`;
          if (scrap.scrap) {
            othod[index] = 1;
          }
        });
        return this.write(join(tmpPath, 'LIST.CFG'), list)
          .then(() => this.write(join(tmpPath, 'OTHOD.THN'), othod));
      });
  },

  // анализирует файлы с ошибкам
  errors(tmpPath) {
    return new Promise((resolve, reject) => {
      // если существует FILE.LOG - это ошибка и её содержимое надо вернуть в reject
      const log = join(tmpPath, 'FILE.LOG');
      fs.access(log, fs.R_OK, (err) => {
        // err в нашем случае, хорошо
        if(err) {
          // K.DAT - первые два байта должны быть нули
          resolve(this.read(join(tmpPath, 'K.DAT'))
            .catch(() => [0, 0])
            .then((data) => {
              if(data[0] || data[1]) {
                throw new Error('K.DAT');
              }
            }));
        }
        else {
          this.read(log)
            .then(decode)
            .then(reject)
            .catch(reject);
        }
      });
    })
    
  },

  // извлекает результат раскроя
  extract(products, scraps, tmpPath) {
    const res = {scrapsIn: scraps, scrapsOut: [], products: []};
    
    const findScrapIn = (stick) => {
      const rows = scraps.filter(v => v.id === 0 && v.stick === stick);
      if(rows.length === 1) {
        const row = rows[0];
        row.id = stick;
        row.quantity = 1;
        return row;
      }
      const row = Object.assign({}, scraps.find(v => v.stick === stick));
      scraps.push(row);
      row.id = scraps.length;
      row.quantity = 1;
      return row;
    }
    
    return this.errors(tmpPath)
      .then(() => this.read(join(tmpPath, 'OTHOD.DAT')))
      .then(decode)
      .then((data) => {
        const rows = data.split('\r\n');
        rows.forEach((row, index) => {
          if(rows[index]) {
            const flat = row.trim().split('\t').map(v => parseFloat(v));
            const scrap = {
              id: flat[0],
              x: flat[1],
              y: flat[2],
              length: flat[3],
              height: flat[4],
              rotate: flat[5],
            }
            if((scrap.length > 500 && scrap.height > 300) || (scrap.length > 300 && scrap.height > 500)) {
              res.scrapsOut.push(scrap);
            }
          }
        });
      })
      .then(() => this.read(join(tmpPath, 'RASKREND.DAT')))
      .then(decode)
      .then((data) => {
        const rows = data.split('Раскpой ');
        rows.forEach((row, index) => {
          const tmp = row.trim().split('\r\n')
            .map(v => v.includes('\t') ? v.split('\t').map(v => parseFloat(v)) : parseFloat(v));
          if(tmp.length > 5) {
            const flat = tmp[2];
            if(flat[3] !== 1) {
              throw new Error('Раскрой2D - число заготовок в RASKREND !== 1');
            }
            const scrap = {
              id: tmp[0],
              length: flat[0],
              height: flat[1],
              sid: flat[2],
            }
            let scrapIn = scraps[scrap.sid - 1];
            if(scrapIn.length !== scrap.length || scrapIn.height !== scrap.height) {
              throw new Error('Раскрой2D - отличаются размеры в ОбрезьВход и RASKREND');
            }
            scrapIn = findScrapIn(scrapIn.stick);
            for(let i=4; i<tmp.length; i++) {
              const flat = tmp[i];
              const product = {
                id: flat[0],
                x: flat[1],
                y: flat[2],
                length: flat[4],
                height: flat[3],
                rotate: flat[5],
              }
              const prodIn = products[product.id - 1];
              if((Math.abs(prodIn.height - product.length) > 1 || Math.abs(prodIn.length - product.height) > 1) && 
                (Math.abs(prodIn.length - product.length) > 1 || Math.abs(prodIn.height - product.height) > 1)) {
                throw new Error('Раскрой2D - отличаются размеры в Изделия и RASKREND');
              }
              product.stick = scrapIn.id;
              product.id = prodIn.id;
              product.info = prodIn.info || '';
              res.products.push(product);
            }
          }
        });
        if(products.reduce((sum, curr) => sum + curr.quantity, 0) !== res.products.length) {
          throw new Error('Раскрой2D - не удалось разместить все изделия на заготовках');
        }

        return this.read(join(tmpPath, 'REZ.DAT'));        
      })
      .then(decode)
      .then((data) => {
        res.rez = data;
        return res;
      });
  }
};
