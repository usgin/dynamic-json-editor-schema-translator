Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
}

var showEdits = function () {
    var x = document.cookie; 
    var xft = JSON.stringify(root) + ' ' + x;

    var w = window.open();
    $(w.document.body).html(xft);
}

var urlCheck = function( urlString, cb ) {

  var hurl = '/url_status?' + 'url='+urlString ;
  console.log('start url check');
    $.ajax({
        type: 'GET',
        url: hurl,
        dataType: 'json',
        contentType: "application/json",
        success: function(data, status) {
          if ( data ) {
            console.log('url check - OK');
            cb('OK');
            
          } else {
            console.log('url check - BAD');
            cb('Not so much');
          }
      
        }, 
        error: function (jqXHR, status, err) {  
          console.log('url check error');
          cb('Nope');
        }

    });
}

var showFullPack = function () {

    if ( gCin_edit ) {
      
      gCin_edit.dateTime = new Date($.now());
      gCin_edit.editedBy = getCookie('editorName');
      var xft = JSON.stringify(gCKAN_package,null,'   ');

      if ( xft.length > 1 ) {
  
        var w = window.open();
        $(w.document.body).html('<pre>' + xft + '</pre>');
      } else { 
          console.log('empty package'); 
      }
    }
}

var showSave = function () {

    apply_edits(jData, gCKAN_package, gCKAN_mdpackage);
    save_fullpackage()
}

function AlreadyLoggedIn () {

	var lath = localStorage.getItem('AuthLogged');

	if ( lath ) {
			var tripwire = localStorage.getItem('AuthLogged');
			var sesL = tripwire.split('&');
			var sesTime = new Date(sesL[1]);
			var nowTime = new Date();
			var lDur = (nowTime - sesTime)/1000;	

			if ( lDur < 3600 ) {
				lser = sesL[0];
				lpass = sesL[2];
				gLoginState = 'edit';
				loginAuth(lser,lpass);

			} else {
				 localStorage.removeItem('AuthLogged');
			}
	}
}

function loginAuth(usr,pw) {
    // Login button event handler

	if (gLoginState == 'init' || gLoginState == 'LogNo') {
		$("#logger").show();
		gLoginState = 'edit';
    } else if ( gLoginState == 'LogYes' ) {

    	$("#loginBtn").html("Login");
    	$("#savejson").hide(); 
      	$("#trigproc").hide(); 
    	gLoginState = 'init';
    	localStorage.removeItem('AuthLogged');

	} else if ( gLoginState == 'edit' ) {

		if ( usr && pw ) {
			var lser = usr;
			var lpass = pw;
		} else {
			lser = $("#luser").val();
			lpass = $("#lpass").val();	
		}
		
		var hurl = '/get_auth?' + 'uname='+lser+'&pw='+lpass ;
		$.ajax({
		    type: 'GET',
		    url: hurl,
		    dataType: 'json',
		    contentType: "application/json",
		    success: function(data, status) {
		    	if ( data.data !== "NOAUTH") {
		    		console.log(' Login ');	
		
					var ltime = new Date($.now());
					localStorage.setItem('AuthLogged', lser +'&' + ltime + '&' + lpass);
					var newx = localStorage.getItem('AuthLogged');

		    		$("#savejson").show(); 
		    		$("#savejson").css({ 'background-color' : '#196fa6'});

            $("#trigproc").show(); 
		    		$("#trigproc").css({ 'background-color' : '#196fa6'});
                                               
		    		gLoginState = 'LogYes';
		    		$("#loginBtn").html("Logged in as " + lser);
		    		$("#loginBtn").css({ 'background-color' : '#196fa6'});
            $("#mousebox").html ('');
		    	} else {
		    		console.log('Login NO AUTH');	
		    		gLoginState = 'LogNo';
		    		$("#savejson").hide(); 
		            $("#trigproc").hide(); 
		    	}
		    	$("#logger").hide();
		    	
		    },
		    error: function (jqXHR, status, err) { 
		    	gLoginState = 'LogNo';
		    	$("#logger").hide();
		    	localStorage.removeItem('AuthLogged');
		    	alert('Auth Error : ' + status + ' ' + err)}
		});
	}
}

