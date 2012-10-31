var m = {top: 80, right: 80, bottom: 30, left: 10},
    w = 960 - m.left - m.right,
    h = 440 - m.top - m.bottom;

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
		'color': '#3D5BA6', 
		'title': 'Top 26'
	}, 
	{
		'desc': "Medium petrified rocks", 
		'class': "very-insane", 
		'n': 179, 
		'color': '#D92A7A', 
		'title': '27th-205th'
	}, 
	{
		'desc': "Small petrified rocks", 
		'class': "insane", 
		'n': 804, 
		'color': '#EC4B33', 
		'title': '205th-1009th'
	}
];


function updateView (data, metadata) {
	// Render description 

	renderPage(metadata);
	renderGraph (data, metadata);
	drawDonut(data, metadata);

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

	// Make sure both metadata and data are loaded before we continue 
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

	// And create the new one 
	vis = svg.append('g')
		.attr('class', 'vis');

	// Split up the data according to the prizes which players recieve 
	prizeBuckets.forEach(function(p, i){
		dataBuckets.push({
			data: data.slice(cumilative, cumilative + p.n), 
			prize: p, 
			position: cumilative
		});

		cumilative += p.n;
	});

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

function drawDonut (data, metadata) {
	var cumilative = 0, values = [], leftover = metadata.total;

	var size = { width: 250, height: 250}, 
		radius = Math.min(size.width, size.height) / 2 ,
		offset = { x: 700, y: radius - 70 }, 
		donutThickness = 60;

	// Select the g.vis element we're going to be adding the donut to 
	var vis = svg.select('.vis')
			.append('g')
			.attr('class', 'pie')
			.translate(offset.x, offset.y);
		
	var arc = d3.svg.arc()
		.outerRadius(radius)
		.innerRadius(radius - donutThickness);

	// Process data 
	prizeBuckets.forEach(function(p){
		var slice = d3.sum(data.slice(cumilative, cumilative + p.n));

		values.push({
			data: slice, 
			color: p.color,
			title: p.title
		});

		cumilative += p.n; 
		leftover -= slice;
	}); 

	// We also include the rest of the players in the chart 
	values.push({
		data: leftover, 
		color: '#333', 
		title: 'All Others'
	});

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.data; });

	var g = vis.selectAll(".arc")
		.data(pie(values))
		.enter()
			.append("g")
			.attr("class", "arc");

	g.append("path")
		.attr("d", arc)
		.style("stroke-width", 2)
		.style("stroke", function(d) { 
			return d.data.color; 
		});

	g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { 
			return d3.lab(d.data.color).brighter(2.5); 
		});

	g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", "-.6em")
		.attr('class', 'label')
		.text(function(d) { return d.data.title; });

	g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".6em")
		.attr('class', 'label')
		.text(function(d) { return formatPercent(d.data.data / metadata.total); });

	// Add center label
	vis.append('text')
		.attr('class', 'title')
		.attr("dy", "-1.2em")
		.text('Contribution');

	vis.append('text')
		.attr('class', 'title')
		.text('Breakdown');

	vis.append('text')
		.attr('class', 'title')
		.attr("dy", "1.2em")
		.text('by Category');
}

d3.selection.prototype.translate = function (x, y) {
	if (arguments.length === 1)
		return this.attr("transform", "translate(" + x + ")");

	return this.attr("transform", "translate(" + x + "," + y + ")");
};


$('#feats li').click(function(){
	$('#data, #intro').fadeOut();
	loadData(this.id);
});

function formatNumber (n) { 
	if (n < 1000) return n;
	if (n < 1000000) return (Math.round(n / 100) / 10) + 'k';
	return (Math.round(n / 100000) / 10) + 'm';
}

var formatPercent = d3.format('.3p');