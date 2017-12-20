/* D3-content-menu provides edit handling in the right click pop up for various data types
   and saves them back to the d3 tree structure 
   G. Hudman April 8, 2016
*/
var rexedit,
    dJson = {},
    trail,
    found,
    CM = [],
    CMloaded = false,
    taPick = false,
    gll;

// Load a Data Dictionary for select lists

var dictJson = d3.json("jsonSchemas/jsonDictionary.json", function(error, json) {
    if (error) {
        console.log(" error" + error);
        return; }
    dJson = json;
});


var ejoBuilder = function(ejo, newVal, action) {
    // Builds the cinergi edited data object to return

    if ( ejo ) {

        var amINew = true;
        var EdA = gCin_edit.changes;
        for(var i = 0; i < EdA.length; i++) {
          var edObj = EdA[i];
          if ( ejo.ref == edObj.jsonPath) {
            edObj.jsonPath = ejo.ref;
            edObj.oldValue = ejo.oldValue;
            edObj.newValue = ejo.value;
            edObj.type = action;
            edObj.name = ejo.name;
            amINew = false;
          }
        }

        if ( amINew ) {
            var ej = {};
            ej.type = action;
            ej.jsonPath = ejo.ref;
            ej.oldValue = ejo.value;
            ej.newValue = newVal;
            ej.name = ejo.name;
            if ( action == 'add' ) {}
            if ( action == 'change') {}
            if ( action == 'delete') {}
            gCin_edit.changes.push(ej);
        }
        listEditStack();
    }

} 


function menuLookup(jsonObj, trail, keylookup) {
    trail = trail || [];
    for (var key in jsonObj) {
        if (key == keylookup ) {
            return jsonObj[key];
        }
        if (jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
            menuLookup(jsonObj[key], trail.concat(key), keylookup );
        } else {
            var fullkey = trail.join(".") + "." + key;
            if ( keylookup == fullkey ) {
                found = jsonObj[key];
                return found;
            }
        }
    }
    return found;
}

    function clearChildren(dn) {
    // If data has dependent children and value changes clear children
        if (typeof(dn.dictChildren) !== "undefined" && typeof(dn.dictChildren) == "object" ) {
            var cO = dn.dictChildren,
            didChild = false;
            cO.forEach(function(d) {   
               
                 var cName = d.name;
                 var chTxt = d3.selectAll("g.node")
                    .filter(function(d) { return d.name === cName }).datum();
                chTxt.value = "";
                didChild = true;
            });
        } 
    }

// Whn an object is cloned, if the object Id's are not unique they do not show up.
// switch to cloneDid !

var updateDid = function(did,clr) {

    if ( typeof(did) !== "undefined" && (did.id) ) { 
      
        did.id = ++maxId;
        //++maxId;
       
        if ( !clr && (did.value) ) {
            did.value = "";
        }
        if ( !did.x ) { did.x = 500; }
        if (did.xoffset) { did.xoffset = did.xoffset + 5; }
    }
    
    if (typeof(did) !== "undefined" && (did.children) ) {
        for (var i = 0; i < did.children.length; i++) {
            var dc = did.children[i];
  
            updateDid(dc,clr);
        }

    }
    
    if (typeof(did) !== "undefined" && (did._children) ) {
        for (var i = 0; i < did._children.length; i++) {
            var dc = did._children[i];
   
            updateDid(dc,clr);
        }

    }
    return true;
}

// build a new clone from scratch overcommes d3 inherent reference problems

var cloneDid = function(did, sibs, clr, newParent) {

    var newClone = {};
    for (var elem in did) {
        var xoffsize = 5*sibs + 20;
 
        if ( elem == "id" ){
            newClone.id = ++maxId;
        } else if (elem == "parent" && newParent) {
            newClone.parent = newParent;

        } else if ( elem == "children" && typeof(did.children) != "undefined" && did.children != null )  { 
            xoffsize = did.children.length;
             newClone.children = [];
            
             for (var i = 0; i < did.children.length; i++) {
                var dc = did.children[i];
                var tClone = cloneDid(dc,did.children.length, clr,newClone);
                newClone.children.push(tClone);
            } 

        } else if (elem == "_children" && typeof(did._children) != "undefined"  && did._children != null ) {
            xoffsize = did._children.length;
            newClone._children = [];
            for (var i = 0; i < did._children.length; i++) {
                var dc = did._children[i];
                var tClone = cloneDid(dc,did._children.length,clr,newClone);
                newClone._children.push(tClone);
            }
        } else if ( elem == "xoffset" )  {
            if ( !newParent ) {
                newClone.xoffset = did[elem] + xoffsize;
            } else {
                newClone.xoffset =  newParent.xoffset + xoffsize;;
            }
        } else {
            if (clr && elem == "value") {
                newClone[elem] = "";
            } else {
                newClone[elem] = did[elem];
            }
        }
    }
    ejoBuilder(newClone,newClone.value,"add");
    return newClone;
}

