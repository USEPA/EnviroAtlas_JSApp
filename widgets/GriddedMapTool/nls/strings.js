define({
  root: {
    selectLabel: "Select Area and Layer",
    resultsLabel: "Results",
    clear: "Clear selection",
    calculate: "Calculate",
    attributeHeader: "Attribute",
    valueHeader: "Value",
    areaOfSelectionHeader: "Area of Selection",
    sizeError: "The area you have selected is too large, please try again with a smaller selection.",
    tooSmallError: "The area you have selected is too small, please try again with a larger selection.",
    genericError: "Something went wrong, please re-select an area on the map to try again",
    hucServiceMsg: "Zoom in to see HUC boundaries",
    inputTableHeaderCol1: {
      area: "Draw Type",
      point: "Draw Type",
      huc: "HUC-12",
      district: "Congressional District",
      state: "State",
      county: "County",
    },
    inputTableHeaderCol2: {
      area: "Area Size",
      point: "Buffer Distance",
      district: "Representative",
      county: "State",
      huc: "HUC Name",
      state: "Population"
    },
    inputTableBodyCol1: {
      area: "User Shape",
      point: "User Point",
    },
    nlcd: {
      42: "Percent NLCD Forest",
      90: "Percent NLCD Water",
      23: "Percent NLCD Developed",
      71: "Percent NLCD Greenspace",
      31: "Percent NLCD Barren",
      82: "Percent NLCD Agriculture",
      layer_id: "NLCD Image Layer",
      url: "https://enviroatlas2.epa.gov/arcgis/rest/services/test_services/NLCD_2016_Land_Cover_L48_20190424/ImageServer"
    },
    stateLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    countyLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0',
    districtLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_116th_Congressional_Districts/FeatureServer/0',
    hucLayer: 'https://enviroatlas2.epa.gov/arcgis/rest/services/test_services/allResults/MapServer/0'
  },
});
