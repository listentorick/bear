

var exports = module.exports = require('connect').middleware;

exports.auth = require('connect-auth');

var Server = exports.Server = require('./server');


exports.createServer = function(){
    return new Server(Array.prototype.slice.call(arguments));
};

require('./schema');
