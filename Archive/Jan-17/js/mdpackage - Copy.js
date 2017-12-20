// Server json translator library 
// D3 needs an api source to pull in json, so Node makes the request and translates the package
// G. Hudman April 8, 2016

exports.any = (function(d3json, mdjson) { 
	var kp;
	var newJson = transverse(d3json,kp,mdjson);
	return newJson;
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

function transverse(d3,kp,md) {

	kp = kp || [];

	for (var i in d3) {
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
			console.log(' step ' + d3[i].name + ' ' + i);

			if ( d3[i].ref !== "undefined" ) {
				var mdlookup = d3[i].ref;
				if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    var jT;
					var refval = jsonLookup(md, jT,mdlookup);
					//console.log('obj lookup' + mdlookup + ': ' + refval);
					if ( typeof(refval) !== "undefined" && refval !== null ) {
						d3[i].value = refval;
					}
					found="";
				}	
			}
			d3[i] = transverse(d3[i],kp.concat(i),md);
		} else {
			
			console.log(' traverse end ' + d3[i].name);

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
			// console.log('jslkup ' + fullkey); 

			if ( keylookup == fullkey ) {
			        found = jsonObj[key];
					return found;
			}
		}
		//}
    }    
	return found;
}
