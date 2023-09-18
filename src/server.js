"use strict";

const svg = require('./svg');
const proxy = require('./proxy');


const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Transfer-Encoding': 'chunked',
  'Access-Control-Allow-Origin': '*',
};


module.exports = function cutting($p, log) {

  const {job_prm: {server}, adapters: {pouch}, utils: {moment, hrtime, getBody, end}} = $p;
  const {ping, pong} = hrtime;
  
  return function listener (req, res) {
    if(req.method !== 'POST') {
      res.writeHead(400);
      return res.end('only POST allowed');
    }

    const ping = setInterval(() => {
      if(!res.headersSent) {
        res.writeHead(200, headers);
      }
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
        if(!res.headersSent) {
          res.writeHead(200, headers);
        }
        res.end(JSON.stringify(data));
      })
      .catch((err) => {
        if(!res.headersSent) {
          res.writeHead(500, headers);
        }
        res.end(JSON.stringify({error: true, message: err.message || err}));
      });
  }
};
