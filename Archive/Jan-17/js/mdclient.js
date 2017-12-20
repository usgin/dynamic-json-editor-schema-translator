/* Client side transform tools
   This allows the client to translate the incoming package, and translate the edited
   package before saving.    
   G. Hudman April 21, 2016
*/

var found = "";

// newJson is in d3 format loaded with Source data
function xform(d3json, mdjson) {
    var kp;
	var newJson = transverse(d3json,kp,mdjson);
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








