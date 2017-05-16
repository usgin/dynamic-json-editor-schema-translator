/* D3-content-menu provides edit handling in the right click pop up for various data types
   and saves them back to the d3 tree structure 
   G. Hudman April 8, 2016
*/

var rexedit,
    dJson = {},
    trail,
    found,
    CM = [],
    tmpIdx,
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
       // listEditStack();
    }

} 

var cin_editObjBld = function(ejo, newVal, action,sibs) {
    // Modified 3/21 new diff object matches USGIN lineage
    
    if ( ejo ) {

        var amINew = true;
        var EdA = gCinEditSession.item.metadataUpdates;
        if ( !EdA ) {
            var initMU = { "UpdateSequenceNo" : 0 }
         
            console.log(' init MU ');
        }
        
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
            gCinEditIdx++;
            var ej = { "UpdateSequenceNo" : gCinEditIdx };
            ej.type = action;
   
            ej.oldValue = ejo.value;
            ej.newValue = newVal;
            ej.name = ejo.name;
            if ( ejo.RefSaveTo ) {
                var refer = ejo.RefSaveTo;
            } else { 
                if ( Array.isArray(ejo.ref) ) {        
                    refer = ejo.ref[0];
                } else {
                    refer = ejo.ref;  
                }
            }
     
            if ( action == 'add' ) {
                if ( Array.isArray(ejo.ref) ) {
                    for (z=0; z < ejo.ref.length; z++) {
                        if ( refer.indexOf(ejo.ref[z]) > 0) {
                            var subP = refer.indexOf(ejo.ref[z]);
                        }
                    }
                } else {
                    var subP = refer.indexOf(ejo.ref);
                }

              
                ej.insertPath = refer;
                ej.newValue = newVal;
            }
            if ( action == 'update') {
              
               
                ej.updatePath = refer;
                ej.newValue = newVal;   
                ej.originalValue = ejo.oldValue;
            }
            if ( action == 'delete') {
                ej.deletePath = refer;
                ej.originalValue = ejo.oldValue;
            }
            gCinEditSession.item.metadataUpdates.push(ej);
        }
        listEditStack();
    }

} 

function new_srcObject (obj, access, subPath,sibs ) {
    // cleave to the index then build down to the end then add the value
    // OriginalDoc.gmd:MD_Metadata.gmd:contact.7.gmd:CI_ResponsibleParty.gmd:organisationName.gco:CharacterString._$
    // Add new object only -

    var wc = jQuery.extend(true, {}, obj );

    if ( subPath > 3) {
        var maskPath = access.substring(0,subPath);

    } else {
        maskPath = access;
    }

    if ( maskPath.slice(-1) == '.' ) 
    { maskPath = maskPath.slice(0,-1);
    }

    maskPath = maskPath.split('.');
    var mlp = maskPath.length;

    for (z=0; z < mlp-1; z++) {
        // get the llast non-empty element
        if ( maskPath[1] != "" ) {
            var obj = obj[maskPath.shift()]; 
                
        }
    }

    // shallow copy of child to clone
    var curKey = maskPath[0];
    var cloneObj = jQuery.extend({}, obj[maskPath.shift()]);   // jQuery.extend(true, {}, obj[maskPath.shift()] );
    

    if ( Array.isArray(obj) ) {
         obj.push(cloneObj);     
    } else {
        obj[curKey] = cloneObj;
    }
   
}

function newSrc_copy(obj,access, copyKey ) {

    if (typeof(access)=='string'){
        access = access.split('.');
    }

    var mlp = access.length;
    var writ = false;
    var cp = access[0];

    for (z=0; z < mlp; z++) {
        var cpo = access[z];

        if ( obj[cpo] ) {
            obj = obj[cpo];     
        } else {

            // Not found add it
            if ( cpo == copyKey ) {
                // at the proper end
                var cloneObj = jQuery.extend({}, obj[copyKey]);
                if ( Array.isArray(obj) ) {             
                     obj.push(cloneObj);
                     obj = obj[obj.length-1];   
                } else {
                    obj[copyKey] = cloneObj;
                    obj = obj[copyKey];
                }
            } else {
                // somewhere in the middle
                var cloneObj = {};
                if ( Array.isArray(obj) ) {
                     obj.push(cloneObj);
                     obj = obj[obj.length-1];   
                } else {
                    obj[cpo] = cloneObj;
                    obj = obj[cpo];
                }

            }
        }
        cp = access[z];     
    }

    if ( !writ ) {

    }

}