function isRecordValidated() {
  var mdurl = '/hasMdEdits?docId='+gCKAN_pid;
  
  $.ajax({
    type: 'GET',
    url: mdurl,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {

      if ( data.edited == "true" ) {
   	      $("#validBtn").hide();          
      } else {
         $("#validBtn").show();
      }

      if ( localStorage.getItem('ShowSplash') ) {
      	var lt = localStorage.getItem('ShowSplash');
      	if ( isNaN(lt) ) {
     		 localStorage.setItem('ShowSplash', 0); 		
      	}
      }
     
      var lCount = 0;
      if ( localStorage.getItem('ShowSplash') ) {
         lCount = localStorage.getItem('ShowSplash');	
         lCount = parseInt(lCount) + 1;
      	 localStorage.setItem('ShowSplash', lCount);    
      } else {
      	 localStorage.setItem('ShowSplash', 1);  
      }
      if ( lCount < 5) {
      	 $("#showValidateSplash").show();
      }

    }
  }); 

}

function validator() {

  if ( gLoginState == 'LogYes' ) {
    $("#validBtn").hide();
    gCIN_saveDoc.editStatus = 'validated';
    saveMdb();
    
  } else {
    alert('To validate this record, please login in, first ');
    
  }

}


function save_fullpackage() {
   // NGDS version - out of date
  var inp = JSON.stringify(gCKAN_package);

  if ( !inp ) {
    alert('nothing to save');
    return;
  }
  $.ajax({ 
    type: 'POST',
    url: '/save_fullpackage',
    data: inp,
    dataType: "json",
    contentType: "application/json",  
    success: function(data) {
      res = data.result;
      var pstack = 'Save Package :' + JSON.stringify(res,undefined,2);
      //$("#myEd").html(pstack);
      clearEdits();
      alert(pstack);
    },
    error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

  });
}

function trigProc() {
  
 
  if ( confirm('Do you really mean it ?') ) {
       console.log('I certainly do');
       var noodel = JSON.stringify(gCKAN_package);
       var inid = '999';
       alert('Not yet implemented');
       /*
       $.ajax({ 
        type: 'PUT',
        url: 'http://132.249.238.169:8080/geoportal/rest/metadata/item/999',
        processData: false,
        username: 'gptadmin',
        password: 'gptadmin',
        in: noodel,
        dataType: "json",
        contentType: "application/json",  
        success: function(data) {
          
          console.log(' came back as ' + data);
          

        },
        error: function (jqXHR, status, err) { alert('Trigger  Error : ' + status + ' ' + err)}

      });
      
      */
  
  } else {
  
    console.log('Changed my mind');
  }
}



function saveMdb() {
      // Curent Cinergi Save 
      
      //gCin_edit.metadataRecordLineageItems.stepDateTime = new Date($.now());

      // First apply edits from edit object to the local OriginalDoc image
      // Then apply the Lineage to the Save Object

      //if  ( typeof(gCinEditSession.metadataUpdates) !== "undefined" && gCinEditSession.metadataUpdates.length > 0 )  {
      if ( typeof(gCinEditSession.metadataUpdates) !== "undefined" && gCinEditSession.metadataUpdates.length > 0 )  {
        gCIN_saveDoc.editStatus = 'edited';
      }
      
      gDDH_edit.push(gCinEditSession);
      gCIN_saveDoc.metadataRecordLineageItems = gDDH_edit;
          
      //}  
      
      if ( gCKAN_package.SourceInfo ) {
         gCIN_saveDoc.SourceID = gCKAN_package.SourceInfo.SourceID;
      }
             
      var inp = JSON.stringify(gCIN_saveDoc);
      console.log(' save ' + inp);
    
      $.ajax({ 
        type: 'POST',
        url: '/update_cinRec',
        processData: false,
        data: inp,
        dataType: "json",
        contentType: "application/json",  
        success: function(data) {
          
          res = data.result;
          var pstack = 'Save Package :' + gTitle; //JSON.stringify(res,undefined,2);
          alert(pstack);
          clearEdits();
          listEditHistory();

          // $("#myEd").html(pstack);
         

          },
        error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

      });
      //} else { 
      //  alert('No edits to save ');
      //}
      
      

}


