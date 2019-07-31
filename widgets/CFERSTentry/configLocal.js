define(
[],
function() {

    var natamapservice = "https://leb.epa.gov/arcgis/rest/services/Other/NATA/MapServer"; 
    //var natamapservice = "https://gis8.saic.com/arcgis/rest/services/NATA/NATA/MapServer";    //error for tract 
    var watershedmapservice = "http://leb.epa.gov/arcgis/rest/services/Other/watershed/MapServer";
    //var watershedmapservice = "https://gis8.saic.com/arcgis/rest/services/NATA/watershed/MapServer";//error for watershed
    var demogmapservice = "https://geopub.epa.gov/arcgis/rest/services/ejscreen/census2016acs/MapServer";
    //var printservice = //"https://gis8.saic.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    var printservice = "https://leb.epa.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    //var printservice = //"https://enviroatlas.epa.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
var _config = {
    "nata":{
        "mapurl": natamapservice,
        "enote": "Note: Scientific notation is used for very small values. For example, 2.7113e-5 represents 0.000027113 while 7.0482e-6 equals 0.0000070482. The bar graphs for these values are not visible for this reason.",
        "natalayers": {
            'tract': {'layerid': 0,'idfield':'GEOID10','namefield':'GEOID10'},
            'county': {'layerid': 1,'idfield':'GEOID10','namefield':'County'},
            'state': {'layerid': 2,'idfield':'GEOID10','namefield':'NAME10'}
        }
    },
    "demog":{
        "mapurl": demogmapservice,
        "demoglayers": {
            'tract': {'layerid': 1,'idfield':'STCNTR'},
            'county': {'layerid': 2,'idfield':'STCN'},
            'state': {'layerid': 3,'idfield':'STATE'}
        }
    },
    "themeObj":{
        'envcon':{
            'description':'Environmental Concentration Estimates',
            'note': '',
            'hasscinote': false,
            'isNATA': true,
            'xtitle': 'Chemicals',
            'unit':'Environmental Concentration (μg/m3)',
            'surfix': '(μg/m<sup>3</sup>)',
            'divid':'1',
            'fields': {
                'AC_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
                'AC_ACROLEIN':{'description': 'Acrolein+','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/acrolein.pdf'},
                'AC_ARSENIC':{'description': 'Arsenic','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/arsenic-compounds.pdf'},
                'AC_BENZENE':{'description': 'Benzene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/benzene.pdf'},
                'AC_BUTADIENE':{'description': 'Butadiene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/13-butadiene.pdf'},
                'AC_CHROMIUM':{'description': 'Chromium','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
                'AC_DIESEL_PM':{'description': 'Diesel PM','digits':1, 'metalink':'https://www.epa.gov/cleandiesel/learn-about-clean-diesel#impact'},
                'AC_FORMALDEHYDE':{'description': 'Formaldehyde','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
                'AC_LEAD':{'description': 'Lead','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'},
                'AC_NAPHTHALENE':{'description': 'Naphthalene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'},
                'AC_PAHPOM':{'description': 'PAH','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/polycyclic-organic-matter.pdf'}
            },
            'status':false
            },
        'humanexpo':{
            'description':'Human Exposure Estimates',
            'note': 'The <a href="https://www.epa.gov/fera/human-exposure-modeling-hazardous-air-pollutant-exposure-model-hapem" target="_blank"> \
            Human Exposure Modeling - Hazardous Air Pollutant Exposure Model (HAPEM)</a> has been designed to estimate inhalation exposure for selected \
            population groups to various air toxics.<br> \
            ',
            'hasscinote': false,
            'isNATA': true,
            'xtitle': 'Chemicals',
            'unit':'Annul Avg in Human Breathing Zone (μg/m3)',
            'surfix': '(μg/m<sup>3</sup> annual avg in human breathing Zone)',
            'divid':'2',
            'fields': {
                'EC_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
                'EC_ACROLEIN':{'description': 'Acrolein+','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/acrolein.pdf'},
                'EC_ARSENIC':{'description': 'Arsenic','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/arsenic-compounds.pdf'},
                'EC_BENZENE':{'description': 'Benzene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/benzene.pdf'},
                'EC_BUTADIENE':{'description': 'Butadiene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/13-butadiene.pdf'},
                'EC_CHROMIUM':{'description': 'Chromium','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
                'EC_DIESEL_PM':{'description': 'Diesel PM','digits':1, 'metalink':'https://www.epa.gov/cleandiesel/learn-about-clean-diesel#impact'},
                'EC_FORMALDEHYDE':{'description': 'Formaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
                'EC_LEAD':{'description': 'Lead','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'},
                'EC_NAPHTHALENE':{'description': 'Naphthalene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'},
                'EC_PAHPOM':{'description': 'PAH','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/polycyclic-organic-matter.pdf'}
            },
            'status':false
            },
        'risk': {'description':'Health Risk Estimates',
            'isNATA': true,
            'divid': '3',
            'note': '',
            'hasscinote': false,
            'subsets': {
                'cancer':{
                    'description':'Air Toxics Cancer Risk',
                    'xtitle': 'Chemicals',
                    'unit':'Risk per one million persons',
                    'surfix':'Cancer Risk<sup>1</sup> (risk per one million persons)',
                    'divid':'3-1',
                    'cumdata':{},
                    'fields':{
                        'TOTAL_RISK':{'description':'Cumulative Air Toxics','cumulate':true,'digits':1},
                        'CR_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
                        'CR_ARSENIC':{'description': 'Arsenic','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/arsenic-compounds.pdf'},
                        'CR_BENZENE':{'description': 'Benzene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/benzene.pdf'},
                        'CR_BUTADIENE':{'description': 'Butadiene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/13-butadiene.pdf'},
                        'CR_CHROMIUM':{'description': 'Chromium','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
                        'CR_FORMALDEHYDE':{'description': 'Formaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
                        'CR_NAPHTHALENE':{'description': 'Naphthalene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'},
                        'CR_PAHPOM':{'description': 'PAH','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/polycyclic-organic-matter.pdf'}
                    },
                    'status':false
                },
                'resp':{
                    'description':'Non-Cancer Respiratory Risk ',
                    'xtitle': 'Chemicals',
                    'unit':'Hazard Quotient',
                    'surfix':'Non-Cancer Respiratory Risk (Hazard Quotient<sup>2</sup>)',
                    'divid':'3-2',
                    'cumdata':{},
                    'fields':{
                        'RESPIRATORY_HI':{'description':'Cumulative Air Toxics','cumulate':true,'digits':2},
                        'RS_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
                        'RS_ACROLEIN':{'description': 'Acrolein+','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/acrolein.pdf'},
                        'RS_CHROMIUM':{'description': 'Chromium','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
                        'RS_DIESEL_PM':{'description': 'Diesel PM','digits':2, 'metalink':'https://www.epa.gov/cleandiesel/learn-about-clean-diesel#impact'},
                        'RS_FORMALDEHYDE':{'description': 'Formaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
                        'RS_NAPHTHALENE':{'description': 'Naphthalene','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'}
                    },
                    'status':false
                },
                'neuro':{
                    'description':'Non-Cancer Neurological Risk',
                    'xtitle': 'Chemicals',
                    'unit':'Hazard Quotient',
                    'surfix':'Non-Cancer Neurological Risk (Hazard Quotient<sup>2</sup>)',
                    'divid':'3-3',
                    'cumdata':{},
                    'fields':{
                        'NEUROLOGICAL_HI':{'description':'Cumulative Air Toxics','cumulate':true,'digits':2},
                        'NR_LEAD':{'description': 'Lead','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'}
                    },
                    'status':false
                }
            }
        },
        'demog':{
            'description':'Demographic Indicators',
            'note': '',
            'isNATA': false,
            'hasscinote': false,
            'xtitle': 'Demographics',
            'unit':'Percent',
            'divid':'4',
            'fields':{
                'PCT_MINORITY':{'description':'% Minority'},
                'PCT_BPOV':{'description':'% Below Poverty Level'},
                'PCT_LOWINC':{'description':'% Low Income (<2x poverty level)'},
                'PCT_AGE_LT5':{'description':'% Less than Age 5 years'},
                'PCT_AGE_LT18':{'description':'% Less than 18 Years'},
                'PCT_AGE_GT64':{'description':'% > 64 years'},
                'PCT_EDU_LTHS':{'description':'% >= 25 years with less than a H.S. degree'},
                'PCT_LINGISO':{'description':'% Linguistically Isolated Households'},
                'PCT_AMERIND':{'description':'% Population American Indian and Alaskan Native'},
                'PCT_AMERIND_BPOV':{'description':'% Population American Indian and Alaskan Native below poverty'}
            },
            'status':false
        }
    },
    "tract": {
        "mapurl": natamapservice,
        "idfield":"GEOID10",
        "layerindex":0
    },
    "watershed":{
        "mapurl": watershedmapservice,
        "idfield":"HUC_12",
        "layerindex": 0,
        "notelayer": {'layerid': 3, 'idfield': 'HUC_12','pctfield':'PERCENTAGE','cntyname':'NAMELSAD','statefld':'State'},
        "layers": {
            'huc12': {'layerid': 0,'idfield':'HUC_12','namefield':'HU_12_Name'},
            'county': {'layerid': 1,'idfield':'GEOID','namefield':'NAMELSAD'},
            'state': {'layerid': 2,'idfield':'GEOID','namefield':'NAME'}
        },
        "fields": {
            //'Pct_Land': {'description':'Percent land'},
            'NINDEX': {'description':'Percent natural land cover'},
            'pfor': {'description':'Percent forest'},
            'pwetl': {'description':'Percent wetlands'},
            'pdev': {'description':'Percent developed area'},
            'pagr': {'description':'Percent agriculture'},
            'pagrp': {'description':'Percent pasture'},
            'pagrc': {'description':'Percent cropland'},
            'pfor90': {'description':'Percent forest and woody wetlands'},
            'pwetl95': {'description':'Percent emergent herbaceous wetlands'},
            'rNI45': {'description':'Percent natural land cover in waterbody buffer'},
            'rfor45': {'description':'Percent forest land in waterbody buffer'},
            'rfor9045': {'description':'Percent forest and woody wetlands in waterbody buffer'},
            'Pimprv': {'description':'Percent impervious area'}
        }
    },

    "print":{
        "mapurl": printservice
    }
};
return _config;
  
});

