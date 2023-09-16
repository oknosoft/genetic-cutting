"use strict";

const Service = require('node-windows').Service;

// Create a new service object
const svc = new Service({
  name:'Cutting 2D',
  description: 'Cutting 2D optimizer web server.',
  script: 'C:\\WORK\\cutting\\src\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  workingDirectory: 'C:\\WORK\\cutting\\src',
  // allowServiceLogon: true,
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();
