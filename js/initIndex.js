

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var fileGraphHeight = 1024;
var margin = 10;

var languageGraphWidth = 780;
var languageGraphHeight = 200;

var chunk = 20;
var selectedElement = undefined;

window.onload = function() {
  var branchWidth = $(".branchGraph").width();
  var branchElement = d3.select(".branchGraph").append("svg")
  drawElementGraph(branchElement, "realBranches.json", "branches", branchWidth - 2 * margin);

  var directoryWidth = $(".directoryGraph").width();
  var directoryElement = d3.select(".directoryGraph").append("svg")
  drawElementGraph(directoryElement, "realDirs.json", "dirs", directoryWidth - 2 * margin);

  var fileWidth = $(".fileGraph").width();
  var fileElement = d3.select(".fileGraph").append("svg")
  drawElementGraph(fileElement, "realFiles.json", "files", fileWidth - 2 * margin);


  var extensionWidth = $(".extensionGraph").width();
  var extensionElement = d3.select(".extensionGraph").append("svg")
  drawElementGraph(extensionElement, "realExtensions.json", "exts", extensionWidth - 2 * margin);


  var detailWidth = $(".detailGraph").width();
  var detailElement = d3.select(".detailGraph").append("svg").attr("id", "detailInstance");
  detailElement.append("text")
    .attr("transform", "translate(" + (detailWidth / 7) + ",50)")
    .text("(Click on an element to see the details)")
    .style("font-size", "0.75em");

};



function drawElementGraph(element, file, fileAttr, width) {
  d3.json(file, function(error, jsonData) {
    var root = jsonData[fileAttr];

    element
        .attr("width", width)
        .attr("height", ((root.length / chunk) + 1) * (width / chunk));

    svg = element.append("g")
      .attr("transform", "translate(5, 5)");

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
      drawElementLine(svg, fileAttr, resultArray, width, line);
      line++;
    }
  });
}

function drawElementLine(element, elementId, subArray, width, line) {
  var scaleWidth = d3.scale.ordinal()
    .domain([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19])
    .rangeBands([0, width]);

  var scaleColor = d3.scale.ordinal();
  var red = d3.rgb("grey").darker(2);

  var color = d3.scale.ordinal()
    .range(["#777777", "#AAAAAA", "#EEEEEE"])
    .domain([1,2,3]);

  var svg = element.append("g")
    .attr("id", "fileLine");

  var rects = svg.selectAll("g")
    .data(subArray).enter().append("rect").attr("id", elementId)
      .attr("transform", function(d) { return "translate(" + (scaleWidth(d.position)) + ", " + line*(scaleWidth.rangeBand()) + ")"; })
      .attr("width", scaleWidth.rangeBand() - 10)
      .attr("height", scaleWidth.rangeBand() - 10)
      .style("stroke", d3.rgb("white"))
      .style("stroke-width", 3)
      .style("fill", function(d) { return (d.elem.bus_factor.length == 0) ? '#FFFFFF' : color(d.elem.bus_factor.length); } );

  var tooltip = element.append("g")
      .attr("class", "tooltip")
      .style("z-index", -4)
      .style("opacity", 1e-6);

  rects.on("click", function(d, index, elem) {
    if(d.elem.bus_factor.length != 0) {
      // Highliting the selected element
      if(selectedElement)
        d3.select(selectedElement).style("stroke", d3.rgb("white"));

      d3.select(this)
        .attr("id", "selected")
        .style("stroke", d3.rgb("purple"));

      selectedElement = this;

      // Drawing the details
      pieData = d.elem.bus_factor;
      busFactor = pieData.filter(function(d) { return d.author != "others"} ).length;

      var totalKnowledge = 0;
      pieData.forEach(function(d) {
        totalKnowledge += d.knowledge;
      });

      if(totalKnowledge < 100) {
        pieData.push({ author : "others", knowledge : (100 - totalKnowledge)});
      }

      drawDetails(d.elem, pieData, busFactor);

      // Highlighting the other elements
      if(d.elem.type == "branch") {
        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
        
        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
        files = d3.selectAll("rect#files").filter(function(file) { return d.elem.name == file.elem.branch; });
        files.style("stroke", d3.rgb("black"));

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));       
      } else if(d.elem.type == "dir") {
        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));

        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
        files = d3.selectAll("rect#files").filter(function(file) { 
          var found = false;
          if(file.elem.dirs == undefined) return false;
          file.elem.dirs.forEach(function(fileDir) { 
            if(fileDir == d.elem.name){
              found = true;
            }
          });
          return found;
        });
        files.style("stroke", d3.rgb("black"));

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));    
      } else if(d.elem.type == "file") {
        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
        branches = d3.selectAll("rect#branches").filter(function(branch) { return d.elem.branch == branch.elem.name; });
        branches.style("stroke", d3.rgb("black"));

        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));
        dirs = d3.selectAll("rect#dirs").filter(function(dir) { 
          var found = false;
          d.elem.dirs.forEach(function(elemDir) { 
            if(elemDir == dir.elem.name){
              found = true;
            }
          });
          return found;
        });
        dirs.style("stroke", d3.rgb("black"));

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));   
        exts = d3.selectAll("rect#exts").filter(function(ext) { return d.elem.ext == ext.elem.name; });
        exts.style("stroke", d3.rgb("black")); 
      } else if(d.elem.type == "ext") {
        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));

        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
        files = d3.selectAll("rect#files").filter(function(file) { return d.elem.name == file.elem.ext; });
        files.style("stroke", d3.rgb("black")); 

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));   
        
      }

    }
  });
}

function drawDetails(projectElement, pieData, busFactor) {
  $("#detailInstance").remove();
  var detailWidth = $(".detailGraph").width();
  var element = d3.select(".detailGraph").append("svg").attr("id", "detailInstance");

  var width = detailWidth, textHeight = 50, 
      height = detailWidth + textHeight + 10;
  
  var svg = element
      .attr("width", width)
      .attr("height", height);

  // Main Info
  var projectElementNameLabel = svg.append("text")
    .attr("transform", "translate(0,20)")
    .text("Name: ")
    .style("font-size", "1em")
    .style("font-weight", "bold");

  var projectElementName = svg.append("text")
    .attr("transform", "translate(50,20)")
    .text(projectElement.name)
    .style("font-size", "1em");

  var infoElementLabel = svg.append("text")
    .attr("transform", "translate(" + (width / 7) + ",50)")
    .text("Bus factor and main knowledgeable users")
    .style("font-size", "0.75em");

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
