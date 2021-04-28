// JS for the keyword space umap viz
// Followed the zooming example here https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2


// Set constants
const RADIUS = 15;   // Node radius
const EDGETHRESH = 4; // Number of shared references required for an edge to exist
const NODESTHRESH = 200; // Max number of nodes allowed for drawing edges
const NODERADIUS = 0.7;

let current_node_radius  = NODERADIUS;
let author1_input = null;
let author2_input = null;
let author12;

// Extract relevant information from html elements
const svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");


// Set up zoom
let zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

let g = svg.append("g");


svg.call(zoom);

// Prepare additional variables
let isClicked = false;  // Boolean to help us update UI based on clicks
let filterWords = ["Ries"];  // Author input


// Prepare divInfo
let divInfo = d3.select("#info-div");
divInfo.attr("opacity",0);

let zoomTrans = {x:0, y:0, scale:1}


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
    // ANN LOOK AT THE BOUNCE
    function onclick(d) {

        // Update boolean
        isClicked = true;
    
        // Modify node listeners
        d3.selectAll(".nodes").attr("r",current_node_radius);
        d3.selectAll(".nodes").on("mouseout", mouseout);
        d3.select(this).on("mouseout", null);
        d3.selectAll(".nodes").on("mouseover", mouseover);
        d3.select(this).on("mouseover", null);
    
        // Alter state of selected node
        let selectedNode = d3.select(this);
        // selectedNode.attr("r","#D1BE8E");
        selectedNode.transition().duration(150).attr("r", 2*current_node_radius);

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


    // Buttons
    d3.select("#author-submit1").on("click", function() {

        // Retrieve input
        author1_input = document.getElementById('author-input1').value;

        if (author1_input.length>1) {
            filterWords = [author1_input];
    
            let author1 = node.filter(d => filterWords.some(r => d.authors.includes(r)));
    
            author1.attr("class","author1");
            console.log(author2_input)
    
            if(author2_input) {
                filterWords.push(author2_input);
                author12 = node.filter(d => filterWords.every(r => d.authors.includes(r)));
    
                console.log(author12);
                author12.attr("class","author12");
            }
            
            // Handle mouse events
            node.on("mouseout",mouseout);
            author1.on("mouseout", null);
            author1.on("mouseout",authorMouseout);

        } else {
            // Treat as clear
            node.attr("class", "nodes");
            node.on("mouseout",mouseout);
        }
        
    })

    d3.select("#author-submit2").on("click", function() {

        // Retrieve input
        author2_input = document.getElementById('author-input2').value;

        if (author2_input.length>1) {
            filterWords = [author2_input];
    
            let author2 = node.filter(d => filterWords.some(r => d.authors.includes(r)));
    
            author2.attr("class","author2");
    
            if(author1_input) {
                filterWords.push(author1_input);
                author12 = node.filter(d => filterWords.every(r => d.authors.includes(r)));
    
                author12.attr("class","author12");
            }
            
            // Handle mouse events
            node.on("mouseout",mouseout);
            author2.on("mouseout", null);
            author2.on("mouseout",authorMouseout);

        } else {
            // Treat as clear
            node.attr("class", "nodes");
            node.on("mouseout",mouseout);
        }
        
    })

}); // end d3.csv



// Additional helper functions
function authorMouseout(d) {
    let selectedNode = d3.select(this);
    selectedNode.attr("r",current_node_radius);

    // Remove hover text
    d3.selectAll(".hover-text").remove();
    d3.selectAll(".hover-underline").remove();
}

// Handle mousover actions
let highlightedKeyword;

function mouseover(d) {

    
    // Extract object info
    let selectedNode = d3.select(this);
    selectedNode.attr("r",1.5*current_node_radius);
    
    // let x = (d3.mouse(this)[0]- zoomTrans.x)/zoomTrans.scale;
    let x = (d3.mouse(this)[0] - zoomTrans.x)/zoomTrans.scale;
    console.log(d3.event.x)
    let y = (d3.mouse(this)[1]- zoomTrans.y)/zoomTrans.scale;

    let hoveredKeyword = Object.entries(selectedNode.data()[0])[1][1];

    // Clear hover text
    d3.selectAll(".hover-text").remove();

    // Show keyword (hover-text)
    svg.append("text")
        .attr("x", d3.event.x +3)
        .attr("y", d3.mouse(this)[1] - 3)
        .attr("fill", "white")
        .attr("font-size", 0.5)
        .attr("class","hover-text")
        .attr("text-anchor","start")
        .text(hoveredKeyword);


} // end mouseover

// Handle mouseout
function mouseout(d) {

    // Extract data
    let selectedNode = d3.select(this);
    // selectedNode.attr("fill", "#5E3B66");
    selectedNode.attr("r", current_node_radius)

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

const radius_zoom_size = d3.scaleLinear().domain([1, 20]).range([NODERADIUS, 0.2]);
const hover_text_zoom_size = d3.scaleLinear().domain([1, 20]).range([10, 0.00001]); 
// Zoom
function zoomed() {

    zoomTrans.x = d3.event.transform.x;
    zoomTrans.y = d3.event.transform.y;
    zoomTrans.scale = d3.event.transform.k;
    console.log(d3.event.transform.k)

    d3.selectAll(".nodes").attr("r", radius_zoom_size(d3.event.transform.k));
    // d3.selectAll(".hover-text").attr("font-size", hover_text_zoom_size(d3.event.transform.k));
    // d3.selectAll(".hover-text").attr("transform", "scale("+hover_text_zoom_size(d3.event.transform.k) + " " + hover_text_zoom_size(d3.event.transform.k) + ")");
    g.attr("transform", d3.event.transform); // updated for d3 v4
    // console.log(d3.event.transform.k)
    // Update global radius
    current_node_radius = radius_zoom_size(d3.event.transform.k);
}
  
// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
if (d3.event.defaultPrevented) d3.event.stopPropagation();
}




