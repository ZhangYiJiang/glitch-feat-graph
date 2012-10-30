var m = {top: 20, right: 80, bottom: 30, left: 10},
    w = 960 - m.left - m.right,
    h = 360 - m.top - m.bottom;

var svg = d3.select('#histogram').append("svg")
		.attr("width", w + m.left + m.right)
		.attr("height", h + m.top + m.bottom)
	.append("g")
		.attr("transform", "translate(" + m.left + "," + m.top + ")");

var prizeBuckets = [
	{
		'desc': "Big petrified rocks", 
		'class': "utterly-insane",
		'n': 26, 
		'color': '#3D5BA6'	
	}, 
	{
		'desc': "Cigar badge + medium petrified rock", 
		'class': "very-insane",
		'n': 3, 
		'color': '#6B519C'
	}, 
	{
		'desc': "Medium petrified rocks", 
		'class': "slightly-less-than-very-insane", 
		'n': 179, 
		'color': '#D92A7A'
	}, 
	{
		'desc': "Small petrified rocks", 
		'class': "insane", 
		'n': 1000, 
		'color': '#EC4B33'
	}
];


function updateView (data, metadata) {
	// Render description 

	renderPage(metadata);
	renderGraph (data, metadata);

	$('#data').fadeIn();
}

function renderPage (d) {
	$('#data h2 a')
		.text(d.name)
		.prop('href', d.url);

	$('#feat-desc').text(d.desc);
	$('#feat-legend').text(d.legend);
}


function loadData (id) {
	var ready = 0, 
		data, metadata; 

	d3.text('feats/' + id + '/data', function(text){
		data = text.split(',').map(function(d){ return +d; });
		complete();
	});

	d3.json('feats/' + id + '/metadata', function(json){
		metadata = json;
		complete();
	});

	function complete () {
		ready++;

		if (ready === 2) {
			updateView(data, metadata);
		}
	}
}


function renderGraph (data, metadata) {
	var dataBuckets = [], vis, 
		x, y, xAxis, yAxis, 
		line, area, cumilative = 0, 
		i;

	// Remove the old visualization 
	svg.select('.vis').remove();

	// Split up the data according to the prizes which players recieve 
	prizeBuckets.forEach(function(p, i){
		dataBuckets.push({
			data: data.slice(cumilative, cumilative + p.n), 
			prize: p, 
			position: cumilative
		});

		cumilative += p.n;
	});

	// And create the new one 
	vis = svg.append('g')
		.attr('class', 'vis');

	// Create the scales for x (player count) and y (contribution) axis
	// The y axis is logarithmic to help fit the visualization in 
	x = d3.scale.linear()
		.domain([0, data.length])
	    .range([0, w]);

	y = d3.scale.log()
		.domain([d3.min(data), d3.max(data)])
	    .range([h, 0]);

	// Create the x and y axis functions 
	xAxis = d3.svg.axis()
	    .scale(x)
	    .tickSize(-h)
	    .ticks(20)
	    .orient("bottom");

	yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("right")
	    .tickSize(-w)
	    .ticks(8, formatNumber);

	// Create the graph area and  the line that goes on 
	// top of the area 
	area = d3.svg.area()
	    .x(function(d, i) { return x(i); })
	    .y0(h)
	    .y1(function(d) { return y(d); });

	line = d3.svg.line()
	    .x(function(d, i) { return x(i); })
	    .y(function(d) { return y(d); });

	// Create each section of data 
	dataBuckets.forEach(function(bucket){
		vis.append("path")
			.attr('class', 'area ' + bucket.prize.class)
			.translate(x(bucket.position), 0)
			.attr('d', area(bucket.data))
			.attr("fill", d3.lab(bucket.prize.color).brighter(2.4))
			.on('mouseover', function(d) {

			});

		vis.append("path")
			.attr('class', 'line ' + bucket.prize.class)
			.translate(x(bucket.position), 0)
			.attr('d', line(bucket.data))
			.attr("stroke", bucket.prize.color);

	});

	vis.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + h + ")")
		.call(xAxis);

	vis.append("g")
		.attr("transform", "translate(" + w + ", 0)")
		.attr("class", "y axis")
		.call(yAxis)
	.append("text")
		.attr("transform", "rotate(90)")
		.attr("x", h/2)
		.attr("dy", "-3em")
		.style("text-anchor", "middle")
		.text(metadata.unit);
}

function drawDonut (data) {

}

d3.selection.prototype.translate = function (x, y) {
	return this.attr("transform", "translate(" + x + "," + y + ")");
};


$('#feats li').click(function(){
	$('#data').fadeOut();
	loadData(this.id);
});

function formatNumber (n) {
	var postfix; 
	if (n < 1000) return n;
	if (n < 1000000) return (Math.round(n / 100) / 10) + 'k';
	return (Math.round(n / 100000) / 10) + 'm';
}

