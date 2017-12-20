/* JSON Editor V1.2
   G. Hudman
   Created: April 1, 2016
   Cinergi Version - for DDH
   Feb 15, 2017
*/

process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

var http = require('http'),
    fs = require("fs"),
    express = require('express'),
    app = express(),
    request = require('request'),
    urlExists = require('url-exists'),
    bodyParser = require('body-parser'),
    Path = process.env.NODE_PATH,
    api_path = 'http://132.249.238.150:8080/foundry/api/cinergi/docs/orig/cinergi-0002'; 

    md_api = require(Path + "/js/cin-mdpackage.js"),
    // dbp = require(Path + "/js/cin-mdb-lib.js"),
    ta_api = require(Path + "/js/typeahead.js");

var MongoClient = require('mongodb').MongoClient,
    Db = require('mongodb').Db,
    f = require('util').format,
    assert = require('assert');
  
var MdbSD_url = 'mongodb://pipeline2:Ap4Pipeline!@132.249.238.128:27017/discotest?authMechanism=SCRAM-SHA-1';
//var MdSave_url = 'mongodb://127.0.0.1:27017/test';
var MdSave_url =  'mongodb://pipeline2:Ap4Pipeline!@132.249.238.128:27017/discotest?authMechanism=SCRAM-SHA-1';


var htmObj = "",
    default_json = "f2-min3.json";

console.log(' Executing in >  ' + Path);
// Size limit - some records cause 413 POST cin_flush
app.use( bodyParser.json({limit: '50mb'}) );  
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));

app.get('/' , function(req,res) {
	  console.log('Remote IP ' + req.connection.remoteAddress);
      res.sendFile(Path+'/public/treeEditorMongoDb.htm');
} );

app.get('/debug' , function(req,res) {
	   console.log('Remote IP ' + req.connection.remoteAddress);
     res.sendFile(Path+'/public/treeEditorMongoDb-debug.htm');
} );

app.get('/mdb' , function(req,res) {
      res.sendFile(Path+'/public/mongo-api.htm');
} );

app.get('/schema' , function(req,res) {
      res.sendFile(Path+'/public/schema-builder.htm');
} );


app.get('/indent', function(req,res) {
      res.sendFile(Path+'/public/indentEditor.htm');
} );

app.get('/jsonDictionary.json' , function(req,res) {
	res.sendFile(Path+'/public/jsonDictionary.json');
} );

app.get('/md_data' , function(req,res) {
    res.sendFile(Path+'/md_example.json');
});

app.get('/publish/faq' , function(req,res) {
    res.sendFile(Path+'/public/faq.htm');
});

// NGDS route
app.get('/md_get_package', function(req,res) {
  var pid = req.query.pid; 

  var hurl = api_path + '/api0/3/action/package_show?id='+pid;
  hurl = api_path + '?docId=' + pid; 
  
  request(hurl, function (error, response, body) {
      console.log(' error ' + error + ' ' + response.statusCode);

      if (!error && response.statusCode == 200) {
          mdbody = JSON.parse(body);
          console.log(' md_get_package body ' + body.length );
          res.send(mdbody);
      } else {
          res.send('error: ' + error);
      }

    });
  });


app.get('/cintest', function (req,res) {
    var schemafile = req.query.schema;
    var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
    res.send(d3file);

});

app.get('/getrecord', function (req,res) {
   
    var rid = req.query.pid;
    ( !rid ) ? rid =  '542819e4e4b09ea5964f9138' : rid = rid;

	
	MongoClient.connect(MdbSD_url,
		function(err, db) { 
			console.log(' /getrecord error is ' + err);
			assert.equal(null, err);
			
			if (err) {
				console.log('Unable to connect to the mongoDB server. Error:', err);
				res.send('Unable to connect to the mongoDB server. Error:' + err); 
			} else {
				console.log('Connection established to', MdbSD_url);
				
				var colRec = db.collection('records');
				colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
				
					   if (err) {
							console.log(err);
				  		} else if (result.length) {
				  			var rootrec = {};
				  			if ( Array.isArray(result) ) {
			  					rootrec = result[0];
			  					} else { rootrec = result }
	
				  			
							res.send(rootrec);
							db.close();				 
				  		}
				});	
			}

		});
	
});


