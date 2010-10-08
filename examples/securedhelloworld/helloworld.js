
require.paths.unshift('./../../support/connect/lib');
require.paths.unshift('./../../support');

//this needs to be included in the project
var auth= require('connect-auth')
var never = require('connect-auth/auth.strategies/never');
var anonymous = require('connect-auth/auth.strategies/anonymous');
var bear = require('./../../lib/bear');

var app = bear.createServer(auth( [never(), anonymous()] ));

app.setConfiguration("defaultAuthenticationStrategies", ["never"]);

app.get('/helloworld', {authenticationStrategies:["anon"]}, function(data, callback){
	callback(null,data);
});

app.get('/securehelloworld', function(data, callback){
	callback(null,data);
});

app.listen(3000);