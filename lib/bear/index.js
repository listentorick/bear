var exports = module.exports = require('connect').middleware;

var Server = exports.Server = require('./server');


exports.createServer = function(){
    return new Server(Array.prototype.slice.call(arguments));
};

require('./schema');
