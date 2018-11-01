/* JSON Editor V1.2
   G. Hudman
   Created: April 1, 2016
   Cinergi Version - for DDH
   Docker Version
   Oct 23, 2018
*/

process.env.NODE_PATH = __dirname;
var dotenv = require(process.env.NODE_PATH+'/node_modules/dotenv').config({path: process.env.NODE_PATH+'/.env'});
require('module').Module._initPaths();
console.log('Startup at ' + Date.now() + ' env ' + process.env.NODE_PATH);

var http = require('http'),
    fs = require("fs"),
    express = require('express'),
    app = express(),
    request = require('request'),
    urlExists = require('url-exists'),
    bodyParser = require('body-parser'),
    Path = process.env.NODE_PATH,
    xml2js = require('xml2js'),    
    api_path = process.env.API_PATH; 
    md_api = require(Path + "/js/cin-mdpackage.js"),
    ta_api = require(Path + "/js/typeahead.js");

var MongoClient = require('mongodb').MongoClient,
    Db = require('mongodb').Db,
    f = require('util').format,
    assert = require('assert');
  
var MdbSD_url = 'mongodb://' + process.env.MDB_USER + ':' + process.env.MDB_PASS + '@' + process.env.MDB_HOST + 
                ':' + process.env.MDB_PORT + '/discotest?authMechanism=SCRAM-SHA-1';
				
var MdSave_url =  'mongodb://' + process.env.MDB_USER + ':' + process.env.MDB_PASS + '@' + process.env.MDB_HOST + 
                ':' + process.env.MDB_PORT + '/discotest?authMechanism=SCRAM-SHA-1';
			
var htmObj = "",
    default_json = "f2-min3.json";

// Size limit - some records cause 413 POST cin_flush
app.use( bodyParser.json({limit: '50mb'}) );  
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));


function jToXML(data) {
	var builder = new xml2js.Builder({renderOpts: {pretty: true}});
  //console.log('a - processing xml ..');
	var xmlA = builder.buildObject(data);
  //console.log('b - processing xml ..');
    return xmlA;
}

function XMLtoJ(data) {
	var aj = {};
	 var parser = new xml2js.Parser({explicitArray: false, ignoreAttrs: false, mergeAttrs: false });
	 parser.parseString(data, function (err, result) {
        aj = md_api.mdKwPrep(result);
        console.log(' xml Parser ' );
    });
	 return aj;
}


app.get('/v1' , function(req,res) {
   
     if ( req.query.docId ) {
     console.log(' Headers for ' + req.query.docId + ' ---- ' + JSON.stringify(req.headers));
     var rd = req.query.docId;
     var r = require('request');
     var rurl = "http://localhost/indexID?docId="+req.query.docId;
     var body = '';
     
     console.log('Remote IP ' + req.connection.remoteAddress);
     
     r.get(rurl)
       .on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
    			var tb = JSON.parse(body);
          //console.log(' the type is ' + tb.indexID );
		    
  		  if ( tb.source && tb.source == 'US GIN (P)' ) {
             //console.log(' Go to XML ' + '/xml?docId='+rd);
             res.redirect('/xml?docId='+rd);
             //res.sendFile(Path+'/public/treeXML.htm/?docId='+rd);
          } else {
              //console.log(' Go to JSON ' + 'docId='+rd);
             res.sendFile(Path+'/public/treeEditorMongoDb.htm');
          }
    		    
     });
     
   } else {
    res.sendFile(Path+'/public/treeEditorMongoDb.htm');
   }
   
});

app.get('/' , function(req,res) {
	 console.log('Remote IP ' + req.connection.remoteAddress);
     res.sendFile(Path+'/public/treeXML.htm');
} );

