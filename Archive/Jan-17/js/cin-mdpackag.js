// Server json translator library 
// D3 needs an api source to pull in json, so Node makes the request and translates the package
// G. Hudman April 8, 2016

exports.any = (function(d3json, mdjson) { 
	var kp;
	var newJson = transverse(d3json,kp,mdjson);
	return newJson;
});

exports.altmap = (function(d3json, mdjson) { 
	var kp;
	var newJson = altransverse(d3json,kp,mdjson);
	return newJson;
});

/*
exports.cinRecord = (function(url, MongoClient, rid) {
		MongoClient.connect(url, function(err, db) { 
        // Get the source collection

			if (err) {
				console.log('Unable to connect to the mongoDB server. Error:', err);
			} else {
				console.log('Connection established to', url);
				var colRec = db.collection('records');

				colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
					   console.log('Found:', JSON.stringify(result));	
					   if (err) {
							console.log(err);
				  		} else if (result.length) {
				  			var rootrec = {};
				  			rootrec.name = 'root';
				  			if ( Array.isArray(result) ) {
				  				rootrec.collection = result[0];
				  			} else {
				  				rootrec.collection = result;
				  			}
							return(rootrec); 
				  		}
				});			
			}

		console.log('Done');
		db.close()
	});

});
*/


exports.xmlToJson = (function(obj) { 
	var rj = _xmlToJson(obj);
	return rj;
});


var found = "";

function xform(d3json, mdjson) {
    var kp;
	var newJson = transverse(d3json,kp,mdjson);
	return newJson;
}

function transverseX(d3,kp,md) {
	return d3;
}

// Traverse modification - allows the reference (ref) lookup to optionally be an array

function transverse(d3,kp,md) {

    //console.log('1-cin xform: ' + d3.name  ); 

	kp = kp || [];
	for (var i in d3) {
		console.log('2 start ' + i );
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
			// Parent with children
			//console.log('3 transverse object ' + d3[i].name + ' ' + i);

			if ( d3[i].ref !== "undefined" ) {
				var mdlookup = d3[i].ref;
				//console.log('4 transverse reference ' + mdlookup + ' ' + i);
				if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
					//console.log('4.5 is defined ' + mdlookup + ' ' + i);
					if ( Array.isArray(mdlookup) ) {
						for (var j = 0; j < mdlookup.length; j++) {
							var locLookup = mdlookup[j]; 
							if ( typeof(locLookup) !== "undefined" && locLookup !== null ) {
			                    var jT;
								var refval = jsonLookup(md, jT,locLookup);
								//console.log(' 5 obj lookup ref array' + locLookup + ': ' + refval);
								if ( typeof(refval) !== "undefined" && refval !== null ) {
									d3[i].value = refval;
									console.log('6 obj lookup ref array here ' + locLookup + ': ' + refval);
									if ( refval.length > 1 ) { break }
								}
								found="";
							}	
						}
					} else {
						
		                    var jT;
		                    //console.log('6.5 not array b4 lookup ' + mdlookup);
							var refval = jsonLookup(md, jT,mdlookup);

							//console.log('7 obj lookup ' + mdlookup + ': ' + refval);
							if ( typeof(refval) !== "undefined" && refval !== null ) {
								d3[i].value = refval;
							}
							found="";
			
					}
				}	
			}
			d3[i] = transverse(d3[i],kp.concat(i),md);
		} else {
			// Endpoint
			 console.log('8 traverse end ' + d3[i].name);
			if ( d3[i] &&  typeof(d3[i]) !== "undefined" ) { 
				if ( typeof(d3[i]).ref !== "undefined" ) { 
					var mdendlook = d3[i].ref;
					if ( typeof(mdendlook) !== "undefined" && mdendlook !== null ) {
						if ( Array.isArray(mdendlook) ) {
							for (var i = 0; i < mdendlook.length; i++) {
								var locLookup = mdendlook[i]; 
								if ( typeof(locLookup) !== "undefined" && locLookup !== null ) {
									var ejT;
									var endref = jsonLookup(md, ejT,loclookup);
									if ( typeof(endref) !== "undefined"  && endref !== null ) {
										d3[i].value = endref;
									}		
								}
							}
						} else {
							var ejT;
							var endref = jsonLookup(md, ejT,mdendlook);
	                   
							if ( typeof(endref) !== "undefined"  && endref !== null ) {
								d3[i].value = endref;
							}
						}
					}
				}
			}
		}
	}
	return d3;
}


