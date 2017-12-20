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
	//console.log(' the json object ' + JSON.stringify(mdjson) );
	var newJson = altransverse(d3json,kp,mdjson);
	return newJson;
});


exports.xmlToJson = (function(obj) { 
	var rj = _xmlToJson(obj);
	return rj;
});


var found = "";

// altraverse allows the build of n-children based on a single child schema structure
// Todo: add reference lookup array handling 6/2

function altransverse(d3,kp,md) {

	kp = kp || [];

	if ( d3.name == "root" && d3.titleref !== "undefined" ) {		
		     var ndx = jsonLookup(md, ajT,d3.titleref);
		     //console.log(' >>>>>>>>>>> root ' +  d3.name + ' ' + d3.titleref + ' ' + ndx);
		     d3.titleval = ndx;
	}

   // console.log(' Alt Transverse entry point '); // + JSON.stringify(md));
	for (var i in d3) {

		console.log(' Alt step ' + d3[i] + ' - ' + i + ' type is ' + typeof(d3[i]) );
		
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
            var iObj = d3[i];
            if ( d3[i].ref !== "undefined" ) {
            	var mdlookup = d3[i].ref;
            	// If the reference lookup is an array that handles multiple jsonPaths

            	if ( typeof(mdlookup) !== "undefined" && Array.isArray(mdlookup) ) {
            		for (var k in mdlookup) {
            			var mdarrLookup = jsonLookup(md, ajT,mdlookup[k], false);
            			if (mdarrLookup) {
            				mdlookup= mdlookup[k];
            				break;	
            			}
            			// what to do if nothin found
            		}
            	}
            	// If the D3 schema element is an array
            	if ( typeof(d3[i].datatype) !== "undefined" && d3[i].datatype == "array"  ) {
            		//console.log('an array ');
            		//for (var k in mdlookup) {

            		//}
            		if ( d3[i].children ) {
	            		var jASchema = d3[i].children[0];
	            		console.log('>>>>>>>>>>>>>array start ' + mdlookup) ;
	            	
		            		var ajT;
							var mdArray = jsonArrayLookup(md, ajT,mdlookup);
							console.log(' got array  ' + mdlookup + ' ' + + ' ' + Array.isArray(mdArray) + ' ' + JSON.stringify(mdArray) );
							if ( typeof(mdArray) !== "undefined" && Array.isArray(mdArray) ) {
								console.log(' found it - process an array ');
									if (mdArray.length > 0 ) {
								// build a new array using schema format and source data 
									var dArr = jsonArray(mdArray, jASchema);
									if ( dArr ) {
										console.log(' returned array ' + JSON.stringify(dArr));
										d3[i].children = dArr;
									}
								}
		                        //console.log(' returned array ' + JSON.stringify(dArr));
							} else {
								// sometimes if its a single value then it can show up as just a regular json object
								// this is an "arrayable" object ---
								// convert from object to array 2/3
								console.log(' I am suppused to be an array but I am an object >>' + mdlookup);
								var mdObj = jsonLookup(md,ajT,mdlookup, false);
								console.log(' obj ' + JSON.stringify(mdObj) );
								if ( mdObj ) {
									var mdA = [];
									mdA.push(mdObj);
									console.log('b4 jArray' + mdA.length);
									var schemArray = jsonArray(mdA,jASchema);
									console.log(' CONVERTED OBJ TO ARRAY ' + JSON.stringify(schemArray));
									d3[i].children = schemArray;
								}
							}
						
					}
            	} else {
            		if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    	var jT;
						var refval = jsonLookup(md, jT,mdlookup);
						//console.log('obj lookup' + mdlookup + ': ' + refval);
						if ( typeof(refval) !== "undefined" && refval !== null ) {
							// Dont stuff the object into a string, mite want to process
							if ( typeof(refval) !== "object" ) {
								d3[i].value = refval;	
							} 
							
						}
						found="";
            		}
            	    d3[i] = altransverse(d3[i],kp.concat(i),md);	
            	}
            }
            
		} else {
			

			if ( typeof(d3[i].ref) !== "undefined" ) { 
				var mdendlook = d3[i].ref;
				//console.log(' Alt traverse end point path ' + mdendlook);
				if ( typeof(mdendlook) !== "undefined" && Array.isArray(mdendlook) ) {
            		for (var k in mdendlook) {
            			var mdarrLookup = jsonLookup(md, ajT,mdendlook[k], false);
            			if (mdarrLookup) {
            				mdendlook= mdendlook[k];
            				break;	
            			}
            			// what to do if nothin found
            		}
            	}

				if ( typeof(mdendlook) !== "undefined" && mdendlook !== null ) {
					var ejT;
					//console.log(' b4 - end lookup' + mdendlook);
					var endref = jsonLookup(md, ejT,mdendlook, false);
                   
					if ( typeof(endref) !== "undefined" && endref !== null ) {
							d3[i].value = endref;
					
					}
				}
			}
		}
	}
	return d3;
}

