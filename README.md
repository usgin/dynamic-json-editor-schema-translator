# Cinergi Data Discovery Hub customizations

The primary change of this version of the metdata editor injests xml from the Data Discovery Studio geoportal and transforms to json.  If the user decides to save changes, 
data is saved in mongodb and in the editedRecords Collection,  and the the updated record is translated back to xml and pushed to the geoportal index so that the user can
view the changes in real time.

The Data Discovery Hub metadata editor differs from the standard editor in the following ways:

1 - Provides json path arrays in the schema files to allow multiple json paths for each metadata element. This allows the editor to edit     records with the different metadata schemas. Cinergi records are harvested from many data sources, so the metadata formats may vary.
    
2 - Creates "difference objects" that track edit changes for processing in Cinergi pipeline.

3 - Saves the edited objects to a different collection than the source data.  The application checks if the edited object
    is available and uses it. the orginal source data is never modified.
    
4 - The pipeline processed data record is copied to the edited record, these values are not changed, but does allow
    marking these records as valid or not valid for subsequent pipeline processing and metadata enhancement.
    
5 - Since Cinergi metadata schemas vary, adding metadata elements by schema has not so far been feasible.  This is 
    a part of the standard tool that has been disabled.
    
6 - Custom typeaheads that are useful in the cinergi environment include

    Key word completion 
    
    http://ec-scigraph.sdsc.edu:9000/scigraph/vocabulary/autocomplete
    
    Keyword Type - local dictionary extracted from cinergi Dataset
    
    Bounding box lookups
    
    ESRI Gazateer with Extent filtering
    
    http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest
    http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidatesQQQsingleLine
    
    IdentificationInfo Topic Categories - local dictionary extracted from cinergi database
    