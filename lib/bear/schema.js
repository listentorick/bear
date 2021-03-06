var validate =  require('commonjs-utils/lib/json-schema').validate;
var parseJSON =  require('commonjs-utils/lib/json-ext').parse;
var http = require('http');
var extname = require('path').extname;
var fs = require('fs');

var schemaCache = {};


http.ServerResponse.prototype.validateRequest = function(path, obj, fn) {
	return validateData(this.app, path,obj,".req",fn);
}

http.ServerResponse.prototype.validateResponse = function(path, obj, fn) {
	return validateData(this.app, path,obj,".res",fn);
}

function getSchemaPath(app) {
	return app.getConfiguration("schemaPath") || (process.cwd() + '/schema')
}


function validateData(app, path, obj, ext, fn) {

	var self = this;
	
	function error(err) {
		if (fn) {
			fn(err);
		} else {
			self.req.next(err);
		}
	}
	
	function removeNL(s){ 
		return s.replace(/[\n\r\t]/g,""); 
	}
	
	function cacheSchemaSync(path) {

		try {

			var fileContents = fs.readFileSync(path,'utf8');
			fileContents = fileContents.replace('\ufeff','');  //bom check
			var schema = parseJSON(fileContents);
			schema.additionalProperties = false; //we dont allow additional properties...
			return schemaCache[path] = schema;
		} catch(e) {
			
			error(e);
			return {};
		}
	}
 
	path = getSchemaPath(app) + path + ext;

	var schema;
	// Cache contents
    try {
		schema = schemaCache[path];
		if(schema == null) {
			schema = cacheSchemaSync(path);
		}
		return validate(obj,schema);
    } catch (err) {
        error(err);
		//This seems wrong since the schema may not be wrong 
		//just located in the wrong place or 
		return false;
    }
	
};