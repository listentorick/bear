var validate =  require('commonjs-utils/lib/json-schema').validate;
var parseJSON =  require('commonjs-utils/lib/json-ext').parse;
var http = require('http');
var extname = require('path').extname;
var fs = require('fs');

var schemaCache = {};


http.ServerResponse.prototype.validateRequest = function(path, obj, fn) {
	return validateData(path,obj,".req",fn);
}

http.ServerResponse.prototype.validateResponse = function(path, obj, fn) {
	return validateData(path,obj,".res",fn);
}

function validateData(path, obj, ext, fn) {

	 console.log("validate");

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
		
			console.log(path);
		
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
 
	path = process.cwd() + '/schema' + path + ext;

	var schema;
	// Cache contents
    try {
		schema = schemaCache[path];
		if(schema == null) {
			schema = cacheSchemaSync(path);
		}
		console.log(JSON.stringify(validate(obj,schema)));
		return validate(obj,schema).valid;
    } catch (err) {
        error(err);
		return false;
    }
	
};