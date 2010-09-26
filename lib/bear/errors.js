var Errors = {
	INCORRECT_CONTENT_TYPE: {code:1, message: "content-type should be application/json"},
	REQUEST_JSON_DOESNT_MATCH_SCHEMA: {code:2, message: "json doesnt match schema: {0}"}
}

exports.constructError = function(type) {

	var err = {code:type.code};
	var str = type.message;
	var numArgs = arguments.length - 1;

	for (var i = 0; i < arguments.length - 1; i++) {       
		var reg = new RegExp("\\{" + i + "\\}", "gm");             
		str = str.replace(reg, arguments[i + 1]);
	}
	
	err.message = str;

	return err;
}

exports.Errors = Errors;