// Lookup an item from json source - its all arrays

var getArrayItem = function (arrayItems, key, id) {

    if ( typeof(arrayItems.children) !== "undefined") {
        for (var i = 0; i < arrayItems.children.length; i++) {

            if (key=="id" && arrayItems.children[i].id == id) {
                return arrayItems.children[i];
            } else if (key=="name" && arrayItems.children[i].name == id) {
                return arrayItems.children[i];
            }
            var found = getArrayItem(arrayItems.children[i], key, id);
            if (found) return found;

        }
        
    }
};

var hasEdits = function(compVal1, compVal2 ) {

    if ( ( typeof(compVal1) == "undefined") && ( typeof(compVal1) == "undefined") ) {

    }
}

// Cut an item from the tree

var deleteItem = function (arrayItems, id) {
    if ( typeof(arrayItems.children) !== "undefined") {
        for (var i = 0; i < arrayItems.children.length; i++) {
            if (arrayItems.children[i].id == id) {
                arrayItems.children.splice(i,1);
                return true;
            }
            found = deleteItem(arrayItems.children[i], id);
            if (found) return found;
        }
    }
    return false;
};

function toggleChildren(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    return d;
}

function createUUID() {
    // From http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

d3.contextMenu = function (d, menuSel, openCallback) {
    
    // create the div element that will hold the context menu

    if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
     
        d3.selectAll('.d3-read-only').data([1])
            .enter()
            .append('div')
            .text('read only')
            .attr('class', 'd3-readonly');
        d3.select('.d3-context-menu').style('display', 'none');
     } else {

        d3.selectAll('.d3-context-menu').data([1])
            .enter()
            .append('div')
            .attr('class', 'd3-context-menu');

        var yoffset = 0;
     
    	d3.select('.d3-context-menu')
    			.style('left', d3.event.pageX + 'px')
    			.style('top', d3.event.pageY + 'px')
    			.style('display', 'block');
    }

    // this gets executed when a contextmenu event occurs
	
	var rtnFn = function(data, index, openCallback) {  
        var elm = this;
        var showMenu = true;

        if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
            d3.select('.d3-context-menu').style('display', 'none');
           
        } else {

            d3.selectAll('.d3-context-menu').html('');
            var list = d3.selectAll('.d3-context-menu').append('ul');
            if (typeof(data.datatype) !== "undefined" && data.datatype == "array") {
                menuSel = arrayMenu;   
                var aList = getArrayItem(tData, "id", data.id);
                list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        if ( d.title == 'Array Menu' ) {
                            var selArrStr = d.title + '</br><select>';
                            // change from data.children so that it comes from the schema
                            if ( aList.children ) {
                                aList.children.forEach(function(d) {     
                                    var ns = "";
                                    (typeof(d.value) !=="undefined") ? ns = " [" + d.value + "]":ns = "";
                                    selArrStr = selArrStr + '<option value="'+ d.name + ns + '" >' + d.name + ns + "</option>";    
                                });
                            }
                        }
                        selArrStr = selArrStr + '</select>';
                        return ( d.title == 'Array Menu' ) ? selArrStr : d.title;
                    })
                    .on('click', function (d, i, openCallback) {
                        if ( i == 0 ) {
                            var e = this.parentNode.childNodes[0].childNodes[2];
                           
                    
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Array ";
                        } else {
                            if ( i != 2) { 
                                if ( isNaN(rexedit) ) { 
                                    var e = this.parentNode.childNodes[0].childNodes[2];
                                    (e.selectedIndex > -1 ) ? rexedit = e.options[e.selectedIndex].value: rexedit = e.options[0].value;
                                }
                            }
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
    						update(root);
                        }
                    });

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "dictlist") {
                
                var aList = menuLookup(dJson, trail, data.name);

                menuSel = listMenu;
                list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        var selStr = d.title + '</br><select>';
                        aList.forEach(function(itm) {
                            selStr = selStr + '<option value="'+ itm.value + '" >' + itm.name + '</option>';
                        })
                        var selStr = selStr + '</select>';
                        return ( d.title == 'Select' ) ? selStr : d.title;
                    })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                            var e = this.parentNode.childNodes[0].childNodes[2];
                            console.log(e.selectedIndex);
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Dictionary ";
                        } else {
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
    						update(root);
    						
                        }
                    });

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "bbox") {

                var eb = -150;
                var wb = -90;
                var nb = 45;
                var sb = 5;

                if ( data.children ) {
                data.children.forEach(function(d) {
                    if ( d.value ) {
                        if (d.name == "eastBoundLongitude") { eb = d.value }
                        if (d.name == "westBoundLongitude") { wb = d.value }
                        if (d.name == "northBoundLatitude") { nb = d.value }
                        if (d.name == "southBoundLatitude") { sb = d.value }       
                    }
                });
            }

            if ( data._children ) {
                data._children.forEach(function(d) {
                    if  (d.value ) {
                        if (d.name == "eastBoundLongitude") { eb = d.value }
                        if (d.name == "westBoundLongitude") { wb = d.value }
                        if (d.name == "northBoundLatitude") { nb = d.value }
                        if (d.name == "southBoundLatitude") { sb = d.value }       
                    }
                });
            }

                 menuSel = mapMenu;
                 list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function (d) {
                        var selStr = d.title + '</br><div id="boxmap" class="map"></div>' +
                                        '<div><table><tr><td id="tdnb">N:'+nb+'</td><td id="tdwb">W:'+wb+'</td></tr>' +
                                        '<tr><td id="tdsb">S:'+sb+'</td><td id="tdeb">E:'+eb+'</td><tr></table></div>';

                        return ( d.title == 'Bounding Box' ) ? selStr : d.title;
                    })
                    .call(function(d) { 
                         $('#boxmap').css({'display':'block','width': '300px'});
                        //var initExtent = L.latLngBounds([50.919376, -130.227639], [21.637598, -65.891701]);
                        var initExtent = L.latLngBounds([nb, wb], [sb , eb]);
                        var center = new L.LatLng(sb + (nb - sb)/2 ,eb + (wb - eb)/2);
                         
                          // load a tile layer

                        L.mapbox.accessToken = 'pk.eyJ1IjoiZ2FyeWh1ZG1hbiIsImEiOiJjaW14dnV2ZzAwM2s5dXJrazlka2Q2djhjIn0.NOrl8g_NpUG0TEa6SD-MhQ';
                        var map = L.mapbox.map('boxmap', 'mapbox.streets', 
                                {  infoControl: false,
                                    legendControl: false,
                                    zoomControl: true, 
                                    trackResize: true,
                                    tileSize: 128,  
                                    animate: false })
                                .setView(center, 6)
                                .on('ready',function() { 
                                    setTimeout(function(){ 
                                        map.invalidateSize();
                                        map.fitBounds(initExtent);
                                    }, 200);
                                    console.log('ready map')})
                                .on('resize',function() { console.log('resize map')});                  
                        
                        // create an orange rectangle
                         L.rectangle(initExtent, {color: "#ff7800", weight: 1}).addTo(map);
                         var drawnItems = L.featureGroup().addTo(map);
                         map.addLayer(drawnItems);

                         var drawControl = new L.Control.Draw({
                                edit: {
                                    featureGroup: drawnItems
                                },
                                draw: {
                                    polygon: false,
                                    polyline: false,
                                    rectangle: true,
                                    circle: false,
                                    marker: false
                                  }
                            });
                        map.addControl(drawControl);
                        map.on('draw:created', showRectArea);
                        map.on('draw:edited', showRectEdited);

                        function showRectEdited(e) {
                          e.layers.eachLayer(function(layer) {
                            showRectArea({ layer: layer });
                          });
                        }
                        function showRectArea(e) {
                          drawnItems.clearLayers();
                          drawnItems.addLayer(e.layer);
                           gll = e.layer.getLatLngs();
                          $('#tdnb')[0].innerHTML = "N:"+ gll[1].lat;
                          $('#tdwb')[0].innerHTML = "W:"+ gll[0].lng;
                          $('#tdeb')[0].innerHTML = "E:"+ gll[2].lng;
                          $('#tdsb')[0].innerHTML = "S:"+ gll[0].lat;

                        }

                    })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                            return d.title + " Bounding box ";
                        } else {
                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
    						update(root);
                        }
                    })
                    .style('width','300px');
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "object") {
                // object - only allows specify set of children, if they already exist, cant add another
                menuSel = objMenu;
                
                var aList = getArrayItem(jsonSrc, "name", data.name);
                
                list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function(d) {
                        if ( d.title == 'Add Item' ) {
                            var selArrStr = d.title + '</br><select>';
                            // change from data.children so that it comes from the schema
                            
                            if ( typeof(aList.children) !== "undefined" ) {
                                
                                aList.children.forEach(function(d) {   
                                              
                                    if (data.children && data.children.length > 1) {
                                        var isTaken = false;
                                        for (var i=0; i < data.children.length; i++) {
                                            if ( d.name == data.children[i].name ) {isTaken = true }
                                        }
                                        if (!isTaken) {
                                            var ns = "";
                                            (typeof(d.value) !=="undefined") ? ns = " [" + d.value + "]":ns = " ";
                                            selArrStr = selArrStr + '<option value="'+ d.name + '" >' + d.name + ns + "</option>"; 
                                        }
                                    }
                                    
                                });                    
                            }
                            selArrStr = selArrStr + '</select>';  
                        }
                        return ( d.title == 'Add Item' ) ? selArrStr : d.title;
                     })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                             var e = this.parentNode.childNodes[0].childNodes[2];
        
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Object ";
                        } else {
                            if ( i == 1) { 
                                if ( isNaN(rexedit) ) { 
                                    var e = this.parentNode.childNodes[0].childNodes[2];
                                    (e.selectedIndex > -1 ) ? rexedit = e.options[e.selectedIndex].value: rexedit = e.options[0].value;
                                }
                            }

                            d.action(elm, data, index);
                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                        }
                    });
            
            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "guid") {
                var guidVal = data.value;

                d3.select('.d3-context-menu').style('display', 'none');
                if ( guidVal.length > 16 ) {
                    alert("The Metadata Identifer cannot be edited");
                } else {
                    data.value = createUUID();
                    update(root);
                }
                
                showMenu=false;

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "typeahead") {

                menuSel = menu;
                list.selectAll('li').data(menuSel).enter()
                .append('li')
                .html(function (d) {

                    if(!CMloaded) {
                        var editStr = d.title + ' <b>' + data.name + '</b></br><div class="typeahead container"><div class="typeahead-wrapper">' +
                            '<input class="typeahead-text" name="contentModel" type="text" placeholder="Content Models" value="' + data.value + '">' + 
                            '</div></div>';

                        CMloaded = true;
                        }
                        return ( d.title == 'Edit' ) ? editStr : d.title;
                    })
                 .on('click', function (d, i, openCallback) {
                            // text and date type objects
                        if (i == 0) {

                        } else {
                            CMloaded = false;
            

                            if ( data.value != rexedit ) {
                                clearChildren(data);
                            }

                            d.action(elm, data, index);
                             if (i > 0) {   
                                d3.select('.d3-context-menu').style('display', 'none');
                                update(root);
                            }
                        }
                    }).on('change', function (d,i,openCallback) {
                            if (!taPick) {
                               var manE = $('.typeahead-text')[1];    
                               rexedit = manE.innerHTML;
                               d.action(elm, data, index);
                                if (i > 0) {   
                                    d3.select('.d3-context-menu').style('display', 'none');
                                    update(root);
                                }
                            }

                    });
                  

            } else {
                // these are text and dates
                menuSel = menu;
                if (typeof(data.readonly) !== "undefined" && data.readonly == "true") {
                    console.log(data.name + "  read only");
                } else {

                    list.selectAll('li').data(menuSel).enter()
                        .append('li')
                        .html(function (d) {
                            var valen;
                            if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                var xdate = new Date(data.value);
            
                                var editStr = d.title + ' <b>' + data.name + '</b></br><div  id="jdpid" class="cm-datepicker" ><p id="ipg">' + data.value + '</p></div>';

                                return ( d.title == 'Edit' ) ? editStr : d.title;
                            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                (typeof(data.value) !== "undefined") ? valen = 1 + Math.round(data.value.length / 80 ) : valen = 4;
                                
                                var editStr = d.title + ' <b>' + data.name + '</b></br><textarea class="d3txtArea" rows="' + valen + '" cols="80">'
                                    + data.value + '</textarea>';
                                return ( d.title == 'Edit' ) ? editStr : d.title;

                            } else {
                                (typeof(data.value) !== "undefined") ? valen = data.value.length : valen = 10;
                                if (valen < 15) {
                                    valen = 15;
                                }
                                var editStr = d.title + ' <b>' + data.name + '</b></br> <input class="d3str" type="text" '
                                    + 'size="' + valen + '" value="' + data.value + '"></input>';
                                return ( d.title == 'Edit' ) ? editStr : d.title;
                            }
                        })
                        .on('click', function (d, i, openCallback) {
                                // text and date type objects
                            if (i == 0) {
                                if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                   
                                    var dp = Date.parse(data.value);
                                    if (isNaN(Date.parse(data.value))) {
                                        var td = new Date();
                                        var xdate = td.getDate();
                                    } else {
                                        var xdate = new Date(data.value);
                                    }

                                
                                    $("#jdpid").datepicker({
                                        dateFormat: 'mm/dd/yy',
                                        changeYear: true,
                                        changeMonth: true,
                                        inline: true,
                                        onSelect: function (date) {
                                           // console.log(date);
                                            rexedit = date;
                                            //console.log(' inner p ' + $("#ipg").html());
                                            $("#ipg").html(date);
                                        }
                                    });
                                    $("#jdpid").datepicker("setDate", xdate);
                                    $("#jdpid").datepicker("show");
                                  
                                } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                    rexedit = this.parentNode.childNodes[0].childNodes[3].value;
                                } else {
                                    rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                                   
                                }
                            }
                            else {
                                if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                 
                                } else if (typeof(data.datatype) !== "undefined" && data.datatype == "textarea") {
                                    rexedit = this.parentNode.childNodes[0].childNodes[3].value;
                                }
                                else {
                                    rexedit = this.parentNode.childNodes[0].childNodes[4].value;
                                }

                                d.action(elm, data, index);
                               
                        


                                if (i > 0) {
        							
                                    d3.select('.d3-context-menu').style('display', 'none');
        							update(root);
                                }
                            }
                        });
                }
            // >>> end else
            }
        }
       var cleft = (d3.event.pageX - 2);
       var ctop = (d3.event.pageY - 2);

       if ( typeof(data.datatype) !== "undefined" && data.datatype =="bbox") {
                cleft = cleft - 150;
                ctop = ctop - 300;
       } else if ( typeof(data.datatype) !== "undefined" && data.datatype =="textarea") {
                cleft = cleft - 400;
                ctop = ctop - 150;
       } else {
            cleft = cleft - 50;
            ctop = ctop - 50;
       }

       // event handler after render for type aheads
       if ( typeof(data.datatype) !== "undefined" && data.datatype =="typeahead") {

            var params = data.dictparams;
            
            if ( params.query.length > 0 ) {
                //params.ref =  d3.select(.selectAll("g.node")params.query).value;
                var tex = d3.selectAll("g.node")
                          .filter(function(d) { return d.name === params.query }).datum(); //(params.query);
                params.ref = tex.value;

            }

            var paramStr = '?rsrc='+ params.field + '&qfld=' + params.query + '&qval=' + params.ref;
            var listurl = data.dicturl + paramStr;
                        
            var cmObj = typeaheadRef(listurl,params, function(taData) {
                // when the data shows up build the event handlers
                taPick = false;
                var contMod = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: taData
              });
              
              contMod.initialize();
              $('.typeahead-text').typeahead({
                highlight: true,
                limit: 20
              },
              {
                source: contMod,
                limit: 20
              }).on('typeahead:selected', function (obj, datum) {
                    
                    taPick = true;
                    rexedit = datum;
                  
               });                
            });

            var CM = [];
            
          }

        // display context menu
        if ( showMenu ) {
            d3.select('.d3-context-menu')
                .style('left', cleft + 'px')
                .style('top', ctop + 'px')
                .style('display', 'block');
            
        }
        d3.event.preventDefault();
    };
	
	return rtnFn(d);
	
};

