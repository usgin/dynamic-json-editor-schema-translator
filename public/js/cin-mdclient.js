/* Client side transform tools
   This allows the client to translate the incoming package, and translate the edited
   package before saving.    
   G. Hudman April 21, 2016
*/

var found = "";

function ddh_apply_edits(edObject, OrigDoc) {
	 var kp;

	 if ( edObject.metadataUpdates.length > 0 ) {
		 for (i = 0; i <  edObject.metadataUpdates.length; i++) {
		 	var mx = edObject.metadataUpdates[i];
		 	if ( mx.type == 'add' ) {

		 	}
		 	
		 	if ( mx.type == 'change' ) {
 		 		OrigDoc[mx.updatePath] = mx.newValue;
		 	}

		 	if ( mx.type == 'delete' ) {
		 		if ( OrigDoc[mx.deletePath]	) {
		 			delete OrigDoc[mx.deletePath];
		 		}

		 	}

		 } 	
	 }

}


var deep_update = function(obj, path, value){
    for (var i=0, path=path.split('.'), len=path.length; i<len; i++){
        obj = obj[path[i]];
    };
    return obj;
};


// newJson is in d3 format loaded with Source data
function xform(d3json, mdjson) {
    var kp;
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
                    console.log(' t end lookup' +  d3[i].name + ' ' + endref);
					if ( typeof(endref) !== "undefined"  && endref !== null ) {
						d3[i].value = endref;
					}
				}
			}
		}
	}
	return d3;
}

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
            		
            		if ( d3[i].children ) {
	            		var jASchema = d3[i].children[0];
	            		
	            		var ajT;
						var mdArray = jsonArrayLookup(md, ajT,mdlookup);
						
						if ( typeof(mdArray) !== "undefined" && Array.isArray(mdArray) ) {
							
							var dArr = jsonArray(mdArray, jASchema);
							d3[i].children = dArr;
	                      

						}
					}
            	} else {
            		if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    	var jT;
						var refval = jsonLookup(md, jT,mdlookup);
					
						if ( typeof(refval) !== "undefined" && refval !== null ) {
							d3[i].value = refval;
						}
						found="";
            		}
            	    d3[i] = altransverse(d3[i],kp.concat(i),md);	
            	}
            }
            
		} else {
	
			if ( typeof(d3[i].ref) !== "undefined" ) { 
				var mdendlook = d3[i].ref;

				if ( typeof(mdendlook) !== "undefined" && Array.isArray(mdendlook) ) {
            		for (var k in mdendlook) {
            			var mdarrLookup = jsonLookup(md, ajT,mdendlook[k]);
            			if (mdarrLookup) {
            				mdendlook= mdendlook[k];
            				break;	
            			}
            			
            		}
            	}
				if ( typeof(mdendlook) !== "undefined" && mdendlook !== null ) {
					var ejT;
					var endref = jsonLookup(md, ejT,mdendlook);
                    console.log('end lookup' + mdendlookup);
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
	
    var newArray =[];
	if ( mdJson.length > 0 ) {

        for (var i = 0; i < mdJson.length; i++) {

        	
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
   
	var jT;
	
		
	if ( typeof(jSchema.children) != "undefined" )  {
		for (var subkey = 0; subkey < jSchema.children.length; subkey++) {
			var jT;

			for ( var keyA in jObjData  ) {
				
				if ( keyA == jSchema.children[subkey].name ) {
					if ( keyA == 'term') { 
						
						jSchema.value =  jObjData[keyA]; 	
					}
					jSchema.children[subkey].value = jObjData[keyA];
				
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
        	if (  keylookup == 'Data.keywords') {
				console.log( 'jsonLookup - the key >>> ' + key );
			}

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

    }    
	return found;
}

function jsonArrayLookup(jsonObj, trail, keylookup) {
    // console.log( 'jsonArrayLookup - json lookup ' + trail + ' ' + keylookup );
	trail = trail || [];
	for (var key in jsonObj) {

			 if ( jsonObj[key] !== null && Array.isArray(jsonObj[key]) ) {
			 	var fk = trail + '.' + key;
			 		
			 	 if ( fk == keylookup ) {
			 	 	
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



//********************************************************************************

// This translates data on the way out
// traverse the d3 edited schema and apply values to any reference points
// NGDS -specific join the md_package to the full data package
// and translate any md_package dat to the outer package

var apply_edits = function(d3edits, fullpack, mdPack) {
	 var kp;
	 mdlookup(d3edits,kp, mdPack, fullpack);
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
			var rtnU = mdUpdate(mdPack, mdk, d3edits.ref, d3edits.value ); 
			if ( !rtnU ) {
				console.log(' not found ' + d3edits.ref );
				
               var mx = d3edits.ref;
                if ( typeof(mx) !== "undefined" && Array.isArray(mx) ) {
                	var mz = mx[0];
                } else { mz = mx; }

               // 
               var my = mz.lastIndexOf('.');
               if ( my > 0 ) {
			   		var mdPar = mz.substr(0, my);
			   } else {
			   		mdPar = mz;
			   }
                
						
			}   		
			
    	}
    }

    // If it extends outside of defined root (md_package)

	if ( typeof(d3edits.package_ref) !== "undefined" && d3edits.package_ref !== null ) {
		if (typeof(d3edits.value) !== "undefined" && d3edits.value !== null ) {
    		var mdk;
    		var mt = mdUpdate(fullpack, mdk, d3edits.package_ref, d3edits.value );

			if ( mt ) {
				console.log(' outside md find ' + d3edits.package_ref);		

			} else { console.log('outside md no find');
		    } 
			    		
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
        	   
            if ( typeof(lookup) !== "undefined" && Array.isArray(lookup) ) {
              	var mx = lookup[0];
            } else { mx = lookup; }

        	if ( mdk.length < 1 ) { var fullkey = key; }
        	else {
				var fullkey = mdk.join(".") + "." + key; }
			if (mx == fullkey ) {	
			
			    jsonObj[key] = value;
				return true;
			}
		}
		
    }  
   
    if ( !fmd ) {

    	  if ( typeof(lookup) !== "undefined" && Array.isArray(lookup) ) {
                var mx = lookup[0];
          } else { mx = lookup; }

    	var lKey = mx.lastIndexOf(".");
    	if ( lKey > 0 ) { lPath = mx.substr(lKey + 1); }
    	else { lPath = lookup; }
    	var newJ = {};
    	newJ[lPath] = value;
    	$.extend(jsonObj,newJ);
    	console.log(' added new ' + mx  + ' with ' + value);
    	return true;

    }
    return fmd;
}








