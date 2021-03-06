// JS for the author-based keyword network

// Set constants
const RADIUS = 15;   // Node radius
const EDGETHRESH = 50; // Number of shared references required for an edge to exist
const NODESTHRESH = 200; // Max number of nodes allowed for drawing edges

// Extract relevant information from html elements
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");


// Initialize simulation
let simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-50).distanceMin(20));


// Prepare additional variables
let filterWords = ["relationship"];  // Author input
let isClicked = false;  // Boolean to help us update UI based on clicks


 // Update title
 let divTitle = d3.select("#title-div");
 divTitle.text(null);
 divTitle.append("text")
    .html("<h1> Works that mention " + filterWords[0] + "</h1>");

// Prepare divInfo
let divInfo = d3.select("#info-div");
divInfo.attr("opacity",0);


// Read in data and create visualization
d3.csv("../data/all_filenames.csv", function(error, csv_nodes) {
  if (error) throw error;
  d3.csv("../data/all_filenames_edges.csv", function(error2, csv_edges) {
      if (error) throw error2;

    // Collect the original nodes so we can always return to them.
    const original_nodes1 = csv_nodes;
    const original_edges1 = csv_edges.filter(d => d.keywords.split("'").length > EDGETHRESH ? true : false);

    // Define the simulation function. Input the filterWords, all nodes, and all edges for subsetting and drawing.
    let runSimulation = function(filterWords, nodes, edges){

        // Subset the data to include only those nodes/edges that relate to filterWords
        let show_nodes = nodes.filter(d => filterWords.some(r => d.keywords.includes(r)));
        let show_edges = edges.filter(d => filterWords.some(r => d.keywords.includes(r)));
        
        // Decide if we will draw edges based on number of nodes in the subset
        let drawEdges = show_nodes.length > NODESTHRESH ? false : true;

        // Create scales
        let node_radius_domain = show_nodes.map(d => {return getKeywords(d.keywords).length}); // functionalize
        let radius_scale = d3.scaleLinear().domain(d3.extent(node_radius_domain)).range([5,20]);
        let edge_opacity_domain = show_edges.map(d => {return getKeywords(d.keywords).length})
        let edge_scale = d3.scaleLinear().domain(d3.extent(edge_opacity_domain)).range([0.2, 1]);

        // Create links and draw them if drawEdges===true
        let link;
        if(drawEdges){
            link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(show_edges)
                .enter().append("line")
                .attr("opacity", function(d) {return edge_scale(getKeywords(d.keywords).length)});
        } else {
            link = svg.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(show_edges);
        } // end if(drawEdges)


        // Draw nodes
        let node = svg.append("g")
            .selectAll("circle")
            .data(show_nodes)
            .enter().append("circle")
            .attr("r",function(d) { return radius_scale(getKeywords(d.keywords).length)})
            .attr("stroke-width",0)
            .attr("class", "nodes")
            .on("mouseover",mouseover)
            .on("mouseout",mouseout)
            .on("click",onclick);

        // Update simulation with the data
        simulation
            .nodes(show_nodes)
            .on("tick", ticked);

        simulation
            .force("link", d3.forceLink().id(function(d) { return d.filename; }))
            .force('collision', d3.forceCollide().radius(function(d) {return radius_scale(getKeywords(d.keywords).length)+1}))

        simulation.force("link")
            .links(show_edges);

        simulation.force("y", d3.forceY().y(height/2).strength(show_nodes.length/10000))
            .force("x",d3.forceX().x(width/2).strength(show_nodes.length/10000));

        // Define what happens as time progresses
        function ticked() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node
                .attr("cx", function(d) { return d.x = Math.max(RADIUS, Math.min(width - 20, d.x));})
                .attr("cy", function(d) { return d.y = Math.max(RADIUS+22, Math.min(height - 20, d.y));})

            } // end ticked()

        // Executed when a user clicks a node
        function onclick(d) {

            // Update boolean
            isClicked = true;
        
            // Modify node listeners
            d3.selectAll(".nodes").attr("stroke-width",0)
            d3.selectAll(".nodes").on("mouseout", mouseout)
            d3.select(this).on("mouseout", null);
            d3.selectAll(".nodes").on("mouseover", mouseover)
            d3.select(this).on("mouseover", null);
     
            // Alter state of selected node
            let selectedNode = d3.select(this);
            selectedNode.attr("stroke-width","1");

            // Retrieve node data
            let selectedNodeData = Object.entries(selectedNode.data()[0]);
            let selectedNodeKeywords = getKeywords(selectedNodeData[4][1]);
            selectedNodeKeywords.sort();
        
            // Clear and update divInfo
            divInfo.text(null)
            divInfo.append("text")
                .html("<h4><b> Reference:  </b> <a href=https://4banks.net/Mes-Rel/bibl.htm#" + selectedNodeData[1][1] + " id=reference-link>" +
                      selectedNodeData[2][1] + ", " + selectedNodeData[3][1] + "</a></h4><br><br>")
        
            // Add authors and their refs to divInfo
            divInfo.append("text")
                .html("This work contains the following keywords:<br><br>");

                selectedNodeKeywords.forEach(function(entry) {
         
                // Append info to div
                    divInfo.append("text")
                        .html("<a href='' onclick='return false;'>" + entry + "</a><br>")
                        .attr("class", "infotext")
                        .attr("class", entry)
                        .on("click", redrawNetworkFromKeyword); // Consider using id...

  
                 }); // end forEach
        
            // Finally make div visible
            divInfo.attr("opacity",1);

        } // end onClick

        
    }; // end runSimulation

    // Actually run the simulation and plot!
    runSimulation(filterWords, original_nodes1, original_edges1);


    // Buttons
    d3.select("#keyword-submit").on("click", function() {

        // Retrieve input
        let keyword_input = document.getElementById('keyword-input').value;

        // Basic protection against nonsense input
        if (keyword_input.length > 2){

            filterWords = [keyword_input];

            // Update svg
            svg.selectAll(".nodes").remove();
            svg.selectAll(".links").remove();
            d3.selectAll(".hover-text").remove();
            d3.selectAll(".hover-underline").remove();
            divInfo.text(null);

            // Restart and rerun simulation
            simulation.alpha(0.3).restart();
            runSimulation(filterWords, original_nodes1, original_edges1);

            // Update title
            divTitle.text(null);
            divTitle.append("text")
                .html("<h1> Works that mention " + filterWords[0] + "</h1>");
        } // end if keyword_input...
    }); // end submit button onclick


    // If user clicks a keyword, update network with that keyword
    function redrawNetworkFromKeyword() {

        let selected_keyword = d3.select(this).attr("class");
        filterWords = [selected_keyword];

        // Update svg
        svg.selectAll(".nodes").remove();
        svg.selectAll(".links").remove();
        d3.selectAll(".hover-text").remove();
        d3.selectAll(".hover-underline").remove();
        divInfo.text(null);

        // Restart and rerun simulation
        simulation.alpha(0.3).restart();
        runSimulation(filterWords, original_nodes1, original_edges1);

        // Update title
        divTitle.text(null);
        divTitle.append("text")
            .html("<h1> Works that mention " + filterWords[0] + "</h1>");

    }


  }); // end d3.csv
}); // end d3.csv



