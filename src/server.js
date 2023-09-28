"use strict";

const execute = require('./execute');

const products = [
  {length: 1000, height: 1200, quantity: 5, info: '1'},
  {length: 920, height: 1200, quantity: 2},
  {length: 960, height: 1090, quantity: 3, info: '2'},
  {length: 880, height: 1100, quantity: 3},
  {length: 990, height: 1340, quantity: 4},
  {length: 770, height: 1440, quantity: 1},
  {length: 760, height: 1240, quantity: 2, info: '3'},
  {length: 760, height: 1210, quantity: 3},
  {length: 780, height: 1530, quantity: 4},
  {length: 660, height: 1110, quantity: 3},
  {length: 640, height: 1310, quantity: 1},
  {length: 690, height: 1390, quantity: 5},
];
const scraps = [
  {length: 3200, height: 2600, quantity: 100},
]

const http = require('http');
const getBody = require('./io').body;

function solve(body) {
  if(!body.products) {
    body.products = products.map(v => Object.assign({}, v));
  }
  if(!body.scraps) {
    body.scraps = scraps.map(v => Object.assign({}, v));
  }
  return execute(body.products, body.scraps);
}

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Access-Control-Allow-Origin': '*',
};

function listener (req, res) {
  if(req.method !== 'POST') {
    res.writeHead(400);
    return res.end('only POST allowed');
  }
  // проверка ip
  const ip = `${req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || res.socket.remoteAddress}`;
  
  const ping = setInterval(() => {
    if(res.finished) {
      return clearInterval(ping);
    }
    res.write('\n');
  }, 30000);

  res.writeHead(200, headers);
  getBody(req)
    .then(JSON.parse)
    .then(solve)
    .then((data) => {
      res.end(JSON.stringify(data));
    })
    .catch((err) => {
      res.writeHead(500, headers);
      res.end(JSON.stringify({error: true, message: err.message || err}));
    });
}

const host = 'localhost';
const port = 3707;
const server = http.createServer(listener);
server.listen(port, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

module.exports = server;