function search_package(curPage) {
  // NGDS Search
  var inp = $("#searchid").val();
  var pgSize = $("#pgsz").val();
  (curPage == 1) ? $("#offpg").val(1) : curPage = curPage;
  (curPage) ? offpg = curPage : offpg = $("#offpg").val();
  var pages = $("#pages").val();
  var startAt = (offpg - 1)*pgSize;

  if (startAt < 0 ) {
    offset = 0;
  }
  var pData = { id : inp };
 
  var hurl = gCKAN_api_path + 'searchText=keywords:%20' + inp +'&f=pjson' ;
  $.ajax({
    type: 'GET',
    url: hurl,
    dataType: 'jsonp',
    contentType: "application/json",
    error: function (xhr, ajaxOptions, thrownError){
      console.log(xhr.statusText);
      console.log(thrownError);
    },
    success: function(data, status) {
   
      var pkg = '<div><p>Search Package Results</p>';
      for (i = 0; i < res.length; i++) {
            pkg_item = res[i];
            var pkgName = pkg_item.id;
            var pkgTitle = pkg_item.title;
            var pkgUrl = pkg_item.links[3].href;
            pkg_string = JSON.stringify(pkg_item, undefined, 1);
            pkg_string = pkg_string.substring(1,pkg_string.length-1);
            pkg = pkg + '<a href="#" id="'+ pkgUrl + '"onclick="javascript:get_package(this);"><p>'+pkgTitle+'</p></a>';

            //page_size = i + 1;
            //pkg = pkg + '<h2>Result '+ page_size + '</h2>' + JSON.stringify(res.results[i]);
          }
      pkg = pkg + '</div>';
      $("#pages").val(Math.round(res.length/pgSize));
      $("#ckan_list").html(pkg);
      }
  });
 };

var cp = false;

function show_packlist(pageSet) {
 
  var srch = $("#searchid").val();
  if (srch.length > -1 ) {
     if ( pageSet == "next" ) {
        var offpg = $("#offpg").val();
        var cp = parseInt(offpg) + 1;
        $("#offpg").val(cp);
        search_package(cp);
     } else {
       var offpg = $("#offpg").val();
        var cp = parseInt(offpg) - 1;
        $("#offpg").val(cp);
        search_package(cp);
     }
  } else {

    var link = gCKAN_api_path + '/api/3/action/package_show?id='; 
    var inp = $("#pgsz").val();

    if ( pageSet == "next" ) {
      var cp = parseInt($("#offpg").val()) + 1;
      var offset = cp*parseInt(inp); 
    } else {
      var cp = parseInt($("#offpg").val()) - 1;
      var offset = cp*parseInt(inp);
    }
    $("#offpg").val(cp); 
    var pData = { limit : inp };
      $.ajax({
      type: 'GET',
      url: gCKAN_api_path + '/api/3/action/package_list?limit='+inp+'&offset='+offset,
      dataType: "json",
      contentType: "application/json",
      success: function(data) {
        res = data.result;
        var pstack = "<div><p>Package List</p>";
        for (i = 0; i < res.length; i++) {
              pkg_item = res[i];
              pkg_url  = res[i].links[3].href;
              pkg_string = JSON.stringify(pkg_item, undefined, 1);
              pkg_string = pkg_string.substring(1,pkg_string.length-1);
              pstack = pstack + '<a href="#" id="'+ pkg_url + '"onclick="javascript:get_package(this);"><p>'+pkg_string+'</p></a>';
            }
            pstack = pstack + '</div>';
        $("#ckan_list").html(pstack);
        }
    });
  }
};

var setMode = function() {
  if ( dMode == "Navigate" ) { 
      dMode = "Edit";
      $("#btnSRD").
       dMode = "Navigate";
       $("#btnSRD").text = "Navigate";
     } else {
      dMode = "Edit";
       $("#btnSRD").text = "Edit";
     }
}

function paintTree(zoomScale) {
   reset(zoomScale);
}

function schemaChange(schema) {

  // This retreieves the schema from the server and applies it to the 
  // local data.  Allow schema navigation without requiring save

  $.ajax({
    type: 'GET',
    url: schema,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
  
       var treeData = xform(data, gCKAN_mdpackage);
       var error;
       visu(error, treeData);
       reset();
      
      }
  });

}

