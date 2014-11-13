

var margin = { top: 20, right: 20, bottom: 20, left: 20 };

var hightlightColor = d3.rgb("#6A5ACD");

var fileGraphHeight = 1024;
var margin = 10;

var languageGraphWidth = 780;
var languageGraphHeight = 200;

var chunk = 20;
var selectedElement = undefined;
var selectedUser = undefined;

var infoTooltip = undefined;


var color = d3.scale.ordinal()
  .range(["#777777", "#AAAAAA", "#EEEEEE"])
  .domain([1,2,3]);

window.onload = function() {
  infoTooltip = d3.select("body").append("div")
    .attr("class", "infoTooltip")
    .style("opacity", 1e-6);


  var userWidth = $(".userGraph").width();
  var userElement = d3.select(".userGraph").append("svg")
  drawUsers(userElement, "users.json", "user_relevance", userWidth);

  var branchWidth = $(".branchGraph").width();
  var branchElement = d3.select(".branchGraph").append("svg")
  drawElementGraph(branchElement, "branches.json", "branches", branchWidth - 2 * margin);

  var directoryWidth = $(".directoryGraph").width();
  var directoryElement = d3.select(".directoryGraph").append("svg")
  drawElementGraph(directoryElement, "dirs.json", "dirs", directoryWidth - 2 * margin);

  var fileWidth = $(".fileGraph").width();
  var fileElement = d3.select(".fileGraph").append("svg")
  drawElementGraph(fileElement, "files.json", "files", fileWidth - 2 * margin);

  var extensionWidth = $(".extensionGraph").width();
  var extensionElement = d3.select(".extensionGraph").append("svg")
  drawElementGraph(extensionElement, "exts.json", "exts", extensionWidth - 2 * margin);

  d3.json("extensionRelevance.json", function(error, jsonData) {
    var relExts = jsonData["extension_relevance"];
    if(relExts.length == 1) {
      var relevantExtensions = d3.select(".relevantExtensions").text(relyingUsers.map(function(ext) { return ext.name + " (" + ext.percentage + "%)" }));
    } else {
      subRelevantExtensions = relExts.slice(0, relExts.length - 1);
      lastRelevantExtensions = relExts[relExts.length - 1];
      var subtext = subRelevantExtensions.map(function(ext) { return " " +ext.name + " (" + ext.percentage + "%)" });
      var relevantExtensions = d3.select(".relevantExtensions").text(subtext + " and " + lastRelevantExtensions.name + " (" + lastRelevantExtensions.percentage + "%)");
    }
    
  });

  initDetails();
};

function initDetails() {
  $("#detailInstance").remove();
  var detailWidth = $(".detailGraph").width();
  var detailElement = d3.select(".detailGraph").append("svg").attr("id", "detailInstance");
  detailElement.append("text")
    .attr("transform", "translate(" + (detailWidth / 7) + ",50)")
    .text("(Click on an element to see the details)")
    .style("font-size", "0.75em");
}

