process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();
console.log('Startup at ' + Date.now() +' env ' + process.env.NODE_PATH);

var dotenv = require(process.env.NODE_PATH+'/node_modules/dotenv').config({path: process.env.NODE_PATH+'/.env'});