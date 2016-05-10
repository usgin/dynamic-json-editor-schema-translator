/* JSON Editor V1
   G. Hudman
   April 1, 2016
*/
var http = require('http'),
    fs = require("fs"),
    express = require('express'),
    app = express(),
    request = require('request'),
    bodyParser = require('body-parser'),
    Path = '/home/user/yourpath',
    md_api = require(Path + "/js/mdpackage.js");

var htmObj = "",
    default_json = "f2-min3.json";

app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/jsonSchemas', express.static(__dirname + '/public/jsonSchemas'));

app.get('/' , function(req,res) {
      res.sendFile(Path+'/public/treeEditor.htm');
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

  var hurl = 'http://test.geothermaldata.org/api/3/action/package_show?id='+pid;
  request(hurl, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          mdbody = JSON.parse(body);
          obj = mdbody.result;
          res.send(obj);
      } else {
          res.send('error: ' + error);
      }

    });
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

  (typeof(schemafile) == "undefined") ? schemafile = "f2-min3.json" : schemafile = schemafile;
  var d3file = JSON.parse(fs.readFileSync(Path+'/public/jsonSchemas/' + schemafile, 'utf8'));
  
  for (var key in d3file) {
      console.log('Schema key ' + key + ' value ' + d3file[key] ); 
      if ( key == 'root' ) {
            rootObj = d3file['root'];
            rootType = d3file['rootType'];
            rootKey = d3file['rootKey'];
            break;
      }
    }


  var hurl = 'http://test.geothermaldata.org/api/3/action/package_show?id='+pid;
  console.log("here " + hurl);

	request(hurl, function (error, response, body) {
	    if (!error && response.statusCode == 200) {

        mdbody = JSON.parse(body);
	    	obj = mdbody.result;
            var doMDP = false;
            for (key in obj) { 
                if ( key == rootObj ) {
                  var findRoot = obj[key];
                  if ( rootType == "array") {
                    for (i=0; i < findRoot.length; i ++ ) {
                       if ( findRoot[i][rootKey.keyname] == rootKey.keyvalue ) {
                            var luckyGuess = findRoot[i][rootKey.valuename];
                            console.log('lucky guess ' + rootKey.valuename + ' ' + JSON.stringify(luckyGuess));
                       }         
                    }
                  }
                  // console.log(" Im a genius " + key);
                  break;
                }

            }
            if ( typeof(obj.extras)  !== "undefined" ) {
		    	    for (i = 0; i < obj.extras.length; i++) {
			      		if (obj.extras[i].key === 'md_package') {
			             var md_pkg = JSON.parse(obj.extras[i].value);
							     doMDP = true;
							     var d3proc = md_api.any(d3file,md_pkg);
			    			   res.send(d3proc); 
			      		}
		    		  }	
            }

    		   if (!doMDP) {
    			   var noPack =  { "status" : "No md_package!" };
        		 res.send(noPack); 
      		}
 
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
  var stuff = {"result": "Node start save .. "};

  var sData = JSON.stringify(req.body);
  console.log(' saving: ' + JSON.stringify(req.body) );

  var hurl = 'http://test.geothermaldata.org/api/3/action/package_update';

  // Requires authorization key - contact usgin admin

  var options = {url: hurl, 
                method: "POST",
                json: true,
                body : req.body,
                headers: {
                  'Authorization' :'*',
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
  res.send(stuff);

});


app.get('/data.json' , function(req,res) {
    res.sendFile(Path+'/data.json');
} );

app.set('port', process.env.PORT || 8001);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});


