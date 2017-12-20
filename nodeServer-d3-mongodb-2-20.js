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
    bodyParser = require('body-parser'),
    //Path = '/Users/ghudman/Documents/DataDiscoveryHub/Mongodb/',
    Path = process.env.NODE_PATH,
    api_path = 'http://132.249.238.150:8080/foundry/api/cinergi/docs/orig/cinergi-0002'; //http://test.geothermaldata.org',

    md_api = require(Path + "/js/cin-mdpackage.js"),
    ta_api = require(Path + "/js/typeahead.js");

var MongoClient = require('mongodb').MongoClient,
    f = require('util').format,
    assert = require('assert');
  
var MdbSD_url = 'mongodb://pipeline2:Ap4Pipeline!@132.249.238.128:27017/discotest?authMechanism=SCRAM-SHA-1';

var htmObj = "",
    default_json = "f2-min3.json";

console.log(' env ' + Path);
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));

app.get('/' , function(req,res) {
      console.log('Remote IP ' + req.connection.remoteAddress);
      res.sendFile(Path+'/public/treeEditorMongoDb.htm');
} );

app.get('/mdb' , function(req,res) {
      res.sendFile(Path+'/public/mongo-api.htm');
} );

app.get('/indent' , function(req,res) {
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

app.get('/md_get_package', function(req,res) {
  var pid = req.query.pid; 

  var hurl = api_path + '/api0/3/action/package_show?id='+pid;
  hurl = api_path + '?docId=' + pid; 
  console.log(' get package ' + hurl);
  request(hurl, function (error, response, body) {
      console.log(' error ' + error + ' ' + response.statusCode);

      if (!error && response.statusCode == 200) {
          mdbody = JSON.parse(body);
          console.log(' md_get_package body ' + body.length );
          //obj = mdbody.result;
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
    console.log('Get record test ID ' + rid );
	
	MongoClient.connect(MdbSD_url,
		function(err, db) { 
			console.log('error is ' + err);
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
			console.log('Done');

		});
	
});


app.get('/get_sources', function(req, res){
	
	console.log('Get source test');
	MongoClient.connect(MdbSD_url, function(err, db) {
	  // Get an additional db
	  if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	  } else {
		console.log('Connection established to', MdbSD_url);
	  
        // Get the source collection
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
					console.log('Found:', JSON.stringify(result));
					res.send(result); 
			  	} else {
				console.log('No document(s) found with defined "find" criteria!');
			  }	
			});
        
		}

		console.log('Done');
		db.close();
	});
	
});

app.get('/cin_extract', function(req,res) {
// Cinergi - this route receives a request from the editor page
// Three step process - get the full package, strip the md_package, then translate to an editor page
// the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var rid = req.query.pid;
	var schemafile = req.query.schema;
	var mdjson;

	(typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	for (var key in d3file) {
	  console.log('cinergi extract -  Schema key: ' + key + ' value: ' + d3file[key] ); 
	  if ( key == 'root' ) {
			rootObj = d3file['root'];
			rootType = d3file['rootType'];
			rootKey = d3file['rootKey'].keyvalue;
			break;
	  }
	}

	MongoClient.connect(MdbSD_url, function(err, db) { 
        // Get the source collection

		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			console.log('Connection established to', MdbSD_url);
			var colRec = db.collection('records');

			colRec.find( { 'primaryKey' : rid }).toArray(function (err, result) {
				  
				   
				   if (err) {
						console.log(err);
						res.send(err); 
			  		} else if (result.length) {
			  			var rootrec = {};
			  			
			  			if ( Array.isArray(result) ) {
			  				rootrec = result[0];
			  			} else { rootrec = result }
                    
                        var mxbody = rootrec;
			  			var d3proc = md_api.altmap(d3file, mxbody);
			  				  			
						res.send(d3proc); 
			  		}
			  		
			});

			db.close();			
		}

		console.log('Done');
		
	});


});

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
        //console.log(' response is ' + body );
     
        mdbody = JSON.parse(body);
        var d3proc = md_api.any(d3file, mdbody);

        //console.log(JSON.stringify(d3proc) );
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
  //res.send(stuff);

});

app.get('/typeahead', function(req,res) {
    var rscName = req.query.rsrc;
    var qfld = req.query.qfld;
    var qval = req.query.qval;
    var qStr = '{"field":"' + rscName + '","query":"' +  qfld + '","ref":"' + qval + '"}';

    console.log(' request ' + qStr);

    var lookup_obj = ta_api.ta_query(rscName,JSON.parse(qStr) );
    //console.log(' return ' + lookup_obj);

    res.send(lookup_obj);
    
} );


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


