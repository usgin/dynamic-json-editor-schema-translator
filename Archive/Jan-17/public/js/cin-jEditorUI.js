
var showEdits = function () {
    var xft = JSON.stringify(root);
    console.log("Saved data is " + xft );
    var w = window.open();
    $(w.document.body).html(xft);
}

var showFullPack = function () {

    if ( gCin_edit ) {
      gCin_edit.dateTime = new Date($.now());
      gCin_edit.editedBy = getCookie('editorName');
      var xft = JSON.stringify(gCin_edit);
    
      //(gCKAN_package);

      if ( xft.length > 1 ) {
   // console.log("Saved data is " + xft );
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
  console.log(inp);

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
      console.log('success');
      res = data.result;
      var pstack = 'Save Package :' + JSON.stringify(res,undefined,2);
      $("#myEd").html(pstack);

      },
    error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

  });
}

function search_package(curPage) {
  var inp = $("#searchid").val();
  var pgSize = $("#pgsz").val(); //$("#searchlim").val();
  (curPage == 1) ? $("#offpg").val(1) : curPage = curPage;
  (curPage) ? offpg = curPage : offpg = $("#offpg").val();
  var pages = $("#pages").val();
  var startAt = (offpg - 1)*pgSize;

  if (startAt < 0 ) {
    offset = 0;
  }
  var pData = { id : inp };
  // var hurl = gCKAN_api_path + '/api/3/action/package_search?q='+inp+'&start='+startAt+'&rows='+pgSize;
  var hurl = gCKAN_api_path + 'searchText=keywords:%20' + inp +'&f=pjson' ;
  $.ajax({
    type: 'GET',
    //url: '/search_package', ?docId=OT.082012.26911.3
    url: hurl,
    // data: JSON.stringify(pDatagCKAN_api_path
    dataType: 'jsonp',
    contentType: "application/json",
    error: function (xhr, ajaxOptions, thrownError){
      console.log(xhr.statusText);
      console.log(thrownError);
    },
    success: function(data, status) {
     // res = data.records;
     // ( data.totalResults ) ? var trecs = data.totalResults : var trecs = pgSize;
      
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

    //var link = gCKAN_api_path + '/api/3/action/package_show?id='; 
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

  //var mdurl = '/jsonSchemas'+schema;
  $.ajax({
    type: 'GET',
    url: schema,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      // gCKAN_package = data;
      // var temp_schema = JSON.parse(data);
       var treeData = xform(data, gCKAN_mdpackage);
       var error;
       visu(error, treeData);
       reset();
       //localMdPackage();
      // if  ( typeof(gCKAN_package.title) !== "undefined" ) {
      //    $("#myEd").html("<h3>"+ gCKAN_package.title + "</h3>");
      //  } else {
      //     $("#myEd").html("<h3>"+ pxid + "</h3>");
       // }

      }
  });

}
function selectSchema(eg) {

    gD3_Schema = eg.options[eg.selectedIndex].id
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
          //reset();
       }
      });
  }
}

function get_package(obj) {

   // First pull in the whole package 
   gCKAN_pid = obj.id;
   get_full_package(obj);   
   loadD3();
  ( gCKAN_pid.length > 5 ) ? $("#SAC").show() : $("#SAC").hide(); 

}

function loadD3() {
    var tempSchema;
    ( gD3_Schema.lastIndexOf("/") ) ? tempSchema = gD3_Schema.substring(gD3_Schema.lastIndexOf("/")+1) : tempSchema = gD3_Schema;
    var mdurl = '/md_extract?pid='+gCKAN_pid+'&schema='+tempSchema;

    //mdurl ='http://132.249.238.150:8080/foundry/api/cinergi/docs/orig/cinergi-0002?docId=OT.082012.26911.3';
   // mdurl = '/md_extract?pid=OT.082012.26911.3&schema='+tempSchema;
   // mdurl = '/md_extract?pid=' + gCKAN_pid + '&schema='+tempSchema;

    mdurl = '/cin_extract?pid=' + gCKAN_pid + '&schema='+tempSchema;
    console.log(mdurl); 

    d3.json(mdurl, function(error, treeData) {
      if (  typeof(treeData) !== "undefined" && typeof(treeData.status) !== "undefined" &&  treeData.status == "No md_package!" ) {
         alert("Metadata Source is missing the md_package: " + gCKAN_pid);
         console.log('Did I save anything ?' + dataEdits);
          var pixName = gCKAN_package.title;
          $("#myEd").html("<h3>"+ pixName + " [ New ]</h3>");
          d3.json( gD3_Schema, function(error, treeData) {
          d3.selectAll("svg").remove();
          d3.selectAll('.d3-context-menu').remove();
          visu(error, treeData);
          reset();
        });       
      } else {
       // $("#myEd").html("<h3>"+ pixName + "</h3>");
        console.log('From cin_extract - ' + JSON.stringify(treeData));
        d3.selectAll("svg").remove();
        d3.selectAll('.d3-context-menu').remove();
        // gCKAN_package = treeData;
        jsonSrc = treeData;
        visu(error, treeData);
        reset();
      }
    });

}

function get_full_package(obj) {
  var pxid = obj.id;
  console.log('/getrecord?pid='+pxid);
  var mdurl = '/getrecord?pid='+pxid; 
   
  $.ajax({
    type: 'GET',
    url: mdurl,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      // gCKAN_package = data.records;
       gCKAN_package = data;
       console.log('Full package ' + JSON.stringify(gCKAN_package) );
       //localMdPackage();
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

var localMdPackage = function() {
  if ( gCKAN_package ) {
     var doMDP = false;
    for (i = 0; i < gCKAN_package.extras.length; i++) {
      console.log( "extras names " + gCKAN_package.extras[i].key);
      if (gCKAN_package.extras[i].key === 'md_package') {
        // console.log( "it found extras : " + gCKAN_package.extras[i].key);
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
  //return ' hey there';

  $.ajax({
    type: 'GET',
    url: listurl,
    data:  JSON.stringify(params),
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
      evHandle(data);
      //console.log(data);
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
      console.log(data);
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
      console.log(data);
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

 // $.("#editby")

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
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

