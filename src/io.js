"use strict";

const fs = require('fs');
const join = require('path').join;
const tmpdir = require('os').tmpdir;
const decode = require('./866');

module.exports = {

  rimraf(tmpPath) {
    return new Promise((resolve, reject) => {
      fs.readdir(tmpPath, (err, files) => {
        if (!err) {
          try {
            for (let file of files) {
              fs.unlinkSync(join(tmpPath, file));
            }
            fs.rmdirSync(tmpPath);
            resolve(tmpPath);
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
        resolve('D:\\TEMP\\cut-UMZKnL');
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
          list += `${scrap.length}\t${scrap.height}\t${scrap.quantity || 1}\n`;
          if (scrap.scrap) {
            othod[index] = 1;
          }
        });
        return this.write(join(tmpPath, 'LIST.CFG'), list)
          .then(() => this.write(join(tmpPath, 'OTHOD.THN'), othod));
      })
      .then(() => tmpPath);
  },

  // анализирует файлы с ошибкам
  errors(tmpPath) {
    return new Promise((resolve, reject) => {
      // если существует FILE.LOG - это ошибка и её содержимое надо вернуть в reject
      fs.access(join(tmpPath, 'FILE.LOG'), fs.R_OK, (err) => {
        // err в нашем случае, хорошо
        if(err) {
          // K.DAT - первые два байта должны быть нули
          resolve(this.read(join(tmpPath, 'K.DAT'))
            .then((data) => {
              if(data[0] || data[1]) {
                throw new Error('K.DAT');
              }
            }));
        }
        else {
          reject(this.read(name).then(decode));
        }
      });
    })
    
  },

  // извлекает результат раскроя
  extract(tmpPath) {
    const res = {};
    return this.errors(tmpPath)
      .then(() => this.read(join(tmpPath, 'RASKREND.DAT')))
      .then(decode)
      .then((data) => {
        const rows = data.split('Раскpой ');
        rows.forEach((row, index) => {
          const tmp = row.trim().split('\r\n');
          tmp.forEach((row, index) => {
            if(row.includes('\t')) {
              tmp[index] = row.split('\t').map(v => parseFloat(v)); 
            }
            else {
              tmp[index] = parseFloat(tmp[index]);
            }
          });
          rows[index] = tmp;
        });
        res.products = rows;
      })
      .then(() => this.read(join(tmpPath, 'OTHOD.DAT')))
      .then(decode)
      .then((data) => {
        const rows = data.split('\r\n');
        rows.forEach((row, index) => {
          if(rows[index]) {
            rows[index] = row.trim().split('\t').map(v => parseFloat(v));
          }
        });
        res.scraps = rows.filter(v => Array.isArray(v));
      });
  }
};
