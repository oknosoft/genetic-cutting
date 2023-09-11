"use strict";

const execute = require('./execute');

const products = [
  {width: 1000, htight: 1200, quantity: 7},
  {width: 920, htight: 1200, quantity: 2},
  {width: 960, htight: 1090, quantity: 3},
  {width: 880, htight: 1100, quantity: 3},
  {width: 990, htight: 1340, quantity: 5},
  {width: 770, htight: 1440, quantity: 1},
  {width: 760, htight: 1240, quantity: 2},
  {width: 760, htight: 1210, quantity: 3},
  {width: 780, htight: 1530, quantity: 4},
  {width: 660, htight: 1110, quantity: 3},
  {width: 640, htight: 1310, quantity: 5},
  {width: 690, htight: 1390, quantity: 5},
];
const scraps = [
  {width: 3200, htight: 2600, quantity: 100},
]
execute(products, scraps)
.catch(console.error);
