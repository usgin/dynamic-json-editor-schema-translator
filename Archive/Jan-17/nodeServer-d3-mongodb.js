/* JSON Editor V1
   G. Hudman
   April 1, 2016
*/
var http = require('http'),
    fs = require('fs-extra'),
    express = require('express'),
    app = express(),
    request = require('request'),
    bodyParser = require('body-parser'),
    Path = '/home/cinergi/DDH/',

    api_path = 'http://cinergi.sdsc.edu/geoportal/rest/find/document?'; 
    md_api = require(Path + "/js/cin-mdpackage.js"),
    ta_api = require(Path + "/js/typeahead.js");

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
  
var MdbSD_url = 'mongodb://pipeline2:Ap4Pipeline!@132.249.238.128:27017/discotest?authMechanism=SCRAM-SHA-1';

var htmObj = "",
    default_json = "f2-min3.json";

app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));

app.get('/' , function(req,res) {
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
  hurl = api_path + '?docId=' + pid; //'/api/3/action/package_show?id='+pid;
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
    console.log('Get record test');
    var rid = req.query.pid;
    ( !rid ) ? rid =  '520a8723e4b0026c2bc46c98' : rid = rid;

	//var nnurl = 'mongodb://pipeline2:Ap4Pipeline!@132.249.238.128:27017/discotest?authMechanism=SCRAM-SHA-1';
	
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
				  			/*
				  			rootrec.name = 'root';
				  			if ( Array.isArray(result) ) {
				  				rootrec.children = result[0];
				  			} else {
				  				rootrec.children = result;
				  			}
				  			*/
				  			console.log(' returned ' + JSON.stringify(rootrec) );
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
	/// this route receives a request from the editor page
  /// Three step process - get the full package, strip the md_package, then translate to an editor page
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var rid = req.query.pid;
	var schemafile = req.query.schema;
	var mdjson;

	(typeof(schemafile) == "undefined") ? schemafile = "cinergi-mongodb.json" : schemafile = schemafile;
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	console.log('md_extract - Schema file ' + schemafile); 
	for (var key in d3file) {
	  console.log('md_extract -  Schema key ' + key + ' value ' + d3file[key] ); 
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
				   //console.log('cin extract found:', JSON.stringify(result));	
				   
				   if (err) {
						console.log(err);
			  		} else if (result.length) {
			  			var rootrec = {};
			  			//rootrec.name = 'root';
			  			//if ( Array.isArray(result) ) {
			  			//	rootrec.children = result[0];
			  			//} else {
			  			//	rootrec.children = result;
			  			//}
			  			if ( Array.isArray(result) ) {
			  				rootrec = result[0];
			  			} else { rootrec = result }
                        console.log('cin extract: ' + JSON.stringify(rootrec) ); 
                        var mxbody = rootrec;
			  			var d3proc = md_api.any(d3file, mxbody);
						console.log('d3 returned: ' + JSON.stringify(d3proc) ); 			  			
						res.send(d3proc); 
			  		}
			  		
			});			
		}

		console.log('Done');
		db.close();
		
	});


	/*
	console.log('map it');
	exports.altmap = (function(d3json, mdjson) { 
		var kp;
		var newJson = altransverse(d3json,kp,mdjson);
		return newJson;
	});


	request(hurl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
        console.log(' response is ' + body );
       
        mdbody = JSON.parse(body);
        var d3proc = md_api.any(d3file, mdbody);
        res.send(d3proc); 
        
      } else {
       		res.send('error: ' + error);
      }
    });
    */
});