// Additional helper functions
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }

// function dragstarted(d) {
//   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//   d.fx = d.x;
//   d.fy = d.y;
// }

// function dragged(d) {
//   d.fx = d3.event.x;
//   d.fy = d3.event.y;
// }

// function dragended(d) {
//   if (!d3.event.active) simulation.alphaTarget(0);
//   d.fx = null;
//   d.fy = null;
// }


// Handle mousover actions
let highlightedKeyword;

function mouseover(d) {

    // Extract object info
    let selectedNode = d3.select(this);
    selectedNode.attr("stroke-width","0.5");
    
    let hoveredKeyword = Object.entries(selectedNode.data()[0])[1][1];

    // Clear hover text
    d3.selectAll(".hover-text").remove();

    // Show keyword (hover-text)
    svg.append("text")
        .attr("x", 15)
        .attr("y", 16)
        .attr("fill", "white")
        .attr("class","hover-text")
        .attr("text-anchor","start")
        .text(hoveredKeyword);

    // Add fancy line
    svg.append("line")
        .attr("x1", 15)
        .attr("x2", 200)
        .attr("y1", 22)
        .attr("y2", 22)
        .attr("class", "hover-underline");

} // end mouseover

// Handle mouseout
function mouseout(d) {

    // Extract data
    let selectedNode = d3.select(this);
    selectedNode.attr("stroke-width", 0);

    // Remove hover text
    d3.selectAll(".hover-text").remove();
    d3.selectAll(".hover-underline").remove();

} // end mouseout

// Parse filenames
function getKeywords(str) {

    let keywords = str.replace("]","").replace(", ","").replace("[","").split("'");
    let filtered_keywords = keywords.filter(f => {return f.length>4});

    return filtered_keywords;
}


// Have button listen to "enter"
const input = document.getElementById("keyword-input");
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("keyword-submit").click();
  }
});

// // Return the node degree
// function get_n_links(d) {

//     let nSource = show_edges.filter(e => e.source===d.keyword).length;
//     let nTarget = show_edges.filter(e => e.target===d.keyword).length;

//     return (nSource+nTarget)
// }



