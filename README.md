# Dynamic JSON Editor and Schema Translator (DyJest)

This Metadata Editor is based on a D3 SVG tree graphic, using a local json file as the User interface schema to build the nodes. Also included in the json file are reference attributes for populating values with data imported from external api calls that return json.  The intent is for this editor to work with multiple UI json schemas and to easily adapt to variety of metadata standards and formats and sources.  The source json object is preserved locally, and once the edits have been completed the intent is with an export schema, to map the Json object back to the source structure and post it back to its original repository.

The transform function iterates through a provided schema, and looks up all reference attribute values from the source json, returning a json object that has the structure of the provided schema populated with data from the source json. This allows the same transform functions to be used for both exports and imports, only requiring accurate json schemas to provide correct json output.

User Interface Capabilities

    Pan and Zoom - double click to zoom in 
    Collapse and Expand Tree -click on nodes to collapse or expand
    Drag and Drop - allows modification of the json tree
    Right click on a node to edit

    Editor Menu - Data Type sensitive edit widgets
	Text 
	Large Text - text area widget
	Date - date picker
	Spatial - Bounding Box with map widget
	Array - Create, edit, delete items.

Navigation Legend

  End Nodes - containing values - Blue Circle shows the data value
            - empty value - small white cirle show the field name

   Parent Nodes  Object Nodes - Dark Blue show node name only
                 Array Nodes - Green 
  
  Links - gold links nodes containing data
        - grey links nodes with no data

#Installation

TBD




 
 
