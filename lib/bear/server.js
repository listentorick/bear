 var schema = require('./schema'),
	connect = require('connect'),
	sys = require('sys'),
	router = require('connect/middleware/router'),
	querystringParser = require('./querystringparser');
	bodyDecoder = require('connect/middleware/bodyDecoder');
	errorHandler = require('connect/middleware/errorhandler');
	
	
var Server = exports = module.exports = function Server(middleware){
    var self = this;
    this.config = {};
    this.settings = {};
    this.redirects = {};
    this.jsonHelpers = {};
  
	//pass the middleware to connect
    connect.Server.call(this, middleware || []);
	
	
	this.use(function(req, res, next){
        req.query = {};
        res.headers = {};
        req.app = res.app = self;
        req.res = res;
        res.req = req;
        req.next = next;
        // Assign req.params.get
        //if (req.url.indexOf('?') > 0) {
        //    var query = url.parse(req.url).query;
        //    req.query = queryString.parse(query);
        //}
        next();
    });
	
	this.use(querystringParser());
	this.use(bodyDecoder());
	this.use(router(function(app){ self.routes = app; }));
	this.use(errorHandler({ dumpExceptions: true, showStack: true }));

};


/**
 * Inherit from `connect.Server`.
 */
sys.inherits(Server, connect.Server);

Server.prototype.setConfiguration = function(key, value) {
 this._config[key] = value;
}

Server.prototype.getConfiguration = function(key){
	return this._config[key];
}


/**
 * Proxy `connect.Server#use()` to apply settings to
 * mounted applications.
 *
 * @param {String|Function|Server} route
 * @param {Function|Server} middleware
 * @return {Server} for chaining
 * @api public
 */

Server.prototype.use = function(route, middleware){
    if (typeof route !== 'string') {
        middleware = route, route = '/';
    }
	
    connect.Server.prototype.use.call(this, route, middleware);

    // Mounted an app
    if (middleware instanceof Server) {
        // Home is /:route/:home
        var app = middleware,
            home = app.set('home');
        if (home === '/') home = '';
        app.set('home', (app.route || '') + home);
        app.parent = this;
        // Mounted hook
        if (app.__mounted) app.__mounted.call(app, this);
    }

    return this;
};


(function(method) {

	Server.prototype[method] = function(path, schemaPath, fn) {

		//if second argument isnt a string use path as schemaPath
		if (typeof schemaPath === 'function') {
			fn = schemaPath;
			schemaPath = path;
		}

		var bearGet = function(req, res,next) {

			var requestValid = res.validateRequest(schemaPath, req.querystring, function(e) {
				throw new Error(e);
			});
			
			if(requestValid) {
				//call the handler
				fn(req.querystring, function(error,result) {
				
					if(error) {
						throw new Error(error);
					} else {
									
						var responseValid = res.validateResponse(schemaPath, result, function(e) {
							throw new Error(e);
						});
						
						if(!responseValid) {
							throw new Error();
						}

						//should we parse this?
						res.writeHead(200);	
						res.end(JSON.stringify(result));
					}
				
				});
			
			} else {
				res.writeHead(400, {});
				res.end();			
			}
		}

		this.routes[method](path, bearGet);

		return this;

	};
	
	 return arguments.callee;

})("get")("post");