// works for Arrays only 
// call from menus

function newSrc3 (dob, copyKey, action) {

    var lob = gCKAN_package;

     if ( dob.RefSaveTo ) {
        var mPath = dob.RefSaveTo;
    } else if ( (Array.isArray( dob.ref) ) ) {
        mPath = dob.ref[0];
    } else {
        mPath = dob.ref;
    }

    mPath = mPath.split('.');
    var mPlen = mPath.length;
    var lzPath = mPath.slice(0);

    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
        if (lob.hasOwnProperty(top) ) {

            if ( z == (mPlen - 1)  ) {
              
                lob = lob[top];

                if ( lob[copyKey] ) {
                   
                    var lObj = jQuery.extend({}, lob[copyKey]);
                    
                    var cloneObj = clone(lObj);

                    if ( Array.isArray(lob) ) {             
                        lob.push(cloneObj);
                      

                    } else {
                        lob[copyKey+'cc'] = cloneObj;
                     
                    }
                 } else if ( copyKey == '0' ) {
                    //it mite be lazy !
                    
                    var lObj = jQuery.extend({}, lob );
                    var cloneObj = clone(lObj);
                    var clone2 = clone(lObj);

                    var tc = [];
                    tc.push(cloneObj);
                    tc.push(clone2);
                    
                    var gC = gCKAN_package;

                    for (lx=0; lx < mPlen; lx++) {
                        var t = lzPath.shift();
                         if ( lx == (mPlen - 1)  ) { 
                            gC[t] = tc;
                        } else {
                            gC = gC[t];
                        }

                   }
                   
                 }          
            } else {
                 lob = lob[top];
            }
        } else if ( top == '0' ) {
            var lazyArray = mPath.shift(); 
        } else {
            // its missing - add it         
            lob[top] = newBob;

        }
    }

    
    if ( action == 'new' ) {
        console.log('new doc needs some cleaning');
    }

}

// this does a true deep clone
function clone(obj) {
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}



