"use strict";

const join = require('path').join;
const spawn = require("child_process").spawn;
const decode = require('./866');
const io = require('./io');

function execute(products, scraps) {
  let tmpPath;
  return io.tmpdir()
    // извлекаем файлы оптимизатора во временный каталог
    .then((tmp) => {
      tmpPath = 'D:\\WORK\\JS\\genetic-cutting\\bin\\result';
      //return io.cpdir(join(__dirname, '../bin'), tmpPath);
    })
    // создаём файлы параметров
    .then(() => io.prepare(products, scraps, tmpPath))
    //.then(() => optimize(tmpPath))
    .then(() => io.extract({tmpPath, products, scraps}))
    .catch((err) => {
      console.error(err);
    })
    //.then(() => io.rimraf(tmpPath));
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


module.exports = execute;