function selectSchema(eg) {

    gD3_Schema = eg.options[eg.selectedIndex].value
    d3.selectAll("svg").remove();
    // If its already got a dataset, use it else build an empty schema

    if ( typeof(gCKAN_pid) !== "undefined" &&  gCKAN_pid.length > 1) {
        loadD3();
    } else {
      d3.json(gD3_Schema, function(error, treeData) {
        if (error) {
          alert('Schema : ' + gD3_Schema + ' indicated ' + error);
        } else {
          visu(error, treeData);
         
       }
      });
  }
}

function get_package(obj) {

  if (gCKAN_pid != obj.id ) {
     gEdName = getCookie("editorName");
     //gCin_edit = { 'dateTime' : 'Now', 'editedBy' : gEdName, 'changes' : [] };
     listEditStack();
  }

  gCKAN_pid = obj.id;
  
  loadD3();
  ( gCKAN_pid.length > 5 ) ? $("#SAC").show() : $("#SAC").hide(); 

}

function reSchemD3() {
    // This loads records using the edited JSON object that is sent to node server with a new schema name

    var tempSchema;
    ( gD3_Schema.lastIndexOf("/") ) ? tempSchema = gD3_Schema.substring(gD3_Schema.lastIndexOf("/")+1) : tempSchema = gD3_Schema;
    var mdurl = '/cin_reflush?pid='+gCKAN_pid+'&schema='+tempSchema;
    var refObj = {};
    refObj.schema = tempSchema;
    refObj.pid = gCKAN_pid;

    // Added 5/2 - since the NOAH pks can have embedded invalid characters
    gCKAN_package.primaryKey = gCKAN_pid;

    refObj.body =  gCKAN_package;
    // var inp = {'datakey': 'DataObject'}; // JSON.stringify(refObj);

    svgReady = false;
    $.ajax({ 
          type: 'POST',
          url: '/cin_flush',
          processData: false,
          data: JSON.stringify(refObj),
          dataType: "json",
          contentType: "application/json",  
          success: function(data) {   

          // console.log(data);
          var error = { "error" : "None"};
          //  var treeData = data.result;
            var tData = data[0];
            console.log(' flush ' + JSON.stringify(tData));
            svgReady = true;
            set_title(tData); 
            d3.selectAll("svg").remove();
        	d3.selectAll('.d3-context-menu').remove();

            visu(error, tData);
            reset();
          },
          error: function (jqXHR, status, err) { 
            console.log('Re Schema Error : ' + status + ' ' + err)

          }

        });

}

