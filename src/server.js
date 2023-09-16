"use strict";

const svg = require('./svg');
const proxy = require('./proxy');


const http = require('http');
const getBody = require('./io').body;


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
  }, 20000);
  
  getBody(req)
    .then(JSON.parse)
    .then(proxy)
    .then((res) => res.json())
    .then(svg)
    .then((data) => {
      res.writeHead(200, headers);
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
