/*  D3 tree library 
    G. Hudman 
    Mar 31, 2016
    Update: 1/10/17 - For cinergi mongo
*/

var jsonSrc;
treeJSON = d3.json(gD3_Schema, function(error, treeData) {
    jsonSrc = $.extend(true, [], treeData);
    console.log("json load error " + error);
    setTimeout(function(){ 
        visu(error, treeData); 
        reset();
    }, 500);
});

var mdData = "Initial",
    jData = {},
    dMode ="Navigate",
    root,
    editStatus = false,
    dataEdits = false,
    update,
    tData,
    maxId,
    maxHeight,
    reset;


function visu (error, treeData) {
    tData = treeData;
    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 400;
    var txtAreaLineSize = 100;
    
    // size of the diagram
    var errDoc = $(document);

    if(errDoc.width()) {
        var viewerWidth = $(document).width()*.8;
        var viewerHeight = $(document).height()*.9;
    } else {
        var viewerWidth = $(document).parentWindow.width()*.8;
        var viewerHeight = $(document).height()*.9;
    }

    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth])
        .nodeSize([30,100])
        .separation(function(a, b) { return (a.parent == b.parent ? 150 : 125); });

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var jChild = { "name":"personName", "value": "Host A. Dministrator"};

    // A recursive helper function for performing some setup by walking through all nodes        
    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        ( typeof (d.name) !== "undefined" ) ? maxLabelLength = Math.max(d.name.length, maxLabelLength): console.log("visit tree err ");

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // sort the tree according to the node names
    // turned off sortinf for now
    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    // sortTree();

    reset = function(zoom) {

        centerNode(root,zoom);
       // panTimer = true;
       // pan(root,'up')
    }

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function (a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function (d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function (d) {
                    return d.id;
                }).filter(function (d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

       
            parentLink = tree.links(tree.nodes(draggingNode.parent));
            svgGroup.selectAll('path.link').filter(function(d, i) {
                if (d.target.id == draggingNode.id) {
                    return true;
                }
                return false;
            }).remove();


        dragStarted = null;
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);


    // Define the drag listeners for drag/drop behaviour of nodes.
    dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will 
            // absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function(d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
             
                initiateDrag(d, domNode); 
            }

            // get coords of mouseEvent relative to svg container to allow for panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }
            (isNaN(d.x0)) ? d.x0 = d3.event.dy: d.x0 += d3.event.dy;
           // d.x0 += d3.event.dy;
            (isNaN(d.y0)) ? d.y0 = d3.event.dx: d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function(d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            //centerNode(draggingNode);
            draggingNode = null;
        }
    }

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {

        selectedNode = d3.select(d);
        
     
    };
    var outCircle = function(d) {

        updateTempConnector();
    };


    // Function to update the temporary connector indicating dragging affiliation
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.
    // turned off

    function centerNode(source, zoom) {

        (isNaN(zoom)) ? zoom = 1: zoom = zoom;
        scale = parseFloat(zoomListener.scale());
        scale = scale * parseFloat(zoom);

        x = -source.y0;
        y = -source.x0;
        x =  25; //x * scale + viewerWidth / 3;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function



    function toggleChildren(d) {
        
        if (d.children) {
            d._children = d.children;
            d.children = null;
            d.viewstate = "expand";

        } else if (d._children) {
            d.children = d._children;
            d._children = null;
            d.viewstate = "collapse";
        }
        return d;
        
    }

    // Toggle children on click.

    function click(d) {

        var newD = this;

        if ( d.datatype == "subschema" ) {
            gD3_Schema = d.ref;
            d3.select("svg").remove();

            if ( typeof(gCKAN_pid) !== "undefined" &&  gCKAN_pid.length > 1) {
               
               schemaChange(gD3_Schema); 

                loadD3();
            } else {
              d3.json(gD3_Schema, function(error, treeData) {
                if (error) {
                  alert('Schema : ' + gD3_Schema + ' indicated ' + error);
                } else {
                  visu(error, treeData);
                  reset();
               }
              });
            }
        }

        if ( d.datatype == "textarea" || d.datatype == "string" || d.datatype == "bbox" || d.datatype == "typeahead" || d.datatype == "dictlist" || d.datatype == "guid" || d.datatype == "date" ) {
             //alert(d.value);
             d3.contextMenu(d, menu, update)
        } else {
    
             d = toggleChildren(d);
            //if ( typeof(d.viewstate) !== "undefined") { d.viewstate ="expand" }
            
            
            if ( typeof(d.viewstate) !== "undefined") { 
                (d.viewstate =="expand") ? d.viewstate =="collapse" : d.viewstate = "expand";
            } else {
                if ( typeof(d.children) != "undefined" ) 
                { d.viewstate ="collapse"; }
                else {d.viewstate = "expand"; }

            }
            
            update(d);
        }
    }

    function json_xporter() {

        var rootObj = $.extend(true, [], d3.selectAll('g.node'));
        var rootNode = new Object();
       
        rootObj.each( function(d) {
            var node_data = d;

             if (node_data.depth == 0) {
                rootNode = node_data;
                var children = rootNode.children;
                if (children != null) {
                    $.each(children, function(index, child) {
                        remove_d3_metadata(child);
                    });
                }
            }
        });

        return rootNode;

    } 

    var remove_d3_metadata = function(node_data) {
        // remove the d3 metadata
        delete node_data.parent;
        delete node_data.x;
        delete node_data.x0;
        delete node_data.y;
        delete node_data.y0;
        delete node_data.__proto__;

        var grandchildren = node_data.children;
        if (grandchildren != null) {
            $.each( grandchildren, function(index, grandchild) {
                remove_d3_metadata(grandchild);
            });
        }
    };

    var linkWidth = function(d, maxdepth) {

         var baseWidth = (maxdepth - d.target.depth),
             wid = baseWidth + "px",
             reqCS = false,
             hvCS  = false;

                ( typeof(d.target.required) != "undefined" && d.target.required == "true") ? reqCS = true: reqCS = false;
                ( typeof(d.source.required) != "undefined" && d.source.required == "true") ? reqCS = true: reqCS = false;
                ( typeof(d.target.value) != "undefined" && d.target.value != "") ? hvCS = true: hvCS = false;

                if ( typeof(d.target.children) != "undefined" && d.target.children.length > 0 ) {
                    d.target.children.forEach(function(child) {

                        ( typeof(child.required) != "undefined" && child.required == "true") ? reqCS = true: reqCS = reqCS;
                        if ( typeof(child.value) != "undefined" && child.value != "")  {
                            hvCS = true;
                            d.source.childvalue = 1;
                        }
                    }); 
                }

                if ( reqCS && hvCS ) { wid = (baseWidth + 3) + "px" }
                else if ( reqCS && !hvCS ) { wid = (baseWidth + 5) + "px" }
                else if ( !reqCS && hvCS ) { wid = (baseWidth + 2) + "px" }

                return wid;

    }

    var linkStroke = function (d) {

        var colr = "#ccc",
                    reqCS = false,
                    hvCS  = false,
                    hasChild = false;
                    reqCSchild = "#ccc",
                    hvCSchild  = "#ccc";

                ( typeof(d.target.required) != "undefined" && d.target.required == "true") ? reqCS = true: reqCS = false;
                ( typeof(d.target.value) != "undefined" && d.target.value != "") ? hvCS = true: hvCS = false;
                ( typeof(d.target.childvalue) != "undefined" && d.target.childvalue == "1") ? hvCS = true: hvCS = hvCS;
                if ( typeof(d.target.children) != "undefined" && d.target.children.length > 0 ) {
                    hasChild = true;
                    d.target.children.forEach(function(child) {
                        if ( typeof(child.required) != "undefined" && child.required == "true") {
                            if ( typeof(child.value) != "undefined" && child.value != "")  {
                                reqCSchild = "#ada";
                            } else {  reqCSchild = "#daa"; }
                        } else {
                           if ( reqCSchild != "#ccc" )  {
                              ( typeof(child.value) != "undefined" && child.value == "") ? hvCSchild = "#dda": hvCSchild = hvCSchild;
                            }
                        }
                    }); 
                }

                if ( reqCS && hvCS ) { 
                    if ( hasChild ) {
                        ( reqCSchild != "#ccc" ) ? colr = reqCSchild : colr = colr;             
                        ( hvCSchild != "#ccc") ? colr = hvCSchild : colr = colr;
                    } else { colr = "#ada" }
                }
                else if ( reqCS && !hvCS ) { 
                    if ( hasChild ) {
                        ( reqCSchild != "#ccc" ) ? colr = reqCSchild : colr = hvCSchild;
                    } else { colr = "#d99" }  
                }
                else if ( !reqCS ) { 
                     if ( hasChild ) {
                        ( reqCSchild != "#ccc" ) ? colr = reqCSchild : colr = "#dda";

                       // ( reqCSchild && hvCSchild ) ? colr = "#ada" : colr = "#daa";             
                       // ( !reqCSchild ) ? colr =  "#dda" : colr = "#daa";
                       } else { 
                        ( hvCS ) ? colr = "#dda" : colr = "#ccc";
                       }  
                } 
                
                return colr;

    }

    update = function(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1],
            maxdepth = 0;

        var childCount = function(level, n) {
            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };

        childCount(0, root);
        // tree.size is overriden by .nodesize
        var nX = 25, 
            nY = 25,
            runningYoffset = 0;
        var newHeight = d3.max(levelWidth) * 300; // not active 
        tree = tree.size([newHeight, viewerWidth])
            .nodeSize([nX,nY])
            .separation(function(a, b) {return 1.5});


        // Compute the new tree layout.

        var nodes = tree.nodes(root).reverse(),
            maxHeight = 0;
            runningYoffset = 0,
            leve1 = 0, 
            lev2 = 0;

        var links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        nodes.forEach(function(d) {
            //console.log(' for each node ' + d.name + ' ' + ' x ' +  d.x + ' ' + d.y );
            var scale = 6;
            if (d.xoffset) {d.x = d.x + d.xoffset }; 
           
            if  (d.depth == 0 ) { d.y = 25; }
            else {
                d.y = (1 + d.depth) * maxLabelLength*scale;
            }

            if ( d.depth > maxdepth )  { maxdepth = d.depth }
            if ( d.x >  maxHeight ) { maxHeight = d.x }
 
            if  (d.depth == 1 ) { d.y = (1 + d.depth) * maxLabelLength*scale } // +  msgLen * scaleFactor; // GHud -- maxLabelLength * 10px
            if (d.yoffset) {d.y = d.y + d.yoffset + runningYoffset}; 

        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
               // maxId = d.id = ++i;
             //   return d.id;12
               // maxId = d.id + 1;
               console.log(' selectAllnodes ' + d.name + ' x ' + d.x + ' ' + d.y + ' val ' + d.value);
               return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g") 
            .attr("class", "node")
            .attr("childvalues","0")
            .attr("transform", function(d) {

                return "translate(" + d.y  + "," + d.x + ")"; 

            })
            .on('click', click) 
            .on('contextmenu',  function(d) { 
                    d3.contextMenu(d, menu, update);
            })

            
       // console.log("building the tree node " + source.name);
        
        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d.children || d._children ? "#fff" : "lightsteelblue";
            }); 
        
         nodeEnter.append("rect")
           .attr("y", -12)
           .attr("x", -12)
          .attr("height", function(d) {
             var txtHeight = 25;     
             return 25; 
          })
          .attr("width",  function(d) {
            var textLen = 50;
            if ( typeof(d.datatype) != "undefined" && d.datatype == "textarea" ) {
                textLen = txtAreaLineSize*8;
            } else if ( typeof(d.value) != "undefined" && d.value != "" && d.value !== null ) {
                if ( isNaN(d.value) ) {
                    textLen = textLen + d.value.length*8;
                } else { 
                    var ds = d.value.toString(); 
                    textLen = textLen + ds.length*8; } 
             }
             
             return textLen;
          })
          .style("fill", '#ccc');
         
        nodeEnter.append("text")
            .attr('class', 'nodeText')
            .attr("x", 10)
            .attr("y", 0)

            .attr("dy", ".35em") 
            .attr("text-anchor","start")

            .text(function(d) {
                var mz;
                ( d.datatype == "subschema" || d.children || d._children  ) ? mz = "" : mz = d.value;
                //var mz = d.name + ":" + d.value;
                if ( typeof(d.datatype) != "undefined" && typeof(d.value) != 'undefined' && d.datatype == "textarea" ) 
                    {  
                    console.log(' split : ' + d.name);
                    var arr = d.value.split(" "),
                        linetxt = "";
                    for (i = 0; i < arr.length; i++) {
                        ( linetxt.length == 0 ) ? linetxt = arr[i]: linetxt = linetxt + ' ' + arr[i];
                        if (linetxt.length > txtAreaLineSize ) {
                            break;
                        }
                    }
                    mz = linetxt;
                }
                return mz;

            })
            .style("fill-opacity", 0);

        nodeEnter.append("text")
            .attr("x", function(d) {
                 return d.children || d._children || ( typeof(d.datatype) != "undefined" && d.datatype == "subschema" ) ? -20 : 0;
             })
            .attr("y", -20)
            .attr("dy", ".35em")
            .attr('class', 'nodeLabel')
            .attr("text-anchor","start")

            .text(function(d) {
                return " new node label text error";
                //return d.children || d._children ? (d.display) ? d.display : d.name : "";
               
            })
            .style("fill-opacity", 50);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 20)
            .attr("opacity", function(d) {
                var opVal = 0;
                if ( typeof(d.datatype) != "undefined" && d.datatype == "subschema" ) {
                        opVal = .3;
                } else if ( typeof(d.required) != "undefined" && d.required != "true" ) {
                        opVal = .2;
                } else if ( typeof(d.viewstate) != "undefined") {
                    ( d.viewstate == "collapse" || d.viewstate == "collapsed" ) ? opVal = .2 : opVal = .1;
                } 
                return opVal;

            }) // change this to zero to hide the target area
            .style("fill", function(d) {
                var cv = "#CC6600";
               if ( typeof(d.datatype) != "undefined" && d.datatype == "subschema" ) {
                    cv = "#1F45FC";
                } else if ( typeof(d.viewstate) != "undefined") {
                     ( d.viewstate == "collapse" || d.viewstate == "collapsed" ) ? cv = "#FFD801" : cv = "#CC6600" ;
                } else if ( typeof(d.required) != "undefined" && d.required != "true" ) {
                    if ( typeof(d.value) != "undefined" && d.value != "" )  {
                        cv = "#89C35C";
                    } else {
                        cv = "#CC6600";
                    }
                }
                return cv;
               
            })
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
            });

        // Update the text to reflect whether node has children or not.
        var nt = node.select("text.nodeText")
        .text(function(d) {
                var dText, dValue,rtnVal;
               
                if ( typeof(d.datatype) != "undefined" && d.datatype != "textarea" ) {
                    ( typeof(d.value) != "undefined" && d.value != "" ) ? rtnVal = d.value: rtnVal = "";

                    if ( d.children || d._children ) { 
                        rtnVal = "";
                      
                    }
               
                    if ( d.datatype == "subschema" ) { rtnVal = ""; }
                    return rtnVal;
                }
            });

        
        var ta_id,
            ta_lines = 1;

        nt.each(function(d) {
           // .text(function(d) {
                var rtnVal;                
                console.log(' nt each selected ' + d.name + ' ' + d.value);

                ( d.datatype == "subschema" || d.children || d._children  ) ? rtnVal = "" : rtnVal = d.value;

                if ( typeof(d.datatype) != "undefined" && d.datatype == "textarea" ) {
                    if ( typeof(d.value) != "undefined" && d.value.length > 1 ) {
                       if ( d.value.length >= txtAreaLineSize ) {

                            d3.select(this).selectAll("tspan").remove();

                            var arr = d.value.split(" "),
                                linetxt = "",
                                linecount = 0,
                                linelength = 0;

                            for (i = 0; i < arr.length; i++) {
                                ( linelength == 0 ) ? linetxt = arr[i]: linetxt = linetxt + ' ' + arr[i];
                                //linelength = linelength + arr[i].length;
                                linelength = linetxt.length;
                                if ( linelength > txtAreaLineSize ) {
                                    if (linecount > -1 ) {
                                        ta_lines++;
                                        ta_id = d.id;
                                        d3.select(this).append("tspan")
                                            .text(linetxt)
                                            .attr("dy", i ? "1.2em" : 0)
                                            .attr("x", 10)
                                            .attr("text-anchor", "left")
                                            .attr("class", "tspan" + i);     
                                    }
                                    linetxt = "";
                                    linelength = 0;
                                    linecount++;
                                }
                            }
                            if (linelength > 0 ) {
                                 d3.select(this).append("tspan")
                                            .text(linetxt)
                                            .attr("dy", (i+1) ? "1.2em" : 0)
                                            .attr("x", 10)
                                            .attr("text-anchor", "left")
                                            .attr("class", "tspan" + (i+1)); 
                            }

                        }
                    } 
                } else {
                    rtnVal = d.value;
                }

                return rtnVal;
            });
           

        node.select("text.nodeLabel")
              .text(function(d) { 
                    return ( d.display ) ? d.display : d.name;
                });


        //Update the boxes
         node.select('rect')
           .attr("width",  function(d) {
            var textLen = 25;
            if ( typeof(d.datatype) != "undefined" && d.datatype == "textarea" ) {
                textLen = txtAreaLineSize*7;
              
            } else if ( typeof(d.value) != "undefined" && d.value != "" && d.value !== null ) {
                if ( isNaN(d.value) ) {
                    textLen = textLen + d.value.length*8;
                } else { 
                    var ds = d.value.toString(); 
                    textLen = textLen + ds.length*8; } 
             }
        
             return textLen;
         }).attr("height", function(d) {
               if ( typeof(d.datatype) != "undefined" && typeof(d.value) != 'undefined' && d.datatype == "textarea" ) {
                    var linecount = (d.value.length / txtAreaLineSize) + 1;
                    if ( linecount <= 1 ) {
                        return 25;
                    } else {
                        return (linecount+1)*15;
                    }
                }
                else {
                    return 25;
                }
        });

        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", function(d) { 
                  var CircSize = 6;
                 typeof(d.value) != "undefined" && d.value != "" ? CircSize = CircSize + 2: CircSize = CircSize -1;
                 d.children || d._children  ?  CircSize = CircSize + 2: CircSize = CircSize -1; 
                 if  ( typeof(d.datatype) !== "undefined" && d.datatype == "bbox" ) { CircSize = 10; } 
                 return CircSize;           
            })
            .style("fill", function(d) {
                var cirColor = "#fff"
                if  ( typeof(d.value) != "undefined" && d.value != "" ) 
                    { cirColor = "#8cc"; 
                   } else if ( d.children || d._children ) 
                    { cirColor ="#88c"; } 
                if  ( typeof(d.datatype) != "undefined" && d.datatype == "array" ) 
                    { cirColor = "#f44"; }
                if  ( typeof(d.datatype) != "undefined" && d.datatype == "bbox" ) 
                    { cirColor = "#4e4"; }
                return cirColor;
            });

        node.select("circle.ghostCircle")
           .attr("opacity", function(d) {
               var opVal = 0;
               if ( typeof(d.datatype) != "undefined" && d.datatype == "subschema" ) {
                        opVal = .3;
                } else if ( typeof(d.required) != "undefined" && d.required != "true" ) {
                        opVal = .2;
                } else if ( typeof(d.viewstate) != "undefined") {
                    ( d.viewstate == "collapse" || d.viewstate == "collapsed" ) ? opVal = .2 : opVal = .1;
                } 
                return opVal;
            })
            .style("fill", function(d) {
               var cv = "#CC6600";
               if ( typeof(d.datatype) != "undefined" && d.datatype == "subschema" ) {
                    cv = "#1F45FC";
                } else if ( typeof(d.viewstate) != "undefined") {
                     ( d.viewstate == "collapse" || d.viewstate == "collapsed" ) ? cv = "#FFD801" : cv = "#CC6600" ;
                } else if ( typeof(d.required) != "undefined" && d.required != "true" ) {
                    if ( typeof(d.value) != "undefined" && d.value != "" )  {
                        cv = "#89C35C";
                    } else {
                        cv = "#CC6600";
                    }
                }
                return cv;

            });

        // Transition nodes to their new position.
        
        //var nodeUpdate = nodeEnter.transition()//- this way makes the links error
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
              // return "translate(" + d.y  + "," + d.x + ")";

               if ( d.x > maxHeight ) { maxHeight = d.x; }
             //  console.log('transition ' + d.name)

                if ( d.id < ta_id ) {
                    var ta_off = (ta_lines-1)*15;
                    return "translate(" + d.y  + "," + (d.x + ta_off) + ")";
                } else {
                    return "translate(" + d.y  + "," + d.x + ")";    
                }
                
               // }
            });
        
        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                console.log('transitioning ' + d.name + ' ' + source.y);
                if ( source.id < ta_id ) {
                    var ta_off = (ta_lines-1)*15;
                     return "translate(" + source.y + "," + (source.x + ta_off) + ")";
                }
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();
        
        nodeExit.select("circle")
            .attr("r", 15);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…

        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            })
            .attr("d", function(d) {
                 if ( d.target.id < ta_id ) {
                    var ta_off = (ta_lines-1)*15;
                    d.target.x = d.target.x + ta_off;
                    //link_off = true;
                     console.log('link select ' + d.target.name + ' ' + d.target.id + ' ' + d.target.x + ' ' + d.target.y + ' '  + ' ' + ta_id + ' ' + ta_lines + ' ' + ta_off);
                } 
            })
            .style("stroke-width", function(d) {
                 var baseWidth = (maxdepth - d.target.depth) + 2,
                 wid = baseWidth + "px",
                 reqCS = false,
                 hvCS  = false;

                    ( typeof(d.target.required) != "undefined" && d.target.required == "true") ? reqCS = true: reqCS = false;
                    ( typeof(d.source.required) != "undefined" && d.source.required == "true") ? reqCS = true: reqCS = false;
                    ( typeof(d.target.value) != "undefined" && d.target.value != "") ? hvCS = true: hvCS = false;

                    if ( typeof(d.target.children) != "undefined" && d.target.children.length > 0 ) {

                        d.target.children.forEach(function(child) {

                            ( typeof(child.required) != "undefined" && child.required == "true") ? reqCS = true: reqCS = reqCS;
                            if ( typeof(child.value) != "undefined" && child.value != "")  {
                                hvCS = true;
                                d.source.childvalue = 1;
                            }
                        }); 
                    } else { d.target.x = d.target.x + 7; }

                    if ( reqCS && hvCS ) { wid = (baseWidth + 3) + "px" }
                    else if ( reqCS && !hvCS ) { wid = (baseWidth + 5) + "px" }
                    else if ( !reqCS && hvCS ) { wid = (baseWidth + 2) + "px" }

                    return wid;

                // return linkWidth(d, maxdepth)
            })
            .style("stroke", function(d) {
                return linkStroke(d)
            });

       
        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", function(d) {
                 // console.log("D is " + d.name);
                 return "link";

                  if ( typeof(d.target.value) != "undefined" && d.target.value != "") 
                   { return "link"; 
                   } else { return "link"; }
            })
            .attr("d", function(d) {
                if ( typeof(source.x0) =="undefined" || typeof(source.y0) =="undefined" ) {
                    var o = {
                        x: source.x,
                        y: source.y
                     }
                } else {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    }
                };
        
                if ( d.target.id < ta_id ) {
                    var ta_off = (ta_lines-1) *15;
                    d.target.x = d.target.x + ta_off;
                    console.log('link enter ' + d.target.name + ' ' + d.target.id + ' ' + d.target.x + ' ' + d.target.y + ' '  + ' ' + ta_id + ' ' + ta_lines + ' ' + ta_off);
                }

                return diagonal({
                    source: o,
                    target: o
                });
            })
            .attr("opacity", function(d) {
                if ( typeof(d.target.value) != "undefined" && d.target.value != "") 
                    {return 1.0; } else  { return .6; }
            })
            .style("stroke-width", function(d) {
                //linkWidth(d, maxdepth);
            
                var baseWidth = (maxdepth - d.target.depth) + 2;
                var wid = baseWidth + "px";
                var reqCS = false;
                var hvCS  = false;

                ( typeof(d.target.required) != "undefined" && d.target.required == "true") ? reqCS = true: reqCS = false;
                ( typeof(d.source.required) != "undefined" && d.source.required == "true") ? reqCS = true: reqCS = false;
                ( typeof(d.target.value) != "undefined" && d.target.value != "") ? hvCS = true: hvCS = false;

                if ( typeof(d.target.children) != "undefined" && d.target.children.length > 0 ) {
                    d.target.children.forEach(function(child) {

                        ( typeof(child.required) != "undefined" && child.required == "true") ? reqCS = true: reqCS = reqCS;
                        if ( typeof(child.value) != "undefined" && child.value != "")  {
                            hvCS = true;
                            d.source.childvalue = 1;
                        }
                    }); 
                }

                if ( reqCS && hvCS ) { wid = (baseWidth + 3) + "px" }
                else if ( reqCS && !hvCS ) { wid = (baseWidth + 5) + "px" }
                else if ( !reqCS && hvCS ) { wid = (baseWidth + 2) + "px" }

                return wid;
            })
            .style("stroke", function(d) {
                 return linkStroke(d)
            });


        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                
                if ( d.target.id < ta_id ) {
                    var ta_off = (ta_lines-1) *15;
                    d.target.x = d.target.x + ta_off;
                    console.log('link enter ' + d.target.name + ' ' + d.target.id + ' ' + d.target.x + ' ' + d.target.y + ' '  + ' ' + ta_id + ' ' + ta_lines + ' ' + ta_off);
                }
                
                return diagonal({
                    source: o,
                    target: o
                });
            })
           .remove();

        // Stash the old positions for transition.
        
        nodes.forEach(function(d) {
            
            d.x0 = d.x;          
            d.y0 = d.y;
            console.log('state ' + d.name + ' ' + d.x0 + ' ' + d.y + ' ' + d.viewstate);
        });

       jData = json_xporter();
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = 0; //viewerHeight;
    root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(root);
    //centerNode(root);
}