// to be called directly from menus
// can be used by any object type
function upSrc2( dob, value ) {

    var lob = gCKAN_package;
    var voStatus = false;
    var vo;

    if ( dob.RefSaveTo ) {
        var mPath = dob.RefSaveTo;
    } else if ( (Array.isArray( dob.ref) ) ) {
        mPath = dob.ref[0];
    } else {
        mPath = dob.ref;
    }

    if ( dob.datatype == 'validateonly') {
        voStatus = true;
        if ( dob.validateonly == 'true' ) {
            vo = true;
        } else {
            vo = false;
        }
    }

    mPath = mPath.split('.');
    var mPlen = mPath.length;
    for (z = 0; z < mPlen; z++) {
        var top = mPath.shift();
        if (lob.hasOwnProperty(top) ) {
            // end point logic
            if ( z == (mPlen - 1)  ) {
                if ( voStatus ) {
                    lob[top].validation = vo;
                } else {
                    lob[top] = value;    
                }
            } else {
                lob = lob[top];
            }
        } else if ( top == '0' ) {
           
            var zip = 'zed';

        } else {
            // This part builds the json if it doesnt exist
            lob[top] = {};
            if ( z == (mPlen - 1)  ) {
                if ( voStatus ) {
                    lob[top].validation = vo;
                } else {
                    lob[top] = value;    
                }
            } else {
                lob = lob[top];
            }
        }
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
            var cO = getArrayItem(jsonSrc, "name", dn.dictChildren.name),
            //var cO = dn.dictChildren,
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

var cloneDid = function(did, sibs, clr, newParent) {

    var newClone = {};
    var xoffsize = 5*sibs + 20;
    for (var elem in did) {
        
        if ( elem == "id" ){
            newClone.id = ++maxId;
        } else if (elem == "parent" && newParent) {
            newClone.parent = newParent;

        } else if ( elem == "children" && typeof(did.children) != "undefined" && did.children != null )  { 
            xoffsize = did.children.length;
             newClone.children = [];
              var nP = did.children.length;
             for (var i = 0; i < did.children.length; i++) {
                var dc = did.children[i];
                var tClone = cloneDid(dc,did.children.length, clr,newClone);
                if ( tClone.RefSaveTo ) {
                    var postPath = tClone.RefSaveTo.replace( did.ref +'.', '');
                    postPath = postPath.split('.');
                    postPath[0] = sibs;
                    tClone.RefSaveTo = did.ref + '.' + postPath.join('.');
                }
                newClone.children.push(tClone);
            } 

        } else if (elem == "_children" && typeof(did._children) != "undefined"  && did._children != null ) {
            xoffsize = did._children.length;
            newClone._children = [];
            for (var i = 0; i < did._children.length; i++) {
                var dc = did._children[i];
                var tClone = cloneDid(dc,did._children.length,clr,newClone);
                if ( tClone.RefSaveTo ) {
                    var postPath = tClone.RefSaveTo.replace( did.ref +'.', '');
                    postPath = postPath.split('.');
                    postPath[0] = sibs;
                    tClone.RefSaveTo = did.ref + '.' + postPath.join('.');
                }
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
    
    return newClone;
}


    // Edit object and original Doc - need the parent created before descending childern for orginal image
    // shallow copy version

    cin_editObjBld(newClone,newClone.value,"add",sibs);

    // Descend the children

    for (var elem in did) {
        
        if ( elem == "children" && typeof(did.children) != "undefined" && did.children != null )  { 
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
        } 
    }

  
   
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

            } else if (typeof(data.datatype) !== "undefined" && data.datatype == "validateonly") {

                   menuSel = validateMenu; 

                    list.selectAll('li').data(menuSel).enter()
                        .append('li')
                        .html(function (d) {
                            var editStr = d.title + ' <b>' + data.value + '</b></br>'; 
                            return ( d.title == 'Cancel' ) ? d.title : editStr;    

                        }).on('click', function (d, i, openCallback) { 

                            if ( i == 0 ) {
                                console.log(' valid ');
                                d.action(elm, data, index);

                            } else if ( i == 1 ) {
                                console.log(' not valid ');
                                d.action(elm, data, index);
                            } else { // cancel
                                d.action(elm, data, index);
                
                            }

                            d3.select('.d3-context-menu').style('display', 'none');
                            update(root);
                            
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

                var eb = -70;
                var wb = -110;
                var nb = 0;
                var sb = 0;

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
               
                    list.selectAll('li').data(menuSel).enter()
                    .append('li')
                    .html(function(d) {
                        
                        return d.title;

                    })
                    .on('click', function (d, i, openCallback) {
                        if (i == 0) {
                            var e = this.parentNode.childNodes[0].childNodes[2];
        
                            rexedit = e.options[e.selectedIndex].value;
                            return d.title + " Object ";
                        } else {
                            

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
                            '<input class="typeahead-text" name="contentModel" type="text" placeholder="Term Typeahead" value="' + data.value + '">' + 
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

                            // if (!taPick) {
                               var manE = $('.typeahead-text')[1];    
                               rexedit = manE.innerHTML;
                               if ( rexedit == "" ) {
                                    rexedit = manE.value;
                               }
                               d.action(elm, data, index);
                                if (i > 0) {   
                                    d3.select('.d3-context-menu').style('display', 'none');
                                    update(root);
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
                                data.value = data.value.replace(/"/g,""); 
                                var editStr = d.title + ' <b>' + data.name + '</b></br> <input class="d3str" type="text" '
                                    + 'size="' + valen + '" value="' + data.value + '"></input>';
                                return ( d.title == 'Edit' ) ? editStr : d.title;
                            }
                        })
                        .on('click', function (d, i, openCallback) {
                                // text and date type objects
                            if (i == 0) {
                                if (typeof(data.datatype) !== "undefined" && data.datatype == "date") {
                                    rexedit = data.value;
                                    var dp = Date.parse(data.value);
                                    if (isNaN(Date.parse(data.value))) {
                                        var td = new Date();
                                        var xdate = td.getDate();
                                    } else {
                                        var xdate = new Date(data.value);
                                    }
                 
                                    $("#jdpid").datepicker({
                                        autoSize: true,
                                        dateFormat: 'mm/dd/yy',
                                        changeYear: true,
                                        changeMonth: true,
                                        inline: true,
                                        onClose: function (date) {
                                            if (date == "") {
                                                rexedit = data.value;
                                            }
                                        },
                                        onChangeMonthYear: function(y,m,o) {
                                            console.log(y + m);
                                            rexedit = y + '-' + m + '-' + o.currentDay;
                                            var nDate = new Date(y + '-' + m + '-' + o.currentDay);
                                           
                                            $("#jdpid").datepicker("setDate", nDate);
                                             $("#ipg").html(y + '-' + m + '-' + o.currentDay);
                                        },
                                        onSelect: function (date) {
                                           if (date) {
                                                rexedit = date;
                                           }
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


            var taCol = new Bloodhound({
              datumTokenizer: function(datum) {
                return Bloodhound.tokenizers.whitespace(datum.value);
              },
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              remote: {
                wildcard: params.query,
          
                url: data.dicturl,
                transform: function(response) {
                  console.log(JSON.stringify(response));
                  // Map the remote source JSON array to a JavaScript object array
                  return $.map(response, function(taObj) {
                    console.log(JSON.stringify(taObj.completion));
                    return {
                      value: taObj.completion
                    };
                  });
                }
              }
            });

            // Instantiate the Typeahead UI
            $('.typeahead-text').typeahead(null, {
              display: 'value',
              source: taCol
            }).on('typeahead:selected', function (obj, datum) {
                    
                    taPick = true;
                    rexedit = datum.value;
                  
               }); 

          
         
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
                  
                    cin_editObjBld(d,gll[2].lng, 'update');
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                    
                     cin_editObjBld(d,gll[0].lng, 'update');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value != gll[1].lng ) { dataEdits = true; }
                    
                     cin_editObjBld(d,gll[1].lng , 'update');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                    
                     cin_editObjBld(d,gll[2].lng, 'update');
                    d.value = gll[0].lat; } 
            });
        }

         if ( d._children ) {
            d._children.forEach(function(d) {
                if (d.name == "eastBoundLongitude") { 
                    if ( d.value != gll[2].lng ) { dataEdits = true; }
                    
                     upSrc2(d, gll[2].lng);
                     cin_editObjBld(d,gll[2].lng, 'update')
                    d.value = gll[2].lng; }
                if (d.name == "westBoundLongitude") { 
                    if ( d.value != gll[0].lng ) { dataEdits = true; }
                    
                      upSrc2(d, gll[0].lng );
                     cin_editObjBld(d,gll[0].lng, 'update');
                    d.value = gll[0].lng; }
                if (d.name == "northBoundLatitude") { 
                    if ( d.value !=  gll[1].lat ) { dataEdits = true; }
                    
                     upSrc2(d,  gll[1].lat );
                     cin_editObjBld(d, gll[1].lat, 'update');
                    d.value = gll[1].lat; }
                if (d.name == "southBoundLatitude") { 
                    if ( d.value != gll[0].lat ) { dataEdits = true; }
                    
                     upSrc2(d, gll[0].lat );
                     cin_editObjBld(d,gll[0].lat, 'update');
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
                    tmpIdx = index;
                    var copyChild = cloneDid(child, siblings, false);
                    newSrc3(copyChild,index,'clone');
                    cin_editObjBld(copyChild,copyChild.value,"add",siblings);
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
                        tmpIdx = index;
                        var copyChild = cloneDid(child, siblings, true); 
                        newSrc3(copyChild,index,'new');
                        cin_editObjBld(copyChild,copyChild.value,"add",siblings);
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

var objMenu = [{ title: 'Edit Menu',
        action: function(elm, d, i) {
            console.log('Object select clicked!');
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
          
            upSrc2(d, rexedit);
            cin_editObjBld(d,rexedit, 'update');
            d.value = rexedit;

        }
    }, {
        title: 'Cancel',
        action: function(elm, d, i) {
            console.log('Cancel ');
            
        }
}]

var validateMenu = [{ title: 'Valid',
    action: function(elm, d, i) {
        console.log('Picked Valid');
         d.validateonly = 'true';
         if ( typeof(d.array_index) != undefined ) {
                d.RefSaveTo = d.ref + '.' + d.array_index;
         }
         upSrc2(d, 'true');
       
        }
    }, {
        title: 'Not Valid',
        action: function (elm, d, i) {
            console.log('Picked INVALID');
            d.validateonly = 'false';
            if ( typeof(d.array_index) != undefined ) {
                d.RefSaveTo = d.ref + '.' + d.array_index;
            }
           
            upSrc2(d, 'false');
           

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
        if ( d.value != rexedit ) { 

            dataEdits = true; 
       
            upSrc2(d, rexedit);
            cin_editObjBld(d,rexedit, 'update');
            d.value = rexedit;
        }
      
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
