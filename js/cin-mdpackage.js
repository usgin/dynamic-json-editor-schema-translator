// Server json translator library 
// D3 needs an api source to pull in json, so Node makes the request and translates the package
// G. Hudman April 8, 2016

JSON.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop ? prop+"."+i : ""+i);
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

var moa;
exports.any = (function(d3json, mdjson) { 
	var kp;
	var newJson = transverseX(d3json,kp,mdjson);
	return newJson;
});

exports.altmap = (function(d3json, mdjson) { 
	var kp;
	moa = mdjson;
  
	var newJson = altransverse(d3json,kp,mdjson);
	return newJson;
});


exports.xmlToJson = (function(obj) { 
	var rj = _xmlToJson(obj);
	return rj;
});

// Remove ISO XML namespaces from JSON Paths
exports.stripNS  = function(mdjson) {
	var kp;
	var nsJson = nsWalk(mdjson);
	return nsJson;

}

// Incoming json record check and repair for keywords
// This could be used for templating and validation in the more genaral case

exports.mdKwPrep=(function(mdjson) {
                          
  gDist = {
            "gmd:MD_Distribution": {
               "gmd:distributor": {
                  "gmd:MD_Distributor": {
                     "gmd:distributorContact": {
                        "gmd:CI_ResponsibleParty": {
                           "gmd:individualName": {
                              "gco:CharacterString": ""
                           },
                           "gmd:organisationName": {
                              "gco:CharacterString": ""
                           },
                           "gmd:positionName": {
                              "gco:CharacterString": ""
                           },
                           "gmd:contactInfo": {
                              "gmd:CI_Contact": {
                                 "gmd:phone": {
                                    "gmd:CI_Telephone": {
                                       "gmd:voice": {
                                          "gco:CharacterString": ""
                                       }
                                    }
                                 },
                                 "gmd:address": {
                                    "gmd:CI_Address": {
                                       "gmd:deliveryPoint": {
                                          "gco:CharacterString": ""
                                       },
                                       "gmd:city": {
                                          "gco:CharacterString": ""
                                       },
                                       "gmd:administrativeArea": {
                                          "gco:CharacterString": ""
                                       },
                                       "gmd:postalCode": {
                                          "gco:CharacterString": ""
                                       },
                                       "gmd:electronicMailAddress": {
                                          "gco:CharacterString": ""
                                       }
                                    }
                                 },
                                 "gmd:onlineResource": {
                                    "gmd:CI_OnlineResource": {
                                       "gmd:linkage": {
                                          "gmd:URL": ""
                                       }
                                    }
                                 }
                              }
                           },
                           "gmd:role": {
                              "gmd:CI_RoleCode": {
                                 "_": "distributor",
                                 "$": {
                                    "codeList": "http://standards.iso.org/ittf/PubliclyAvailableStandards/ISO_19139_Schemas/resources/Codelist/gmxCodelists.xml#CI_RoleCode",
                                    "codeListValue": "distributor"
                                 }
                              }
                           }
                        }
                     }
                  }
               },
               "gmd:transferOptions": {
                  "gmd:MD_DigitalTransferOptions": {
                     "gmd:onLine": {
                        "gmd:CI_OnlineResource": {
                           "gmd:linkage": {
                              "gmd:URL": "http://cinergi.sdsc.edu/geoportal/#"
                           },
                           "gmd:name": {
                              "gco:CharacterString": "Resource Description"
                           }
                        }
                     }
                  }
               }
            }
         };
		 
	gExtent = { "gmd:EX_Extent": {
								"gmd:geographicElement": {
									"gmd:EX_GeographicBoundingBox": {
										"gmd:westBoundLongitude": { "gco:Decimal": "" },
										"gmd:eastBoundLongitude": { "gco:Decimal": "" },
										"gmd:southBoundLatitude": { "gco:Decimal": "" },
										"gmd:northBoundLatitude": { "gco:Decimal": "" } } },
								"gmd:description" : { "gco:CharacterString" : "Empty New Extent" } }
							};

    //console.log('in mdkwprep !' );      
    //if ( mdjson.hasOwnProperty("OriginalDoc") ) {
	//	console.log('has origdoc !');
	var mo = mdjson;
	var top = 'gmi:MI_Metadata';
	var rec = false;
	if ( typeof(mo) !== "undefined" && mo.hasOwnProperty(top) ) {
		 mo = mo[top];
		 rec = true;
	}
	
	top = 'gmd:MD_Metadata';
	if ( !rec && typeof(mo) !== "undefined" && mo.hasOwnProperty(top) ) {
		 mo = mo[top];
		 rec = true;
	}
	
	if  ( rec ) {
		//console.log('has ' +top);
		var dist = 'gmd:distributionInfo';
		var hasDist = false;
		if ( typeof(mo) !== "undefined" && mo.hasOwnProperty(dist) ) { hasDist = true; }
		dist = 'distributionInfo';
		if ( typeof(mo) !== "undefined" && mo.hasOwnProperty(dist) ) { hasDist = true; }
		
		if ( !hasDist ) {
			mo[dist] = gDist;
			//console.log('missing dist !' + dist);
		}
		
		var idInfo = 'gmd:identificationInfo';
		var hasExt = false;
	
		if ( typeof(mo) !== "undefined" && mo.hasOwnProperty(idInfo) ) { 
			
			mo = mo[idInfo];
			idInfo = 'gmd:MD_DataIdentification';
			if ( typeof(mo) !== "undefined" && mo.hasOwnProperty(idInfo) ) { 
				mo = mo[idInfo];
				var extItem = 'gmd:extent';
				if ( !mo.hasOwnProperty('gmd:extent') && !mo.hasOwnProperty('extent') ) {
					mo[extItem] = gExtent;
					//console.log('missing extent');
				}
			}
		}
	}
		
		
		
		
		
   return mdjson;
                          
});