function loadD3() {
    // This processs records when its first loaded, it gets data from cinergi and process schema at node server

    AlreadyLoggedIn();
    isRecordValidated();

    var tempSchema;
    ( gD3_Schema.lastIndexOf("/") ) ? tempSchema = gD3_Schema.substring(gD3_Schema.lastIndexOf("/")+1) : tempSchema = gD3_Schema;
    var mdurl = '/cin_extract?pid='+gCKAN_pid+'&schema='+tempSchema;

    mdurl = '/cin_get?schema=' + tempSchema + '&pid=' + encodeURIComponent(gCKAN_pid);
    //mdurl = '/cin_getEdRec?schema=' + tempSchema + '&pid=' + encodeURIComponent(gCKAN_pid);

    svgReady = false;
    d3.json(mdurl, function(error, treeData) {
     if ( error ) { console.log(' Error returned ' + error); } 

       if (  typeof(treeData) !== "undefined" && (treeData.value == "No Data Found" || treeData.value == "No Database Connection")   ) {
          //alert("Metadata Source is missing the md_package: " + gCKAN_pid);
          svgReady = false;
          
          //d3.json( gD3_Schema, function(error, treeData) {
            d3.selectAll("svg").remove();
            d3.selectAll('.d3-context-menu').remove();
            svgReady = true;
            visu(error, treeData);
            reset();
          //});

      } else {
        var tData  = {};
        if ( Array.isArray(treeData) ) { 
          tData = treeData[0];
          var packageObj = treeData[1];
      
          gCKAN_package = packageObj;

          if ( packageObj.metadataRecordLineageItems  ) {
            gDDH_edit = packageObj.metadataRecordLineageItems;  
           // if ( !gDDH_edit ) { gDDH_edit = packageObj.item.metadataRecordLineageItems;  }
            if ( gDDH_edit  && Array.isArray(gDDH_edit )) {
              var iac = gDDH_edit.length;
              listEditHistory();
              
            } else { iac = 0 }
            // modify 9/11 - removed item
            gCinEditSession =  { 
                                  "stepSequenceNo" : iac, 
                                  "stepProcessors" : [ { "personName": gEdName } ],  
                                  "stepDateTime" : new Date($.now()),
                                  "metadataUpdates": []
                                };                                         

          } else {
            gCinEditSession = { 
                                  "stepSequenceNo" : 0, 
                                  "stepProcessors" : [ { "personName": gEdName } ],  
                                  "stepDateTime" : new Date($.now()),
                                  "metadataUpdates": []                                         
                            };

            //gDDH_edit.metadataRecordLineageItems[0].item.stepProcessors[0].personName = gEdName;
            //gDDH_edit.metadataRecordLineageItems[0].item.stepDateTime = new Date($.now());

          }
          
          gCKAN_package = treeData[1];
          gCIN_saveDoc.OriginalDoc = gCKAN_package.OriginalDoc;
          gCIN_saveDoc.Data = gCKAN_package.Data;
          gCIN_saveDoc.primaryKey = gCKAN_package.primaryKey;
          console.log (JSON.stringify(tData) );

        } else {
          tData = treeData
        }

        set_title(tData);  
        d3.selectAll("svg").remove();
        d3.selectAll('.d3-context-menu').remove();
      
        jsonSrc = tData;
        svgReady = true;
        visu(error, tData);
        reset();

      }
    });

}

function get_full_package(obj) {
  var pxid = obj.id;
 
  var mdurl = '/getrecord?pid='+pxid; 
   
  $.ajax({
    type: 'GET',
    url: mdurl,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
   
       gCKAN_package = data;
  
       var ddHTitle = "mongrove";
       var kp;

       var lookupPath = "OriginalDoc.gmd:MD_Metadata.gmd:identificationInfo.gmd:MD_DataIdentification.gmd:citation.gmd:CI_Citation.gmd:title.gco:CharacterString._$";
       var ddHTitle = jsonLookup(gCKAN_package, kp, lookupPath);

	
       if  ( typeof(ddHTitle) !== "undefined" ) {
          $("#myEd").html("<h3>"+ ddHTitle + "</h3>");
        } else {
           $("#myEd").html("<h3>"+ pxid + "</h3>");
        } 
      }
  });
}

function set_title(jB) {
      var ddHTitle = "Title";
       var kp;

       if  ( typeof(jB.titleval) !== "undefined" ) {
          $("#myEd").html("<h3>"+ jB.titleval + "</h3>");
          // if not in DocHistList
          gTitle = jB.titleval;
          setCookie(gCKAN_pid, jB.titleval, 60 );
          docHistList.push({ gCKAN_pid : jB.titleval });
        } 
       listDocCookies();
}


var localMdPackage = function() {
  if ( gCKAN_package ) {
     var doMDP = false;
    for (i = 0; i < gCKAN_package.extras.length; i++) {
     
      if (gCKAN_package.extras[i].key === 'md_package') {
      
         gCKAN_mdpackage = JSON.parse(gCKAN_package.extras[i].value);
         doMDP = true;
      }
    } 
  }
  if (!doMDP) {
    console.log('Local MD package not found !');
  }
}

var typeaheadRef = function (listurl, params,evHandle) {


  $.ajax({
    type: 'GET',
    url: listurl,
    data:  JSON.stringify(params),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      var tam = [];
      for (var ix in data) {
        data[ix].completion;
      }
      evHandle(data);
      
      return '{Hello}';
      }
    });

   return '{I am later}';
}

var externalRef = function (listurl, params, connectMe) {
  return ' hey there';

  $.ajax({
    type: 'GET',
    url: listurl,
    data:  JSON.stringify(params),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
     
      return data;
      }
    });
}