// JASchema is the array template, mdjson is the array data

function jsonArray(mdJson, jASchema ) {
	console.log("array builder " + mdJson.length);
    var newArray =[];
	if ( mdJson.length > 0 ) {

        for (var i = 0; i < mdJson.length; i++) {

        	//console.log("-------------- jsonArray " + i + ' ' + mdJson[i].name );
        	// recursively handl objects in array
        	 if ( typeof(jASchema) !== "undefined" && typeof(jASchema)=="object" ) {
        	 	var tjO = {};
        	 	var subData = mdJson[i];
        	 	var trail;
        	 	tjO = SubObjectBuilder(subData, trail, jASchema); 
        	 	newArray.push(tjO);
        	 } else {
        	 	 var tjs = {};
        	 	tjs = JSON.parse(JSON.stringify(jASchema)); // cheap copy
             	tjs.value = mdJson[i].name;
             	tjs.array_index = i;   
			 	newArray.push(tjs);

        	 }
        	 
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

// Recursive for array objects that populates all the object elements
// Instead of scanning the data looking for matching paths

function SubObjectBuilder (jObjData, trail, iNjSchema) {
	trail = trail || [];
    var jSchema = JSON.parse( JSON.stringify(iNjSchema) );
   
	console.log(' subObject ' + JSON.stringify(jObjData)  + jSchema.name + ' ' +  jSchema.ref );
	var jT;
	//jSchema.value = JSON.stringify( jsonLookup(jObjData, jT, jSchema.ref ) );
		
	if ( typeof(jSchema.children) != "undefined" )  {
		for (var subkey = 0; subkey < jSchema.children.length; subkey++) {
			var jT;
            
            // t2o level lookup based on schema paths
			var  schemaChild = jSchema.children[subkey];
			if ( typeof(schemaChild.ref) != "undefined" ) {
				    schemaChild = arrayRefLookup(jObjData, schemaChild.ref, schemaChild );
			}

			if ( schemaChild.children ) {
				for (var sk = 0; sk < schemaChild.children.length; sk++) {
					var  subChild = schemaChild.children[sk];
					if ( typeof(subChild.ref) != "undefined" ) {
						subChild = arrayRefLookup(jObjData, subChild.ref, subChild );
							
					}
					// 3rd level here - recurse !
				}
			}

            // This part is for special key words ------
			for ( var keyA in jObjData  ) {
				console.log(' keywords inner ' + keyA + ' ' + jObjData[keyA] + ' ' + jSchema.children[subkey].name);
               
				if (jObjData[keyA] !== null && typeof(jObjData[keyA])=="object" ) {
				}

				if ( keyA == jSchema.children[subkey].name ) {
					if ( keyA == 'term') { // find a way to encode the default into the ui-schema
						// give the parent a default value
						jSchema.value =  jObjData[keyA]; 	
					} 
					jSchema.children[subkey].value = jObjData[keyA];
					//console.log(' KEYWORDS subobj made it ' + keyA + ' ' + subkey + ' ' + jObjData[keyA] + ' ' + jSchema.children[subkey].name + jSchema.children[subkey].value)
				}
			}
		}
	}
	return jSchema;
}


function arrayRefLookup (jObjData, referTo,d3Object) {
	/*  This function lookups up the value as defined in the d3 Object.ref and
	    updates the object with the value found. 
	    Also needs to provide the saves which path used in the d3Object.RefSaveTo 

	 */
	var rtN;
    if ( Array.isArray(referTo) ) {
		for (var k in referTo) {
			var ajT;
			found="";
			var rtnRefer = jsonLookup(jObjData, ajT,referTo[k], true);
			console.log(' ARL - ref array lookup ' + referTo[k] + ' ' + k + ' ' + rtnRefer);
			if (typeof(rtnRefer) != "undefined" && rtnRefer != "") {
				console.log(' >>> Found this ' +referTo[k] + ' ' + k + ' ' + rtnRefer);
				d3Object.RefSaveTo = referTo[k];
				d3Object.value = rtnRefer;			
				return d3Object;
			}
		}
	} else {
		
		var njT;
		console.log(' refer  to ' + referTo);
		found = "";
		var newt = jsonLookup(jObjData, njT,referTo, true);
		if (typeof(newt) != "undefined" && newt != "") {
			d3Object.value = newt;
			console.log(' ARL - single reference is  ' + referTo + ' : ' + newt);
			return d3Object;
		}
	}

}

// Recursive lookup and return the array from the source 
// based on the reference value

function jsonArrayLookup(jsonObj, trail, keylookup) {
    //console.log( 'jsonArrayLookup - json lookup ' + trail + ' ' + keylookup );
	trail = trail || [];
	for (var key in jsonObj) {

			 if ( jsonObj[key] !== null && Array.isArray(jsonObj[key]) ) {
			 	if ( trail.length > 1 ) {  var fk = trail.toString() + '.' + key } else { fk = key; } 
			 	// console.log( 'jsonArrayLookup - json I am an array ! ' + keylookup + ' key ' + key + ' full ' + fk + ' trail: ' + trail );
			 	 if ( fk == keylookup ) {
			 	 	//console.log( 'jsonArrayLookup - json I am found ! ' + fk + ' ' + keylookup + ' ' + trail );
					found = jsonObj[key];
				 	return found;	 	 	
			 	 }
			 }

			 if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
			 	if ( trail.length > 1 ) {  var nfk = trail.toString() + '.' + key } else { nfk = key; } 
			 		found = jsonArrayLookup(jsonObj[key], nfk, keylookup );
			 }

	}
	if ( Array.isArray(found) ) 
		{ return found }
	else { return null; }
}

// Recursive lookup and return the value from the source 
// based on the reference value

function jsonLookup(jsonObj, trail, keylookup, debug) {
    //var found;
	trail = trail || [];
	if (debug) { console.log(' json lookup for ' + keylookup + ' trail: ' + trail ); }
	if ( Array.isArray(jsonObj) ) {
		var indxStr = "",
			indxA = 0;

		// If the array has an index in the path
		if ( typeof(keylookup) != "undefined" && typeof(trail) != "undefined" ) {
			indxStr = keylookup.substring(trail.length+1);
			indxA = indxStr.split('.');
		}
		if (debug) { console.log(' in array ' +  keylookup + ' array has index in path ' + indxStr  + ' ' + indxA[0] );}
		if (isNaN(indxA[0]) ) {
			// The index is not in the path so walk thru it
			for (var i = 0; i < jsonObj.length; i++) {
				var joArray = jsonObj[i];
					if (debug) { console.log(' in array ' +  keylookup + ' non indexed ' + i );}
				for (var ka in joArray) {
				 	if (debug) { console.log(' in array ' +  keylookup + ' am i object ? ' + typeof(joArray[ka])=="object" );}
				    if ( joArray[ka] !== null && typeof(joArray[ka])=="object" ) {
			            var newka = trail.toString()  + '.' + ka.toString();
				        if ( ka == keylookup || newka == keylookup ) {
				        	 found = joArray[ka];
				        	  if (debug) { console.log(' array object json lookup ' +  keylookup + ' ' + found);}
							 return found;
						} else {
			           		jsonLookup(joArray[ka], trail.concat(ka), keylookup );
			           	}
			           
			        } else { 
						//	var fullkey = trail.join(".") + "." + ka;
						var fullkey ="";
						( trail.length > 1 ) ? 	fullkey = trail.toString() + "." + ka : fullkey = ka;

						if ( keylookup == fullkey ) {
						        found = joArray[ka];
						        if (debug) { console.log(' array endpoint json lookup ' +  keylookup + ' ' + found);}
								return found;
						}
					}
			    }    
			}

		} else {
			// If it passed an array index then just use it
			if (debug) { console.log(' Indexed array ' +  keylookup + ' array has index in path ' + indxStr  + ' ' + indxA[0] );}
			var joArray = jsonObj[indxA[0]];
			if (debug) { console.log(' Indexed array  - value ' +  JSON.stringify(joArray) ); }
			for (var ka in joArray) {
				 	if (debug) { console.log(' in array ' +  keylookup + ' am i object ? ' + ka );}
				    if ( joArray[ka] !== null && typeof(joArray[ka])=="object" ) {   
				        var newka = trail.toString() + '.' +indxA[0] + '.' + ka.toString();    
				        if (debug) { console.log(' YES OBJECT  ' +  keylookup + ' new key ' + newka );}   
				        if ( ka == keylookup || newka == keylookup ) {
				        	 found = joArray[ka];
				        	  if (debug) { console.log(' array object json lookup ' +  keylookup + ' ' + found);}
							 return found;
						} else {
			           		jsonLookup(joArray[ka], newka, keylookup );
			           	}
			           
			        } else { 
			        	if (debug) { console.log(' INDEXED array endpoint json lookup ' +  keylookup + ' ' + ka );}
						//	var fullkey = trail.join(".") + "." + ka;
						var fullkey ="";
						( trail.length > 1 ) ? 	fullkey = trail.toString() + "." +  +indxA[0] + '.' + ka : fullkey = ka.toString();

						if ( keylookup == fullkey ) {
						        found = joArray[ka];
						        if (debug) { console.log(' array endpoint json lookup ' +  keylookup + ' ' + found);}
								return found;
						}
					}
			    }    

		}

		if (debug) { console.log(' json lookup IS Array for ' + keylookup + ' ' +  jsonObj.length + ' trail: ' + trail ); }

	} else {
        // Not an array

		for (var key in jsonObj) {
			//if (debug) { console.log(' 1 json lookup ' +  keylookup + ' am i object ? ' + key );}

		    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
	           
	            var fx ="";
				if ( trail.length > 1 )  { fx = trail.toString() + "." + key;  } else { fx = key; }
				if (debug) { console.log(' YES object >> ' +  keylookup + ' am i ' + key  + ' full ' + fk); }
		        if ( key == keylookup || fx == keylookup ) {
		        	 found = jsonObj[key];
		        	 if (debug) { console.log('>>> object json found ' +  keylookup + ' ' + key);}
					 return found;
				} else {
					//var fk = trail.join(".") + "." + key;
					//var fk = trail.toString() + "." + key;
					var fk ="";
					( trail.length > 1 ) ? 	fk = trail.toString() + "." + key : fk = key;
					if (debug) { console.log(' object not found  dig  ' +  keylookup + ' ' + fk) };
	           		jsonLookup(jsonObj[key], fk, keylookup,debug );
	           	}
	           
	        } else { 
	        	if (debug) { console.log(' endpoint trail >>>>>>>>>> ' +  trail) ;}
				//var fullkey = trail.toString() + "." + key;
				var fullkey ="";
				( trail.length > 1 ) ? 	fullkey = trail.toString() + "." + key : fullkey = key;
				if ( keylookup == fullkey ) {
				        found = jsonObj[key];
				        if (debug) { console.log('>>> endpoint json found ' +  keylookup + ' ' + found);}
						return found;
				}
			}
			//}
	    }    
	}
    if (debug) { console.log('outer json lookup ' +  keylookup + ' :' + trail + ': ' + found );}
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
