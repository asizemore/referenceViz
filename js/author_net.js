// JS for the author-based keyword network

// Set constants
const RADIUS = 15;   // Node radius
const EDGETHRESH = 4; // Number of shared references required for an edge to exist
const NODESTHRESH = 200; // Max number of nodes allowed for drawing edges

// Extract relevant information from html elements
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");


// Initialize simulation
let simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody().strength(-50).distanceMin(20));


// Prepare additional variables
let filterWords = ["Ries"];  // Author input
let isClicked = false;  // Boolean to help us update UI based on clicks

// Set up zoom
let zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on("zoom", zoomed);

    var g = svg.append("g");


svg.call(zoom);


 // Update title
 let divTitle = d3.select("#title-div");
 divTitle.text(null);
 divTitle.append("text")
    .html("<h1> Keyword space of author " + filterWords[0] + "</h1>");

// Prepare divInfo
let divInfo = d3.select("#info-div");
divInfo.attr("opacity",0);


// Read in data and create visualization
d3.csv("../data/all_keywords.csv", function(error, csv_nodes) {
  if (error) throw error;
  d3.csv("../data/all_keywords_edges.csv", function(error2, csv_edges) {
      if (error) throw error2;

    // Collect the original nodes so we can always return to them.
    const original_nodes1 = csv_nodes;
    const original_edges1 = csv_edges.filter(d => d.files.split("'").length > EDGETHRESH ? true : false);

    // Define the simulation function. Input the filterWords, all nodes, and all edges for subsetting and drawing.
    let runSimulation = function(filterWords, nodes, edges){

        // Subset the data to include only those nodes/edges that relate to filterWords
        let show_nodes = nodes.filter(d => filterWords.some(r => d.filenames.includes(r)));
        let show_edges = edges.filter(d => filterWords.some(r => d.files.includes(r)));
        
        // Decide if we will draw edges based on number of nodes in the subset
        let drawEdges = show_nodes.length > NODESTHRESH ? false : true;

        // Create scales
        let node_radius_domain = show_nodes.map(d => {return d.filenames.replace("]","").replace("[","").split("'").length}); // functionalize
        let radius_scale = d3.scaleLinear().domain(d3.extent(node_radius_domain)).range([5,20]);
        let edge_opacity_domain = show_edges.map(d => {return d.files.split("'").length})
        let edge_scale = d3.scaleLinear().domain(d3.extent(edge_opacity_domain)).range([0.2, 1]);

        // Create links and draw them if drawEdges===true
        let link;
        if(drawEdges){
            link = g.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(show_edges)
                .enter().append("line")
                .attr("opacity", function(d) {return edge_scale(d.files.split("'").length)});
        } else {
            link = g.append("g")
                .attr("class", "links")
                .selectAll("line")
                .data(show_edges);
        } // end if(drawEdges)


        // Draw nodes
        let node = g.append("g")
            .selectAll("circle")
            .data(show_nodes)
            .enter().append("circle")
            .attr("r",function(d) { return radius_scale(get_filenames(d.filenames).length)})
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
            .force("link", d3.forceLink().id(function(d) { return d.keyword; }))
            .force('collision', d3.forceCollide().radius(function(d) {return radius_scale(get_filenames(d.filenames).length)+1}))

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

            // Retreive node data
            let selectedNodeData = Object.entries(selectedNode.data()[0])
            let selectedNodeFilenames = get_filenames(selectedNodeData[2][1]);
        
            // Clear and update divInfo
            divInfo.text(null)
            divInfo.append("text")
                .html("<h4><b> Keyword: </b>" + selectedNodeData[1][1] + "</h4><br><br>")
        
            // Add authors and their refs to divInfo
            divInfo.append("text")
                .html("The following works reference \"" + selectedNodeData[1][1] + "\":<br><br>");

            selectedNodeFilenames.forEach(function(entry) {
        
                // Extract the last author and year from the filename
                if(entry.match(/(^[A-Za-zÀ-ÖØ-öø-ÿ]+)(\d{4})/)){
                    let entryAuthor = entry.match(/(^[A-Za-zÀ-ÖØ-öø-ÿ]+)(\d{4})/)[1],
                        entryYear = entry.match(/(^[A-Za-zÀ-ÖØ-öø-ÿ]+)(\d{4})/)[2];
        
                // Append info to div
                        divInfo.append("text")
                            .html("<a href=https://4banks.net/Mes-Rel/bibl.htm#" + entry + ">" + entryAuthor + ", " + entryYear + "</a><br>")
                            .attr("class", "infotext")
                } // end (if entry.match...)
  
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
            g.selectAll(".nodes").remove();
            g.selectAll(".links").remove();
            d3.selectAll(".hover-text").remove();
            d3.selectAll(".hover-underline").remove();
            divInfo.text(null);

            // Restart and rerun simulation
            simulation.alpha(0.3).restart();
            runSimulation(filterWords, original_nodes1, original_edges1);

            // Update title
            divTitle.text(null);
            divTitle.append("text")
            .html("<h1> Keyword space of author " + keyword_input + "</h1>")
        } // end if keyword_input...
    }); // end submit button onclick


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
function get_filenames(str) {

    let files = str.replace("]","").replace(", ","").replace("[","").split("'");
    let filteredFiles = files.filter(f => {return f.length>4});

    return filteredFiles;
}

// Have button listen to "enter"
const input = document.getElementById("keyword-input");
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
   event.preventDefault();
   document.getElementById("keyword-submit").click();
  }
});


// Zoom
function zoomed() {
    // d3.selectAll(".nodes").attr("r", radius_zoom_size(d3.event.transform.k));
    g.attr("transform", d3.event.transform); // updated for d3 v4
}
  
// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

// // Return the node degree
// function get_n_links(d) {

//     let nSource = show_edges.filter(e => e.source===d.keyword).length;
//     let nTarget = show_edges.filter(e => e.target===d.keyword).length;

//     return (nSource+nTarget)
// }