// altraverse allows the build of n-children based on a single child schema structure
// Todo: add reference lookup array handling 6/2


function altransverse(d3,kp,md) {

	kp = kp || [];

   // console.log(' Alt Transverse entry point '); // + JSON.stringify(md));
	for (var i in d3) {
		//console.log(' Alt step ' + d3[i] + ' - ' + i + ' type is ' + typeof(d3[i]) + 'x' );
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
            var iObj = d3[i];
            if ( d3[i].ref !== "undefined" ) {
            	var mdlookup = d3[i].ref;
            	//console.log('object ref ' + mdlookup);
            	if ( typeof(d3[i].datatype) !== "undefined" && d3[i].datatype == "array"  ) {
            		//console.log('an array ');
            		var jASchema = d3[i].children[0];
            		//console.log('child  ' + jASchema);
            		var ajT;
					var mdArray = jsonLookup(md, ajT,mdlookup);
					//console.log(' got array   ' + mdArray);
					if ( typeof(mdArray) !== "undefined" && Array.isArray(mdArray) ) {
						//console.log(' found it - process an array ');
						// build a new array using schema format and source data 
						var dArr = jsonArray(mdArray, jASchema);
						d3[i].children = dArr;
                        //console.log(' returned array ' + JSON.stringify(dArr));

					}
            	} else {
            		if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    	var jT;
						var refval = jsonLookup(md, jT,mdlookup);
						//console.log('obj lookup' + mdlookup + ': ' + refval);
						if ( typeof(refval) !== "undefined" && refval !== null ) {
							d3[i].value = refval;
						}
						found="";
            		}
            	    d3[i] = altransverse(d3[i],kp.concat(i),md);	
            	}
            }
            
		} else {
			console.log(' Alt traverse end point ' + i + ' ' + d3[i]);
			if ( typeof(d3[i].ref) !== "undefined" ) { 
				var mdendlook = d3[i].ref;
				if ( typeof(mdendlook) !== "undefined" && mdendlook !== null ) {
					var ejT;
					var endref = jsonLookup(md, ejT,mdendlook);
                    //console.log('end lookup' + mdendlookup);
					if ( typeof(endref) !== "undefined"  && endref !== null ) {
						d3[i].value = endref;
					}
				}
			}
		}
	}
	return d3;
}

function jsonArray(mdJson, jASchema ) {
	console.log("array builder " + mdJson.length);
    var newArray =[];
	if ( mdJson.length > 0 ) {

        for (var i = 0; i < mdJson.length; i++) {
        	//console.log("ab " + i + ' ' + mdJson[i].name );
        	 var tjs = {};
        	 tjs = JSON.parse(JSON.stringify(jASchema));
             tjs.value = mdJson[i].name;
             tjs.array_index = i;
             //console.log("wtf " + JSON.stringify(tjs));
			 newArray.push(tjs);
		    //newArray[i].value = mdJson[i].name;
		    //newArray[i].array_index = i;
		}
	} else {
		// Build empty array item
	    newArray.push(jASchema);
	    newArray[i].name = "default";
		newArray[i].array_index = 0;
	}

	return newArray;
}

// Recursive lookup and return the value from the source 
// based on the reference value

function jsonLookup(jsonObj, trail, keylookup) {

	trail = trail || [];
	for (var key in jsonObj) {
	    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {

	        if ( key == keylookup ) {
	
	        	 found = jsonObj[key];
				 return found;
			} else {
				
           		jsonLookup(jsonObj[key], trail.concat(key), keylookup );
           	}
           
        } else { 
			var fullkey = trail.join(".") + "." + key;
			if ( keylookup == fullkey ) {
			        found = jsonObj[key];
					return found;
			}
		}
		//}
    }    
	return found;
}


// Changes XML to JSON
function _xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};