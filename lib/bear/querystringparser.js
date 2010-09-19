
var querystring = require('querystring');


function toCamel(str){
	return str.replace(/(\_[a-z])/g, function($1){return $1.toUpperCase().replace('_','');});
};


/**
 * Decode url querystrings.
 *
 * @return {Function}
 * @api public
 */

exports = module.exports = function querystringParser() {
    return function querystringParser(req, res, next) {

			req.setEncoding('utf8');
			req.addListener('end', function() {
			   
			if (req.url.indexOf('?') > 0) {
				qs = req.url.substr(req.url.indexOf('?')+1);
				//query string data is the format page_index, page_size.
				//core actually takes pageIndex and pageSize - so here we convert...
				result = querystring.parse(qs);
				var camelCaseResult = {};
				
				for(var prop in result) {
					camelCaseResult[toCamel(prop)] = result[prop];	
				}
				
				req.querystring = camelCaseResult;
			}

			next();
		});
	}
};

