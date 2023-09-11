const fs = require('node:fs/promises');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const {spawn} = require("node:child_process");
const decompress = require('decompress');
const {rimraf} = require('rimraf');
const {Iconv}  = require('iconv');

const iconv = new Iconv('CP866', 'UTF-8');

async function execute({products, scraps}) {
  const tmpPath = await fs.mkdtemp(join(tmpdir(), 'cut-'));
  const zname = join(tmpPath, 'cut2d.zip');
  // извлекаем файлы оптимизатора во временный каталог
  await decompress('../bin/cut2d.zip', tmpPath);
  // создаём файлы параметров
  await createPrm({products, scraps, tmpPath});
  // выполняем оптимизацию
  await optimize(tmpPath);
  // удаляем временный каталог
  await rimraf(tmpPath);
}

async function createPrm({products, scraps, tmpPath}) {
  if(!products.length || !scraps.length) {
    throw new Error('Пустой список изделий или заготовок');
  }
  let zag = `\n\n`;
  for(const product of products) {
    zag += `${product.width}\t${product.htight}\t${product.quantity || 1}\t+\n`;
  }
  await fs.writeFile(join(tmpPath, 'ZAG.CFG'), zag);
  
  let list = '0\n0\n10\t500\t300\n';
  let othod = new Uint8Array(scraps.length);
  scraps.forEach((scrap, index) => {
    list += `${scrap.width}\t${scrap.htight}\t${scrap.quantity || 1}\n`;
    if(scrap.scrap) {
      othod[index] = 1;
    }
  });
  await fs.writeFile(join(tmpPath, 'LIST.CFG'), list);
  await fs.writeFile(join(tmpPath, 'OTHOD.THN'), othod);
}

function optimize(tmpPath){
  return new Promise((resolve, reject) => {
    
    const ls = spawn(join(tmpPath, 'rs.exe'), {cwd: tmpPath});

    ls.stdout.on("data", data => {
      console.log(`stdout: ${iconv.convert(data)}`);
    });

    ls.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
    });

    ls.on('error', (err) => {
      console.error(`error: ${err.message}`);
      reject(err);
    });

    ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
      resolve(code);
    });
  });
}

module.exports = execute;