function drawUsers(element, file, fileAttr, width) {
  element
        .attr("width", width)
        .attr("height", 60);        

  svg = element.append("g").attr("transform", "translate(3,0)");

  d3.json(file, function(error, data) {
    jsonData = data[fileAttr];
    // Updating the factors
    var knowledgeableUsers = jsonData.filter(function(user) { return user.status.indexOf("not in bus factor") == -1});
    var factorElement = d3.select(".factor").text(knowledgeableUsers.length);

    var maxKnowledge = d3.max(jsonData.map(function(d) { return d.knowledge; }));

    var importantUsers = jsonData.filter(function(user) { return +user.knowledge == maxKnowledge && user.status.indexOf("not in bus factor") == -1});
    var importantUsersElement = d3.select(".importantUsers").text(importantUsers.map(function(user) { return user.name }));

    var relyingUsers = jsonData.filter(function(user) { return +user.knowledge < maxKnowledge && user.status.indexOf("not in bus factor") == -1});
    if(relyingUsers.length == 1) {
      var relyingUsersElement = d3.select(".relyingUsers").text(relyingUsers.map(function(user) { return user.name }));
    } else {
      subRelyingUsers = relyingUsers.slice(0, relyingUsers.length - 1);
      lastRelyingUser = relyingUsers[relyingUsers.length - 1];
      var subtext = subRelyingUsers.map(function(user) { return " " + user.name });
      var relyingUsersElement = d3.select(".relyingUsers").text(subtext + " and " + lastRelyingUser.name);
    }

    var notImportantUsers = jsonData.filter(function(user) { return user.status.indexOf("not in bus factor") > -1});
    if(notImportantUsers.length == 1) {
      var notImportantUsersElement = d3.select(".notImportantUsers").text(notImportantUsers.map(function(user) { return user.name }));
    } else {
      subNotImportantUsers = notImportantUsers.slice(0, notImportantUsers.length - 1);
      lastNotImportantUsers = notImportantUsers[notImportantUsers.length - 1];
      var subtext = subNotImportantUsers.map(function(user) { return " " + user.name });
      var notImportantUsersElement = d3.select(".notImportantUsers").text(subtext + " and " + lastNotImportantUsers.name);
    }

    var contributorsElement = d3.select(".numContributors").text(jsonData.length);

    // Drawing the users
    var scaleWidth = d3.scale.ordinal()
      .domain(jsonData.map(function(d) { return d.name; }))
      .rangeBands([0, width]);

    var rects = svg.selectAll("g")
      .data(jsonData).enter().append("g").attr("id", "user")
        .attr("transform", function(d) { return "translate(" + (scaleWidth(d.name)) + ", 5)"; })

    rects.append("rect")
      .attr("id", "user")
      .attr("width", scaleWidth.rangeBand() - 10)
      .attr("height", 45)
      .style("stroke", d3.rgb("white"))
      .style("stroke-width", 3)
      .style("fill", function(d) { return "#EEEEEE" } );

    var knowledgeScale = d3.scale.linear()
      .domain([0,100])
      .range([0, scaleWidth.rangeBand() - 10]);

    rects.append("rect")
      .attr("transform", "translate (3,3)")
      .attr("id", "knowledge")
      .attr("width", function(d) { return knowledgeScale(d.knowledge); })
      .attr("height", 39)
      .style("stroke-width", 0)
      .style("fill", function(d) { return "#AAAAAA" } );


    rects.append("text")
      .attr("dy", "1.65em")
      .attr("dx", scaleWidth.rangeBand()/2 - 5)
      .style("fill", d3.rgb("black"))
      .style("text-anchor", "middle")
      .style("font-size", "0.85em")
      .text(function(d) { return d.name; });

    rects.append("text")
      .attr("dy", "2.95em")
      .attr("dx", scaleWidth.rangeBand()/2 - 5)
      .style("fill", d3.rgb("black"))
      .style("text-anchor", "middle")
      .style("font-size", "0.85em")
      .text(function(d) { return d.knowledge + "%"; });


    var busHittingButton = d3.select(".busHittingButton");
    busHittingButton.on("click", function(d, index, elem) {
      if($(".busHittingButton").text() == "Undo") {
        location.reload();
      } else {
        $(".busHittingButton").text("Undo");
      }

      var userRects = d3.selectAll("g#user");
      userRects.on("click", null);

      var closeRects = userRects.append("g")
        .attr("id", "closeRect")
        .attr("transform", "translate(" + (scaleWidth.rangeBand() - 27) + ",2)");

      closeRects.append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .style("fill-opacity", 1)
        .style("stroke", d3.rgb("black"))
        .style("fill", d3.rgb("black"));

      closeRects.append("path")
        .attr("d", "M 2,2 12,12")
        .style("stroke", d3.rgb("white"))
        .style("stroke-width", 2)
        .style("opacity", 1);


      closeRects.append("path")
        .attr("d", "M 2,12 12,2")
        .style("stroke", d3.rgb("white"))
        .style("stroke-width", 2)
        .style("opacity", 1);

      closeRects.on("click", function(d, index, elem) {
        var selectedUser = d3.select(this);

        var userRect = d3.selectAll("g#user").filter(function(user) { return user.name == d.name});
        userRect.select("#knowledge").remove();
        userRect.select("rect#user").style("fill", d3.rgb("white"));
        userRect.select("rect#user").style("stroke", d3.rgb("#EEEEEE"));

        if(d.status.indexOf("not in bus factor") == -1) {
           d3.select(".factor").text(+d3.select(".factor").text() - 1);
        }

        files = d3.selectAll("rect#files");
        busHittingElements(files, d);

        branches = d3.selectAll("rect#branches");
        busHittingElements(branches, d);

        dirs = d3.selectAll("rect#dirs");
        busHittingElements(dirs, d);

        exts = d3.selectAll("rect#exts");
        busHittingElements(exts, d);

        selectedUser.remove();
      });
    });

    rects.on("click", function(d, index, elem) {
      var selectedUser = d3.select(this);

      if(selectedUser.attr("id") == "userRemoved") { 
        return;
      }

      initDetails();

      // Highliting the selected element
      if(selectedElement) {
        d3.select(selectedElement).style("stroke", d3.rgb("white"));
        d3.select(selectedElement).attr("id", "user")
      }

      /*if(selectedUser) 
        selectedUser.style("stroke", d3.rgb("white"));*/

      selectedUser = d3.select(this).select("rect");

      // Updating users
      users = d3.selectAll("rect#user").style("stroke", d3.rgb("white"));

      // Updating branches
      branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
      branches = d3.selectAll("rect#branches").filter(function(branch) { 
          var found = false;
          if(branch.elem.bus_factor == undefined) return false;
          branch.elem.bus_factor.forEach(function(person) { 
            if(person.author == d.name){
              found = true;
            }
          });
          return found;
        });
      branches.style("stroke", hightlightColor);

      // Updating dirs
      dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));
      dirs = d3.selectAll("rect#dirs").filter(function(dir) { 
          var found = false;
          if(dir.elem.bus_factor == undefined) return false;
          dir.elem.bus_factor.forEach(function(person) { 
            if(person.author == d.name){
              found = true;
            }
          });
          return found;
        });
      dirs.style("stroke", hightlightColor);

      // Updating files
      files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
      files = d3.selectAll("rect#files").filter(function(file) { 
          var found = false;
          if(file.elem.bus_factor == undefined) return false;
          file.elem.bus_factor.forEach(function(person) { 
            if(person.author == d.name){
              found = true;
            }
          });
          return found;
        });
      files.style("stroke", hightlightColor);

      // Updating extensions
      exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white")); 


      // We have to do this to override the previous colors
      d3.select(this).select("rect")
        .style("stroke", d3.rgb("purple"));
    });

  });
}