app.get('/crescent' , function(req,res) {
	 console.log('Remote IP ' + req.connection.remoteAddress);
     res.sendFile(Path+'/public/crescentXML.htm');
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

app.get('/cintest', function (req,res) {
    var schemafile = req.query.schema;
    var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
    res.send(d3file);
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

app.post('/cin_flush', function(req,res) {
	// DDH - added 4/6 - the object and the diff are saved so ...
	// When user changes schema page, but is staying on the same record
	// the edited record from the client is applied to the schema request. Sends the same
	// record back along with the updated d3 object.

    console.log(' Flush Record ');
    var respStr = { 'result': 'POST MESSAGE Received' };

    var pbody = req.body;
  	var schemafile = pbody.schema; 
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
	  if (typeof(err) !== "undefined" && err) {
	    console.log('hasEdits Error ' + err + ' ' + MdbSD_url);
        res.send(err);
      } else {  
        var edRec = db.collection('editedRecords');	  
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

app.get('/getEditedDiffs', function(req,res) {
// returns true if edits exist
    console.log(' get Edited Records');
   	MongoClient.connect(MdbSD_url, function(err, db) {
      console.log(' connected to Edited Records');
      var edRec = db.collection('editedRecords');
      if (err) {
        res.send(err);
      } else {      
        edRec.find( {}, { _id: 0, primaryKey: 1, metadataRecordLineageItems: 1 } ).toArray(function (err, result) {
          console.log(' returnd from Edited Records');
          if (err) {
            res.send(err);
          } else {
            if (result) {
              res.send( JSON.stringify(result) );
            } else {
              res.send( { 'editedRecords' : 'false' } );
            }
          }
        });
      }
    });     
});

app.get('/get_foundry', function(req,res) {
	// Working version ***
  // This retrieves the prov from the mongoDB records collection 
  // not active for Docker Version
  
	var rid = unescape(req.query.docId);
	var schemafile = req.query.schema;
    var cip = req.connection.remoteAddress;
    console.log(cip + ' Foundry Record ' + rid);

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
		
		var colRec = db.collection('records');

		colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
			
			if (result.length) {
				var rootrec = {};
				var rtnRec = [];

				if ( Array.isArray(result) ) {
			  		rootrec = result[0];
			  	} else {
			  		rootrec = result[0];
			  	}

			  	if ( rootrec.History ) {
			  		rtnRec = rootrec.History
			  	} else {
			  		rtnRec = noData;
			  	}

          res.send(JSON.stringify(rtnRec)); 

			} else {
				  res.send(JSON.stringify(errData)); 
			  	rCheck = true;
			  	console.log('No Data Connection');

			}		
		});

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

// This function maps the docID to the geoportal index ID
app.get('/indexID', function (req,res) {
  var docID = unescape(req.query.docId);
  var udi = req.query.docId;
  //var rqSrc = req.query.getSource;
  
	var urlH = process.env.GPT_URL+'/rest/metadata/search?q=fileid:%22' + udi + '%22&f=json&size=5&pretty=false';
    console.log('indexID ' + urlH);
  
	request(urlH, function (error, response, body) {
		
		 if (error) {
			res.send('ERROR: 0' + error);
		  } else {
			 
        var nx = JSON.parse(body);
        if ( nx.hits ) {
          var h = nx.hits;
          if ( typeof(h.total) !== "undefined" && h.total != 0 && h.hits ) { 
          
              if ( Array.isArray(h.hits) ) {
              	var h2 = h.hits[0];	
              } else {  
              	h2 = h.hits; }
              
              if ( h2._id ) {
                   var idxID = { 'indexID' : h2._id };
                   res.send(idxID);
               }  else {
                 console.log('/indexID error-1 ' + docID); 
                 res.send('ERROR-1 No Id found'  ) }
          } else {
            console.log('/indexID error-2 ' + docID);
            res.send('ERROR-2') }
        }  else { 
            // if no hits then a single record maybe
            if ( nx.results ) {
              var rb = nx.results[0];
              var sn = { 'indexID' : rb.id };
              if ( rb._source ) {
                sn = { 'indexID' : rb.id, 'source' : rb._source.src_source_name_s }
              }
              console.log(JSON.stringify(sn) );
              res.send(sn);
            }
        }
       
     }
	})			

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

app.post('/cin_xml_index', function(req,res) { 
  // This route receives the json object from the app, converts back to XML and puts it to cinergi geoportal
  // Should not be active for Docker Version
  
	var pbody = req.body;
	var respStr = { 'result': 'POST MESSAGE Received' };
	var origD = pbody.OriginalDoc;
	var bodyXML = jToXML(origD);
    var docID = pbody.primaryKey;
    var indexId = pbody.indexId;
    console.log('The doc id is ' + docID);
  
    var body = '';
    
	function getAuth(indexId) {
		
		var Aurl = process.env.GPT_URL + '/geoportal/oauth/token';
		
		var ra = require('request'); 
		var bd = 'grant_type=password&client_id=geoportal-client&username='+ process.env.GPT_USER + '&password='+process.env.GPT_PASS ;
		var options = {
			url: Aurl,
			headers: {
				'Content-type' : 'application/x-www-form-urlencoded',
				'Content-length' : 82,
				'Connection': 'keep-alive'
			},
			body: bd
		};
	
		ra.post(options, function (error, response ) {
			console.log('auth ' + docID + ' ' + JSON.stringify(response) );
		
			var rb = response.body;
			var jb = JSON.parse(rb);
			var acto = jb.access_token;
			postUp(acto,indexId);
		});
		
	}
	
	function postUp(gat,indexId) {
	

        var purl = process.env.GPT_URL + '/rest/metadata/item/'+ indexId;
		console.log(' post url ' + purl);
		  
		var tfile = fs.readFileSync(Path+'/tempIdx.xml');
		
		 if ( tfile.length ) {
			  var tlen = tfile.length;
			  console.log(' Get XML Complete ' + tlen );
		 } else {       
		   var tlen = 0; 
		   console.log(' Get XML empty ' );
		 }
	 
		var options = {
			  url: purl,
			  headers: {
				'content-type' : 'application/xml',
				'content-length' : tlen 
			  }
		};
			
		var rpCode, cl;
		var rp = require('request'); 
					
		fs.createReadStream(Path+'/tempIdx.xml').pipe(
			rp.put(options)
			.auth(process.env.GPT_USER,process.env.GPT_PASS, true)
			.on ('error', function(err) {
				console.log('Put error ' + err);
			})
			.on('response', function(response) {
				if (response.statusCode) {
				  rpCode = response.statusCode;
				}

				if (response.request) {
				  if (response.request.headers) {
					 cl = response.request.headers['content-length'];
				  }
				}
				
			    if ( rpCode == '400' || rpCode == '405' ) {
					var rpv = { 'status' : 'Error', 'code' : rpCode, 'length' : 0 };
					console.log(' Put response ' + JSON.stringify(response) );
					res.send(rpv);
				}
				console.log(' Put response ' + JSON.stringify(response) );
			 })
			 .on('end',function() {
				console.log(' Reindex complete '); 
				var rpv = { 'status' : 'Complete', 'code' : rpCode, 'length' : cl };
				res.send(JSON.stringify(rpv));
			 }) 
		);				 	  
	}

	fs.writeFile(Path+'/tempIdx.xml',  bodyXML, (err) => {  
		// throws an error, you could also catch it here
		if (err) throw err;
		console.log('Posted body saved to temp!');
		getAuth(indexId);
			
	});
	
          
});


app.get('/md_reindex', function(req,res) {
    // This version gets the index from cinergi (pipelined) and puts it in the index
    // Disbled for Docker
	
	res.send(' Not active in this version');
	return;
	
	var docID = unescape(req.query.docId);
    var indexID = req.query.indexId;
    
    var hurl = process.env.FOUNDRY_URL+docID;
    
	var purl = process.env.GPT_URL + '/rest/metadata/item/'+ indexId;
	 
    console.log(' Reindex - 1 ' + hurl);
    var body = '';
    
    fs.writeFile("temp.xml", "", function(err) {
      if ( err ) {
          return console.log('Reindex - Temp file clear Error: ' + err);
      }
    });
    
    var r = require('request');   
    r.get(hurl)
    	.on ('error', function(err) {
    		console.log('Reindex - Get XML error ' + err);
    	})
    	.on ('response',function(response) {     
    		console.log('Reindex Get - ' + JSON.stringify(response) );
    	})
      .on ('data', function(chunk) {
        body += chunk;
      })
      .on ('end', function() {
        console.log(' xml file ' + Path+'/temp.xml');
         var tfile = fs.readFileSync(Path+'/temp.xml', 'utf8');
        
         if ( tfile.length ) {
              var tlen = tfile.length;
              console.log(' Get XML Complete' + tfile.length );
         } else {       
           var tlen = 0; 
           console.log(' Get XML empty ' );
         }
     
         var options = {
              url: purl,
              headers: {
                'content-type' : 'text/xml',
                'content-length' : tlen 
              }
            };
        
        var rpCode, cl;
        fs.createReadStream(Path+'/temp.xml').pipe(
            r.put(options)
            .auth(process.env.GPT_USER,process.env.GPT_PASS, true)
            .on('response', function(response) {
                if (response.statusCode) {
                  rpCode = response.statusCode;
                }
                
                if (response.request) {
                  if (response.request.headers) {
                     cl = response.request.headers['content-length'];
                  }
                }
                console.log(' Put response ' + JSON.stringify(response) );
             })
             .on('end',function() {
                console.log(' Reindex complete '); 
                res.send('Complete - status' + rpCode + ' Length ' + cl );
             }) 
        );    
         
      })
      .pipe(fs.createWriteStream(Path+'/temp.xml'));
                  
});

app.get('/cin_xml', function(req,res) { 
    var qt = unescape(req.query.qt);
  	var docID = unescape(req.query.pid);
    var schemafile = unescape(req.query.schema);
    var indx = req.query.idx;
    
    if ( qt == 'f' ) { 
      //var hurl = 'http://132.249.238.151:8080/foundry/api/cinergi/docs/id/'+docID;
	  var hurl = process.env.FOUNDRY_URL + docID
    } else {
      var hurl = process.env.XML_URL+indx+'/xml';
	  
    }
    
	console.log(' schema file ' + schemafile);
	
    (typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
    var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
    
    var r = require('request');
  	var body = '';
 	var rtnRec = [];
    var rootRec = {};
    //console.log('Schema loaded --->>>  ' + schemafile); 
  	r.get(hurl)
  	    .on ('error', function(err) {
      		console.log('Get XML error ' + err);
      	})
      	.on ('response',function(response) {           		
      	})
        .on ('data', function(chunk) {
          body += chunk;
        })
        .on ('end', function() {
        
          var tj = XMLtoJ(body.trim());
    
          rootRec._id = docID;
          rootRec.primaryKey = docID;
          rootRec.Version = 1;
          rootRec.CrawlDate = "2018-03-02T23:00:15.343Z";
          rootRec.OriginalDoc = tj;
          rootRec.Data = {};
          rootRec.metadataRecordLineageItems = {};
		  
          console.log('cin_xml rootRec ' + rootRec._id + ' ' + rootRec.CrawlDate );
  
         	var d3proc = md_api.altmap(d3file, rootRec);
       
         	rtnRec.push(d3proc);
					rtnRec.push(rootRec);
          res.send(rtnRec);         
     });
         
});


app.post('/cin_xml_save2', function(req,res) { 
  //var docID = unescape(req.query.docId);
  //var indexID = req.query.indexId;
  
  var pbody = req.body;
 	var rootRec = pbody.body;
  console.log('xml_save-1'+rootRec.length);
  var respStr = { 'result': 'POST MESSAGE Received' };
  //var rid = pbody.primaryKey; //unescape(req.query.pid);
  //var src = pbody.SourceID;
  var origD = rootRec.OriginalDoc;
  //var edStatus = pbody.editStatus;
  //var pData = pbody.Data;
  //var mDiff = pbody.metadataRecordLineageItems;
  //var purl = 'http://132.249.238.169:8080/geoportal/rest/metadata/item/'+ indexID;
 
  var bx = jToXML(origD);
  
  respStr = { 'result': bx };
  console.log('xml_save-length ' + bx.length ); 
  //res.header('Content-Type', 'text/xml');
  console.log('res header'); 
  res.set({ 'content-type': 'application/json; charset=utf-8' })
  res.send(respStr);
  //res.send(bx);  
  
   console.log('xml_save-2'+typeof(bx));
  //respStr = { 'result': bx };
  //res.send(respStr);  
  
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
  /// Three step process - get the full package, strip the md_package, then translate to an editor page JSON
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var rid = unescape(req.query.pid);
	var schemafile = req.query.schema;
	var mdjson;

   
    var cip = req.connection.remoteAddress;
    console.log(cip + ' Extract Record ' + rid);

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

/* Cinergi DDH GetRecords Search with elastic */

app.get('/DDH-GetRecords-Qry' , function(req,res) {

	  var baseRef= process.env.BASE_REF;
	  var inp = req.query.q;
	  var  startP = req.query.from;
	  var gpq = { "query": {
				        "bool" : {
				            "must" : {
				                "match_all" : {}
				            },
				            "filter" : {
				                "geo_polygon" : {
				                    "person.location" : {
				                        "points" : [
				                        {"lat" : 40, "lon" : -70},
				                        {"lat" : 30, "lon" : -80},
				                        {"lat" : 20, "lon" : -90}
				                        ]
				                    }
				                }
				            }
				        }
				    }
				};

	  var gpStr = JSON.stringify(gpq);

	  var inParams = '&from='+startP+'&q='+inp;
	  console.log('cinergi base ' + baseRef + ' ' + inParams);

      var optPack = {};

	  request(baseRef+inParams, 
	  	function (error, response, body) {
	      console.log(' error ' + error + ' ' + response.statusCode);

	      if (!error && response.statusCode == 200) {
	          var mdbody = JSON.parse(body);
	          console.log(' md_get_package body ' + body.length );
	          res.send(mdbody);
	      } else {
	          res.send('error: ' + error);
	      }

	    });

} );

 
/* Cinergi DDH Save */

app.post('/update_cinRec' , function(req,res) { 
// This will write the OriginalDoc and the lineage diff to the editedRecord Collection
// Currently writes to the record.OriginalDoc locally.

  var pbody = req.body;
  var rid = pbody.primaryKey;
  var src = pbody.SourceID;
  var origD = pbody.OriginalDoc;
  var edStatus = pbody.editStatus;
  var pData = pbody.Data;
  var mDiff = pbody.metadataRecordLineageItems;

  var respStr = { 'result': 'POST MESSAGE Received' };

  var pK = JSON.stringify(rid);
  var sID = JSON.stringify(src);

  var sData = JSON.stringify(pbody);
  var sProcD = JSON.stringify(pData);


  console.log(' saving: ' + JSON.stringify(rid) + '  data : ' + JSON.stringify(sProcD) );

   MongoClient.connect(MdSave_url, function(err, db) { 
   		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else { 
			
			var colRec = db.collection('editedRecords');
			// Save whole record not parts
            colRec.update(	{ 'primaryKey' : pK }, 
            				{ 'primaryKey' : pK , 'sourceID' : sID, 
                      'editStatus': edStatus, 
                      'Data' : pData, 
                      'metadataRecordLineageItems' : mDiff }, 
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

app.use(bodyParser.json({"strict":"false"}))

app.use(function (req, res, next) {
  next()
})

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

console.log(' this far  ' + app.get('port'));

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


