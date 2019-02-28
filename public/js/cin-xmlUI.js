Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }

    }
    return false;
}

JSON.flatten = function(data) {
    var result = {};
    var idxID = 0;
    function recurse (cur, prop) {
        if ( typeof(cur) !== "undefined" && Object(cur) !== cur) {
            var attrtest = prop.split('.');
            lAttr = attrtest.pop();
            if ( lAttr != "$" && lAttr != "gco:nilReason"  ) { // dont include attr's it search list 
              var mo ={};
              mo.Path = prop;
              mo.sPath = pathFilter(prop);
              mo.Value = cur; //'not object ' + idxID;
              result[idxID] = mo;
              mo.type = 'endpoint';
              idxID++;
            }
            //result[prop] = cur;
        } else if (Array.isArray(cur)) {
        
            var mo ={};
            mo.Path = prop;
            mo.sPath = pathFilter(prop);
            mo.Value = idxID;
			      mo.type = 'array';
            result[idxID] = mo;
            idxID++;
            
            for(var i=0, l=cur.length; i<l; i++) {
                 recurse(cur[i], prop ? prop+"."+i : ""+i);
            }
            /*
            if (l == 0) {
                var mo ={};
                mo.Path = prop;
                mo.sPath = pathFilter(prop);
                mo.Value = idxID + 'empty' ;
                result[idxID] = mo;
                idxID++;
            }
            */
                //result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                var mo ={};
                mo.Path = prop;
                mo.sPath = pathFilter(prop);
                mo.Value = idxID; //cur;
                mo.type = 'object';
                result[idxID] = mo;
                idxID++;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty) {
                var mo ={};
                mo.Path = prop;
                mo.sPath = pathFilter(prop);
                mo.Value = "empty";
                mo.type = 'object';
                //mo[prop] = "";
                result[idxID] = mo;
                idxID++;
            }
                //result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}

// cleanup schema diffs



var pathFilter = function(origPath) {
  
    var zeb = [];
    var nameSpace = [ "gmd:", "gmi:", "gco:", "gmx:", "rdf:", "dc:", "dct:" ];
    var preFix = [ "MD_", "MI_", "EX_", "CI_" ];
    //  var cw = [ "OriginalDoc","Metadata","CharacterString","citation","date","ResponsibleParty","identificationInfo"];
    var cw = [ "CharacterString","citation","date","ResponsibleParty" ];
    cw.push("ResponsibleParty", "contactInfo", "descriptiveKeywords","extent","DataIdentification","DigitalTransferOptions");
    cw.push("distributionInfo","onlineResource","role","geographicElement","GeographicBoundingBox","transferOptions","Decimal");
    cw.push("online","codeList","codeListValue","$","topicCategory","Anchor","_","Type","type");
    
    var origA = origPath.split(".");
    var torg = "";
    
    for (z = 0; z < origA.length; z++) {
         var torg = origA[z];
         torg = rAEliS(nameSpace,torg);
         torg = rAEliS(preFix,torg);
         //torg = rAEliS(cw,torg);
         //if ( torg.length > 0 ) {
         //  zeb.push(torg)
         //}
         origA[z] = torg;
    }
    
    var rp = origA.join(".");
    return rp;
}

// remove Array element in String
var rAEliS = function(A, StrX) {
  if ( typeof(StrX) == "string" && StrX.length > 0 ) {
    for (i = 0; i < A.length; i++) {
       var elm = A[i];
       if ( StrX.indexOf(elm) !== -1 ) {
         StrX = StrX.slice(0, StrX.indexOf(elm)) + StrX.slice(StrX.indexOf(elm)+ elm.length);
       }
    }
  }
  return StrX;
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


var prevA = [];
var padIn = 0;

var mkTree = function(op) {

    var origA = op.split(".");
    var origB = op.split(".");

    padIn = 0;
    
    for (z = 0; z < origA.length; z++) {
      if ( typeof(prevA[z]) !== "undefined" ) {
          if ( prevA[z] == origA[z] ) {
               padIn = padIn + origA[z].length;
               origA[z] = " ";
          } else {
            break;
          }
      }
    }
    prevA = origB;
    var rp = origA.join("-");
    return rp;  
}


/* showEndPoints - mxo builds the search tree results */

var mzo = function(data,srStr, sType, replStr) {

    var result = {};
    var idxID = 0;
	gSA = [];
	
    function recurse (cur, prop, res, srStr, replStr) {
    
       if ( typeof(cur) !== "undefined" && Object(cur) !== cur) {
            // endpoint
            //var sj = prop.split('.')
             var cp = prop.toLowerCase();
			 if ( cur.length ) {
				var cs = cur.toLowerCase();
             } else { cs = "" }
			 
             if ( sType == 'Path' ) {
               var searchIndex = cp.indexOf(srStr);
             } else if ( sType == 'Text' || sType == 'Replace' ) {
               searchIndex =  cs.indexOf(srStr);
             } else {
               srStr = 'All';
               srIndex = 1;
             }
             
             if (srStr.length > 1) {
                  if ( searchIndex != -1 ) {
                  
                    var mo ={};
                    var shortstuff=pathFilter(prop).split('.');
                    if ( sType == 'Replace' ) {
                      cur = cur.slice(0,searchIndex) + replStr + cur.slice(searchIndex+srStr.length); 
					   gSedState=1;
                    }
                    
                    var lz=  "color: #000; background: #8888f8; height: 24px; line-height: 24px; border: 2px solid #d4d4d4;" ;
                    LHstyle ="height: 24px;";
                    if ( cur.length > 119 ) {
                      var lw = 120;
                      var lc = Math.ceil(cur.length/lw);
                      if ( lc > 2 ) { lc++ }
                      var lineht = Math.ceil(24*lc);
                      
                      LHstyle ="height: " + lineht + "px;";
                      lz=  "color: #000; background: #8888f8;" + LHstyle + " line-height: 24px; border: 2px solid #d4d4d4;";
                      // var origLen = cur.length
                      for (z = 1; z < cur.length; z++) {
                           var cc = cur.substring(z,z+1);
                           if ( ( z % lw ) == 0 ) { 
                              do {
                                  z++;
                                  cc = cur.substring(z,z+1);
                              } while ( z < cur.length && cc !== " " ) 
                              var ln = Math.floor(z/lw);
                              cur = cur.substring(0,z) + '</br>' + cur.substring(z);
                             //cur = cur.substring(0,lw*ln) + '</br>' + cur.substring(lw*ln);
                             z=z+4;
                           }      
                      }                       
                    }
                    mo.id = gSearchIdx++;
					         gSA[gSearchIdx] = prop;
                    mo.text= cur;
                    mo.state = { 'opened' : true, 'selected' : true };
                    mo.type="child";
                    mo.path=prop;
                    var pxa = pathFilter(prop).split('.');
                    var pf = pxa[pxa.length-1];
                    if ( pf == "language" || pf == "RoleCode" || pf == "KeyTypeCode" ) {
                     
                        mo.a_attr = { "style" : " color: #000; background: #88b8d8; border: 2px solid #d4d4d4", 'onclick' : 'cx(this)'   };
                        mo.icon="/img/drop-down-icon.png";
                   } else {
                        mo.a_attr = { "style" :  lz,
                                       'onclick' : 'sed(this)', 'oncontextmenu' : 'sed(this)' };
                        mo.icon="/img/leaf_icon.png";
                   
                   }
                     //mo.icon= "fa fa-pagelines";  
                    if (!Array.isArray(res['children']) ){
                      res.children = new Array();
                    }
                    res['children'].push(mo);
                    return res;
                }
            }
            return res;
    
       } else if (Array.isArray(cur)) {
       
             for (var p in cur) {
            
                 var mo ={};
                 mo.text = '<b>' + pathFilter(p) + '</b>';
                 mo.icon="/img/array_elem.png";
                 mo.state = { 'opened' : true };
                 mo.type="folder";
				 mo.id = gSearchIdx++;
				 gSA[gSearchIdx] = prop;
                 mo.separator_after = false;
                 var nr = recurse(cur[p], prop ? prop+"."+p : p, mo, srStr,replStr);
                
                 if ( typeof(nr.children) !== "undefined" ) {
                
                  if (!Array.isArray(res['children']) ) {
                    res.children = new Array();
                  }
                  res['children'].push(nr);
                }       
            }
            return res;
            
         
       } else {
            //object
       
            for (var p in cur) {
            
                 var pf = pathFilter(p);
                 var ico = "/img/folder.jpg";
                 if ( pf == "Extent" ) {
                   ico = "/img/extent-globe-icon.png";
                 } else if ( pf == "date" ) {
                    ico = "/img/cal-icon.png";
                 } else if ( pf == "fileIdentifier" ) {
                     ico = "/img/read-only-icon.png";
                 } 
                 
                 var mo ={};
                 mo.text = '<b>' + pathFilter(p) + '</b>';
                 mo.icon = ico;
				 mo.id = gSearchIdx++;
				 gSA[gSearchIdx] = prop;
                 mo.state = { 'opened' : true };
                 mo.type="folder";
                 mo.separator_after = false;
                 var nr = recurse(cur[p], prop ? prop+"."+p : p, mo, srStr, replStr);
                
                 if ( typeof(nr.children) !== "undefined" ) {
                
                  if (!Array.isArray(res['children']) ) {
                    res.children = new Array();
                  }
                  
                  if ( pf == "CharacterString" || pf == "Anchor" || pf == "Date" ) {
                    var charEnd = nr['children'];
                    var newC = charEnd[0];
                    res['children'].push(newC);
                  } else {
                    res['children'].push(nr);
                  }
                  
                  
                }       
            }
            return res;
        
        }
        
    }
    
    var er = recurse(data, "", result, srStr, replStr);
    return er;
    
}

/* Show Text & Path Search results for an XML record */

var showEndpoints = function(d,stitle) {

        var srStr = $('#stxt').val();
        gSearchStr = srStr.toLowerCase();
        var st = $('#searchType');
        if ( st[0].selectedIndex > -1 ) {
          var sType =  st[0].options[st[0].selectedIndex].value;
        } else {
          sType = 'Text';
        }
        
        var jflat = mzo(d,gSearchStr, sType);
        if ( typeof(stitle) == "undefined" ) {
          stitle = "";
        }
        sepHeader(srStr,stitle);
        
        $("#showList").show();
        iniTree(jflat);
    
}

function iniTree (d) {

     $('#jstree_div').jstree({
            'core' : {
                 "animation" : 0,
                 "multiple" : true,
                  "check_callback" : true,
                  'themes' : { 'stripes' : false },
                  'data' : [ d ] 
            },
            /*
            'contextmenu' : {
                  'items' : customMenu, 
                  'show_at_node' : true
            },*/
            "types" : {
              "#" : {
                "max_children" : 1000,
                "max_depth" : 100,
                "valid_children" : ["root"]
              },
              "root" : {
                "icon" : "img/tree_icon.png",
                "valid_children" : ["default"]
              },
              "default" : {
                "valid_children" : ["default","file"]
               
              },
              "file" : {
                "icon" : "img/tree_icon.png",
                "valid_children" : []
              }
            },
            "plugins" : [
              "dnd", "search",
              "state", "types"
            ]
       });

}
function cx(obj) {
  var txa_id = sed(obj);

}

var gwide;

function customMenu(node) {
    // The default set of all items
   
    var items = {
        editItem: { // The "rename" menu item
            label: "Edit-xxx",
            action: function () { console.log('edit') }
        },
        saveItem: { // The "rename" menu item
            label: "Save",
            action: function () { console.log('save me') }
        },
        deleteItem: { // The "delete" menu item
            label: "Delete",
            action: function () { console.log('delete') }
        },
        cancelItem: { // The "delete" menu item
            label: "Cancel",
            action: function () {
                var txaid = 'txa-'+node.id;
                var anchid = node.id + '_anchor';
                
                //$("#" + anchid).css('width','300px').css('opacity',0); 
                $("#" + txaid).remove();
                
                var anchorid = node.id+ '_anchor';
                $("#" + anchorid).css('width',gwide);
                $("#" + anchorid).css('opacity',1);
                console.log(' i am a ' + node.id ) }
        }
    };

    if ($(node).hasClass("folder")) {
        // Delete the "delete" menu item
        delete items.deleteItem;
    }
        
    return items;
}

var texld = function(tx) {
		console.log(' text ' + $(tx).val() ); 
}

var sed = function(i, porc) {
    
    if ( porc == 'p' ) {
       var tdi= i;
    } else {
    
      var tdi= $(i).parent()[0];
	  var widx = $(i).innerWidth();
      var htx = $(i).innerHeight(); 
    }
    
    var ofs = $(tdi).offset();
    var edval = $(i).text();
    
    if ( Array.isArray(tdi) ) { tdi = tdi[0] }
    
    var gid = tdi.id;
    //var  txanbr = 'txa-'+ gid.substring(4);
    var  txanbr = 'txa-'+ gid;
    if (  $("#"+txanbr).length ) {
    
      sedclick(i);
      return txanbr;
      
    }
    
    if ( $(i).is(":visible") ) {
      
      var txi = $('<textarea class="d3txtArea"></textarea>')
                 .attr('id',txanbr)
                 .text(edval)
                 .width(widx)
                 .height(htx)
				// .keydown(
               //  .attr('onclick','sedclick(this)');
                 .attr('onkeydown','texld(this);'); 
     
      gwide = $(i).css('width');
      $(i).hide(); 
      $(i).css('width',0); 
      $(i).css('opacity',0); 
      $(tdi).append( $(txi) ) //.offset({ top: ofs.top, left: ofs.left });
		.append($('<div>')
			.append($('<a>')
				.attr('id','savesed-' + txanbr)
				.attr('class','sel-link')
				.attr('onClick','sedSave(this);')
				.css('width','40px')
				.css('height','12px')
				.css('margin-left','20px')
				.css('display','inline')
				.text('Save'))
				//.append($('<img>')
				//	.attr('height','12px')
				//	.attr('width','12px')
				//	.attr('src','img/copyplus.jpg')))
			.append($('<a>')
				.attr('id','sedCancel-' + txanbr)
				.attr('class','sel-link')
				.attr('onClick','sedCancel(this);')
				.css('width','40px')
				.css('height','12px')
				.css('display','inline')
				.text('Cancel')));
				//.append($('<img>')
				//	.attr('height','12px')
				//	.attr('width','12px')
				//	.attr('src','img/del.png')));
		  

      //$(txi).focus();
	  $(txi).keydown(function( event ) {
		  console.log('kd event');
		  event.preventDefault();
		  var ek = event.key;
		  
		  if ( ek.length == 1 ) {
			 var $this = $(this);
			 var pos = $this[0].selectionStart;
			 $this.val($this.val().substring(0, pos) + event.key + $this.val().substring(pos));
			 // $this.setSelectionRange(pos+1, pos+1);
			  $this[0].setSelectionRange(pos+1, pos+1);
		  } else {
			if ( event.keyCode == 8 ) {
			  var $this = $(this);
			  var pos = $this[0].selectionStart;
			  $this.val($this.val().substring(0, pos-1) + $this.val().substring(pos));
			  $this[0].setSelectionRange(pos-1, pos-1);
		   } 
		   /*
		   else if ( !event.ctrlKey ) {

			var $this = $(this);
			var pos = $this[0].selectionStart;
		  
			$this.val($this.val().substring(0, pos) + event.key + $this.val().substring(pos));
			*/
		}
		//
		
	  });
	  
      //$(i).hide();
      return txanbr;
      
    } else {
       
       $(i).show();
       return 0;
       
    }
    
}

var sedclick = function(t) {
    console.log('clicked');
   // $(t).remove();
    
}

var sedSave = function(t) {
  
	var tdi= $(t).attr('id');
	var vm =  tdi.slice(12);
	var tbi = 'txa-'+vm;
	var tbo = $("#"+tbi)[0];
	
	var svi = 'sedCancel-txa-'+vm;
    var svo = $("#"+svi);
   
	var rd = vm+'_anchor';
    var rdo = $("#"+rd)[0];
	var rtext = $(rdo).text();
	var tbt = $(tbo).val();
	var cVm = parseInt(vm) + 1;
	var rPath = gSA[cVm];
	var kp;
	var basOb = gXMLSearch[gCKAN_pid];
	var dedo = jsonLookupWrite(basOb, kp, rPath, tbt);
	
	var cw = $(tbo).css('width');
    var ch = $(tbo).css('height');
       
   $(tbo).remove();
   $(svo).remove();
   $(t).remove();
   gSedState=1;
   $(rdo).css('width',cw);
   $(rdo).css('height',ch);
   $(rdo).css('opacity',1);
    $(rdo).css('display','inline-block');
   $(rdo).html(strBreak(tbt));
   $(rdo).show(); 
	
}

var strBreak = function(cur) {
	if ( cur.length > 119 ) {
	  var lw = 120;
	  var lc = Math.ceil(cur.length/lw);
	  if ( lc > 2 ) { lc++ }
	  var lineht = Math.ceil(24*lc);
	  
	 // LHstyle ="height: " + lineht + "px;";
	 // lz=  "color: #000; background: #8888f8;" + LHstyle + " line-height: 24px; border: 2px solid #d4d4d4;";
	  // var origLen = cur.length
	  for (z = 1; z < cur.length; z++) {
		   var cc = cur.substring(z,z+1);
		   if ( ( z % lw ) == 0 ) { 
			  do {
				  z++;
				  cc = cur.substring(z,z+1);
			  } while ( z < cur.length && cc !== " " ) 
			  var ln = Math.floor(z/lw);
			  cur = cur.substring(0,z) + '</br>' + cur.substring(z);
			 
			  z=z+4;
		   }      
	  }                       
	}
	return cur;
					
}
					

var sedCancel = function(t) {
  	
   var tdi= $(t).attr('id');
   var vm =  tdi.slice(14);
   var tbi = 'txa-'+vm;
   var svi = 'savesed-txa-'+vm;
   var svo = $("#"+svi);
   var rd = vm+'_anchor';
   var rdo = $("#"+rd)[0];
   var tbo = $("#"+tbi)[0];
   var cw = $(tbo).css('width');
   var ch = $(tbo).css('height');
   
   $(tbo).remove();
   $(svo).remove();
   $(t).remove();
   
   $(rdo).css('width',cw);
   $(rdo).css('height',ch);
   $(rdo).css('opacity',1);
   $(rdo).show();
	
}

var sedbtn = function(t) {

    $(t).attr('class', 'sed-btn')
        .attr('onclick','sedbtnsave(this)')
        .text('Save');
                                     
    var gid = t.id;
    var gidnbr = 'pxd-'+ gid.substring(4);
    var tb = document.getElementById(gidnbr);
    sed(tb);
    
    console.log('clicked');
  
}

var sedbtnsave = function(t) {
  
    $(t).attr('class', 'sed-btn')
        .attr('onclick','sedbtn(this)')
        .text('Edit');
        
    var gid = t.id;
    var gidnbr = 'txa-'+ gid.substring(4);
    var tb = document.getElementById(gidnbr);
    sedsave(tb);
    
}


var sepHeader = function(srStr, sTitle) {

      //dragElement(document.getElementById(("showList")));
      dragElement(document.getElementById("showMV"));
      $("#showMV").empty(); 
       
       $("#showMV")  //.text(sTitle + " Search Results for "+srStr)
         .append($('<div>')
            .attr('id','tc')
            .append($('<h5>')
               .text(sTitle))
             .append($('<h6>')
               .text("Search Results for "+srStr))
         .append($('<a>')
           .attr('id','replacer')
           .attr('class','sel-link')
           .attr('onClick','searchReplace();')
           .attr('title','replaceB')
           .attr('target','_blank')
           .text('Replace All'))
         /*
         .append($('<a>')
           .attr('id','repeater')
           .attr('class','sel-link')
           .attr('onClick','repeatEdit();')
           .attr('title','replaceB')
           .attr('target','_blank')
           .text('Repeat Last Edit'))
         .append($('<a>')
           .attr('id','saver')
           .attr('class','sel-link')
           .attr('onClick','saveEdit();')
           .attr('title','saveEdit')
           .attr('target','_blank')
           .css('margin-right','5px')
           .text('Save Edits'))
         .append($('<a>')
           .attr('id','save-edit-template')
           .attr('class','sel-link')
           .attr('onClick','saveSearch();')
           .attr('title','sav-edit-template')
           .attr('target','_blank')
           .text('Save Edits as Template'))
          .append($('<a>')
           .attr('id','get-edit-template')
           .attr('class','sel-link')
           .attr('onClick','getTemplates();')
           .attr('title','get-edit-template')
           .attr('target','_blank')
           .text('Select Edit Template'))
          .append($('<a>')
           .attr('id','exec-edit-template')
           .attr('class','sel-link')
           .attr('onClick','execTemplate();')
           .attr('title','exec-edit-template')
           .attr('target','_blank')
           .css('margin-right','5px')
           .text('Apply Template'))
         */
         .append($('<a>')
           .attr('id','hideSearch')
           .attr('class','sel-link')
           .attr('onClick','searchCleanup()')
           .attr('title','hideSearch')
           .attr('target','_blank')
           .text('Close')));
          
}

var searchReplace = function(sStr) {

  var bt = $("#replacer").text();
  if ( bt == "Replace All" )  {
      $("#replacer").text("Run")
        .append($('<input>')
               .attr('id','strReplace')
               .attr('placeholder','with...')
               .css('width',300)
               .css('margin-left',60));
               
      $("#strReplace").focus(); 
        
  } else {
  
    // confirm then save
    console.log("save as " +  $("#strReplace").val() );  
    var replStr =  $("#strReplace").val();
    
    var d= gXMLSearch[gXMLedit_pid];
    $.jstree.destroy();
    var jflat = mzo(d,gSearchStr,"Replace",replStr );  
    iniTree(jflat);
    $("#replacer").text("Replace All")
    $("#strReplace").remove();
  
  }
    
}

var saveSearch = function() {

  var bt = $("#save-edit-template").text();
  if ( bt == "Save Edits" )  {
      $("#save-edit-template").text("Save as ..")
        .append($('<input>')
               .attr('id','txtTemplate')
               .attr('placeholder','....')
               .css('width',300)
               .css('margin-left',60));
               
      $("#txtTemplate").focus(); 
        
  } else {
  
    // confirm then save
    console.log("save as " +  $("#txtTemplate").val() );
    
    $("#save-edit-template").text("Save Edits")
  
  }
    
  
}


var searchCleanup = function() {
  
  $.jstree.destroy();
  $("#showList").hide();
  if (gSedState) {
	  
	reSchemD3();
  }
  
}

var ddhCleanup = function() {
  
  $("#showDDH").hide();
  
}

var  showDDHRecords = function() {

    //dragElement(document.getElementById(("showDDH")));
    dragElement(document.getElementById("showDDHdr"));
    $("#showDDHdr").empty(); 
    
    var sndx = $("#searchDDH").val().split(' ');
    $('#stxt').val(sndx[0]);
       
   $("#showDDHdr")// .text("Search Results for "+$("#searchDDH").val()) 
     .append($('<div>')
            .attr('id','tc')
            .append($('<h2>')
              .text("Results for "+ $("#searchDDH").val() )))
     .append($('<div>')   
        .append($('<a>')
         .attr('id','DDH-process-block')
         .attr('class','sel-link')
         .attr('onClick','lastPage();')
         .attr('title','last-page')
         .attr('target','_blank')
         .text('<'))
       .append($('<a>')
         .attr('id','DDH-process-block')
         .attr('class','sel-link')
         .attr('onClick','nextPage();')
         .attr('title','next-page')
         .attr('target','_blank')
         .css('margin-right','5px')
         .text('>'))            
        .append($('<a>')
         .attr('id','DDH-select-all')
         .attr('class','sel-link')
         .attr('onClick','selectAllRecords();')
         .attr('title','select-records')
         .attr('target','_blank')
         .text('Select-All'))
        .append($('<a>')
         .attr('id','DDH-select-page')
         .attr('class','sel-link')
         .attr('onClick','selectPageRecords();')
         .attr('title','select-page')
         .attr('target','_blank')
         .text('Select-Page'))
        .append($('<a>')
         .attr('id','DDH-clear-page')
         .attr('class','sel-link')
         .attr('onClick','clearPageRecords();')
         .attr('title','clear-page')
         .attr('target','_blank')
         .text('Clear-Page'))
        .append($('<a>')
         .attr('id','DDH-get-save-set')
         .attr('class','sel-link')
         .attr('onClick','loadSelectedRecords();')
         .attr('title','set')
         .attr('target','_blank')
         .text('Load Saved Selection Set'))
       .append($('<a>')
         .attr('id','DDH-save-set')
         .attr('class','sel-link')
         .attr('onClick','storeSelectedRecords();')
         .attr('title','set')
         .attr('target','_blank')
         .css('margin-right','5px')
         .text('Save this Selection Set'))
       .append($('<a>')
         .attr('id','DDH-get-save-set')
         .attr('class','sel-link')
         .attr('onClick','loadEditSet();')
         .attr('title','set')
         .attr('target','_blank')
         .text('Select Edit Script'))
        .append($('<a>')
         .attr('id','DDH-get-save-set')
         .attr('class','sel-link')
         .attr('onClick','runEditSet();')
         .attr('title','set')
         .attr('target','_blank')
         .css('margin-right','5px')
         .text('Run Edit Script'))
       .append($('<a>')
         .attr('id','DDHhideSearch')
         .attr('class','sel-link')
         .attr('onClick','ddhCleanup()')
         .attr('title','hideDDH')
         .attr('target','_blank')
         .text('Close')));
      // .css('float','right'));
  
  $.jstree.destroy();
  $("#showList").hide();
  
  show_cinergi(gDDH_page);
  $("#showDDH").show();
  
}

function lastPage() {
    ( gDDH_page > 0 ) ? gDDH_page-- : 0;
    $("#cin_results_div").empty();
    show_cinergi(gDDH_page);
    
    $.jstree.destroy();
    $("#showList").hide();
  
}

function nextPage() {
    gDDH_page++;
    $("#cin_results_div").empty();
    show_cinergi(gDDH_page);
    
    $.jstree.destroy();
    $("#showList").hide();

}

function selectPageRecords() {
    
    $('.g-item-card').each(function( i, gcard ) {
       console.log(' Item ' );
       $(gcard).attr('class','g-item-card-saved')
       var tx = $(gcard).children('button.sel-link-state');
       $(gcard).find('button.sel-link-state').text('+');
       var bid = $(gcard).find('button.sel-link-state').attr('id');
       var mp = bid.split('#-#');
       var fid = mp[3];
       gXMList.push(fid);
       
    });
  
}

function clearPageRecords() {
    
    $('.g-item-card-saved').each(function( i, gcard ) {
       console.log(' Item ' );
       $(gcard).attr('class','g-item-card')
       $(gcard).children('button.sel-link-state').text('_');
       var tx = $(gcard).children('button.sel-link-state');
       var bid = $(gcard).children('button.sel-link-state').attr('id');
       var mp = bid.split('#-#');
       var fid = mp[3];
       var lx = gXMList.indexOf(fid);
       if ( lx !== -1 ) gXMList.splice(lx, 1) ;
       
    });
  
}


/* This is the record search */

	function show_cinergi(sp, savedSearch ) {
  // Show DDH records on search page
    var baseRef="/DDH-GetRecords-Qry?";
	  sType = "Cinergi";
    var aggUrl;
	  var startP = sp*10;

    if ( savedSearch ) {
        aggUrl = savedSearch;
    } else {
  	  var inp = $("#searchDDH").val();
  	  var inJ = inp.split(" ").join('+');
  	  var inParams = '&from='+startP+'&q='+inJ;
      var xSrchUrl = encodeURI(baseRef+inParams);
      sSrchUrl = xSrchUrl.replace(/=/g,'-#-');
      aggUrl = baseRef+inParams;
    }

	  $.ajax({
		    type: 'GET',
		    url: aggUrl,
		    dataType: "json",
		    contentType: "application/json",
		    success: function(data) {
		      
		        var pstack = '<b>Cinergi results found ' + data.hits.total + ' returned starting at ' +  startP + '</b></br>';
	        
	          var ha = []; 
	          ha = data.hits.hits;
	          var zc = '</br>';
	        
	          for (i = 0; i < ha.length; i++) {
	          	var hid = ha[i]._id;
             // var setCard = "g-item-card";
              //var cHid = getCookie(hid);
              
              //if ( cHid != "" ) {
              //     var setCard = "g-item-card-saved";
              //}
	          	var src_fid = ha[i]._source.fileid;
                          
              if ( isXMLitem(src_fid) > 0 ) {
                var setCard = "g-item-card-saved";
                var btx = "+";
              } else {
                 var setCard = "g-item-card";
                 var btx = "_";
              }
              
           	 // var src_name = 'Data Source: ' + ha[i]._source.src_source_name_s;
	          //	var src_type = 'Data Source Type: ' + ha[i]._source.src_source_type_s;
	          //	var src_uri = 'Data Source URI: ' + ha[i]._source.src_uri_s;
	          	var src_title = ha[i]._source.title;
	          	var src_desc = ha[i]._source.description;

	          	var lnk = ha[i]._source.links_s;
              /*
	          	var sl = ' Links </br>';

	          	if (Array.isArray(lnk) ) {
	          		for (z= 0; z <lnk.length; z++) {
	          			var ls = lnk[z];
                 // var zed = urlCheck(ls); 
	          			sl = sl + '<a rel="external" class="aref-valid" target ="_blank" onclick="javascript:lbak(this);" href="' + ls + '">' + ls + '</a></br>';

	          		 }
	          		console.log(sl);
	          	} else {
	          		if ( typeof(lnk) !== "undefined") {
                  var zed = urlCheck(ls);                  
	          			sl = sl + '<a rel="external" class="aref-valid" target ="_blank" onclick="javascript:lbak(this);" href="' + lnk + '">' + lnk + '</a></br>';
		
	          		}
	          	}  
              */

              var idn = hid + '#-#' + src_title + '#-#' + src_fid;
              zc = zc + '<div class="' + setCard +'"><button class="sel-link-state" id="ddhS#-#';
	          	zc = zc + idn + '" onclick="sel_mdred(this);">' + btx + '</button>';  
              
           	  zc = zc + '<button class="sel-link" id="ddh-edit#-#';
              zc = zc + idn + '" onclick="show_mdrec(this);" >View</button>'; 
              
              zc = zc + '<a id="ddh-edlink#-#' + idn + ' onclick="show_mdrec(this);" target ="_blank">' + src_title + '</a></br>' + src_desc + '</br></div></br>';
                     
          		//zc = zc + '<b>' + src_title + "</b></br> " + src_type + '</br>' + src_uri + '</br>' + src_desc + '</br></div></br>';
	          	//zc = zc + '<b>' + src_title + "</b></br> " + src_type + '</br>' + src_uri + '</br>' + src_desc + '</br>' + sl + '</div></br>';

	          }
              
		        $("#cin_results_div").html(pstack + zc);

		      }
	  });
	};
 
function sel_mdred(itm) {

    var mp = itm.id.split('#-#');
    var hid = mp[1]
    var nTitle= mp[2];
    var fid = mp[3];
    var bstate = $(itm).text();
    
    var gcard = $(itm).parent();
    
    if ( bstate == '_' ) {
        gXMList.push(fid);
        $(itm).text('+');
        $(gcard).attr('class','g-item-card-saved')
    }  else {
      
      for (var i in gXMList) {
          if ( gXMList[i] == fid ) {
                // found in selection set - so clear it
             gXMList.splice(i,1);
             $(gcard).attr('class','g-item-card')
             console.log(' found and deleted ' + fid);
          }
      }
      $(itm).text('_');
    }
}

function isXMLitem(fid) {

      for (var i in gXMList) {
          if ( gXMList[i] == fid ) {
          return i;
            // gXMList.splice(i,1);
          }
      }
      return 0;

}

function show_mdrec(itm) {

  console.log(' show xml '+ itm.id);
  var mp = itm.id.split('#-#');
  var hid = mp[1];
  var nTitle= mp[2];
  var fid = mp[3];
  
  mp[0] = 'ddhS';
  var sb = mp.join('#-#');
  var znu = document.getElementById(sb);
  sel_mdred(znu);
  
  var xmlurl = '/cin_xml?schema=cinergi-xml.json&qt=f&pid=' + encodeURIComponent(fid);
  var XMLSearch = {};
  gXMLedit_pid = fid;
  
  $.ajax({
        type: 'GET',
        url: xmlurl,
        dataType: 'json',
        contentType: "application/json",
        success: function(data, status) {
          if ( data ) {   
           if ( typeof(data[1].OriginalDoc) !== "undefined" ) {
               XMLSearch = data[1].OriginalDoc;
               if ( typeof(gXMLSearch[fid]) == "undefined" ) { 
                 gXMLSearch[fid] = XMLSearch;
                 
               }
                $.jstree.destroy();
                showEndpoints(gXMLSearch[fid],nTitle);
            } else {
            
              var xid = data[1]._id;
              get_indexml(fid,nTitle);
              
            }   
                
          }
            
        }, 
        error: function (jqXHR, status, err) {  
          console.log('view record lookup error' + status + err);  
        }
    });

}

function get_indexml(fid,nTitle) {

  var idxUrl = '/indexID?docId=' + encodeURIComponent(fid);
  //var xmlurl = '/cin_xml?schema=cinergi-xml.json&qt=g&pid=' + encodeURIComponent(hid);
  var XMLSearch = {};
  
  $.ajax({
        type: 'GET',
        url: idxUrl,
        dataType: 'json',
        contentType: "application/json",
        success: function(data, status) {
           
          if ( data ) {   
            var idx = data.indexID;
            var xmlurl = '/cin_xml?schema=cinergi-xml.json&qt=g&pid=' + encodeURIComponent(idx);       
             $.ajax({
                type: 'GET',
                url: xmlurl,
                dataType: 'json',
                contentType: "application/json",
                success: function(data, status) {
                
                   if ( typeof(data[1].OriginalDoc) !== "undefined" ) {
                       XMLSearch = data[1].OriginalDoc;
                       if ( typeof(gXMLSearch[fid]) == "undefined" ) { 
                         gXMLSearch[fid] = XMLSearch;
                       }
                  } else {
           
                    XMLSearch = { "id" : "no data found" };
                  }   
                           
                   $.jstree.destroy();
                   showEndpoints(gXMLSearch[fid],nTitle);      
                  }
             }); 
          }       
        }, 
        error: function (jqXHR, status, err) {  
          console.log('view record lookup error' + status + err);  
        }
    });
    
}

var showEndpointsX = function() {
      // XML search function - 4/4/18
      prevA = [];
      var jflat = JSON.flatten(gCKAN_package);
      
      //var xft = JSON.stringify(jflat,null,'   ');
      var srStr = $('#stxt').val();
      var srLC = srStr.toLowerCase();
      
      //if ( jflat.length > 1 ) {  
        var jView = {};
       // $('#searchStack').empty();
       dragElement(document.getElementById(("showList")));
       
       $("#sHdr").text("Search Results for "+srStr)
         .append($('<input>')
           .attr('id','txtReplace')
           .attr('placeholder','Replace with ....')
           .css('width',300)
           .css('margin-left',60))
         .append($('<a>')
           .attr('id','replacer')
           .attr('class','nav-link')
           .attr('onClick','$("#showList").hide();')
           .attr('title','replaceB')
           .attr('target','_blank')
           .text('Replace All'))
         .append($('<a>')
           .attr('id','hideSearch')
           .attr('class','nav-link')
           .attr('onClick','$("#showList").hide();')
           .attr('title','hideSearch')
           .attr('target','_blank')
           .text('Close')
           .css('vertical-align','text-top')
           .css('float','right'));
          
        $("#searchTab").find("tr:gt(0)").remove(); 
        $("#searchTab").find("tr:eq(0)").remove(); 
        $("#searchTab").find('tbody')
            .append($('<tr>')
                .append($('<th>')
                    .attr('class', 's-hdr')
                     .css('width',500)
                    .append($('<p>')
                        .text('Element')
                    )
                )
                .append($('<th>')
                     .attr('class', 's-hdr')
                      .css('width',400)
                    .append($('<p>')
                        .text('Value')
                    )
                )
                .append($('<th>')
                    .attr('class', 's-hdr')
                    .css('width',80)
                    .append($('<p>')
                        .text('Action')
                    )
                )
            );
        
        for (var i in jflat) {
          jView = jflat[i];
          if ( jflat[i].type == "endpoint" && jflat[i].Path.length > 1 && jflat[i].Value.length > 1 ) {
                var cs = jflat[i].Value.toLowerCase();
                if (srStr.length > 1) {
                  if ( cs.indexOf(srLC) != -1 ) {
                    var snek = mkTree(jflat[i].sPath);
                    //var sna = sn.split('.');
                    var padx = padIn*3;
                    $("#searchTab").find('tbody')
                          .append($('<tr>')
                              .append($('<td>')
                                   .attr('class', 'td-s')
                                   .css('width',500)
                                   .append($('<p>')
                                     .css('padding-left',padx)
                                     .text(snek)
                                  ))
                               .append($('<td>')
                                   .attr('class', 'td-s')
                                    .css('width',400)
                                    .append($('<p>')
                                      .attr('class', 'pxd')
                                      .attr('id','pxd-'+i)
                                      .text(jflat[i].Value)
                                     // .attr('onclick','sed(this)')
                                     // .click(function() {
                                    //       $('next').attr('onclick','alert(i)');
                                    //  }
                               ))
                              .append($('<td>')
                                   .attr('class', 'td-s')
                                   .css('width',60)
                                   .append($('<a>')
                                     .attr('class', 'sed-btn')
                                     .text('Edit')
                                     .attr('id','ssb-'+i)
                                     .attr('onclick', 'sedbtn(this)')
                                     .attr('target','_blank'))
                              )
                          );
                  
                  //  $('#searchStack').append(
                  //   $('<li>').append(
                  //    $('<a>').attr('href','#')
                  //        .attr('id','x00')
                  //        .attr('style','font-weight: bold')
                  //        .attr('onclick',"javascript:clearEdits();").append(
                  //            $('<span>').append(jflat[i].sPath + " - " + jflat[i].Value + "(x)")
                   //   )));
                  }
                } else {
                      $("#searchTab").find('tbody')
                          .append($('<tr>')
                              .append($('<td>')
                                   .attr('class', 'td-s')
                                   .css('width',500)
                                  .append($('<p>')
                                      .text(jflat[i].sPath)
                               ))
                               .append($('<td>')
                                  .attr('class', 'td-s')
                                   .css('width',400)
                                  .append($('<p>')
                                      .text(jflat[i].Value)
                               ))
                              .append($('<td>')
                                  .attr('class', 'td-s')
                                  .css('width',80)
                                  .append($('<p>')
                                      .text('(x)')
                              ))
                          );
                  
                  /*
                    $('#searchStack').append(
                     $('<li>').append(
                      $('<a>').attr('href','#')
                          .attr('id','x00')
                          .attr('style','font-weight: bold')
                          .attr('onclick',"javascript:clearEdits();").append(
                              $('<span>').append(jflat[i].sPath + " - " + jflat[i].Value + "(x)")
                      )));
                   */
                }
         
          } 
        }
        $("#showList").show();
          
      //  }
      //  var w = window.open();
     //   $(w.document.body).html('<pre>' + xft + '</pre>');
     // } else { 
     //     console.log('empty package'); 
     // }
}


var showXML = function() {

    var refObj = {};
    refObj.pid = gCKAN_pid;

    // Added 5/2 - since the NOAH pks can have embedded invalid characters
    gCKAN_package.primaryKey = gCKAN_pid;
    refObj.body =  gCKAN_package;
    // var inp = {'datakey': 'DataObject'}; // JSON.stringify(refObj);

    $.ajax({ 
          type: 'POST',
          url: '/cin_xml_save',
          processData: false,
          data: JSON.stringify(refObj),
          dataType: "json",
          contentType: "application/json",  
          success: function(data,jqXHR) {   
               var x = data.result;
               console.log(' length ' + x.length);
              var rf = '<gmi:MI_Metadata xmlns:gmi="http://www.isotc211.org/2005/gmi" xmlns:gco="http://www.isotc211.org/2005/gco" xmlns:gmd="http://www.isotc211.org/2005/gmd" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:gmx="http://www.isotc211.org/2005/gmx" xmlns:gsr="http://www.isotc211.org/2005/gsr" xmlns:gss="http://www.isotc211.org/2005/gss" xmlns:gts="http://www.isotc211.org/2005/gts" xmlns:srv="http://www.isotc211.org/2005/srv" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.isotc211.org/2005/gmi http://ngdc.noaa.gov/metadata/published/xsd/schema.xsd">';
              
              var res = x.replace('<gmi:MI_Metadata>', rf);
              
              //xmlDoc = $.parseXML( res );
              //var w = window.open('data:text/xml,' + encodeURIComponent(x) );
              //var xmlString = (new XMLSerializer()).serializeToString(xmlDoc);
               var ec = encodeURIComponent(x);
               
               var w = window.open();
               w.document.body.innerHTML = res;
             
               //var hndl = window.open('','xmlstr_window','width=900,height=800');
               //var newdoc = hndl.document.open("text/html","replace"); // set mime type
               //$(newdoc).body.add.text(res);
               /*
               $(newdoc).append($('<body>'))
                        .append($('<div>'))
                        .text(res);
                */         
               //newdoc.write (res);
              // newdoc.close();
               
               //var wx = window.open();
              // wx.document.write("data:text/xml;charset=utf-8,"+x);
               //wx.focus();
               
               //var winz = window.open('<pre>' + ec + '</pre>', "", "_blank");
              //var winz = window.open("data:text/xml,"+x, "", "_blank");
              //$(w.document.body).html('<pre>' + data + '</pre>');
              console.log(data);
          
          },
          error: function (jqXHR, status, err) { 
            console.log('Re Schema Error : ' + status + ' ' + err)

          }

        });

}

var showFullPack = function () {

    if ( gCin_edit ) {
      
      gCin_edit.dateTime = new Date($.now());
      gCin_edit.editedBy = getCookie('editorName');
      //var jflat = JSON.flatten(gCKAN_package);
      //var xft = JSON.stringify(jflat,null,'   ');
      var xft = JSON.stringify(gCKAN_package,null,'   ');
      
      
      if ( xft.length > 1 ) {
  
        var w = window.open();
        $(w.document.body).html('<pre>' + xft + '</pre>');
      } else { 
          console.log('empty package'); 
      }
    }
}

var showFlat = function () {
// Flat Json using hash path

    if ( gCin_edit ) {
      
      gCin_edit.dateTime = new Date($.now());
      gCin_edit.editedBy = getCookie('editorName');
    //  var jflat = JSON.flatten(gCKAN_package);
       var xft = JSON.stringify(gFlat,null,'   ');
     // var xft = JSON.stringify(jflat,null,'   ');
      //var xft = JSON.stringify(gCKAN_package,null,'   ');
      
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
    //	$("#trigproc").hide(); 
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
		    		$("#savejson").css({ 'background-color' : '#1E84A8' });

            //$("#trigproc").show(); 
		    		//$("#trigproc").css({ 'background-color' : '#196fa6' });
                                               
		    		gLoginState = 'LogYes';
		    		$("#loginBtn").html("Logged in as " + lser);
		    		$("#loginBtn").css({ 'background-color' : '#1E84A8'});
            $("#mousebox").html ('');
		    	} else {
		    		console.log('Login NO AUTH');	
		    		gLoginState = 'LogNo';
		    		$("#savejson").hide(); 
            //$("#trigproc").hide(); 
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

function startPipelineProcess() {
  
  if ( confirm('Do you want to reindex ?') ) {
       console.log('I certainly do');
       
       var noodel = JSON.stringify(gCKAN_package);
       var pdata = { "primaryKey" : gCKAN_package.primaryKey,
                    "sourceID" : gCKAN_package.SourceInfo.SourceID,
                    "apiKey" : "5d7a38c85d280ae20b28c38c2ece8481"
                  };
                  
       var docid = gCKAN_package.primaryKey;
       var purl = "http://132.249.238.151:8080/foundry/api/cinergi/editing/process?primaryKey=" + encodeURIComponent(docid) + 
                  "&sourceID=" + gCKAN_package.SourceInfo.SourceID + "&apiKey=5d7a38c85d280ae20b28c38c2ece8481";
       var inp = JSON.stringify(pdata);
       
       $.ajax({ 
        type: 'POST',
        url: purl,
        contentType: "text/plain;charset=UTF-8",  
        success: function(data, status, xhr) {
          
          console.log(' came back as ' + data + ' ' + status + ' ' + xhr);
          getIndexID();
        
        },
        error: function (jqXHR, status, err) {
          var statCode = jqXHR.status;
          var msg = jqXHR.responseText;
          
          console.log('Pipeline Process Error : ' + statCode + ' ' + msg );
          alert('Pipeline Process Error : ' + statCode + ' ' + msg );
          
          }

      });
      
  
  } else {
  
    console.log('Changed my mind');
  }
}

var getIndexID = function( ) {
// This retrieves the index ID and then callss the reindex request (trigIndex)

  var hurl = '/indexID/?' + 'docId='+ gCKAN_pid ;
  console.log('get the index ID' );
    $.ajax({
        type: 'GET',
        url: hurl,
        dataType: 'json',
        contentType: "application/json",
        success: function(data, status) {
          if ( data ) {         
           if ( data.indexID ) {
               gIndxID = data.indexID;
               saveMdb();
               //ElasticIndex(gIndxID);
               console.log(' index id ' + gIndxID);
           } else {
               console.log('index err');
               gIndxID = '';
           }            
          } else {
            console.log('index ID - BAD');       
          }     
        }, 
        error: function (jqXHR, status, err) {  
          console.log('index lookup error' + status + err);  
        }
    });
}

function ElasticIndex(idxID) {
 // Sends it to the mdeditor server for processing
 
 
   var hurl = '/md_reindex?' + 'docId='+gCKAN_package.primaryKey+'&indexId='+idxID;
    console.log('start reindex check');
    $.ajax({
        type: 'GET',
        url: hurl,
        success: function(data, status) {
          if ( data ) {
            console.log('url check - OK ' + data + ' ' + status);
            alert(data);
          } else {
            console.log('url check - BAD');
          }
        }, 
        error: function (jqXHR, status, err) {
          alert(err);  
          console.log('url check error' + err);   
        }
    });
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
  
      if ( gCKAN_package.SourceInfo ) {
         gCIN_saveDoc.SourceID = gCKAN_package.SourceInfo.SourceID;
      }
      gCIN_saveDoc.indexId = gIndxID;
      var saveURL = '/cin_xml_index'
      var inp = JSON.stringify(gCIN_saveDoc);
      console.log(' save ' + inp);
    
      $.ajax({ 
        type: 'POST',
        url: saveURL,
        processData: false,
        data: inp,
        dataType: "json",
        contentType: "application/json",  
        success: function(data) {
          
          //res = data.result;
          //var pstack = 'Save Package :' + gTitle; //JSON.stringify(res,undefined,2);
         // alert(' Response ' + JSON.stringify(data) );
         //clearEdits();
          //listEditHistory();
          // $("#myEd").html(pstack);
          mongodbSave();
         

          },
        error: function (jqXHR, status, err) { alert('Save Error : ' + status + ' ' + err)}

      });
      //} else { 
      //  alert('No edits to save ');
      //}
      
}

function mongodbSave() {

   var inp = JSON.stringify(gCIN_saveDoc);
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
			//$("#showMap").empty(); 
            visu(error, tData);
            reset();
          },
          error: function (jqXHR, status, err) { 
            console.log('Re Schema Error : ' + status + ' ' + err)

          }

        });

}

var loadIndexID = function( ) {
// This retrieves the index ID and then callss the reindex request (trigIndex)

  var hurl = '/indexID/?' + 'docId='+ gCKAN_pid ;
  console.log('get the index ID' );
    $.ajax({
        type: 'GET',
        url: hurl,
        dataType: 'json',
        contentType: "application/json",
        success: function(data, status) {
          if ( data ) {         
           if ( data.indexID ) {
               gIndxID = data.indexID;
               loadD3();
               //ElasticIndex(gIndxID);
               console.log(' index id ' + gIndxID);
           } else {
               console.log('index err');
               gIndxID = '';
           }            
          } else {
            console.log('index ID - BAD');       
          }     
        }, 
        error: function (jqXHR, status, err) {  
          console.log('index lookup error' + status + err);  
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

    mdurl = '/cin_xml?&schema=' + tempSchema + '&pid=' + encodeURIComponent(gCKAN_pid)+'&idx='+gIndxID;
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
          gFlat = JSON.flatten(gCKAN_package.OriginalDoc);
          if ( packageObj.metadataRecordLineageItems &&  packageObj.metadataRecordLineageItems.length > 0 ) {
          
            gDDH_edit = packageObj.metadataRecordLineageItems;  
           // if ( !gDDH_edit ) { gDDH_edit = packageObj.item.metadataRecordLineageItems;  }
            if ( gDDH_edit  && Array.isArray(gDDH_edit )) {
              var iac = gDDH_edit.length;
              // added global step# feb13/18
              gEditStepSeq  = gDDH_edit.length;
              listEditHistory();
              
            } else { gEditStepSeq = 0 }
            // modify 9/11 - removed item
            gCinEditSession =  { 
                                  "stepSequenceNo" : gEditStepSeq, 
                                  "stepProcessors" : [ { "personName": gEdName } ],  
                                  "stepDateTime" : new Date($.now()),
                                  "metadataUpdates": []
                                };                                         

          } else {
            gEditStepSeq = 0;
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
          gXMLSearch[gCKAN_pid] = gCKAN_package.OriginalDoc;
          
          //console.log (JSON.stringify(tData) );

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
           if ( typeof(jB.titleval._ ) !== "undefined" ) {
               var tv = jB.titleval._;
           }  else {
             var tv = jB.titleval;
           }
          $("#myEd").html("<h3>"+ tv + "</h3>");
          // if not in DocHistList
          gTitle = tv;
          setCookie(gCKAN_pid, tv, 60 );
          docHistList.push({ gCKAN_pid : tv });
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

  btnQ = $('<a id="curEdBtn" class="nav-link" title="Saves the name of the curator/editor - independent of the login name" target="_blank">Curator</a>');
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
     $("#curEdBtn").html("Save Curator");
     $("#editby").append('<input type="text" title="Enter or change name and click Save Curator button" id="edbyin" width="15" name="username"/>');
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
      gCinEditIdx = 0;
      gEditStepSeq++;
      gCinEditSession = { "stepSequenceNo" :  gEditStepSeq, 
                          "stepProcessors" : [ { "personName": gEdName } ],  
                          "stepDateTime" : new Date($.now()),
                          "metadataUpdates": [] };   
      /* this is for previous schema - changed 2/13/18                    
      if ( typeof( gCinEditSession.item ) !== "undefined" ) {
        var EdA = gCinEditSession.item.metadataUpdates;
      }
      
      if ( !EdA ) { EdA = gCinEditSession.metadataUpdates; }

      for(var i = 0; i <= EdA.length; i++) {
          EdA.splice(0,1);
      }
      */
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

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  elmnt.onmousedown = dragMouseDown;
/*  
  if (document.getElementById("showMV") ) {
     //if present, the header is where you move the DIV from:
    document.getElementById("showMV").onmousedown = dragMouseDown;
  } else {
    //otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }
*/
  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}



