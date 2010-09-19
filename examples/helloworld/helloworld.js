
require.paths.unshift('./../../support/connect/lib');
require.paths.unshift('./../../support');

var bear = require('./../../lib/bear');
var app = bear.createServer();

app.get('/helloworld', function(data, callback){
	callback(null,data);

});

app.listen(3000);