app.get('/get_sources', function(req, res){
	
	MongoClient.connect(MdbSD_url, function(err, db) {
	  // Get an additional db
	  if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	  } else {
		console.log('Connection established to', MdbSD_url);
	  
		var colSrc = db.collection('sources');
		
		var jtb = colSrc.aggregate( 
			[ 
				{ 	$group: 
						{ '_id' : { 'rid' : '$sourceInformation.resourceID', 'name' : '$sourceInformation.name' } } 
				} 
			] ).toArray(function(err, result) {
				if (err) {
					console.log(err);
			  	} else if (result.length) {
					// console.log('Found:', JSON.stringify(result));
					res.send(result); 
			  	} else {
				console.log('No document(s) found with defined "find" criteria!');
			  }	
			});
        
		}

		db.close();
	});
	
});

// Prototype - untested

app.get('/get_auth', function(req, res){
	// Simple user collection lookup
	var userName = req.query.uname;
    var pw = req.query.pw;
    console.log( ' auth ' + userName + ' : ' + pw);

	MongoClient.connect(MdbSD_url, function(err, db) {
	  	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	  	} else {
		console.log('Connection established to', MdbSD_url);
		var colUser = db.collection('users');
	    colUser.find( { 'username' : userName, 'password' : pw }).toArray(function (err, result) {
	    	console.log( ' Auth CB ' + JSON.stringify(err) + JSON.stringify(result) );
	    	if ( !result || err ) {
                console.log(' no auth error' + JSON.stringify(err));
	    		res.send(err);
	    	} else {
	    		if ( result.length ) {
	    			console.log(' auth ! '  + JSON.stringify(result));
	    			var AuthRtn = {};
	    			AuthRtn.username = result.username;
	    			res.send(result);	
	    		} else {
	    			console.log(' no auth no err' );
	    			res.send({'data': 'NOAUTH'});
	    		}
	    	}
	    });
		}	
		db.close();
	});
});


app.get('/cin_extract', function(req,res) {
	// Works - not save version
	/// Cinergi - this route receives a request from the editor page
  /// Three step process - get the full package, strip the md_package, then translate to an editor page
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var rid = unescape(req.query.pid);
	var schemafile = req.query.schema;
	var mdjson;

    //var cip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    var cip = req.connection.remoteAddress;
    console.log(cip + ' Extract Record ' + rid);
    //console.log(MdbSD_url);

	(typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	for (var key in d3file) {
	  console.log('DDH  -  Schema key ' + key + ' value ' + d3file[key] ); 
	  if ( key == 'root' ) {
			rootObj = d3file['root'];
			rootType = d3file['rootType'];
			rootKey = d3file['rootKey'].keyvalue;
			break;
	  }
	}

	var noData = { "name":"Server Response", 
				   "value":"No Data Found for ID: " + rid, 
				   "datatype" : "object",
				   "xoffset" : -600,
					"yoffset" : 300
				};
	
	var noCon = {  "name":"Server Response", 
				   "value":"Connection Error", 
				   "datatype" : "object",
				   "xoffset" : -600,
				   "yoffset" : 300
				};

    var rCheck = false;
	MongoClient.connect(MdbSD_url, function(err, db) { 
  
		if (err) {
			console.log ('Connect error: ' +JSON.stringify(err));
			res.send(noData);
			return;
		} else {
			console.log('Connection established ');
			var colRec = db.collection('records');

			colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
				   // assert.equal(null, err);
        			//assert.equal(1, result);
				   rCheck = false;			  
				   if (err) {
						console.log(err);
						(!rCheck) ? res.send(JSON.stringify(noCon)) : console.log('ERROR Previously sent ' + err); 
						rCheck = true;
			  		} else if (result.length) {
			  			var rootrec = {};
			  			var rtnRec = [];

			  			if ( Array.isArray(result) ) {
			  				rootrec = result[0];
			  			} else { rootrec = result }
                    
                        var mxbody = rootrec;
			  			var d3proc = md_api.altmap(d3file, mxbody);
						rtnRec.push(d3proc);
						rtnRec.push(mxbody);

						console.log('Success' + rCheck);
						(!rCheck) ? res.send(rtnRec) : console.log('DATA Previously Sent'); 
						rCheck = true;	
			  		} else {
			  			(!rCheck) ? res.send(JSON.stringify(noData) ) : console.log('No Data - sent') ; 
			  			rCheck = true;
			  			console.log('No Data A');
			  		}

			});	
			
		}
		db.close();
		console.log('Mongo Connection Closed');		
		
	});

});