function busHittingElements(elements, user) {
  // Locating the elements including the user
  filteredElements = elements.filter(function(element) { 
    var found = false;
    element.elem.bus_factor.forEach(function(factor) { 
      if(factor.author == user.name){
        found = true;
      }
    });
    return found;
  });

  // Removing the user from the bus factor
  filteredElements.each(function(filteredElement) {
    var foundUser = undefined;
    var others = undefined
    filteredElement.elem.bus_factor.forEach(function(factor) {
      if(factor.author == user.name) {
        foundUser = factor;
      } else if(factor.author == "others") {
        console.log("found");
        others = factor;
      }
    });
    // adding the knowledge of the user to others
    if(others !== undefined)
      others.knowledge += foundUser.knowledge;

    var index = filteredElement.elem.bus_factor.indexOf(foundUser);
    filteredElement.elem.bus_factor.splice(index, 1);
  });

  filteredElements.style("fill", function(d) { return realBusFactor(d.elem.bus_factor) == 0 ? d3.rgb("white") : color(d.elem.bus_factor.length); } );
  filteredElements.style("stroke", function(d) { return realBusFactor(d.elem.bus_factor) == 0 ? d3.rgb("#EEEEEE") : d3.rgb("white"); } );
  filteredElements.filter(function(element) { return realBusFactor(element.elem.bus_factor) == 0} ).attr("id", "removed");
}

function realBusFactor(data) {
  var result = 0;
  data.forEach(function(factor) {
    if(factor.author !== "others")
      result++;
  });
  return result;
}