function getData() {
  $.ajax({
    type: 'GET',
    url: '/md_data',
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      
      d3.selectAll("svg").remove();
      d3.json(data, function(error, treeData) {
          visu(error, treeData);
          reset();
      });
      $("#myEd").html(JSON.stringify(data));
      }
    });
}

var editUser = function() {

  // if it exists save it, else create it

  btnQ = $('<a id="curEdBtn" class="nav-link" title="curEdBtn" target="_blank">Curator</a>');
  btnQ.click(function() {
       editUser();
   });
 
  if($('#edbyin').val()) {
     setCookie("editorName",$('#edbyin').val(),180);
     $('#editby').append( $("#edbyin").val() );
     $("#edbyin").remove();
     $("#curEdBtn").html("Curator");
  } else {
     var eName = $("#editby").text();
     $("#editby").text("");
     //$("#editby").append(btnQ); 
     $("#curEdBtn").html("Save");
     $("#editby").append('<input type="text" id="edbyin" width="15" name="username"/>');
     $('#edbyin').val(getCookie("editorName") );
     $('#edbyin').focus();
    
 }
  /*
  if($('#edbyin').val()) {
     setCookie("editorName",$('#edbyin').val(),180);
     $('#editby').text( $("#edbyin").val() );
     $("#edbyin").remove();
     $("#curEdBtn").html("Curator");
  } else {
     var eName = $("#editby").text();
     $("#editby").text("");
     $("#editby").append('<input type="text" id="edbyin" width="15" name="username"/>');
     $('#edbyin').val(eName);
     $('#edbyin').focus();
     $("#curEdBtn").html("Save");
    
  }
  */
}

// The Recent History Functions

function listDocCookies() {
  var namis = "Cookie Name",
      indx = 0;
  var ca = document.cookie.split(';');
  $('#dochist').empty();
  $('#dochist').append(
       $('<li>').append(
        $('<a>').attr('href','#')
            .attr('id','000')
            .attr('style','font-weight: bold')
            .attr('onclick',"javascript:clearCookies();").append(
                $('<span>').append("(x) Clear History")
        )));

      if ( ca.length > 7 ) {
      	for(var i = 0; i < (ca.length - 7); i++) {
      		 removeItem(ca[i]);
      	}	
      }

      var ca = document.cookie.split(';');

      for(var i = 0; i < ca.length; i++) {
          var c = ca[i];
          // Over the limit clear the first cookie
          if ( ca.length > 7 && i == 0) {
              removeItem(ca[i]);

          } else {
              var nx = c.split('=');
                  if ( nx[0] != "editorName" && nx[0] != " editorName" ) {
                    namis = namis + ' ' + nx[0];
                    ++indx;
                    $('#dochist').append(
                          $('<li>').attr('id','lix-'+indx)
                                   .attr('docid',nx[0].trim())
                                   .append(
                                      $('<a>').attr('href','#')
                                              .attr('id','lix-'+indx)
                                              .attr('docid',nx[0].trim())
                                              .attr('onclick','javascript:removeItem(this);').append('x'),
                                      $('<a>').attr('href','#')
                                        .attr('id',nx[0].trim())
                                        .attr('onclick','javascript:get_package(this);').append(
                                          $('<span>').attr('class', 'tab').append(nx[1])
                    )));  
                  }
          }
          
      }
     
      return namis;
}


function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    
    if (cname == 'editorName' ) {
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    } else {
      // only set a record if it doesnt exist

      var coCheck = getCookie(cname);
      if (coCheck.length == 0 ) {
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
      }
    }
}

function clearCookies() {
      var ca = document.cookie.split(';');
      for(var i = 0; i <ca.length; i++) { 
          var nx = ca[i].split('=');
          removeItem(nx[0]);
         
      }
      listDocCookies();
}