app.post('/cin_flush', function(req,res) {
	// DDH - added 4/6 - the object and the diff are saved so ...
	// When user changes schema page, but is staying on the same record
	// the edited record from the client is applied to the schema request. Sends the same
	// record back along with the updated d3 object.

    console.log(' Flush Record ');
    var respStr = { 'result': 'POST MESSAGE Received' };

    var pbody = req.body;
  	var schemafile = pbody.schema; //'50578a99e4b01ad7e0281d9b'; //unescape(req.query.pid);
  	var rootRec = pbody.body;

  	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  	var d3proc = md_api.altmap(d3file, rootRec);	

  	var rtnRec = [];
  	rtnRec.push(d3proc);
	rtnRec.push(rootRec);

    res.send(JSON.stringify(rtnRec) );


});

app.get('/hasMdEdits', function(req,res) {
// returns true if edits exist

    var rid = unescape(req.query.docId);
   	MongoClient.connect(MdbSD_url, function(err, db) { 
      var edRec = db.collection('editedRecords');
      if (err) {
        res.send(err);
      } else {      
        rid = '"' + rid + '"';
        edRec.find( { 'primaryKey' : rid }).count(function (ederr, edresult) {
          if (ederr) {
            res.send(ederr);
          } else {
            if (edresult) {
              res.send({ 'edited' : 'true' } );
            } else {
              res.send( { 'edited' : 'false' } );
            }
          }
        });
      }
    });     
});

app.get('/getDiff', function(req,res) {
// returns true if edits exist

    var rid = unescape(req.query.docId);
   	MongoClient.connect(MdbSD_url, function(err, db) { 
      var edRec = db.collection('editedRecords');
      if (err) {
        res.send(err);
      } else {      
        rid = '"' + rid + '"';
        edRec.find( { 'primaryKey' : rid }).toArray(function (ederr, edresult) {
          if (ederr) {
            res.send(ederr);
          } else {
            if (edresult) {
              	if (edresult.length) { 
						      var edroot = {};
      						if ( Array.isArray(edresult) ) {
      					  		edroot = edresult[0];                           
      					  	} else { edroot = edresult }
                  	if ( edroot.metadataRecordLineageItems ) {
      					  		var difRec = edroot.metadataRecordLineageItems;
      					  	} else {
                      var difRec = { 'metadataRecordLineageItems' : 'null' };
                    }
                    var dR = '<pre>' + JSON.stringify(difRec,null,'   ') + '</pre>';
                    res.send(dR);                                  
                } else {
                   res.send( { 'editedRecords' : 'empty' } );
                }          
              
            } else {
              res.send( { 'editedRecords' : 'null' } );
            }
          }
        });
      }
    });
      
});

app.get('/url_header', function (req,res) {
	var urlH = req.query.url;
  
	request(urlH, function (error, response, body) {
		
		 if (error) {
			res.send('ERROR: ' + error);
		  } else {
			  
			if ( response.statusCode ) {
				 var sCode = response.statusCode;
			} else {  var sCode = 'empty'; }
			
			if ( response.headers ) {
				var hdr = response.headers;
				var csize = hdr["content-length"];
                var ctype = hdr["content-type"];
               		
			} else {  
				var hdr = 'empty';
				var csize = 0 ;
                var ctype = 'unknown';         
			}
			
			if ( response.request ) {
				var rsp = response.request;
			} else { rsp = 'empty' }
			
			var rurl = { 'statusCode' : sCode, 'content-length' : csize, 'content-type' : ctype, 'request' : rsp }
	     	res.send(rurl);
	      }

	})			

});

