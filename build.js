var jade = require('jade'),
	fs = require('fs');

var pathPrefix = 'feats/', 
	feats = fs.readdirSync(pathPrefix), 
	data = [];

feats.forEach(function(feat) {
	var d = fs.readFileSync(pathPrefix + feat + '/metadata', 'utf8');
	data.push(JSON.parse(d));
});

var template = jade.compile(fs.readFileSync('template.jade'));
var page = template({
	feats: data
});

fs.writeFileSync('index.html', page);