function removeItem( sKey ) {
    var nk;
    if ( typeof(sKey) == "object" ) {
      nk = sKey.attributes['docid'].value;
      document.cookie = nk + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      var undo = '#' + sKey.id;
      $(undo).remove();
    } else {
       document.cookie = sKey + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
 
}

/*  Edit Stack Functions - display and manage the list of edits for a record
    

*/

function listEditHistory() {

	$('#provStack').empty();
    
  	for(var i = 0; i < gDDH_edit.length; i++) { 
   
      if ( typeof( gDDH_edit[i].item ) !== "undefined" ) {
  		  var tStamp = gDDH_edit[i].item.stepDateTime;
      }
      
      if ( !tStamp ) { 
        if ( typeof( gDDH_edit[i].stepDateTime ) !== "undefined" ) { tStamp = gDDH_edit[i].stepDateTime; }
      }
     
       if ( typeof( gDDH_edit[i].item ) !== "undefined" ) {
          var Curator = gDDH_edit[i].item.stepProcessors[0].personName; 
       }

      if ( !Curator ) {
           if ( typeof( gDDH_edit[i].stepProcessors ) !== "undefined" ) 
            { Curator = gDDH_edit[i].stepProcessors[0].personName; }
      }
  		 $('#provStack').append(
         $('<li>').attr('id','lph-'+ i)
                  .append(
                    $('<a>').attr('href','#')
                            .attr('id','lp-item-'+i)
                            .attr('onclick','javascript:showEdHis(this);').append('-'),
                    $('<span>').append(tStamp + ' ' + Curator))     
      );
  	}

}


function listEditStack() {
  var namis = "Edits",
      xDx = 0;

  $('#editStack').empty();
  $('#editStack').append(
       $('<li>').append(
        $('<a>').attr('href','#')
            .attr('id','x00')
            .attr('style','font-weight: bold')
            .attr('onclick',"javascript:clearEdits();").append(
                $('<span>').append("(x) Clear Edits")
        )));


  //var EdA = gCin_edit.changes;
  
  var EdA = gCinEditSession.metadataUpdates;
  if ( !EdA ) { EdA = gCinEditSession.metadataUpdates; }
  
  for(var i = 0; i < EdA.length; i++) {

      var edObj = EdA[i];
      ++xDx;
      var jp,
          action;
      if ( edObj.updatePath ) {
        jp = edObj.updatePath;
        action = 'update';

      }

      if ( edObj.insertPath ) {
        jp = edObj.insertPath;
        action = 'insert';
      }

      if ( edObj.deletePath ) {
        jp = edObj.deletePath;
        action = 'delete';
      }

      if ( Array.isArray(jp)  ) {
        var pStr = jp.jsonPath[0].split('.');  
      } else {
         var pStr = jp.split('.');   
      }
     
      if ( pStr.length > 4) {
        var pCat = pStr[0] + '-' + pStr[pStr.length-2];
      } else {
        var pCat = pStr;
      }
      var vTrc = edObj.newValue;
      if ( typeof(vTrc) !== "undefined" ) {
        (vTrc.length > 20) ? vTrc = vTrc.substring(1,20) + '...' : vTrc = vTrc;  
      }
      
      $('#editStack').append(
         $('<li>').attr('id','les-'+ xDx)
                  .append(
                    $('<a>').attr('href','#')
                            .attr('id',jp)
                            .attr('onclick','javascript:removeEdit(this);').append('x'),
                    $('<span>').append(edObj.UpdateSequenceNo + ' ' + edObj.name + " " + action + " " + " " + vTrc))     
      );
  }    
}

function clearEdits() {
     //var EdA = gCin_edit.changes;
      if ( typeof( gCinEditSession.item ) !== "undefined" ) {
        var EdA = gCinEditSession.item.metadataUpdates;
      }
      
      if ( !EdA ) { EdA = gCinEditSession.metadataUpdates; }

      for(var i = 0; i <= EdA.length; i++) {
          EdA.splice(0,1);
      }
      listEditStack();
}

function removeEdit(eoRem) {
    
    //var EdA = gCin_edit.changes;
    if ( typeof( gCinEditSession.item ) !== "undefined" ) {
      var EdA = gCinEditSession.item.metadataUpdates;
    }
      
    if ( !EdA ) { EdA = gCinEditSession.metadataUpdates; }
      
    for(var i = 0; i <= EdA.length; i++) {
        var edObj = EdA[i];
        if ( edObj.jsonPath == eoRem.id ) {
          EdA.splice(i,1);
        }
    }
    listEditStack();
}



