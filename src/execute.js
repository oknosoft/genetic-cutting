"use strict";

const join = require('path').join;
const spawn = require("child_process").spawn;
const decompress = require('decompress');
const decode = require('./866');
const io = require('./io');

function execute(products, scraps) {
  return io.tmpdir()
    // извлекаем файлы оптимизатора во временный каталог
    //.then((tmpPath) => decompress(join(__dirname, '../bin/cut2d.zip'), tmpPath).then(() => tmpPath))
    // создаём файлы параметров
    .then((tmpPath) => io.prepare(products, scraps, tmpPath))
    //.then((tmpPath) => optimize(tmpPath))
    .then((tmpPath) => io.extract(tmpPath))
    //.then((tmpPath) => io.rimraf(tmpPath));
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
