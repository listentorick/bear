 var schema = require('./schema'),
	connect = require('connect'),
	sys = require('sys'),
	router = require('connect/middleware/router'),
	querystringParser = require('./querystringparser');
	bodyDecoder = require('connect/middleware/bodyDecoder');
	errorHandler = require('connect/middleware/errorhandler');
	Errors = require('./errors').Errors;
	constructError = require('./errors').constructError;
	
var Server = exports = module.exports = function Server(middleware){
    var self = this;
    this.config = {};
    //this.settings = {};
	this._config = {};
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


function validatePostContentType(req) {
	var contentTypeHeaders = req.headers['content-type'] || '';
	contentTypeHeaders = contentTypeHeaders.split(';')[0];
	var result = {valid: contentTypeHeaders == 'application/json'};
	if(!result.valid) {
		result.error = Errors.INCORRECT_POST_CONTENT_TYPE;
	}
	return result;
	
}

function validateGetContentType(req) {
	return {valid:true, error: null};
}


function constructResponseJSON(error,result) {
	var jsonToReturn = {};
	if(error) {
		jsonToReturn.error = error;
	} else {
		jsonToReturn.result = result;
	}
	return jsonToReturn;
}


(function(method, getData, validateContentType) {

	Server.prototype[method] = function(path, config, fn) {

		//if second argument isnt a string use path as schemaPath
		if (typeof config === 'function') {
			fn = config;
			config = {
				schemaPath: path
			};
		}
		
		if(!config.schemaPath) {
			config.schemaPath = path;
		}
		
		var routeHandlerWithAuthentication = function(req,res,next) {
		
			var authStrats = config.authenticationStrategies;
	
			if(!authStrats) {
				authStrats = req.app.getConfiguration("defaultAuthenticationStrategies");
			}
					
			//we have middleware which can authenticate this request
			if(req.authenticate && authStrats) {
				//note that if we are already authenticated - the strategies shouldnt do any real work...
				req.authenticate(authStrats, function(error, authenticated) {
										
					if(error) {
						//what here?
					} else {
						if(authenticated) {
							routeHandler(req,res,next);
						} else {
							//not authenticated...
							res.writeHead(401);
							res.end();	
						}
					}
				});
				
			} else {
				routeHandler(req,res,next);
			}
		}
		
		var routeHandler = function(req, res,next) {
				
			var validateContentTypeResult = validateContentType(req);
			var responseJSON;
			if(!validateContentTypeResult.valid){
				res.writeHead(400);
				res.end(JSON.stringify(constructResponseJSON(validateContentTypeResult.error)));	
				next();
			} else {

				var dataToValidate = getData(req);

				var validateRequestResult = res.validateRequest(config.schemaPath, dataToValidate, function(e) {
					//throwin this error means that we global error handler will catch this...
					//is this what we want?
					//the error message should also contain why this broken
					//need to think about this later...
					throw new Error(e);
				});
				
				if(validateRequestResult.valid) {
					//call the handler
					fn(dataToValidate, function(error,result) {
					
						if(error) {
							//throw new Error(error);
							responseJSON = constructResponseJSON(error,result);
							res.writeHead(500);	
							res.end(JSON.stringify(responseJSON));
							
						} else {
										
							var validateResponseResult = res.validateResponse(config.schemaPath, result, function(e) {
								throw new Error(e);
							});
							
							if(!validateResponseResult.valid) {
								//This error is because there mismatch between what the coder has provided as the route handler and the response schema 
								//This correctly will cause the error handler to send a 500 (internal error);
								throw new Error();
							}
							
							responseJSON = constructResponseJSON(error,result);
							res.writeHead(200);	
							res.end(JSON.stringify(responseJSON));
						}
					
					});
				
				} else {
					//we need error codes here so that the consumer knows why they have a 404?
					var error = constructError(Errors.REQUEST_JSON_DOESNT_MATCH_SCHEMA, JSON.stringify(validateRequestResult.errors));
					res.writeHead(400);
					res.end(JSON.stringify(constructResponseJSON(error)));			
				}
			}
		}

		this.routes[method](path, routeHandlerWithAuthentication);

		return this;

	};
	
	 return arguments.callee;

})
("get", function(req){return req.querystring;}, validateGetContentType)("post", function(res) {return res.body;}, validatePostContentType);