var mapMenu = [{ title: 'Bounding Box',
      action: function(elm, d, i) {
        console.log('Bounding box clicked!');
       
      }
    },
    {title: 'Save',
      action: function(elm, d, i) {
        console.log('Save ');

        if ( d.children ) {
            d.children.forEach(function(d) {
                if (d.name == "eastBoundLongitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[2].lng, 'update');
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[0].lng, 'update');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value != gll[1].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[1].lng , 'update');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[2].lng, 'update');
                    d.value = gll[0].lat; } 
            });
        }

         if ( d._children ) {
            d._children.forEach(function(d) {
                if (d.name == "eastBoundLongitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[2].lng, 'update');
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[0].lng, 'update');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value != gll[1].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[1].lng , 'update');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                     ejoBuilder(d,gll[2].lng, 'update');
                    d.value = gll[0].lat; } 
            });
        }

      
      }
    },
    {title: 'Cancel',
      action: function(elm, d, i) {
       
        console.log('Cancel ');
        
      } 
    }]


var arrayMenu = [{ title: 'Array Menu',
      action: function(elm, d, i) {
        console.log('Array - ' + i);     
      }
    },{title: 'Copy',
      action: function(elm, d, i) {
       
        var aList = d;

        if (aList.children) {
             var children = aList.children;
             var isDone = false;
              var siblings = children.length;
             children.forEach(function(child, index) {
                if ( child.value ) {
                    var lkey = child.name + " [" + child.value + "]";
                } else {
                    lkey = child.name;
                }
                if (lkey == rexedit && !isDone) {
                    var copyChild = cloneDid(child, siblings, false);
                    var zeb = getArrayItem(root,"id", d.id);
                    zeb.children.push(copyChild);
                    isDone = true;
                }
             });
        }
      } 
    },
    {title: 'Delete',
      action: function(elm, d, i) {
        var isDeleted = deleteItem(root,d.id);
      } 
    },
    {title: 'New',
      action: function(elm, d, i) {
        if (d.children) {
             var children = d.children;
             var isDone = false;
              var siblings = children.length;
             children.forEach(function(child, index) {
                    if ( child.value ) {
                        var lkey = child.name + " [" + child.value + "]";
                    } else {
                        lkey = child.name;
                    }
                    if (lkey == rexedit && !isDone) {
                
                        var copyChild = cloneDid(child, siblings, true);  
                        var zeb = getArrayItem(root,"id", d.id);
                        zeb.children.push(copyChild);
                        isDone = true;
                    }

             });
        }
      } 
    },{title: 'Cancel',
       action: function(elm, d, i) {
        console.log('Cancel ');
      } 
    }]