app.get('/cin_get', function(req,res) {
	// Working version ***
   /// Cinergi - this route receives a request from the editor page
   /// 4 step process - get the full package, see if there are edit records, 
   //    Overwrite OriginalDoc if they do, translate to an editor page
   //    then send the translated UI schema and the json record to client

	var rid = unescape(req.query.pid);
	var schemafile = req.query.schema;
    var cip = req.connection.remoteAddress;
    console.log(cip + ' Extract Record ' + rid);

	(typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
    var errData = { "name":"Server Response", 
				   "value":"No Database Connection", 
				   "datatype" : "object",
				   "xoffset" : -600,
				   "yoffset" : 300
				};
	var noData = { "name":"Server Response", 
				   "value":"No Data Found for ID: " + rid,  
				   "datatype" : "object",
				   "xoffset" : -600,
				   "yoffset" : 300
				};

	var rCheck = false;
	MongoClient.connect(MdbSD_url, function(err, db) { 

	    if ( err ) {
			console.log ('Connect error: ' +JSON.stringify(err));
			res.send(errData);
			return;
		}
		var edRec = db.collection('editedRecords');
		var colRec = db.collection('records');

		colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
			
			if (result.length) {
				var rootrec = {};
				var rtnRec = [];

				if ( Array.isArray(result) ) {
			  		rootrec = result[0];
			  	} else { rootrec = result }
			  	rid = '"' + rid + '"';
				edRec.find( { 'primaryKey' : rid }).toArray(function (ederr, edresult) {
					console.log(' edit records exist ' + JSON.stringify(edresult) + ' ' + ederr);

					if (edresult.length) { 
						var edroot = {};
						if ( Array.isArray(edresult) ) {
					  		edroot = edresult[0];
					  	} else { edroot = edresult }

					  	if ( edroot.OriginalDoc ) {
					  		rootrec.OriginalDoc = edroot.OriginalDoc;
					  	}

					  	rootrec.OriginalDoc = edroot.OriginalDoc;

					  	if ( edroot.metadataRecordLineageItems ) {
					  		rootrec.metadataRecordLineageItems = edroot.metadataRecordLineageItems;
					  	}

					  	if ( edroot.Data ) {
					  		rootrec.Data = edroot.Data;
					  	}

					  	var d3proc = md_api.altmap(d3file, rootrec);
						rtnRec.push(d3proc);
						rtnRec.push(rootrec);
						(!rCheck) ? res.send(rtnRec) : console.log('DATA Previously Sent'); 
						rCheck = true;	
					} else {
					// records but no edits
						var mxbody = rootrec;
			  			var d3proc = md_api.altmap(d3file, mxbody);
						rtnRec.push(d3proc);
						rtnRec.push(mxbody);
						(!rCheck) ? res.send(rtnRec) : console.log('DATA Previously Sent'); 
						rCheck = true;	
					}				
				});
			} else {
				(!rCheck) ? res.send(JSON.stringify(noData) ) : console.log('No Data - sent') ; 
			  	rCheck = true;
			  	console.log('No Data');

			}		
		});

	});

});

