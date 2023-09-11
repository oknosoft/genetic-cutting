"use strict";

const execute = require('./execute');

const products = [
  {length: 1000, height: 1200, quantity: 7},
  {length: 920, height: 1200, quantity: 2},
  {length: 960, height: 1090, quantity: 3},
  {length: 880, height: 1100, quantity: 3},
  {length: 990, height: 1340, quantity: 5},
  {length: 770, height: 1440, quantity: 1},
  {length: 760, height: 1240, quantity: 2},
  {length: 760, height: 1210, quantity: 3},
  {length: 780, height: 1530, quantity: 4},
  {length: 660, height: 1110, quantity: 3},
  {length: 640, height: 1310, quantity: 5},
  {length: 690, height: 1390, quantity: 5},
];
const scraps = [
  {length: 3200, height: 2600, quantity: 100},
]
execute(products, scraps)
  .catch(console.error);
