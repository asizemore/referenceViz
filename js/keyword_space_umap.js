// JS for the keyword space umap viz
// Followed the zooming example here https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2


// Set constants
const RADIUS = 15;   // Node radius
const EDGETHRESH = 4; // Number of shared references required for an edge to exist
const NODESTHRESH = 200; // Max number of nodes allowed for drawing edges
const NODERADIUS = 0.7;

// Extract relevant information from html elements
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");


// Set up zoom
let zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on("zoom", zoomed);

    var g = svg.append("g");


svg.call(zoom);

// Prepare additional variables
let isClicked = false;  // Boolean to help us update UI based on clicks


// Prepare divInfo
let divInfo = d3.select("#info-div");
divInfo.attr("opacity",0);


// Read in data and create visualization
d3.csv("../data/all_keywords_umap.csv", function(error, nodes) {
  if (error) throw error;


    // Create scales
    const node_radius_domain = nodes.map(d => {return get_filenames(d.filenames).length}); // functionalize
    // const radius_scale = d3.scaleLinear().domain(d3.extent(node_radius_domain)).range([5,20]);


    let x_scale = d3.scaleLinear().domain(d3.extent(nodes.map(d => +d.x))).range([20, width-20]);
    let y_scale = d3.scaleLinear().domain(d3.extent(nodes.map(d => +d.y))).range([25, height-20]);


    // Draw nodes
    let node = g.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        // .attr("r",function(d) { return radius_scale(get_filenames(d.filenames).length)})
        .attr("r", NODERADIUS)
        .attr("stroke-width",0.01)
        .attr("class", "nodes")
        .attr("fill", "#5E3B66")
        .attr("cx", function(d) {return x_scale(+d.x)})
        .attr("cy", function(d) {return y_scale(+d.y)})
        .on("mouseover",mouseover)
        .on("mouseout",mouseout)
        .on("click",onclick);



    // Executed when a user clicks a node
    function onclick(d) {

        // Update boolean
        isClicked = true;
    
        // Modify node listeners
        d3.selectAll(".nodes").attr("r",NODERADIUS).attr("fill", "#5E3B66");
        d3.selectAll(".nodes").on("mouseout", mouseout);
        d3.select(this).on("mouseout", null);
        d3.selectAll(".nodes").on("mouseover", mouseover);
        d3.select(this).on("mouseover", null);
    
        // Alter state of selected node
        let selectedNode = d3.select(this);
        selectedNode.attr("fill","#D1BE8E");
        selectedNode.transition().duration(150).attr("r", 2*NODERADIUS);

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

}); // end d3.csv



// Additional helper functions

// Handle mousover actions
let highlightedKeyword;

function mouseover(d) {

    // Extract object info
    let selectedNode = d3.select(this);
    selectedNode.attr("fill","#D1BE8E");
    
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
    selectedNode.attr("fill", "#5E3B66");
    selectedNode.attr("r", NODERADIUS)

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

const radius_zoom_size = d3.scaleLinear().domain([1, 20]).range([3, 5]);

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