//This route is not a working version
app.get('/cin_getEdRec', function(req,res) {
   /// Cinergi - this route receives a request from the editor page
  /// Three step process - get the full package, strip the md_package, then translate to an editor page
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var rid = unescape(req.query.pid);
	var schemafile = req.query.schema;
	var mdjson;

    //var cip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    var cip = req.connection.remoteAddress;
    console.log(cip + ' Extract Record ' + rid);
    //console.log(MdbSD_url);

	(typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	for (var key in d3file) {
	  console.log('DDH  -  Schema key ' + key + ' value ' + d3file[key] ); 
	  if ( key == 'root' ) {
			rootObj = d3file['root'];
			rootType = d3file['rootType'];
			rootKey = d3file['rootKey'].keyvalue;
			break;
	  }
	}

	var noData = { "name":"Server Response", 
				   "value":"No Data Found", 
				   "datatype" : "object",
				   "xoffset" : -600,
					"yoffset" : 300
				};
	
	var noCon = {  "name":"Server Response", 
				   "value":"Connection Error", 
				   "datatype" : "object",
				   "xoffset" : -600,
				   "yoffset" : 300
				};

    var rCheck = false;
	MongoClient.connect(MdbSD_url, function(err, db) { 
  
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			console.log('Connection established ');
			var colRec = db.collection('editedRecords');

			colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
				   // assert.equal(null, err);
        			//assert.equal(1, result);
				   rCheck = false;			  
				   if (err) {
						console.log(err);
						(!rCheck) ? res.send(JSON.stringify(noCon)) : console.log('ERROR Previously sent ' + err); 
						rCheck = true;
			  		} else if (result.length) {
			  			var rootrec = {};
			  			var rtnRec = [];

			  			if ( Array.isArray(result) ) {
			  				rootrec = result[0];
			  			} else { rootrec = result }
                    
                        var mxbody = rootrec;
			  			var d3proc = md_api.altmap(d3file, mxbody);
						rtnRec.push(d3proc);
						rtnRec.push(mxbody);

						console.log('Success' + rCheck);
						(!rCheck) ? res.send(rtnRec) : console.log('DATA Previously Sent'); 
						rCheck = true;	
			  		} else {
			  			(!rCheck) ? res.send(JSON.stringify(noData) ) : console.log('No Data - sent') ; 
			  			rCheck = true;
			  			console.log('No Data A');
			  		}

			});	
			
		}
		db.close();
		console.log('Mongo Connection Closed');
		
	});

});


/* Cinergi DDH Save */

app.post('/update_cinRec' , function(req,res) { 
// This will write the OriginalDoc and the lineage diff to the editedRecord Collection
// Currently writes to the record.OriginalDoc locally.

  //var rid = '50578a99e4b01ad7e0281d9b'; //unescape(req.query.pid);
  var pbody = req.body;
  var rid = pbody.primaryKey; //'50578a99e4b01ad7e0281d9b'; //unescape(req.query.pid);
  var src = pbody.SourceID;
  var origD = pbody.OriginalDoc;
  var edStatus = pbody.editStatus;
  var pData = pbody.Data;
  var mDiff = pbody.metadataRecordLineageItems;

  var respStr = { 'result': 'POST MESSAGE Received' };
  //if ( pbody.id ) { rid = pbody.id }
  var pK = JSON.stringify(rid);
  var sID = JSON.stringify(src);

  var sData = JSON.stringify(pbody);
  var sProcD = JSON.stringify(pData);

  //var origD = pbody.OriginalDoc,
  //    linD = sData.metadataRecordLineageItems;

  console.log(' saving: ' + JSON.stringify(rid) + '  data : ' + JSON.stringify(sProcD) );

   MongoClient.connect(MdSave_url, function(err, db) { 
   		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else { 
			//var colRec = db.collection('records');
			var colRec = db.collection('editedRecords');
			// Save whole record not parts
            colRec.update(	{ 'primaryKey' : pK }, 
            				{ 'primaryKey' : pK , 'sourceID' : sID,'editStatus': edStatus, 'OriginalDoc' : origD, 'Data' : pData, 'metadataRecordLineageItems' : mDiff }, 
            				{ upsert: true },
            	function(err, object) {
			      if (err){
			      	  respStr.result = 'MongoDB Error ' + err.message;
			      	  console.log(JSON.stringify(respStr));
			      	  res.send(JSON.stringify(respStr) );
			           // returns error if no matching object found
			      } else {
			      	  respStr.result = 'MongoDB Post: ID ' + rid;
			      	  res.send(JSON.stringify(respStr) );
			          console.log(JSON.stringify(respStr));
			      }
			  }
			);
        }
    });
});

            /*
			colRec.updateOne( { 'primaryKey' : rid }, 
							  { $set: { "OriginalDoc" : origD },
							          { "jmd:metadataRecordLineageItems" : linD }   },

							  { upsert: true }, // options
							  function(err, object) {
							      if (err){
							      	  respStr.result = 'MongoDB Error ' + err.message;
							      	  console.log(JSON.stringify(respStr));
							      	   res.send(JSON.stringify(respStr) );
							            // returns error if no matching object found
							      }else {
							      	  respStr.result = 'MongoDB Post: ID ' + rid;
							      	  res.send(JSON.stringify(respStr) );
							          console.log(JSON.stringify(respStr));
							      }
							  }
							);
			*/

		


