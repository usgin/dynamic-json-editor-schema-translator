/* JS transform library */

/*
Given a json source doc, and a lookup string return a value
*/

var found ;
var rtnVal;
var htmObj = "";

Object.byString = function(o, s) {
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
        var k = a[i];
        if (k in o) {
            o = o[k];
        } else {
            return;
        }
    }
    return o;
}

var md_jsonlookup = function (js_src, lookup) { 

		var trail ="";
		var nest = 0;
		found = false;
		rtnVal = "NotFound";

		var nest = md_traverse(js_src,trail,nest,lookup);

		if ( rtnVal == "NotFound" ) {


		}


}

function jsonLookup(jsonObj, trail, keylookup) {
	trail = trail || [];
	
	for (var key in jsonObj) {
	    if (jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {    
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





/*
md_traverse will crawl the entire JSON object
*/

function md_traverse(inObj, trail, nest, searchFor) {
	
	// Pop out if its found
	if ( found == true ) {
		return nest;
	}

	try
	{
	   var jsonObj = JSON.parse(inObj); 
	}
	catch(e)
	{
	   if ( typeof(inObj)=="object" ) {
	        var jsonObj = inObj;	 	
	   }
	}

	for (var i in jsonObj) {
		
		var jObj = jsonObj[i];
        if ( jsonObj[i] !== null && typeof(jsonObj[i]) == "string" ) {
        	var jStr = jsonObj[i];
        	if ( jStr.length > 0 && jStr.substring(0,1) =="[" ) {
        		var jb = eval('(' + jStr + ')');	
        		if ( Array.isArray(jb) ) { jObj = jb; };

        	}
        }
        
		if ( Array.isArray(jObj) ) { 
			
			var mar = jObj;	
			if  ( mar.length == 0 ) { 					
				htmObj = htmObj +'Empty Array End point : ' + trail.concat(i) + ' Key: ' + i  + '\n';
				if ( searchFor == trail.concat(i) ) {
					found = true;
					rtnVal = '{ "key": ' + fkArr + ', "value" : "[]"}';
					return nest;	
				}
				
			} else {
				var lz = 0;
				for (lz = 0; lz < mar.length; lz++) {
					
			  	    if ( mar[lz] !== null && typeof(mar[lz]) == "number" ) {                    	
                    	var fkArr = trailer_array(nest, trail,i,lz);
						htmObj = htmObj +'Array n Endpoint : ' + fkArr + ' Value: ' + mar[lz] + '\n';	
						if ( searchFor == fkArr) {
							found = true;
							rtnVal = '{ "key": ' + fkArr + ', "value" : "' + mar[lz] + '""}';
							return nest;
					}

					} else if (mar[lz] !== null && (typeof(mar[lz]=="object")  ) ) {
					    if ( Array.isArray(mar[lz]) ) {
					       var fkArr = trailer_array(nest, trail,i,lz);
						} else {				       
					      	var fkArr = trailer_array(nest, trail,i,lz);
					 	}
					 	
					    nest = nest + 1;
					    var zed = {};
					    zed = mar[lz];	
					    	  
					    nest = md_traverse(zed, fkArr, nest ); 
			          
					} else {
						htmObj = htmObj +'Array Endpoint : ' + trail.concat(i) + ' Key: ' + i + ' Value: ' + mar[lz] + '\n';
						if ( searchFor == trail.concat(i) ) {
							found = true;
							rtnVal = '{ "key": ' + trail.concat(i) + ',"value" : "' + mar[lz] + '"}';
							return nest;
						}				
					}
				}
				lz = 99;
			}
					
		} else { // Everything not an array

			if ( jObj !== null && typeof(jObj)=="string" && isJSON(jObj) && jObj.substring(0,1) =="{" ){
				         
			   var fullkey = trailer(nest,trail,i);   
		       nest++;
	           nest = md_traverse(jObj, fullkey, nest );
	           
			} else if (jObj !== null && typeof(jObj)=="object" ) {  
                       
			   var fullkey = trailer(nest,trail,i);	       		    
		       nest++;	   
	           nest = md_traverse(jObj, fullkey, nest );
	     	} else {    		
	        	var fullkey = trailer(nest,trail,i);
				htmObj = htmObj + 'End point : ' + fullkey + " Name: " + i + " Value:" + jsonObj[i] + '\n';
				if ( searchFor == trail.concat(i) ) {
					found = true;
				    rtnVal = '{ "key": ' + fullkey + ',"value" : "' + jsonObj[i] + '"}';
					return nest;
				}			
			}
		}
    
	}

    nest--;
    console.log("pop " + nest);
    return nest;
}

function trailer(nest,trail,inStr) {
	if ( nest < 1 ) {
		if ( !isNaN(inStr) ){
	     	var fullkey = trail + "[" + inStr + "]";   
     	} else {
     		var fullkey = inStr;
     	}	
	} else {
		if ( !isNaN(inStr) ){
			var fullkey = trail + "[" + inStr + "]";  
	    } else {
	    	var fullkey = trail + "." + inStr;  
	    }
	}
    return fullkey;
}

function trailer_array(nest,trail,inStr, arrIdx) {
	if ( nest == 0 ) {
  		 var fkArr =  inStr + "[" + arrIdx +"]";  	
    } else {
  		if ( !isNaN(inStr) ){
    		var fkArr = trail + "[" + inStr + "][" + arrIdx +"]";	
    	} else {
  		 	var fkArr = trail + "." + inStr + "[" + arrIdx +"]";  	
    	}
    }
    return fkArr;
}


function isJSON(str) {
try {
    JSON.parse(str);
} catch (e) {
    return false;
}
return true;
}