function drawElementGraph(element, file, fileAttr, width) {
  d3.json(file, function(error, jsonData) {
    var root = jsonData[fileAttr];

    // Updating the counters
    if(fileAttr == "branches") {
      $(".numBranches").text(root.length);
    } else if (fileAttr == "dirs") {
      $(".numDirs").text(root.length);
    } else if (fileAttr == "files") {
      $(".numFiles").text(root.length);
    } else if (fileAttr == "exts") {
      $(".numExts").text(root.length);
    }

    // Setting the dimension of the container
    element
        .attr("width", width)
        .attr("height", ((root.length / chunk) + 1) * (width / chunk));

    svg = element.append("g")
      .attr("transform", "translate(5, 5)");

    // Drawing line by line
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

  var svg = element.append("g")
    .attr("id", "fileLine");

  var rects = svg.selectAll("g")
    .data(subArray).enter().append("rect").attr("id", elementId)
      .attr("transform", function(d) { return "translate(" + (scaleWidth(d.position)) + ", " + line*(scaleWidth.rangeBand()) + ")"; })
      .attr("width", scaleWidth.rangeBand() - 10)
      .attr("height", scaleWidth.rangeBand() - 10)
      .style("stroke", d3.rgb("white"))
      .style("stroke-width", 3)
      .style("fill", function(d) { return (realBusFactor(d.elem.bus_factor) == 0) ? '#FFFFFF' : color(d.elem.bus_factor.length); } );

  var tooltip = element.append("g")
      .attr("class", "tooltip")
      .style("z-index", -4)
      .style("opacity", 1e-6);

  // Tooltip
  rects.on("mousemove", function(d, index, element) {    
    infoTooltip.selectAll("p").remove();
    infoTooltip
        .style("left", (d3.event.pageX+15) + "px")
        .style("top", (d3.event.pageY-10) + "px");

    infoTooltip.append("p").text(d.elem.name);
  });    

  rects.on("mouseover", function(d, index, element) {     
      infoTooltip.transition()
        .duration(200)
        .style("opacity", 1);
  });    

  rects.on("mouseout", function(d, index, element) {
      infoTooltip.transition()
        .duration(500)
        .style("opacity", 1e-6);
  });

  // Updating highlighted elements
  rects.on("click", function(d, index, elem) {
    if(realBusFactor(d.elem.bus_factor) > 0) {
      console.log(d);

      // Highligting the selected element
      if(selectedElement)
        d3.select(selectedElement).style("stroke", d3.rgb("white"));

      if(selectedUser)
        selectedUser.style("stroke", d3.rgb("white"));

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
        // Updating users
        users = d3.selectAll("rect#user").style("stroke", d3.rgb("white"));
        users = d3.selectAll("rect#user").filter(function(user) { 
          var found = false;
          if(d.elem.bus_factor == undefined) return false;
          d.elem.bus_factor.forEach(function(factor) { 
            if(factor.author == user.name){
              found = true;
            }
          });
          return found;
        });
        users.style("stroke", hightlightColor);

        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
        
        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));
        dirs = d3.selectAll("rect#dirs").filter(function(file) { return d.elem.name == file.elem.branch; });
        dirs.style("stroke", hightlightColor);

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
        files = d3.selectAll("rect#files").filter(function(file) { return d.elem.name == file.elem.branch; });
        files.style("stroke", hightlightColor);

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));       
      } else if(d.elem.type == "dir") {
        // Updating users
        users = d3.selectAll("rect#user").style("stroke", d3.rgb("white"));
        users = d3.selectAll("rect#user").filter(function(user) { 
          var found = false;
          if(d.elem.bus_factor == undefined) return false;
          d.elem.bus_factor.forEach(function(factor) { 
            if(factor.author == user.name){
              found = true;
            }
          });
          return found;
        });
        users.style("stroke", hightlightColor);

        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
        branches = d3.selectAll("rect#branches").filter(function(branch) { return d.elem.branch == branch.elem.name; });
        branches.style("stroke", hightlightColor);

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
        files.style("stroke", hightlightColor);

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));    
      } else if(d.elem.type == "file") {
        // Updating users
        users = d3.selectAll("rect#user").style("stroke", d3.rgb("white"));
        users = d3.selectAll("rect#user").filter(function(user) { 
          var found = false;
          if(d.elem.bus_factor == undefined) return false;
          d.elem.bus_factor.forEach(function(factor) { 
            if(factor.author == user.name){
              found = true;
            }
          });
          return found;
        });
        users.style("stroke", hightlightColor);

        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));
        branches = d3.selectAll("rect#branches").filter(function(branch) { return d.elem.branch == branch.elem.name; });
        branches.style("stroke", hightlightColor);

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
        dirs.style("stroke", hightlightColor);

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));   
        exts = d3.selectAll("rect#exts").filter(function(ext) { return d.elem.ext == ext.elem.name; });
        exts.style("stroke", hightlightColor); 
      } else if(d.elem.type == "ext") {
        // Updating users
        users = d3.selectAll("rect#user").style("stroke", d3.rgb("white"));

        // Updating branches
        branches = d3.selectAll("rect#branches").style("stroke", d3.rgb("white"));

        // Updating dirs
        dirs = d3.selectAll("rect#dirs").style("stroke", d3.rgb("white"));

        // Updating files
        files = d3.selectAll("rect#files").style("stroke", d3.rgb("white"));
        files = d3.selectAll("rect#files").filter(function(file) { return d.elem.name == file.elem.ext; });
        files.style("stroke", hightlightColor); 

        // Updating extensions
        exts = d3.selectAll("rect#exts").style("stroke", d3.rgb("white"));   
        
      }

      // We have to do this to override the previous colors
      d3.select(this)
        .style("stroke", d3.rgb("purple"));

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