app.get('/md_extract', function(req,res) {
  /// NGDS route - this route receives a request from the editor page
  /// Three step process - get the full package, strip the md_package, then translate to an editor page
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var pid = req.query.pid;
	var schemafile = req.query.schema;

	(typeof(schemafile) == "undefined") ? schemafile = "f2-min3.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	console.log('md_extract - Schema file ' + schemafile); 

	for (var key in d3file) {
	 
	  if ( key == 'root' ) {
			rootObj = d3file['root'];
			rootType = d3file['rootType'];
			rootKey = d3file['rootKey'].keyvalue;
			break;
	  }
	}


	var hurl = api_path + '?docId=' + pid; 

	exports.altmap = (function(d3json, mdjson) { 
		var kp;
		var newJson = altransverse(d3json,kp,mdjson);
		return newJson;
	});

	request(hurl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
  
     
        mdbody = JSON.parse(body);
        var d3proc = md_api.any(d3file, mdbody);
        res.send(d3proc); 

      } else {
       		res.send('error: ' + error);
      }
    });
});

app.use(bodyParser.json({"strict":"false"}))

app.use(function (req, res, next) {
  next()
})

/* NGDS Save */
app.post('/save_fullpackage' , function(req,res) { 

  var stuff = {"result": "Node start save .. "};

  var sData = JSON.stringify(req.body);
  console.log(' saving: ' + JSON.stringify(req.body) );

  var hurl = api_path + '/api/3/action/package_update';

  //request.debug = true;

  var options = {url: hurl, 
                method: "POST",
                json: true,
                body : req.body,
                headers: {
                  'Authorization' :'aefb912c-2865-479a-82ec-f3055faeba55',
                  'sendImmediately': true,
                  dataType: "json",
                  contentType: "application/json"
                }
              };
  
  var rtnRes = function(err, httpResponse, body) {
                  if (err) {
                      stuff = {"result": "Save error : " + err};
                      console.error('upload failed:', err);
                  } else {

                   stuff = {"result": "Upload response: " + body};
                   console.log('Upload response ' + httpResponse + ' body:', body);
                  // res.send(stuff);
                }
              }

  request.post(options, rtnRes);


});

app.get('/url_status', function(req, res){
	 var urlToCheck = req.query.url;

	  console.log(' Url Check ' + urlToCheck )

	 	urlExists(urlToCheck, function(err,exists) {
	 		res.send(exists);
	 	});
    
});

// Local typeahead dictionary
app.get('/typeahead', function(req,res) {
    var rscName = req.query.rsrc;
    var qfld = req.query.qfld;
    var qval = req.query.qval;
    var qStr = '{"field":"' + rscName + '","query":"' +  qfld + '","ref":"' + qval + '"}';

    console.log(' request ' + qStr);

    var lookup_obj = ta_api.ta_query(rscName,JSON.parse(qStr) );
    res.send(lookup_obj);
    
} );

app.get('/place', function(req,res) {
    var hurl = req.query.urxl;
    hurl = hurl.replace(/QQQ/g,'?');
    hurl = hurl.replace(/---/g,'&');
    hurl = hurl.replace(/ /g,'+');
    
    //console.log(' place ' + hurl);
	  request(hurl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
        //console.log('good place'+ JSON.stringify(body) );
        res.send(body); 

      } else {
          //console.log(' error ' + error);
       		res.send('error: ' + error);
      }
    });
});

app.get('/data.json' , function(req,res) {
    res.sendFile(Path+'/data.json');
} );

app.set('port', process.env.PORT || 80);

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


