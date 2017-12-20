
var showEdits = function () {
    var x = document.cookie; 

    var xft = JSON.stringify(root) + ' ' + x;

    var w = window.open();
    $(w.document.body).html(xft);
}

var showFullPack = function () {

    if ( gCin_edit ) {
      //var x = listDocCookies(); 
      gCin_edit.dateTime = new Date($.now());
      gCin_edit.editedBy = getCookie('editorName');
      var xft = JSON.stringify(gCin_edit);
    
      //(gCKAN_package);

      if ( xft.length > 1 ) {
  
        var w = window.open();
        $(w.document.body).html(xft);
      } else { 
          console.log('empty package'); 
      }
    }
}

var showSave = function () {
    apply_edits(jData, gCKAN_package, gCKAN_mdpackage);
    save_fullpackage()
}

function save_fullpackage() {
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
      $("#myEd").html(pstack);

      },
    error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

  });
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
     var edname = getCookie("editorName");
     gCin_edit = { 'dateTime' : 'Now', 'editedBy' : edname, 'changes' : [] };
     listEditStack();
  }

  gCKAN_pid = obj.id;
  
   loadD3();
  ( gCKAN_pid.length > 5 ) ? $("#SAC").show() : $("#SAC").hide(); 

}

function loadD3() {
    var tempSchema;
    ( gD3_Schema.lastIndexOf("/") ) ? tempSchema = gD3_Schema.substring(gD3_Schema.lastIndexOf("/")+1) : tempSchema = gD3_Schema;
    var mdurl = '/cin_extract?pid='+gCKAN_pid+'&schema='+tempSchema;

    mdurl = '/cin_extract?schema=' + tempSchema + '&pid=' + encodeURIComponent(gCKAN_pid);

    svgReady = false;
    d3.json(mdurl, function(error, treeData) {
     if ( error ) { console.log(' Error returned ' + error); } 

      if (  typeof(treeData) !== "undefined" && typeof(treeData.status) !== "undefined" &&  treeData.status == "No md_p" ) {
         alert("Metadata Source is missing the md_package: " + gCKAN_pid);
    
          svgReady = false;
          d3.json( gD3_Schema, function(error, treeData) {
          d3.selectAll("svg").remove();
          d3.selectAll('.d3-context-menu').remove();
          svgReady = true;
          visu(error, treeData);
          reset();
        });       
      } else {
     
        set_title(treeData);
     
        d3.selectAll("svg").remove();
        d3.selectAll('.d3-context-menu').remove();
      
        jsonSrc = treeData;
        svgReady = true;
        visu(error, treeData);
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
  if($('#edbyin').val()) {
     setCookie("editorName",$('#edbyin').val(),180);
     $('#editby').text( $("#edbyin").val() );
     $("#edbyin").remove();

  } else {
     var eName = $("#editby").text();
     $("#editby").text("");
     $("#editby").append('<input type="text" id="edbyin" width="15" name="username"/>');
     $('#edbyin').val(eName);
     $('#edbyin').focus();
  }
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

      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          // Over the limit clear the first cookie
          if ( ca.length > 10 && i == 0) {
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

  var EdA = gCin_edit.changes;
  for(var i = 0; i < EdA.length; i++) {
      var edObj = EdA[i];
      ++xDx;
      if ( Array.isArray(edObj.jsonPath)  ) {
        var pStr = edObj.jsonPath[0].split('.');  
      } else {
         var pStr = edObj.jsonPath.split('.');   
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
                            .attr('id',edObj.jsonPath)
                            .attr('onclick','javascript:removeEdit(this);').append('x'),
                    $('<span>').append(edObj.name + ' ' + edObj.type + " " + " " + vTrc))     
      );
  }    
}

function clearEdits() {
     var EdA = gCin_edit.changes;
      for(var i = 0; i < EdA.length; i++) {
          EdA.splice(0,1);
      }
      listEditStack();
}

function removeEdit(eoRem) {
    
    var EdA = gCin_edit.changes;
    for(var i = 0; i < EdA.length; i++) {
        var edObj = EdA[i];
        if ( edObj.jsonPath == eoRem.id ) {
          EdA.splice(i,1);
        }
    }
    listEditStack();
}



