var fork = require('child_process').fork,
	fs = require('fs');

var pathPrefix = 'feats/', 
	parserPath = 'data.js',
	feats = fs.readdirSync(pathPrefix), 
	urls = [];

feats.forEach(function(feat) {
	var data = fs.readFileSync(pathPrefix + feat + '/metadata', 'utf8');
	urls.push(JSON.parse(data).url);
});

function runChild (n) {
	fork (parserPath, [urls[n]])
	.on('exit', function() {
		
		if (n + 1 < urls.length) {
			runChild (n+1);
		} else {
			process.exit();
		}
		
	});
}

console.log(urls)
// runChild (0);