app.get('/md_extract', function(req,res) {
	/// this route receives a request from the editor page
  /// Three step process - get the full package, strip the md_package, then translate to an editor page
  // the d3 json wants a url to pull in the formated json from
 
	var rootObj = 'empty',
      rootType,
      rootKey;

	var pid = req.query.pid;
	var schemafile = req.query.schema;
	// console.log('md_extract - incoming Schema file ' + schemafile);

	(typeof(schemafile) == "undefined") ? schemafile = "f2-min3.json" : schemafile = schemafile;
	//console.log('md_extract - ' + pid + ' ' + schemafile);
	var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
	console.log('md_extract - Schema file ' + schemafile); // + JSON.stringify(d3file));

	for (var key in d3file) {
	  //console.log('md_extract -  Schema key ' + key + ' value ' + d3file[key] ); 
	  if ( key == 'root' ) {
			rootObj = d3file['root'];
			rootType = d3file['rootType'];
			rootKey = d3file['rootKey'].keyvalue;
			break;
	  }
	}

	//console.log(' root object is a ' + rootObj + rootType + rootKey);

	var hurl = api_path + '?docId=' + pid; //OT.082012.26911.3'; ///api/3/action/package_show?id='+pid;

	//var hurl = pid;
	console.log("here " + hurl);

	exports.altmap = (function(d3json, mdjson) { 
		var kp;
		var newJson = altransverse(d3json,kp,mdjson);
		return newJson;
	});

	request(hurl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {
        console.log(' response is ' + body );
        //var jbody =  md_api.xmlToJson(body); 
        // console.log(' jbody is ' + jbody );
        mdbody = JSON.parse(body);
        var d3proc = md_api.any(d3file, mdbody);
        //var d3proc = md_api.any(d3file,jbody.records[0]);
	    //obj = mdbody.result;
        //var md_pkg = JSON.parse(mdbody);
        // var d3proc = md_api.any(d3file,jbody.records[0]); -- version for cinergi from searched api - doesnt work
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
  // sample jsons for testing
  //var mbig2 = {"license_title":null,"maintainer":null,"relationships_as_object":[],"private":false,"maintainer_email":null,"revision_timestamp":"2016-04-25T21:28:00.746917","id":"556aff22-6c84-4502-81f9-84c68d0b3526","metadata_created":"2015-11-13T00:21:53.825855","metadata_modified":"2016-04-25T22:24:57.178151","author":null,"author_email":null,"state":"active","version":null,"creator_user_id":"e420f293-09b7-4b7c-8ca2-02ad26cb0f0d","type":"dataset","resources":[{"resource_group_id":"1cabdb60-b7bd-4fc3-9f1e-597b1d9321e0","cache_last_updated":null,"revision_timestamp":"2015-11-20T18:31:04.838184","webstore_last_updated":null,"datastore_active":false,"id":"06db3230-3924-4a48-b585-6766db561de0","size":null,"state":"active","resource_locator_function":"","hash":"","description":"","format":"PDF","tracking_summary":{"total":0,"recent":0},"mimetype_inner":null,"url_type":null,"resource_locator_protocol":"","mimetype":null,"cache_url":null,"name":"Downloadable File","created":"2015-11-20T11:31:04.912624","url":"http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf","webstore_url":null,"last_modified":null,"md_resource":"{\"accessLink\": {\"linkObject\": {\"description\": null, \"url\": \"http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf\", \"linkTargetResourceType\": \"\", \"linkContentResourceType\": \"\", \"ogc_layer\": null, \"linkTitle\": \"Downloadable File\"}}, \"distributors\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"distributor\"}, \"organizationName\": \"Stanford University\"}}}]}","position":0,"revision_id":"d38e97f7-795b-400e-ad1a-61b108305f1b","resource_type":null}],"num_resources":1,"tags":[{"vocabulary_id":null,"display_name":"CHP","name":"CHP","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"33de9d90-bd16-4bce-b358-e037ed3462d8"},{"vocabulary_id":null,"display_name":"Geology","name":"Geology","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"4751203a-a298-4049-8766-ec921fb23c89"},{"vocabulary_id":null,"display_name":"Germany","name":"Germany","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"374d4fd2-52c5-4c4d-9db6-dbc90bdff949"},{"vocabulary_id":null,"display_name":"Neustadt-Glewe","name":"Neustadt-Glewe","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"580811f4-cd9f-423f-a21e-541a4b6d9d3f"},{"vocabulary_id":null,"display_name":"ORC","name":"ORC","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"2dfc5c6a-7851-45f8-a71a-f83d3b8b6f66"},{"vocabulary_id":null,"display_name":"operational data","name":"operational data","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"d61e2036-212c-4a58-8e6e-d90307f4d14e"},{"vocabulary_id":null,"display_name":"thermodynamic optimization","name":"thermodynamic optimization","revision_timestamp":"2015-11-13T00:21:53.825855","state":"active","id":"d867c545-7771-4071-8901-2b9dfa3626b9"}],"tracking_summary":{"total":0,"recent":0},"groups":[],"license_id":null,"relationships_as_subject":[],"num_tags":7,"organization":null,"name":"analysis-of-the-combined-heat-and-power-plant-neustadt-glewe","isopen":false,"url":null,"notes":"The first geothermal power plant in Germany is an extension of an existing heating plant. It was connected to the mains in November 2003. Since May 2004 the plant is in stable operation. However, the plant works permanently at part load since neither the temperature nor the available mass flow rate reach the design values. The plant provides data to analyze a low temperature organic Rankine cycle (brine temperature is below 100 ?C). A first check-up shows that despite part load the tuning of the process itself has turned out well. Remaining uncertainties concerning the specific heat capacity of the brine as well as the flow conditions in the geothermal loop prevent proper assessment of overall plant performance for the time being. These uncertainties will be cleared up by further measurements as well as by accompanying numerical modeling of the plant in the future.","owner_org":null,"extras":[{"key":"access_constraints","value":"[]"},{"key":"authors","value":"[{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Silke Kihler\", \"personPosition\": \"\", \"personRole\": \"originator\"}, \"organizationName\": \"World Geothermal Congress\"}}}]"},{"key":"bbox-east-long","value":"134.77"},{"key":"bbox-north-lat","value":"53.560974"},{"key":"bbox-south-lat","value":"18.1535216"},{"key":"bbox-west-long","value":"73.5"},{"key":"contact-email","value":"horne@stanford.edu"},{"key":"coupled-resource","value":"[]"},{"key":"dataset-reference-date","value":"[{\"type\": \"publication\", \"value\": \"2005-01-01T00:00:00\"}]"},{"key":"dataset_category","value":"{document:text}"},{"key":"frequency-of-update","value":""},{"key":"guid","value":"3aae7801-fd85-4de8-8c18-23649d193035"},{"key":"licence","value":"[]"},{"key":"lineage","value":"Geothermal papers database made available for dissemination in the NGDS Geothermal Data System Project (Stanford Geothermal Porgram, pangea.stanford.edu/ERE/research/geoth/publications/). Metadata harvested from the Stanford geothermal database and mapped to the NGDS USGIN metadata specification. Locations were geocoded using a python code based on the Google API."},{"key":"maintainers","value":"[{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"pointOfContact\"}, \"organizationName\": \"Stanford University\"}}}]"},{"key":"md_package","value":"{\"harvestInformation\": {\"originalFileIdentifier\": \"3aae7801-fd85-4de8-8c18-23649d193035\", \"harvestURL\": \"\", \"sourceInfo\": {\"harvestSourceName\": \"\", \"viewID\": \"\", \"harvestSourceID\": \"\"}, \"indexDate\": \"2005-01-01T00:00:00\", \"version\": \"1.2\", \"originalFormat\": \"ISO-USGIN\", \"crawlDate\": \"\"}, \"metadataProperties\": {\"metadataContact\": {\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"organizationURI\": \"\", \"individual\": {\"personName\": \"\", \"personPosition\": \"\", \"personURI\": \"\"}, \"organizationName\": \"Stanford University\", \"phoneNumber\": \"\", \"agentRoleLabel\": \"\", \"contactAddress\": \"\", \"agentRoleURI\": \"\"}}}}, \"resourceDescription\": {\"usginContentModelLayer\": \"\", \"geographicExtent\": [{\"westBoundLongitude\": \"73.5\", \"northBoundLatitude\": \"53.560974\", \"eastBoundLongitude\": \"134.77\", \"southBoundLatitude\": \"18.1535216\"}], \"citedSourceAgents\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Silke Kihler\", \"personPosition\": \"\", \"personRole\": \"originator\"}, \"organizationName\": \"World Geothermal Congress\"}}}], \"resourceAccessOptions\": {\"accessLinks\": [{\"linkObject\": {\"description\": null, \"url\": \"http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf\", \"linkTargetResourceType\": \"\", \"linkContentResourceType\": \"\", \"ogc_layer\": null, \"linkTitle\": \"Downloadable File\"}}], \"distributors\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"distributor\"}, \"organizationName\": \"Stanford University\"}}}]}, \"resourceContact\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"pointOfContact\"}, \"organizationName\": \"Stanford University\"}}}], \"resourceDescription\": \"The-first geothermal power plant in Germany is an extension of an existing heating plant. It was connected to the mains in November 2003. Since May 2004 the plant is in stable operation. However, the plant works permanently at part load since neither the temperature nor the available mass flow rate reach the design values. The plant provides data to analyze a low temperature organic Rankine cycle (brine temperature is below 100 ?C). A first check-up shows that despite part load the tuning of the process itself has turned out well. Remaining uncertainties concerning the specific heat capacity of the brine as well as the flow conditions in the geothermal loop prevent proper assessment of overall plant performance for the time being. These uncertainties will be cleared up by further measurements as well as by accompanying numerical modeling of the plant in the future.\", \"resourceTitle\": \"Analysis of the Combined Heat and Power Plant Neustadt-Glewe-xxx\", \"usginContentModelVersion\": \"\", \"citationDates\": {\"EventDateObject\": {\"dateTime\": \"2015-11-18T20:27:40\"}}}}"},{"key":"metadata-date","value":"2015-11-18T20:27:40"},{"key":"metadata-language","value":""},{"key":"other_id","value":"[\"http://www.opengis.net/def/nil/OGC/0/missing/2013-04-04T12:00:00Z\"]"},{"key":"progress","value":"completed"},{"key":"publication_date","value":"2005-01-01 00:00:00"},{"key":"quality","value":"{}"},{"key":"resource-type","value":"dataset"},{"key":"responsible-party","value":"[{\"name\": \"Stanford University\", \"roles\": [\"pointOfContact\"]}]"},{"key":"spatial","value":"{\"type\": \"Polygon\", \"coordinates\": [[[73.5, 18.1535216], [134.77, 18.1535216], [134.77, 53.560974], [73.5, 53.560974], [73.5, 18.1535216]]]}"},{"key":"spatial-data-service-type","value":""},{"key":"spatial-reference-system","value":""},{"key":"spatial_harvester","value":"true"},{"key":"status","value":"completed"}],"title":"Analysis of the Combined Heat and Power Plant Neustadt-Glewe-xxx","revision_id":"4f2164ba-674f-4f1f-a438-5e855f59c53b"};
  //var mbig = {"license_title": null, "maintainer": null, "relationships_as_object": [], "private": false, "maintainer_email": null, "revision_timestamp": "2016-04-25T21:28:00.746917", "id": "556aff22-6c84-4502-81f9-84c68d0b3526", "metadata_created": "2015-11-13T00:21:53.825855", "metadata_modified": "2016-04-25T22:24:57.178151", "author": null, "author_email": null, "state": "active", "version": null, "creator_user_id": "e420f293-09b7-4b7c-8ca2-02ad26cb0f0d", "type": "dataset", "resources": [{"resource_group_id": "1cabdb60-b7bd-4fc3-9f1e-597b1d9321e0", "cache_last_updated": null, "revision_timestamp": "2015-11-20T18:31:04.838184", "webstore_last_updated": null, "datastore_active": false, "id": "06db3230-3924-4a48-b585-6766db561de0", "size": null, "state": "active", "resource_locator_function": "", "hash": "", "description": "", "format": "PDF", "tracking_summary": {"total": 0, "recent": 0}, "mimetype_inner": null, "url_type": null, "resource_locator_protocol": "", "mimetype": null, "cache_url": null, "name": "Downloadable File", "created": "2015-11-20T11:31:04.912624", "url": "http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf", "webstore_url": null, "last_modified": null, "md_resource": "{\"accessLink\": {\"linkObject\": {\"description\": null, \"url\": \"http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf\", \"linkTargetResourceType\": \"\", \"linkContentResourceType\": \"\", \"ogc_layer\": null, \"linkTitle\": \"Downloadable File\"}}, \"distributors\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"distributor\"}, \"organizationName\": \"Stanford University\"}}}]}", "position": 0, "revision_id": "d38e97f7-795b-400e-ad1a-61b108305f1b", "resource_type": null}], "num_resources": 1, "tags": [{"vocabulary_id": null, "display_name": "CHP", "name": "CHP", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "33de9d90-bd16-4bce-b358-e037ed3462d8"}, {"vocabulary_id": null, "display_name": "Geology", "name": "Geology", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "4751203a-a298-4049-8766-ec921fb23c89"}, {"vocabulary_id": null, "display_name": "Germany", "name": "Germany", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "374d4fd2-52c5-4c4d-9db6-dbc90bdff949"}, {"vocabulary_id": null, "display_name": "Neustadt-Glewe", "name": "Neustadt-Glewe", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "580811f4-cd9f-423f-a21e-541a4b6d9d3f"}, {"vocabulary_id": null, "display_name": "ORC", "name": "ORC", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "2dfc5c6a-7851-45f8-a71a-f83d3b8b6f66"}, {"vocabulary_id": null, "display_name": "operational data", "name": "operational data", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "d61e2036-212c-4a58-8e6e-d90307f4d14e"}, {"vocabulary_id": null, "display_name": "thermodynamic optimization", "name": "thermodynamic optimization", "revision_timestamp": "2015-11-13T00:21:53.825855", "state": "active", "id": "d867c545-7771-4071-8901-2b9dfa3626b9"}], "tracking_summary": {"total": 0, "recent": 0}, "groups": [], "license_id": null, "relationships_as_subject": [], "num_tags": 7, "organization": null, "name": "analysis-of-the-combined-heat-and-power-plant-neustadt-glewe", "isopen": false, "url": null, "notes": "The first geothermal power plant in Germany is an extension of an existing heating plant. It was connected to the mains in November 2003. Since May 2004 the plant is in stable operation. However, the plant works permanently at part load since neither the temperature nor the available mass flow rate reach the design values. The plant provides data to analyze a low temperature organic Rankine cycle (brine temperature is below 100 ?C). A first check-up shows that despite part load the tuning of the process itself has turned out well. Remaining uncertainties concerning the specific heat capacity of the brine as well as the flow conditions in the geothermal loop prevent proper assessment of overall plant performance for the time being. These uncertainties will be cleared up by further measurements as well as by accompanying numerical modeling of the plant in the future.", "owner_org": null, "extras": [{"key": "access_constraints", "value": "[]"}, {"key": "authors", "value": "[{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Silke Kihler\", \"personPosition\": \"\", \"personRole\": \"originator\"}, \"organizationName\": \"World Geothermal Congress\"}}}]"}, {"key": "bbox-east-long", "value": "134.77"}, {"key": "bbox-north-lat", "value": "53.560974"}, {"key": "bbox-south-lat", "value": "18.1535216"}, {"key": "bbox-west-long", "value": "73.5"}, {"key": "contact-email", "value": "horne@stanford.edu"}, {"key": "coupled-resource", "value": "[]"}, {"key": "dataset-reference-date", "value": "[{\"type\": \"publication\", \"value\": \"2005-01-01T00:00:00\"}]"}, {"key": "dataset_category", "value": "{document:text}"}, {"key": "frequency-of-update", "value": ""}, {"key": "guid", "value": "3aae7801-fd85-4de8-8c18-23649d193035"}, {"key": "licence", "value": "[]"}, {"key": "lineage", "value": "Geothermal papers database made available for dissemination in the NGDS Geothermal Data System Project (Stanford Geothermal Porgram, pangea.stanford.edu/ERE/research/geoth/publications/). Metadata harvested from the Stanford geothermal database and mapped to the NGDS USGIN metadata specification. Locations were geocoded using a python code based on the Google API."}, {"key": "maintainers", "value": "[{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"pointOfContact\"}, \"organizationName\": \"Stanford University\"}}}]"}, {"key": "md_package", "value": "{\"harvestInformation\": {\"originalFileIdentifier\": \"3aae7801-fd85-4de8-8c18-23649d193035\", \"harvestURL\": \"\", \"sourceInfo\": {\"harvestSourceName\": \"\", \"viewID\": \"\", \"harvestSourceID\": \"\"}, \"indexDate\": \"2005-01-01T00:00:00\", \"version\": \"1.2\", \"originalFormat\": \"ISO-USGIN\", \"crawlDate\": \"\"}, \"metadataProperties\": {\"metadataContact\": {\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"organizationURI\": \"\", \"individual\": {\"personName\": \"\", \"personPosition\": \"\", \"personURI\": \"\"}, \"organizationName\": \"Stanford University\", \"phoneNumber\": \"\", \"agentRoleLabel\": \"\", \"contactAddress\": \"\", \"agentRoleURI\": \"\"}}}}, \"resourceDescription\": {\"usginContentModelLayer\": \"\", \"geographicExtent\": [{\"westBoundLongitude\": \"73.5\", \"northBoundLatitude\": \"53.560974\", \"eastBoundLongitude\": \"134.77\", \"southBoundLatitude\": \"18.1535216\"}], \"citedSourceAgents\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Silke Kihler\", \"personPosition\": \"\", \"personRole\": \"originator\"}, \"organizationName\": \"World Geothermal Congress\"}}}], \"resourceAccessOptions\": {\"accessLinks\": [{\"linkObject\": {\"description\": null, \"url\": \"http://www.geothermal-energy.org/pdf/IGAstandard/WGC/2005/1309.pdf\", \"linkTargetResourceType\": \"\", \"linkContentResourceType\": \"\", \"ogc_layer\": null, \"linkTitle\": \"Downloadable File\"}}], \"distributors\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"distributor\"}, \"organizationName\": \"Stanford University\"}}}]}, \"resourceContact\": [{\"relatedAgent\": {\"agentRole\": {\"contactEmail\": \"horne@stanford.edu\", \"contactAddress\": null, \"individual\": {\"personName\": \"Roland Horne\", \"personPosition\": \"\", \"personRole\": \"pointOfContact\"}, \"organizationName\": \"Stanford University\"}}}], \"resourceDescription\": \"The-first geothermal power plant in Germany is an extension of an existing heating plant. It was connected to the mains in November 2003. Since May 2004 the plant is in stable operation. However, the plant works permanently at part load since neither the temperature nor the available mass flow rate reach the design values. The plant provides data to analyze a low temperature organic Rankine cycle (brine temperature is below 100 ?C). A first check-up shows that despite part load the tuning of the process itself has turned out well. Remaining uncertainties concerning the specific heat capacity of the brine as well as the flow conditions in the geothermal loop prevent proper assessment of overall plant performance for the time being. These uncertainties will be cleared up by further measurements as well as by accompanying numerical modeling of the plant in the future.\", \"resourceTitle\": \"Analysis of the Combined Heat and Power Plant Neustadt-Glewe-xxx\", \"usginContentModelVersion\": \"\", \"citationDates\": {\"EventDateObject\": {\"dateTime\": \"2015-11-18T20:27:40\"}}}}"}, {"key": "metadata-date", "value": "2015-11-18T20:27:40"}, {"key": "metadata-language", "value": ""}, {"key": "other_id", "value": "[\"http://www.opengis.net/def/nil/OGC/0/missing/2013-04-04T12:00:00Z\"]"}, {"key": "progress", "value": "completed"}, {"key": "publication_date", "value": "2005-01-01 00:00:00"}, {"key": "quality", "value": "{}"}, {"key": "resource-type", "value": "dataset"}, {"key": "responsible-party", "value": "[{\"name\": \"Stanford University\", \"roles\": [\"pointOfContact\"]}]"}, {"key": "spatial", "value": "{\"type\": \"Polygon\", \"coordinates\": [[[73.5, 18.1535216], [134.77, 18.1535216], [134.77, 53.560974], [73.5, 53.560974], [73.5, 18.1535216]]]}"}, {"key": "spatial-data-service-type", "value": ""}, {"key": "spatial-reference-system", "value": ""}, {"key": "spatial_harvester", "value": "true"}, {"key": "status", "value": "completed"}], "title": "Analysis of the Combined Heat and Power Plant Neustadt-Glewe-xxx", "revision_id": "4f2164ba-674f-4f1f-a438-5e855f59c53b"};

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

    //var qStr = '{id=pg}'; // req.query.;

    var lookup_obj = ta_api.ta_query(rscName,JSON.parse(qStr) );
    console.log(' return ' + lookup_obj);

    res.send(lookup_obj);
    
} );


app.get('/data.json' , function(req,res) {
    res.sendFile(Path+'/data.json');
} );

app.set('port', process.env.PORT || 80);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


