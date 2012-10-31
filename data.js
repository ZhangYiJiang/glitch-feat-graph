var request = require('request'), 
	cheerio = require('cheerio'), 
	fs = require('fs'), 
	urlParser = require('url');

var url = process.argv[2], 
	pathPrefix = 'feats/';

// Obtain the feat page and start the whole thing rollin' 
request(url, function (error, response, body) {
	if (!error && response.statusCode == 200) {
		var $ = cheerio.load(body), 
			featName = urlParser.parse(url).pathname.split('/')[2];

		if(!fs.existsSync(pathPrefix + featName)) {
			fs.mkdirSync(pathPrefix + featName); 
		}

		collectData($, featName);
		collectMetadata($, featName);

		process.exit();
	} else {
		console.log('HTTP error: ' + error);
	}
});

function collectData ($, featName) {
	// The top 26 contributors 
	var topHero = $('div[id^="contributor"]').remove('a').text().match(/[\d\.]+/g);

	// The next 975~ contributors
	var juniorHero = $('ul.top_contributors_list li a')
			.map(function(){ return $(this).attr('title').split(' ')[0]; });

	var contributor = topHero.concat(juniorHero)
		.map(function(v){ return +v; });			// Convert everything to numbers 

	contributor = contributor
		.sort(function(a, b) { 
			if (a == b) return 0;
			return (a < b ? 1 : -1); 
		});		// Then sort them 

	console.log('Feat name: ' + featName);
	console.log('Contributors found: ' + contributor.length);

	fs.writeFileSync(pathPrefix + featName + '/data', contributor.join(','));
}

function collectMetadata ($, featName) {
	var feat = {}, featCount, 
		featRewardRaw, currentCount, currentReward = "";

	feat.id = featName;
	feat.url = url;
	feat.name = $('h1.feat_name').text().trim();

	feat.desc = $('p.feat_blurb').first().text().trim();
	feat.legend = $('p.feat_description').text().trim();
	feat.epic = $('p.feat_epic a').text();

	// Feat count is the goal completed line. Example string: 
	// "9,434,634 chunks of sparkly donated"
	featCount = $('p.feat_goal span.feat_count').text()
		.trim().split(' ');

	// The first part is used as the total count, the second as 
	// units for graph axis 
	feat.total = removeComma(featCount[0]);
	feat.unit = featCount.slice(1).join(' ').trim().replace(/\s+/g, ' ');


	// Break down and parse feat rewards 
	feat.reward = {};
	featRewardRaw = $('p.feat-rewards').text();

	if (featRewardRaw) {
		// JavaScript regex's . character doesn't match whitespace, 
		// so we're using [\d\s\w,]
		featRewardRaw = featRewardRaw
			.match(/pool of\s*([\d\s\w,]+)\s*according/)[1].split(/\s+/);

		// The pattern is [number] [description], ... 
		// Example string: "2,469,154 iMG, 2,469,154 currants, 2,469,154 mood, 
		// 2,469,154 energy, and 1,234,577 favor with Zille"

		// Since numbers can contain commas, we're splitting by space instead,
		// and joining them together
		featRewardRaw.forEach(function(t){
			if (t.match(/[\d]+/)) {
				if (currentReward) {
					feat.reward[cleanReward(currentReward)]
						 = removeComma(currentCount);
				}

				currentReward = "";
				currentCount = t;
			} else {
				currentReward += t + ' ';
			}
		});	

		feat.reward[cleanReward(currentReward)] 
			= removeComma(currentCount);
	}

	feat.goals = {
		minimum: removeComma($('div.minimum strong').text()), 
		bonus: removeComma($('div.bonus strong').text()), 
		supermega: removeComma($('div.supermega strong').text())
	};

	fs.writeFileSync(pathPrefix + featName + '/metadata', JSON.stringify(feat));
}

function removeComma (n) {
	return parseInt(n.trim().replace(/,/g, ''), 10);
}

function cleanReward (r) {
	return r
		.replace(/,/g, '')
		.replace(/and/g, '')
		.trim();
}