function nsWalk(kp, md) {

	return(md);

}

var found = "";



function xform(d3json, mdjson) {
    var kp;
	var newJson = transverse(d3json,kp,mdjson);
	return newJson;
}

function transverseX(d3,kp,md) {
	return d3;
}

// Altransvere - builds data into schema
// altraverse allows the build of n-children based on a single child schema structure
// Todo: add reference lookup array handling 6/2

function altransverse(d3,kp,md) {

	kp = kp || [];
	if ( d3.name == "root" && d3.titleref !== "undefined" ) {		
            var ndx ="";
			var tref = d3.titleref;
			if ( typeof(tref) !== "undefined" && Array.isArray(tref) ) { 
				for (var k in tref) {
          found = "";
					var tLook = jsonLookup(md, ajT,tref[k], false);
					if (tLook) {
						ndx = tLook;
						break;
					}
				}
			
			} else {
				ndx = jsonLookup(md, ajT,d3.titleref, false);	
			}
		    
		     d3.titleval = ndx;
	}

	for (var i in d3) {
	    console.log(' Check ' + d3[i].name );
		if (d3[i] !== null && typeof(d3[i])=="object" ) {
            var iObj = d3[i];
            if ( d3[i].ref !== "undefined" ) {
            	var mdlookup = d3[i].ref;
              
            	// If the reference lookup is an array that handles multiple jsonPaths
            	if ( typeof(mdlookup) !== "undefined" && Array.isArray(mdlookup) ) {
            		for (var k in mdlookup) {
                  var mdarrlookup;
                  found = "";
                  //console.log(' Ref Path ' + mdlookup[k] );
         			    mdarrLookup = jsonLookup(md, ajT,mdlookup[k], false);
            		
            			if (mdarrLookup) {
            				mdlookup= mdlookup[k];
            				d3[i].RefSaveTo = mdlookup;
            				//console.log('>>> ' + d3[i].name + ' ' + d3[i].RefSaveTo);
            				break;	
            			}		
            		}
            	}
				
            	// If the D3 schema element is an array
            	if ( typeof(d3[i].datatype) !== "undefined" && d3[i].datatype == "array"  ) {
            		if ( d3[i].children ) {
	            		var jASchema = d3[i].children[0];
		            		var ajT;
							var mdArray = jsonArrayLookup(md, ajT,mdlookup, false);
							
							if ( typeof(mdArray) !== "undefined" && Array.isArray(mdArray) ) {
								
								if (mdArray.length > 0 ) {
								// build a new array using schema format and source data 
									var dArr = jsonArray(mdArray, jASchema);
									if ( dArr ) {							
										d3[i].children = dArr;
									}
								}
		                     
							} else {
								// sometimes if its a single value then it can show up as just a regular json object
								// this is an "arrayable" object ---
								// convert from object to array 2/3
								
								var mdObj = jsonLookup(md,ajT,mdlookup, false);
								
								if ( mdObj ) {
									var mdA = [];
									mdA.push(mdObj);
									var schemArray = jsonArray(mdA,jASchema);
									d3[i].children = schemArray;
								}
							}
						
					}
            	} else {
            		if ( typeof(mdlookup) !== "undefined" && mdlookup !== null ) {
                    	var jT;
						if ( typeof(d3[i].datatype) !== "undefined" && d3[i].datatype == "subschema"  ) {
							var cl = '';
							//console.log(d3[i].name + ' subschema ');
						} else {
							var refval = jsonLookup(md, jT,mdlookup, false);
							if ( typeof(refval) !== "undefined" && refval !== null ) {
								// Dont stuff the object into a string, mite want to process
								if ( typeof(refval) !== "object" ) {
									d3[i].value = refval;	
								} 
							}
						}
						found="";
						
            		}
					d3[i] = altransverse(d3[i],kp.concat(i),md);
            	    	
            	}
            }
            
		} else {
			

			if ( typeof(d3[i]) !== "undefined"  && typeof(d3[i].ref) !== "undefined" ) { 
				var mdendlook = d3[i].ref;
				
				if ( typeof(mdendlook) !== "undefined" && Array.isArray(mdendlook) ) {
            		for (var k in mdendlook) {
            			var mdarrLookup = jsonLookup(md, ajT,mdendlook[k], false);
            			if (mdarrLookup) {
            				mdendlook= mdendlook[k];
            				d3[i].RefSaveTo = mdendlook;
            				//console.log(' New >>> ' + d3[i].name + ' ' + d3[i].RefSaveTo);
            				
            				break;	
            			}    			
            		}
            	}

				if ( typeof(mdendlook) !== "undefined" && mdendlook !== null ) {
					var ejT;		
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
	
    var newArray =[];

    try {

		if ( mdJson.length > 0 ) {
            //var dd = JSON.stringify(mdJson);
			//if ( dd.indexOf('EX_TemporalExtent') > 0 ) {
            //    console.log('>>> mdjson - Temporal extent ' + dd);
            //  }

	        for (var i = 0; i < mdJson.length; i++) {

	        	// recursively handle objects in array

	        	if ( typeof(jASchema) !== "undefined" && typeof(jASchema)=="object" ) {
	        	 	var tjO = {};
	        	 	var subData = mdJson[i];
	        	 	var trail;
              //console.log(' array ' + i + ' ' +  JSON.stringify(subdata) );
              var ddt = JSON.stringify(subData);
              //var okys = Object.keys(subData);
              // Hard code skip of the temporal  
              var hasTem = false;
              if ( subData.hasOwnProperty('gmd:EX_Extent')  ) {
              	var tic = subData['gmd:EX_Extent'];
              	if ( tic.hasOwnProperty('gmd:temporalElement') && !tic.hasOwnProperty('gmd:geographicElement') ) {
              		hasTem = true;
              	}
              }
             
               if ( subData.hasOwnProperty('gmd:temporalElement') ) {
               		hasTem = true;
              }

              if ( hasTem ) {
              	var tempora = true;
                //console.log(' Skip the Temporal extent for now ' + JSON.stringify(subData) );
           
              } else {     
  	        	 	tjO = SubObjectBuilder(subData, trail, jASchema, i); 
  	        	 	tjO.array_index = i;
  	        	 	if ( typeof(mdJson[i].datatype) !== "validationonly" ) {
  	        	 		if ( typeof(mdJson[i].validation) !== "undefined" ) {
  	        	 			tjO.validateonly = mdJson[i].validation.toString();
  	        	 		} else {
  	        	 			tjO.validateonly = "true";
  	        	 		}
  	        	 	} 
                                    
  	        	 	newArray.push(tjO);
             }
	        	} else {
	        	 	 var tjs = {};
	        	 	tjs = JSON.parse(JSON.stringify(jASchema)); // cheap copy
	             	tjs.value = mdJson[i].name;
	             	tjs.array_index = i;   

	        	 	if ( typeof(mdJson[i].datatype) !== "validationonly" ) {
	        	 		if ( typeof(mdJson[i].validation) !== "undefined" ) {
	        	 			tjO.validateonly = mdJson[i].validation;
	        	 		} else {
	        	 			tjO.validateonly = "true";
	        	 		}
	        	 	}
				 	    newArray.push(tjs);
	        	}
	       
			}
		} else {
			// Build empty array item
		    newArray.push(jASchema);
		    newArray[i].name = "default";
			newArray[i].array_index = 0;
		}

	} catch (e) {
    	console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>> JSON Array Error ' + JSON.stringify(e) );
	}

	return newArray;
}

// Recursive for array objects that populates all the object elements
// Instead of scanning the data looking for matching paths

function SubObjectBuilder (jObjData, trail, iNjSchema,mCount) {
	trail = trail || [];
    var jSchema = JSON.parse( JSON.stringify(iNjSchema) );
    var ObX = 0;
	var jT;
    //console.log('SobObject called ' );
	if ( typeof(jSchema.children) != "undefined" )  {
		for (var subkey = 0; subkey < jSchema.children.length; subkey++) {
			var jT;
            
            // t2o level lookup based on schema paths
			var  schemaChild = jSchema.children[subkey];
			if ( typeof(schemaChild.ref) != "undefined" ) {
				    //console.log(' sob l1 -- ' +  ' ' + jSchema.name + ' ' + schemaChild.ref + ' ' + subkey + ' ' + mCount);

				    if ( typeof(jSchema.ref) !== "undefined" && Array.isArray(jSchema.ref) ) {
				    	//console.log(' base path array !');
						for (var k in jSchema.ref) {
							var xJt;
						 //console.log('>>>>>>>>>> level 1 ' + jSchema.ref[k] );
        					vJP = jPathValidate(moa, jSchema.ref[k]);
        					if (vJP) { 
                    //console.log('-------------->>>>>>>>>> level 1 - VALID >>> ' + jSchema.name + ' ' + jSchema.ref[k] );
        						var valPath = jSchema.ref[k];
                    jSchema.RefSaveTo = valPath;
        						break; 
        					}
        				}
        				if (!valPath) {
							var kontinue=1;
        						//console.log(' No valid base path !');
        				}
					} else {
						valPath = jSchema.ref;
					}

					//console.log(' sob l1 --2 NEW ' +  ' Valid Path' + valPath + ' childref ' + schemaChild.ref + ' [subkey] ' + subkey + ' count: ' + mCount);
					schemaChild = arrayRefLookup(jObjData, schemaChild.ref, schemaChild, false, valPath, mCount );
					//  arrayRefLookup (jObjData, referTo, d3Object, refOnly, baseRef, kc) {
					schemaChild.array_index = mCount;
				    var vJP = false;

					if ( !schemaChild.hasOwnProperty('RefSaveTo')  ) {
						//console.log(' l1-2 - RefSaveTo not built in array ref ');
                        /*
						if ( typeof(jSchema.ref) !== "undefined" && Array.isArray(jSchema.ref) ) {
							for (var k in jSchema.ref) {
								var xJt;
            					vJP = jPathValidate(md, jSchema.ref[k]);
            					if (vJP) { 
            						var valPath = jSchema.ref[k];
            						break; 
            					}
            				}

						} else {
							valPath = jSchema.ref;
						}
						*/

						if ( typeof(schemaChild.ref) !== "undefined" && Array.isArray(schemaChild.ref) ) {
							 //console.log(' l1-2 - Child path array ');	
            					//if ( typeof(schemaChild.ref) !== "undefined" && Array.isArray(schemaChild.ref) ) {
									for (var sk in schemaChild.ref) {
										var fJP = valPath + '.' + mCount + '.' + schemaChild.ref[sk];
										//console.log(' try this path ---' + fJP);
										if ( jPathValidate(moa, fJP ) ) {
											var fvJP = jsonLookup(md, ajT, fJP );	
											if ( fvJP ) {
          	            //console.log(' refsaveTo - reset here -1 >>>> ---' + schemaChild.name + ' ' + fJP);                        
												schemaChild.RefSaveTo = fJP;
												break;			
											}	
										}
									}

            } else {

                schemaChild.RefSaveTo = valPath + '.' + mCount + '.' + schemaChild.ref;  
                //console.log(' refSaveTo - reset here  -2 >>>> ---' + schemaChild.name + ' ' + schemaChild.RefSaveTo);       
            }
            			//}
                        
						//schemaChild.RefSaveTo = jSchema.ref + '.' + mCount + '.' + schemaChild.ref;
						//console.log('>>>>> Add ref save to ' + schemaChild.RefSaveTo + ' ' + schemaChild.name + ' ' + schemaChild.ref);
					} 
					
					//console.log(' sob l1 after ' +  schemaChild.name + ' ' + subkey + ' ' + schemaChild.array_index);
					ObX++;
			}

			if (  schemaChild.hasOwnProperty('children') && typeof(schemaChild.children) != "undefined" ) {
				for (var sk = 0; sk < schemaChild.children.length; sk++) {
					var  subChild = schemaChild.children[sk];
					//console.log(' sob l2 ' + schemaChild.ref);
					if ( typeof(subChild.ref) != "undefined" ) {
						if ( typeof(jSchema.ref) !== "undefined" && Array.isArray(jSchema.ref) ) {
					    	//console.log(' base path array !');
							for (var k in jSchema.ref) {
								var xJt;
								
	        					vJP = jPathValidate(moa, jSchema.ref[k]);
	        					//console.log('-------------->>>>>>>>>> level 2' + jSchema.ref[k] + ' ' + vJP );
	        					if (vJP) { 
	        						var valPath = jSchema.ref[k];
	        						//console.log('-------------->>>>>>>>>> level 2 ' + valPath );
	        						break; 
	        					}
	        				}
						} else {
							valPath = jSchema.ref;
						}

						subChild = arrayRefLookup(jObjData, subChild.ref, subChild, false, valPath, mCount );
						subChild.array_index = sk;
						if ( !subChild.hasOwnProperty('RefSaveTo')  ) {
							if ( typeof(subChild.ref) !== "undefined" && Array.isArray(subChild.ref) ) {

	            				//	if ( typeof(subChild.ref) !== "undefined" && Array.isArray(subChild.ref) ) {
										for (var ssk in subChild.ref) {
											var sfJP = valPath + '.' + mCount + '.' + subChild.ref[ssk];
											//console.log(' slevel 2 array path ' + sfJP );
											if ( jPathValidate(moa, SfJP ) ) {
												var sfvJP = jsonLookup(md, ajT, sfJP );
												if ( sfvJP ) {
                          //console.log(' slevel 2 array saved  ' + sfJP );                              
													subChild.RefSaveTo = sfJP;			
												}
											}
										}

	            				} else {
									subChild.RefSaveTo = valPath + '.' + mCount + '.' + subChild.ref;            					
	            				}
	            			//}
							//subChild.RefSaveTo = jSchema.ref + '.' + sk + '.' + subChild.ref;
							//console.log('>>>>> Add ref save to ' + subChild.RefSaveTo + ' ' + subChild.name + ' ' + subChild.ref);
						}
					
					}

					// 3rd level here - recurse !
					if (  subChild.hasOwnProperty('children') && typeof(subChild.children) != "undefined" ) {
						for (var ssk = 0; ssk < subChild.children.length; ssk++) {
							var  DsubChild = subChild.children[ssk];
						  //console.log(' sob l3 ' + subChild.ref);
							if ( typeof(DsubChild.ref) != "undefined" ) {
									if ( typeof(jSchema.ref) !== "undefined" && Array.isArray(jSchema.ref) ) {
								    	//console.log(' base path array !');
										for (var k in jSchema.ref) {
											var xJt;
											//console.log('-------------->>>>>>>>>> level 3' + jSchema.ref[k] );
				        					vJP = jPathValidate(moa, jSchema.ref[k]);
				        					if (vJP) { 
				        						var valPath = jSchema.ref[k];
				        						break; 
				        					}
				        				}
									} else {
										valPath = jSchema.ref;
									}

								    DsubChild = arrayRefLookup(jObjData, DsubChild.ref, DsubChild, false, valPath, mCount );
								    DsubChild.array_index = ssk;
								    if ( !DsubChild.hasOwnProperty('RefSaveTo')  ) {
										DsubChild.RefSaveTo = jSchema.ref + '.' + ssk + '.' + DsubChild.ref;
										//console.log('>>>>> Add ref save to ' + DsubChild.RefSaveTo + ' ' + DsubChild.name + ' ' + DsubChild.ref);
									}
							}
						}
					}
				}
			}

            // This part is for special key words ------
			for ( var keyA in jObjData  ) {
               
				if (jObjData[keyA] !== null && typeof(jObjData[keyA])=="object" ) {
				}

				if ( keyA == jSchema.children[subkey].name ) {
					if ( keyA == 'term') { // find a way to encode the default into the ui-schema
						// give the parent a default value
						jSchema.value =  jObjData[keyA]; 	
					} 
					jSchema.children[subkey].value = jObjData[keyA];
					
				}
			}
		}
	} else {
 
   jSchema.value = jObjData;
   var tmpRef = jSchema.ref.split('.');
   tmpRef.pop();
   jSchema.RefSaveTo = tmpRef.join('.') + '.' + mCount;
 
  }

	return jSchema;
}

function arrayRefLookup (jObjData, referTo,d3Object, refOnly, baseRef, kc) {
	/*  This function lookups up the value as defined in the d3 Object.ref and
	    updates the object with the value found. 
	    Also needs to provide the saves path used in the d3Object.RefSaveTo 
	    refOnly - only update the path not the value
	 */
	var rtN;
	//console.log(' array ref lookup ' + kc);
    if ( Array.isArray(referTo) ) {
		for (var k in referTo) {
            
			var ajT;
			found="";
            var lp = baseRef + '.' + kc + '.' + referTo[k];
           // console.log(' checking on ' + lp);

			var valRefer = jPathValidate(moa, lp);

			//console.log(' array ref lookup - isArray  ' + valRefer + ' >>>> ' + baseRef + '.' + kc + '.' + referTo[k] );
			//var trnRefer = jsonLookup(jObjData, ajT,referTo[k], true);
			
			//if (typeof(rtnRefer) != "undefined" && rtnRefer != "") {
			if (valRefer) {
				// if it has an array in the path
       // console.log(' ARL val refer true ' + baseRef + '.' + kc + '.' + referTo[k]);
				if ( d3Object.hasOwnProperty('subArrCat') && referTo[k].indexOf('.0.') > 4 ) {
					var  rk = referTo[k];
					var prePath=rk.substring(0,rk.indexOf('.0.'));
					var endPath=rk.substring(rk.indexOf('.0.')+3);
					//console.log(' array ref val ' + baseRef + '.' + kc + '.' + referTo[k] + ' ' + valRefer );
					//d3Object.value = ArrayCat(jObjData,prePath, endPath);
					d3Object = ArrayNotCat(jObjData,prePath, endPath, d3Object, baseRef, kc);
					//d3Object.datatype = 'array';

				} else {	
					d3Object.value = jsonLookup(jObjData, ajT,referTo[k], true);				
				}
				//console.log(' array ref val - applied ' + baseRef + '.' + kc + '.' + referTo[k] + ' ' + d3Object.value );
				if (!d3Object.RefSaveTo) {
          //console.log(' ARL -- 2 refSaveTo doesnt exists so build - ' + baseRef + '.' + kc + '.' + referTo[k]);
          d3Object.RefSaveTo = baseRef + '.' + kc + '.' + referTo[k]; 
        }
        //console.log(' ARL -- 2 AFTER RefSaveTo ' + d3Object.name + ' ' + d3Object.RefSaveTo);
				return d3Object;	
        
			} else {
				//console.log ( ' arf return value not defined ' + referTo[k] + ' ------------' + JSON.stringify(jObjData));
				//return d3Object;

			}
		}

	} else {
		
		var njT;

		found = "";
		var newt = jsonLookup(jObjData, njT,referTo, false);
		if (typeof(newt) != "undefined" && newt != "") {
 			//console.log(' array ref - not lookup arrray - applied ' + d3Object.name + ' ' + baseRef + '.' + kc + '.' + referTo + ' ' + newt );
 			d3Object.RefSaveTo = baseRef + '.' + kc + '.' + referTo;
			d3Object.value = newt;
			d3Object.array_index = kc;
			return d3Object;

		}
	}

	return d3Object;

}

// Returns a catenated string
function ArrayCat(jO,jPre,jPath) {

	var kjT;
	var kJ = jsonArrayLookup(jO,kjT,jPre);
	var catVal ="";
	if ( Array.isArray(kJ) ) {

		for (var z = 0; z < kJ.length; z++) {			
			var njT;
			( z != 0) ? catVal = catVal + ', ' : catVal = catVal;
			catVal= catVal + jsonLookup(kJ[z], njT,jPath, false);
			
		}


	}
	return catVal;		
}

// Returns a catenated string
function ArrayNotCat(jO,jPre,jPath,dO,baseRef,keyCnt) {

	var kjT;
	var kJ = jsonArrayLookup(jO,kjT,jPre);
	var catVal ="";
	var rv = "";
	//console.log('>>>>>>>>>>>>>> Array Not Cat >>' + baseRef + '<> ' + jPre + ' <<->> ' + jPath + ' <<__>>' + keyCnt);

	if ( Array.isArray(kJ) ) {
		if ( !dO.children ) { dO.children = []; }
			for (var z = 0; z < kJ.length; z++) {	
			    var bX = {};
				bX.name = 'term';		
				bX.datatype = 'string';
				bX.ref = jPath;
				//bx.xoffset = dO.xoffset;
				// bx.growdown = dO.growdown;
				bX.RefSaveTo = baseRef + '.' + keyCnt + '.' + jPre + '.' + z + '.' + jPath;
	            //console.log('>>>>>>>>>>>>>> Array Not Cat ARRAY - BX saveto >>' + bX.RefSaveTo);			
				bX.yoffset = -1;
				bX.datatype = "typeahead";
	            bX.dicturl ="http://ec-scigraph.sdsc.edu:9000/scigraph/vocabulary/autocomplete/%QUERY?limit=20";
	            bX.dictparams = {"query": "%QUERY","limit":"20" };
				var njT;
				( z != 0) ? catVal = catVal + ', ' : catVal = catVal;
				rv = jsonLookup(kJ[z], njT,jPath, false);
				catVal= catVal + rv;
				dO.value = catVal;
				bX.value = rv;
				dO.children.push(bX);
			}
			dO.value = dO.value.substring(0,30) + '...';
			dO.datatype = "array";
		
	} else {
		// not an array - maybe a lazy array
		if ( !dO.children ) { dO.children = []; }
		 	//var bX = {};
			dO.name = 'term';		
			//dO.datatype = 'string';
			dO.ref = jPath;
			//var tPath = baseRef + '.' + keyCnt + '.' + jPre + '.' + jPath;
			dO.RefSaveTo = baseRef + '.' + keyCnt + '.' + jPre + '.0.' + jPath;

			var lPath = jPre + '.' + jPath;

           // console.log('>>>>>>>>>>>>>> Array Not Cat BX NOT ARRAY --- saveto >>' + dO.RefSaveTo + ' lookup path ' + lPath + '--' + JSON.stringify(jO) );			
			//dO.xoffset = 6*dO.children.length + 40;

			dO.datatype = "typeahead";
            dO.dicturl ="http://ec-scigraph.sdsc.edu:9000/scigraph/vocabulary/autocomplete/%QUERY?limit=20";
            dO.dictparams = {"query": "%QUERY","limit":"20" };
			var njT;
			//( z != 0) ? catVal = catVal + ', ' : catVal = catVal;
			rv = jsonLookup(jO, njT,lPath, false);

			//catVal= catVal + rv;
			dO.value = rv;
			//bX.value = rv;
			//dO.children.push(bX);

	}
	return dO;		
}

function arrayRefLookupExp (jObjData, referTo,d3Object, refOnly) {
	/*  This function lookups up the value as defined in the d3 Object.ref and
	    updates the object with the value found. 
	    Also needs to provide the saves which path used in the d3Object.RefSaveTo 
	    refOnly - only update the path not the value
	 */
	var rtN;
    if ( Array.isArray(referTo) ) {
		for (var k in referTo) {
			var ajT;
			found="";
			var rtnRefer = jsonLookup(jObjData, ajT,referTo[k], false);
			
			if (typeof(rtnRefer) != "undefined" && rtnRefer != "") {

				d3Object.RefSaveTo = referTo[k];  // Save to is to be used when edits are saved

				// If the d3 object is an array and it data is an array build it ...
				if ( d3Object.datatype = "array" ) { 

					if ( Array.isArray(rtnRefer) ) { 
					var buildOut = jsonArray(rtnRefer, d3Object.children[0] );
						d3Object.children = buildOut;
						return d3Object;
				 	}
				 } else {
					d3Object.value = rtnRefer;
					return d3Object; 	
				 }
				
			}
		}
	} else {
		
		var njT;
		
		found = "";
		var newt = jsonLookup(jObjData, njT,referTo, false);
		if (typeof(newt) != "undefined" && newt != "") {
			if ( d3Object.datatype = "array" ) { 
				if ( Array.isArray(newt) ) { 
					var buildOut = jsonArray(newt, d3Object.children[0]  );
					d3Object.children = buildOut;
					return d3Object;
				}
			} else {
				d3Object.value = newt;
				return d3Object;
			}
		}
	}
	return d3Object;

}

// Recursive lookup and return the array from the source 
// based on the reference value

function jsonArrayLookup(jsonObj, trail, keylookup) {
 
	trail = trail || [];
	for (var key in jsonObj) {

			 if ( jsonObj[key] !== null && Array.isArray(jsonObj[key]) ) {
			 	if ( trail.length > 1 ) {  var fk = trail.toString() + '.' + key } else { fk = key; } 
	
			 	 if ( fk == keylookup ) {
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


function jPathValidate(jsonObj,lookup) {
// returns ture if the path is found, correctly maps partial paths from the top

  
	var mPath = lookup.split('.');
    var mPlen = mPath.length;

   // console.log(' path val ' + lookup + ' length  ' + mPlen);

    for (z=0; z < mPlen; z++) {
        var top = mPath.shift();
       // console.log( ' path val ' + z + ' ' + top);
        if (jsonObj.hasOwnProperty(top) ) {
            if ( z == (mPlen - 1)  ) {
            	// console.log(' path val FOUND ' + top);
            	return true;
            } else {
            	jsonObj = jsonObj[top];
            }
        }
    }
    //console.log(' path val NOT FOUND ' + top);
    return false;

}

// Recursive lookup and return the value from the source 
// based on the reference value

function jsonLookup(jsonObj, trail, keylookup, debug) {
    //var found;
	trail = trail || [];
	//if (debug) { console.log(' json lookup for ' + keylookup + ' trail: ' + trail ); }
	if ( Array.isArray(jsonObj) ) {
		var indxStr = "",
			indxA = 0;

		// If the array has an index in the path
		if ( typeof(keylookup) != "undefined" && typeof(trail) != "undefined" &  typeof(keylookup) == "string" ) {
			indxStr = keylookup.substring(trail.length+1);
			indxA = indxStr.split('.');
		}
		
		if (isNaN(indxA[0]) ) {
			// The index is not in the path so walk thru it
			for (var i = 0; i < jsonObj.length; i++) {
				var joArray = jsonObj[i];
					
				for (var ka in joArray) {
				 	
				    if ( joArray[ka] !== null && typeof(joArray[ka])=="object" ) {
			            var newka = trail.toString()  + '.' + ka.toString();
				        if ( ka == keylookup || newka == keylookup ) {
				        	 found = joArray[ka];
				        	
							 return found;
						} else {
			           		jsonLookup(joArray[ka], trail.concat(ka), keylookup );
			           	}
			           
			        } else { 
					
						var fullkey ="";
						( trail.length > 1 ) ? 	fullkey = trail.toString() + "." + ka : fullkey = ka;

						if ( keylookup == fullkey ) {
						        found = joArray[ka];
						    
								return found;
						}
					}
			    }    
			}

		} else {
			// If it passed an array index then just use it
			
			var joArray = jsonObj[indxA[0]];		
			for (var ka in joArray) {
				    if ( joArray[ka] !== null && typeof(joArray[ka])=="object" ) {   
				        var newka = trail.toString() + '.' +indxA[0] + '.' + ka.toString();    
				      
				        if ( ka == keylookup || newka == keylookup ) {
				        	 found = joArray[ka];
				        
							 return found;
						} else {
			           		jsonLookup(joArray[ka], newka, keylookup );
			           	}
			           
			        } else { 
			        	
						var fullkey ="";
						( trail.length > 1 ) ? 	fullkey = trail.toString() + "." +  +indxA[0] + '.' + ka : fullkey = ka.toString();

						if ( keylookup == fullkey ) {
						        found = joArray[ka];		     
								return found;
						}
					}
			    }    
		}

	} else {
        // Not an array

		for (var key in jsonObj) {
			

		    if ( jsonObj[key] !== null && typeof(jsonObj[key])=="object" ) {
	           
	            var fx ="";
				if ( trail.length > 1 )  { fx = trail.toString() + "." + key;  } else { fx = key; }
				
		        if ( key == keylookup || fx == keylookup ) {
		        	 found = jsonObj[key];
		        	
					 return found;
				} else {

					var fk ="";
					( trail.length > 1 ) ? 	fk = trail.toString() + "." + key : fk = key;
	           		jsonLookup(jsonObj[key], fk, keylookup,debug );
	           	}
	           
	        } else { 
				var fullkey ="";
				( trail.length > 1 ) ? 	fullkey = trail.toString() + "." + key : fullkey = key;
				if ( keylookup == fullkey ) {
				        found = jsonObj[key];	        
						return found;
				}
			}
		
	    }    
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