var objMenu = [{ title: 'Add Item',
        action: function(elm, d, i) {
            console.log('Object select clicked!');
        }
    },{
        title: 'Add',
        action: function (elm, d, i) {
            var aList = getArrayItem(jsonSrc, "name", d.name);
            if (aList.children) {
                 var children = aList.children;
                 var isDone = false;
                 var siblings = children.length;

                 children.forEach(function(child, index) {
                        if (child.name == rexedit && !isDone) {
                            var copyChild = cloneDid(child, siblings, true);  
                            var zeb = getArrayItem(root,"id", d.id);
                            zeb.children.push(copyChild);
                            isDone = true;
                            console.log('Added Child ');
                        }
                 });
            }   
        }
    }, 
    {
      title: 'Delete',
      action: function(elm, d, i) {
        var isDeleted = deleteItem(root,d.id);
        console.log("Deleted " + isDeleted);
      }
    }, 
    {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');      
        }
}]


var listMenu = [{ title: 'Select',
    action: function(elm, d, i) {
        console.log('menu 1 clicked!');
        console.log('The data for this circle is: ' + d);
        }
    }, {
        title: 'Save',
        action: function (elm, d, i) {
            if ( d.value != rexedit ) { dataEdits = true; }
             ejoBuilder(d,rexedit, 'update');
            d.value = rexedit;

        }
    }, {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');
            
        }
}]

var menu = [{
      title: 'Edit',
      action: function(elm, d, i) {
        console.log('Item #1 clicked!');
        console.log('The data for this circle is: ' + d);
      }
    },  {
      title: 'Save',
      action: function(elm, d, i) {
        if ( d.value != rexedit ) { dataEdits = true; }
        ejoBuilder(d,rexedit, 'update');
        d.value = rexedit;
        //var tid = d.id;
        console.log('The data for this circle is: ' + d);
      }
    },  {
      title: 'Cancel',
      action: function(elm, d, i) {
        console.log('Item Cancel ');
    
      }
    }, 
    {
      title: 'Delete ',
      action: function(elm, d, i) {
        var isDeleted = deleteItem(root,d.id);
        console.log("Deleted " + isDeleted);

      }
    }

    ]

    var data = [1, 2, 3];
