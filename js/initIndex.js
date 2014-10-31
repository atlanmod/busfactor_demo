

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var fileGraphHeight = 1024;
var margin = 10;

var languageGraphWidth = 780;
var languageGraphHeight = 200;

var chunk = 20;

window.onload = function() {

    var branchWidth = $(".branchGraph").width();
    var branchElement = d3.select(".branchGraph").append("svg")
    drawFileGraph(branchElement, "realBranches.json", "branches", branchWidth - 2 * margin);

    var directoryWidth = $(".directoryGraph").width();
    var directoryElement = d3.select(".directoryGraph").append("svg")
    drawFileGraph(directoryElement, "realDirs.json", "dirs", directoryWidth - 2 * margin);

    var fileWidth = $(".fileGraph").width();
    var fileElement = d3.select(".fileGraph").append("svg")
    drawFileGraph(fileElement, "realFiles.json", "files", fileWidth - 2 * margin);

    var languageElement = d3.select(".languageGraph")
        .append("svg")
            .attr("width", languageGraphWidth)
            .attr("height", languageGraphHeight);
    //drawLanguageGraph(languageElement, 55, languageGraphWidth);
};



function drawFileGraph(element, file, fileAttr, width) {
  d3.json(file, function(error, jsonData) {
    var root = jsonData[fileAttr];

    element
        .attr("width", width)
        .attr("height", ((root.length / chunk) + 1) * (width / chunk));

    svg = element.append("g")
      .attr("transform", "translate(0, 0)");

    var line = 0;
    var i, j;
    for(i = 0; i < root.length; i += chunk) {
      subArray = root.slice(i, i + chunk);
      if(i + chunk > root.length) {
        for(j = 0; j < ((i + chunk) - root.length); j++) {
          subArray.push({ name : "empty" + j, bus_factor : [] });
        }
      }

      resultArray = [];
      for(j = 0; j < chunk; j++) {
        resultArray.push({ position : j, elem : subArray[j]});
      }
      drawFileLine(svg, resultArray, width, line);
      line++;
    }
  });
}

function drawFileLine(element, subArray, width, line) {
  var scaleWidth = d3.scale.ordinal()
    .domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19])
    .rangeBands([0, width]);

  var scaleColor = d3.scale.ordinal();
  var red = d3.rgb("grey").brighter(2);

  var svg = element.append("g")
    .attr("id", "fileLine");

  var fileRects = svg.selectAll("g")
    .data(subArray).enter().append("rect")
      .attr("transform", function(d) { return "translate(" + (scaleWidth(d.position)) + ", " + line*(scaleWidth.rangeBand()) + ")"; })
      .attr("width", scaleWidth.rangeBand() - 10)
      .attr("height", scaleWidth.rangeBand() - 10)
      .style("fill", function(d) { return (d.elem.bus_factor.length == 0) ? '#FFFFFF' : red.darker(d.elem.bus_factor.length); } );

  var tooltip = element.append("g")
      .attr("class", "tooltip")
      .style("z-index", -4)
      .style("opacity", 1e-6);

  fileRects.on("click", function(d, index, elem) {
    pieData = d.elem.bus_factor;
    busFactor = pieData.length;

    var totalKnowledge = 0;
    pieData.forEach(function(d) {
      totalKnowledge += d.knowledge;
    });

    if(totalKnowledge < 100) {
      pieData.push({ author : "others", knowledge : (100 - totalKnowledge)});
    }

    drawDetails(d.elem, pieData, busFactor);
  });
}

function drawDetails(projectElement, pieData, busFactor) {
  $("#detailInstance").remove();
  var detailWidth = $(".detailGraph").width();
  var element = d3.select(".detailGraph").append("svg").attr("id", "detailInstance");

  var width = detailWidth, textHeight = 30, 
      height = detailWidth + textHeight + 10;
  
  var svg = element
      .attr("width", width)
      .attr("height", height);

  // Main Info
  var projectElementName = svg.append("text")
    .attr("transform", "translate(0,20)")
    .text("Name: " + projectElement.name)
    .style("font-size", "1em");

  // Drawing the pie chart
  var radius = Math.min(width, height) / 2;

  var color = d3.scale.ordinal()
    .range(["#EEEEEE", "#DDDDDD", "#CCCCCC", "#BBBBBB", "#AAAAAA", "#999999", "#888888", "#666666", "#444444"]);

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(radius/2);

  var pie = d3.layout.pie()
      .sort(null)
      .value(function(d) { return d.knowledge; });

  var svgPie = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + (width / 2 + textHeight + 10) + ")");

  pieData.forEach(function(d) {
    d.knowledge = +d.knowledge;
  });

  var g = svgPie.selectAll(".arc")
      .data(pie(pieData))
    .enter().append("g")
      .attr("class", "arc");

  g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return (d.data.author == "others") ? d3.rgb("white") : color(d.data.author); });

  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .style("text-anchor", "middle")
      .text(function(d) { return (d.data.author == "others") ? "" : d.data.author; });

  g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", "1.15em")
      .style("text-anchor", "middle")
      .text(function(d) { return (d.data.author == "others") ? "" : d.data.knowledge + "%"; });

  var centerText = svgPie.append("text")
    .attr("dx", - (radius / 6))
    .attr("dy", - (radius / 4))
    .text("Bus Factor");

  var centerFactor = svgPie.append("text")
    .attr("dx", - (radius / 8))
    .attr("dy", + (radius / 5))
    .text(busFactor)
    .style("font-size", "4.5em");

}

function drawFileGraph2(element, width) {
    var diameter = 960,
    format = d3.format(",d");

    var scaleColor = d3.scale.category10();

    var pack = d3.layout.pack()
        .size([diameter - 4, diameter - 4])
        .value(function(d) { return d.factor; });

    var svg = element.append("g")
        .attr("width", diameter)
        .attr("height", diameter)
      .append("g")
        .attr("transform", "translate(10,10)");

    d3.json("files.json", function(error, root) {
      var node = svg.datum(root).selectAll(".node")
          .data(pack.nodes)
        .enter().append("g")
          .attr("class", function(d) { return d.children ? "node" : "leaf node"; })
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

      node.append("title")
          .text(function(d) { return d.name + (d.children ? "" : ": " + format(d.factor)); });

      node.append("circle")
          .attr("r", function(d) { return d.r; })
          .style("fill", function(d) { return scaleColor(d.factor); });

      node.filter(function(d) { return !d.children; }).append("text")
          .attr("dy", ".3em")
          .style("text-anchor", "middle")
          .text(function(d) { return d.name.substring(0, d.r / 3); });
    });

    d3.select(self.frameElement).style("height", diameter + "px");

}

function drawLanguageGraph(element, totalFiles, width) {
    var scaleWidth = d3.scale.linear()
        .range([0, width])
        .domain([0, totalFiles]);

    var scaleColor = d3.scale.category10();

    var svg = element.append("g");

    d3.json("languages.json", function(error, root) {

        var x0 = 0;
        root.forEach(function(d) {
            var langRect = svg.append("rect")
                .attr("transform", "translate(" + scaleWidth(x0) + ", 0)")
                .attr("height", "50px")
                .attr("width", scaleWidth(d.coverage))
                .style("fill", scaleColor(d.language));

            x0 += scaleWidth(x0);

        });
    });


}
