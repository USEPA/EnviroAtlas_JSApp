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
      line: "Draw Type",
      "huc-8": "HUC-8",
      "huc-12": "HUC-12",
      district: "Congressional District",
      state: "State",
      county: "County",
      file: "User Shapefile"
    },
    inputTableHeaderCol2: {
      area: "Area Size",
      buffer: "Buffer Size",
      point: "Buffer Distance",
      line: "Line Distance",
      file: "Area Size",
      district: "Representative",
      county: "State",
      "huc-8": "HUC 8 Name",
      "huc-12": "HUC 12 Name",
      state: "Population"
    },
    inputTableBodyCol1: {
      area: "User Shape",
      point: "User Point",
      line: "User Line"
    },
    nlcd: {
      indices: {
         0: "No Data",
        11: "Open Water",
        12: "Perennial Ice/Snow",
        21: "Developed - Open Space",
        22: "Developed - Low Intensity",
        23: "Developed - Medium Intensity",
        24: "Developed - High Intensity",
        31: "Barren Land",
        41: "Deciduous Forest",
        42: "Evergreen Forest",
        43: "Mixed Forest",
        52: "Shrub / Scrub",
        71: "Grassland / Herbaceous",
        81: "Pasture / Hay",
        82: "Cultivated Crops",
        90: "Woody Wetlands",
        95: "Emergent Herbaceous Wetlands",
      },
      /*layer: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/TO7_NLCD_Flood/ImageServer', */
      layer: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/GDT_NLCD_Dasy/ImageServer',
      OBJECTIDS: {
        2001: 1,
        2004: 2,
        2006: 3,
        2008: 4,
        2011: 5,
        2013: 6,
        2016: 7,
		2019: 8,
      },
      changeIndex: 9,
      floodplains: 10,
      colors: {
         0: "#A9A9A9",
        11: "#486DA2",
        12: "#E7EFFC",
        21: "#E1CDCE",
        22: "#DC9881",
        23: "#F10100",
        24: "#AB0101",
        31: "#B3AFA4",
        41: "#6CA966",
        42: "#1D6533",
        43: "#BDCC93",
        52: "#D1BB82",
        71: "#EDECCD",
        81: "#DDD83E",
        82: "#AE722A",
        90: "#BBD7ED",
        95: "#71A4C1",
      },
      layersUsed: ['National Land Cover Database'],
      layersUsedURL: ['https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/NationalLandCover.pdf'],
      resolution: 30,
      columnHeaders: ['Land Cover Type', 'Area (km2)', 'Percentage']
    },
    "population-floodplains": {
      /* layer: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/TO7_Pop_Flood_Roads_Padus/ImageServer', */
	  layer: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/GDT_Pop/ImageServer', 
      lockRasterId: 2,
      layersUsed: ['Estimated Floodplains', 'Dasymetric Population']
    },
    "population-roads": {
      /* layer: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/TO7_Pop_Flood_Roads_Padus/ImageServer', */
	  layer: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/GDT_Pop/ImageServer', 
      lockRasterId: 4,
      layersUsed: ['FAF4 Roads', 'Dasymetric Population']
    },
    populationRasterId: 10,
    padus: {
      /* layer: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/TO7_Pop_Flood_Roads_Padus/ImageServer', */
	  layer: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/GDT_Pop/ImageServer', 
      /* polys: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/PADUS_Shapefile/MapServer/0', */
	  polys: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/PADUS_Shapefile/MapServer/0',
      lockRasterId: 3,
      layersUsed: ['PADUS']
    },
    "impervious-floodplains": {
      layersUsed: ['Estimated Floodplains', 'NLCD']
    },
    "population-padus": {
      layersUsed: ['PADUS', 'Dasymetric Population']
    },
    "nlcd-change": {
      columnHeaders: ['Land Cover Type', 'Year 1 Area (km2)', 'Year 2 Area (km2)', 'Percentage'],
      layersUsed: ['National Land Cover Database'],
      layersUsedURL: ['https://enviroatlas.epa.gov/enviroatlas/DataFactSheets/pdf/Supplemental/NationalLandCover.pdf'],
      resolution: 30
    },
    stateLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_States_Non_Generalized/FeatureServer/0',
    countyLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties/FeatureServer/0',
    districtLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_117th_Congressional_Districts/FeatureServer/0',
    districtVersion: '117th Congressional District',
    "huc-12Layer": 'https://enviroatlas2.epa.gov/arcgis/rest/services/test_services/allResults/MapServer/0',
    "huc-8Layer": 'https://leb.epa.gov/arcgis/rest/services/Supplemental/HUC8/MapServer/0'
  },
});
