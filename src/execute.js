"use strict";

const fs = require('fs');
const join = require('path').join;
const tmpdir = require('os').tmpdir;
const spawn = require("child_process").spawn;
const decompress = require('decompress');
require('./866');


function execute(products, scraps) {
  return new Promise((resolve, reject) =>  fs.mkdtemp(join(tmpdir(), 'cut-'), (err, tmpPath) => {
    if(err) {
      reject(err);
    }
    else {
      resolve(tmpPath);
    }
  }))
    // извлекаем файлы оптимизатора во временный каталог
    .then((tmpPath) => {
      return decompress(join(__dirname, '../bin/cut2d.zip'), tmpPath)
        .then(() => tmpPath);
    })
    // создаём файлы параметров
    .then((tmpPath) => createPrm(products, scraps, tmpPath))
    .then((tmpPath) => optimize(tmpPath))
    //.then((tmpPath) => rimraf(tmpPath));
}

function createPrm(products, scraps, tmpPath) {
  if(!products.length || !scraps.length) {
    throw new Error('Пустой список изделий или заготовок');
  }
  let zag = `\n\n`;
  for(const product of products) {
    zag += `${product.width}\t${product.htight}\t${product.quantity || 1}\t+\n`;
  }
  return new Promise((resolve, reject) => {
    fs.writeFile(join(tmpPath, 'ZAG.CFG'), zag, (err) => {
      if(err) {
        reject(err);
      }
      else {
        resolve();
      }
    });
  })
    .then(() => {
      let list = '0\n0\n10\t500\t300\n';
      let othod = new Uint8Array(scraps.length);
      scraps.forEach((scrap, index) => {
        list += `${scrap.width}\t${scrap.htight}\t${scrap.quantity || 1}\n`;
        if(scrap.scrap) {
          othod[index] = 1;
        }
      });
      return new Promise((resolve, reject) => {
        fs.writeFile(join(tmpPath, 'LIST.CFG'), list, (err) => {
          if(err) {
            reject(err);
          }
          else {
            resolve(new Promise((resolve, reject) => {
              fs.writeFile(join(tmpPath, 'OTHOD.THN'), othod, (err) => {
                if(err) {
                  reject(err);
                }
                else {
                  resolve();
                }
              });
            }));
          }
        });
      })
    })
    .then(() => tmpPath);
}

function optimize(tmpPath){
  return new Promise((resolve, reject) => {
    
    const ls = spawn(join(tmpPath, 'rs.exe'), {cwd: tmpPath});

    ls.stdout.on("data", data => {
      console.log(decode(data));
    });

    ls.stderr.on("data", data => {
      console.error(decode(data));
    });

    ls.on('error', (err) => {
      console.error(err);
      reject(err);
    });

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
      resolve(tmpPath);
    });
  });
}

function decode(buffer) {
  let res = '';
  for(let i=0; i<buffer.length; i++) {
    res += cptable[866].dec[buffer[i]];
  }
  return res;
}

function rimraf(tmpPath) {
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
}

module.exports = execute;
