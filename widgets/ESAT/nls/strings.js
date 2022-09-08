define({
  root: {
    tabOneLabel: "Current Conditions",
    tabTwoLabel: "Ref Condition Compare",
    clear: "Clear All",
    reset: "Reset",
    calculate: "Analyze",
    tooManyHucs: "Only six HUCs allowed. Please delete a currently selected HUC if you want to add more.",
    customizeWarningTitle: "Please click on an Eco Region to analyze with custom weights",
    customizeWarningBody: "Warning: it is the responsibility of the user to evaluate customized outputs and data limitations. US EPA cannot guarantee the results or the appropriate use of customized indices.",
    ecoRegionBoundries: "https://services.arcgis.com/EDxZDh4HqQ1a9KvA/ArcGIS/rest/services/EnviroAtlas_staging_HUC12s/FeatureServer/0",
    geoprocessorURL: "https://awseastaging.epa.gov/arcgis/rest/services/Other/ApplyWeightsFL",
    geoprocessorJob: "GPServer/ApplyWeightsFeatureLayer",
    geoprocessorResults: "MapServer/jobs",
    // we need to ensure these are in order from L1G1 - L1G8 for the chart to be accurate
    "Freshwater Quality": {
      "Land Use": {
        label: "L1G1_D_ReVA",
        defaultValue: 2,
        info: `The Land Use Index is created using the following EnviroAtlas layers: (1) percent impervious area, (2) percent agriculture, (3) percent cropland on slopes greater than or equal to three percent, (4) percent of stream and shoreline with five percent or more impervious cover within 31 meters, (5) roads crossing streams density, (6) number of large dams and (7) percent non-buffered agriculture.`
      },
      "Watershed": {
        label: "L1G2_D_ReVA",
        defaultValue: 2,
        info: `The Watershed Index is created using the following EnviroAtlas layers: (1) acres of land enrolled in CRP, (2) percent GAP status 1, 2, and 3, (3) percent natural land cover, (4) percent canopy cover, and (5) water body area.`
      },
      "Riparian Habitat": {
        label: "L1G3_D_ReVA",
        defaultValue: 2,
        info: `The Riparian Habitat Index is created using the following EnviroAtlas layers: (1) Percent forest and woody wetlands in stream buffer, (2) percent natural land cover in stream buffer, (3) percent buffered agriculture, (4) percent canopy cover in buffer, and (5) stream density.`
      },
      "Chemical Cycling": {
        label: "L1G4_D_ReVA",
        defaultValue: 2,
        info: `The Chemical Cycling Index is created using the following EnviroAtlas layers: (1) Cultivated biological nitrogen fixation, (2) crop phosphorus removal, and (3) natural biological nitrogen fixation.`
      },
      "Sediment Loads": {
        label: "L1G5_D_ReVA",
        defaultValue: 2,
        info: `The Sediment Loads Index is created using the following EnviroAtlas layers: (1) Surface sediment erosion from agricultural lands, and (2) permitted solids discharges (lb/yr).`
      },
      "Nitrogen Inputs": {
        label: "L1G6_D_ReVA",
        defaultValue: 2,
        info: `The Nitrogen Inputs Index is created using the following EnviroAtlas layers: (1) total annual nitrogen deposition, (2) nitrogen manure application, (3) synthetic nitrogen fertilizer application, (4) nitrogen in surface runoff, (5) nitrogen in tile drain subsurface flow, (6) permitted nitrogen discharges (lb/yr) and (7) nitrogen in sediment.`
      },
      "Phosphorus": {
        label: "L1G7_D_ReVA",
        defaultValue: 2,
        info: `The Phosphorus Inputs Index is created using the following EnviroAtlas layers: (1)phosphorus in surface runoff, (2) phosphorus in tile drain subsurface flow, (3) permitted phosphorus discharges (lb/yr), (4) inorganic phosphorus fertilizer application, (5) phosphorus manure application, and (6) phosphorus in sediment.`
      },
      "Other Chemicals": {
        label: "L1G8_D_ReVA",
        defaultValue: 2,
        info: `The Other Chemicals Index is created using the following EnviroAtlas layers: (1) total annual sulfur deposition, (2) permitted metals discharges (lb/yr), (3) permitted priority pollutant discharges (lb/yr), and (4) permitted pathogen indicator discharges – average (colony-forming units/100 ml).`
      },
      url: 'https://awseastaging.epa.gov/arcgis/rest/services/Other/HUC12_IndexTool/MapServer/1'
    },
    // we need to ensure these are in order from L1G1 - L1G8 for the chart to be accurate (assuming the data ends up the same as above)
    "Terrestrial Diversity": {
      "Habitat Alteration": {
        label: 'n/a',
        defaultValue: 2
      },
      "Habitat Support": {
        label: 'n/a',
        defaultValue: 2
      },
      "Species Richness": {
        label: 'n/a',
        defaultValue: 2
      },
      "Species Vulnerability": {
        label: 'n/a',
        defaultValue: 2
      },
    }
  }
});