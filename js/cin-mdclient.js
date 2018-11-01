/* Client side transform tools
   This allows the client to translate the incoming package, and translate the edited
   package before saving.    
   G. Hudman April 21, 2016
   cin-mdclient 1/27/2017

*/

var found = "";

// newJson is in d3 format loaded with Source data
function xform(d3json, mdjson) {
    var kp;
	//var newJson = transverse(d3json,kp,mdjson);
	var newJson = altransverse(d3json,kp,mdjson);
	return newJson;
}

function transverseX(d3,kp,md) {
	return d3;
}

// Transverse performs incoming translation
function transverse(d3,kp,md) {

	kp = kp || [];

	for (var i in d3) {
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
			//console.log(' step ' + d3[i].name + ' ' + i);

			if ( d3[i].ref !== "undefined" ) {
				var mdlookup = d3[i].ref;
				if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    var jT;
					var refval = jsonLookup(md, jT,mdlookup);
					if ( typeof(refval) !== "undefined" && refval !== null ) {
						d3[i].value = refval;
					}
					found="";
				}	
			}
			d3[i] = transverse(d3[i],kp.concat(i),md);
		} else {
			if ( d3[i].ref !== "undefined" ) { 
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

/* old version
function jsonLookup(jsonObj, trail, keylookup) {
	trail = trail || [];	
	for (var key in jsonObj) {
	    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) { 
           		jsonLookup(jsonObj[key], trail.concat(key), keylookup );
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
*/

// Modfied 1/18 *********************************************************

function altransverse(d3,kp,md) {

	kp = kp || [];

   // console.log(' Alt Transverse entry point '); // + JSON.stringify(md));
	for (var i in d3) {
		//console.log(' Alt step ' + d3[i] + ' - ' + i + ' type is ' + typeof(d3[i]) + 'x' );
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
            var iObj = d3[i];
            if ( d3[i].ref !== "undefined" ) {
            	var mdlookup = d3[i].ref;
            	// If the reference lookup is an array that handles multiple jsonPaths

            	if ( typeof(mdlookup) !== "undefined" && Array.isArray(mdlookup) ) {
            		for (var k in mdlookup) {
            			var mdarrLookup = jsonLookup(md, ajT,mdlookup[k]);
            			if (mdarrLookup) {
            				mdlookup= mdlookup[k];
            				break;	
            			}
            			// what to do if nothin found
            		}
            	}

            	if ( typeof(d3[i].datatype) !== "undefined" && d3[i].datatype == "array"  ) {
            		//console.log('an array ');
            		//for (var k in mdlookup) {

            		//}
            		if ( d3[i].children ) {
	            		var jASchema = d3[i].children[0];
	            		//console.log('>>>>>>>>>>>>>array start ' + mdlookup) ;
	            		var ajT;
						var mdArray = jsonArrayLookup(md, ajT,mdlookup);
						//console.log(' got array  ' + JSON.stringify(mdArray) ) ;
						if ( typeof(mdArray) !== "undefined" && Array.isArray(mdArray) ) {
							//console.log(' found it - process an array ');
							// build a new array using schema format and source data 
							var dArr = jsonArray(mdArray, jASchema);
							d3[i].children = dArr;
	                        //console.log(' returned array ' + JSON.stringify(dArr));

						}
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
			//console.log(' Alt traverse end point ' + i + ' ' + d3[i]);
			if ( typeof(d3[i].ref) !== "undefined" ) { 
				var mdendlook = d3[i].ref;

				if ( typeof(mdendlook) !== "undefined" && Array.isArray(mdendlook) ) {
            		for (var k in mdendlook) {
            			var mdarrLookup = jsonLookup(md, ajT,mdendlook[k]);
            			if (mdarrLookup) {
            				mdendlook= mdendlook[k];
            				break;	
            			}
            			// what to do if nothin found
            		}
            	}
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

// JASchema is the array template, mdjson is the array data

function jsonArray(mdJson, jASchema ) {
	//console.log("array builder " + mdJson.length);
    var newArray =[];
	if ( mdJson.length > 0 ) {

        for (var i = 0; i < mdJson.length; i++) {

        	//console.log("jsonArray " + i + ' ' + mdJson[i].name );
        	// recursively handl objects in array
        	 if ( typeof(jASchema) !== "undefined" && typeof(jASchema)=="object" ) {
        	 	var tjO = {};
        	 	var subData = mdJson[i];
        	 	var trail;
        	 	tjO = SubObjectBuilder(subData, trail, jASchema); 
        	 	newArray.push(tjO);
        	 } else {
        	 	 var tjs = {};
        	 	tjs = JSON.parse(JSON.stringify(jASchema));
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

function SubObjectBuilder (jObjData, trail, iNjSchema) {
	trail = trail || [];
    var jSchema = JSON.parse( JSON.stringify(iNjSchema) );
   
	//console.log(' subObject ' + JSON.stringify(jObjData)  + jSchema.name + ' ' +  jSchema.ref );
	var jT;
	//jSchema.value = JSON.stringify( jsonLookup(jObjData, jT, jSchema.ref ) );
		
	if ( typeof(jSchema.children) != "undefined" )  {
		for (var subkey = 0; subkey < jSchema.children.length; subkey++) {
			var jT;

			for ( var keyA in jObjData  ) {
				//console.log(' inner ' + keyA + ' ' + jObjData[keyA] + ' ' + jSchema.children[subkey].name)
				if ( keyA == jSchema.children[subkey].name ) {
					if ( keyA == 'term') { // find a way to encode the default into the ui-schema
						// give the parent a default value
						jSchema.value =  jObjData[keyA]; 	
					}
					jSchema.children[subkey].value = jObjData[keyA];
					//console.log(' made it ' + keyA + ' ' + subkey + ' ' + jObjData[keyA] + ' ' + jSchema.children[subkey].name + jSchema.children[subkey].value)
				}
			}

		}			
	}

	return jSchema;
}

// New version
function jsonLookup(jsonObj, trail, keylookup) {

	trail = trail || [];
	for (var key in jsonObj) {
	    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
        	//if (  keylookup == 'Data.keywords') {
			//	console.log( 'jsonLookup - the key >>> ' + key );
			//}

	        if ( key == keylookup ) {
	        	 found = jsonObj[key];
				 return found;
			} else {
				//console.log('j2 not found obj ' + trail + key); 
           		jsonLookup(jsonObj[key], trail.concat(key), keylookup );
           	}
           
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

function jsonArrayLookup(jsonObj, trail, keylookup) {
    // console.log( 'jsonArrayLookup - json lookup ' + trail + ' ' + keylookup );
	trail = trail || [];
	for (var key in jsonObj) {

			 if ( jsonObj[key] !== null && Array.isArray(jsonObj[key]) ) {
			 	var fk = trail + '.' + key;
			 		//console.log( 'jsonArrayLookup - json I am an array ! ' + fk + ' ' + keylookup + ' ' + trail );
			 	 if ( fk == keylookup ) {
			 	 	//console.log( 'jsonArrayLookup - json I am found ! ' + fk + ' ' + keylookup + ' ' + trail );
					found = jsonObj[key];
				 	return found;	 	 	
			 	 }
			 }

			 if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
			 		found = jsonArrayLookup(jsonObj[key], trail.concat(key), keylookup );
			 }

	}
	return found;
}



/* OLD version
function altransverse(d3,kp,md) {

	kp = kp || [];

   // console.log(' Alt Transverse entry point '); // + JSON.stringify(md));
	for (var i in d3) {
		//console.log(' Alt step ' + d3[i] + ' - ' + i + ' type is ' + typeof(d3[i]) + 'x' );
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
            var iObj = d3[i];
            if ( d3[i].ref !== "undefined" ) {
            	var mdlookup = d3[i].ref;
            	if ( typeof(mdlookup) !== "undefined" && Array.isArray(mdlookup) ) {

            		for (var k in mdlookup) {
            			var mdarrLookup = jsonLookup(md, ajT,mdlookup[k]);
            			if (mdarrLookup) {
            				mdlookup= mdlookup[k];
            				break;	
            			}
            			// what to do if nothin found
            		}
            	}

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
*/

/* Old Version
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
*/

// *******
// This translates data on the way out
// traverse the d3 edited schema and apply values to any reference points
// NGDS -specific join the md_package to the full data package
// and translate any md_package dat to the outer package

var apply_edits = function(d3edits, fullpack, mdPack) {
	 var kp;
	 mdlookup(d3edits,kp, mdPack, fullpack);
	 // join fullpackage and md_package 
	 for (i = 0; i < fullpack.extras.length; i++) {
  		if (fullpack.extras[i].key === 'md_package') {
  			fullpack.extras[i].value = JSON.stringify(mdPack);
  		}
  	}
}

var mdlookup = function (d3edits, kp, mdPack, fullpack) {

	kp = kp || [];
	if (typeof(d3edits.ref) !== "undefined" && d3edits.ref !== null ) {
    	if (typeof(d3edits.value) !== "undefined" && d3edits.value !== null ) {
    		var mdk;
			mdUpdate(mdPack, mdk, d3edits.ref, d3edits.value );    		
    	}
    }

    // If it extends outside of md_package
	if ( typeof(d3edits.package_ref) !== "undefined" && d3edits.package_ref !== null ) {
		if (typeof(d3edits.value) !== "undefined" && d3edits.value !== null ) {
    		var mdk;
			mdUpdate(fullpack, mdk, d3edits.package_ref, d3edits.value );    		
    	}
	}

    if ( typeof(d3edits.children) !== "undefined") {
		for (var i = 0; i < d3edits.children.length; i++) {
			mdlookup(d3edits.children[i],kp,mdPack, fullpack )
		}

	}
}

var mdUpdate = function(jsonObj, mdk, lookup, value) {
	mdk = mdk || [];
	for (var key in jsonObj) {
	    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) { 
           	var fmd = mdUpdate(jsonObj[key], mdk.concat(key), lookup, value );
        } else { 
        	if ( mdk.length < 1 ) { var fullkey = key; }
        	else {
				var fullkey = mdk.join(".") + "." + key; }
			if (lookup == fullkey ) {
			    jsonObj[key] = value;
				return true;
			}
		}
    }    
    return fmd;
}








