define(
[],
function() {

    var natamapservice = "https://leb.epa.gov/arcgis/rest/services/Other/CMA_Air_Toxics/MapServer"; 
    //var natamapservice = "https://gis8.saic.com/arcgis/rest/services/NATA/NATA/MapServer";    //error for tract 
    var watershedmapservice = "https://leb.epa.gov/arcgis/rest/services/Other/CMA_Landscape/MapServer";
    //var watershedmapservice = "https://gis8.saic.com/arcgis/rest/services/NATA/watershed/MapServer";//error for watershed
    var demogmapservice = "https://geopub.epa.gov/arcgis/rest/services/ejscreen/census2016acs/MapServer";
    //var printservice = //"https://gis8.saic.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    var printservice = "https://leb.epa.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    //var printservice = //"https://enviroatlas.epa.gov/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
var _config = {
    "nata":{
        "mapurl": natamapservice,
        "enote": "<p style='margin-top:1em'>Note: Scientific notation is used for very small values. For example, 2.7113e-5 represents 0.000027113 while 7.0482e-6 equals 0.0000070482. The bar graphs for these values are not visible for this reason.<br><br>\
                        <sup>1</sup> <a href='https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions#emm10' target='_blank'>How does EPA estimate cancer risk?</a> See <a href='https://www.epa.gov/national-air-toxics-assessment/2014-national-air-toxics-assessment' target='_blank'>NATA 2014</a> for more details.<br>\
                        <sup>2</sup> <a href='https://www.epa.gov/national-air-toxics-assessment/nata-glossary-terms#hq' target='_blank'>Hazard Quotient</a> is the ratio of the potential exposure to the substance and the level at which no adverse effects are expected. A hazard quotient of 1 or lower means adverse noncancer effects are unlikely, and thus can be considered to have negligible hazard. For hazard quotients greater than 1, the potential for adverse effects increases, but we do not know by how much.<br>\
                        <sup>3</sup> Cumulative risks include many additional compounds than those included in this report. See <a href='https://www.epa.gov/national-air-toxics-assessment/2014-nata-technical-support-document' target='_blank'>NATA Technical Support Document</a>.<br><br>\
                        For more information please see:<br>\
                        <a href='https://www.epa.gov/national-air-toxics-assessment/nata-limitations' target='_blank'>NATA Limitations</a><br>\
                        <a href='https://www.epa.gov/national-air-toxics-assessment/nata-frequent-questions' target='_blank'>NATA Frequent Questions</a><br>\
                        <a href='https://www.epa.gov/national-air-toxics-assessment/nata-glossary-terms' target='_blank'>NATA Glossary of Terms</a></p>\
                        ",
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
        // 'envcon':{
        //     'description':'Environmental Concentration Estimates',
        //     'note': '',
        //     'hasscinote': false,
        //     'isNATA': true,
        //     'xtitle': 'Chemicals',
        //     'unit':'μg/m3',
        //     'divid':'1',
        //     'fields': {
        //         'AC_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
        //         'AC_ACROLEIN':{'description': 'Acrolein+','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/acrolein.pdf'},
        //         'AC_ARSENIC':{'description': 'Arsenic','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/arsenic-compounds.pdf'},
        //         'AC_BENZENE':{'description': 'Benzene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/benzene.pdf'},
        //         'AC_BUTADIENE':{'description': 'Butadiene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/13-butadiene.pdf'},
        //         'AC_CHROMIUM':{'description': 'Chromium','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
        //         'AC_DIESEL_PM':{'description': 'Diesel PM','digits':1, 'metalink':'https://www.epa.gov/cleandiesel/learn-about-clean-diesel#impact'},
        //         'AC_FORMALDEHYDE':{'description': 'Formaldehyde','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
        //         'AC_LEAD':{'description': 'Lead','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'},
        //         'AC_NAPHTHALENE':{'description': 'Naphthalene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'},
        //         'AC_PAHPOM':{'description': 'PAH','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/polycyclic-organic-matter.pdf'}
        //     },
        //     'status':false
        //     },
        // 'humanexpo':{
        //     'description':'Human Exposure Estimates',
        //     'note': 'The <a href="https://www.epa.gov/fera/human-exposure-modeling-hazardous-air-pollutant-exposure-model-hapem" target="_blank"> \
        //     Human Exposure Modeling - Hazardous Air Pollutant Exposure Model (HAPEM)</a> has been designed to estimate inhalation exposure for selected \
        //     population groups to various air toxics.<br> \
        //     ',
        //     'hasscinote': false,
        //     'isNATA': true,
        //     'xtitle': 'Chemicals',
        //     'unit':'Annul Avg in Human Breathing Zone (μg/m3)',
        //     'surfix': '(μg/m<sup>3</sup> annual avg in human breathing Zone)',
        //     'divid':'2',
        //     'fields': {
        //         'EC_ACETALDEHYDE':{'description': 'Acetaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/acetaldehyde.pdf'},
        //         'EC_ACROLEIN':{'description': 'Acrolein+','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/acrolein.pdf'},
        //         'EC_ARSENIC':{'description': 'Arsenic','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/arsenic-compounds.pdf'},
        //         'EC_BENZENE':{'description': 'Benzene','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/benzene.pdf'},
        //         'EC_BUTADIENE':{'description': 'Butadiene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-08/documents/13-butadiene.pdf'},
        //         'EC_CHROMIUM':{'description': 'Chromium','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/chromium-compounds.pdf'},
        //         'EC_DIESEL_PM':{'description': 'Diesel PM','digits':1, 'metalink':'https://www.epa.gov/cleandiesel/learn-about-clean-diesel#impact'},
        //         'EC_FORMALDEHYDE':{'description': 'Formaldehyde','digits':1, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/formaldehyde.pdf'},
        //         'EC_LEAD':{'description': 'Lead','digits':4, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'},
        //         'EC_NAPHTHALENE':{'description': 'Naphthalene','digits':2, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/naphthalene.pdf'},
        //         'EC_PAHPOM':{'description': 'PAH','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/polycyclic-organic-matter.pdf'}
        //     },
        //     'status':false
        //     },
        'risk': {'description':'Health Risk Estimates',
            'isNATA': true,
            'divid': '3',
            'note': '',
            'hasscinote': true,
            'subsets': {
                'cancer':{
                    'note': 'These data show the 2014 NATA estimated cancer risk<sup>1</sup> from breathing air toxics over many years. ',
                    'description':'Air Toxics Cancer Risk¹',
                    'xtitle': 'Compound',
                    'unit':'Risk per one million persons',
                    'surfix':'(risk per one million persons)',
                    'divid':'3-1',
                    'cumdata':{},
                    'fields':{
                        'TOTAL_RISK':{'description':'Cumulative Cancer Risk³','cumulate':false,'digits':1},
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
                    'note': 'These data show the 2014 NATA estimated risks associated with respiratory health effects other than cancer due to breathing air toxics over many years.',
                    'description':'Non-Cancer Respiratory Risk ',
                    'xtitle': 'Compound',
                    'unit':'Hazard Quotient²',
                    'surfix':'(Hazard Quotient²)',
                    'divid':'3-2',
                    'cumdata':{},
                    'fields':{
                        'RESPIRATORY_HI':{'description':'Cumulative Respiratory Risk³','cumulate':false,'digits':2},
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
                    'note': 'These data show the 2014 NATA estimated risks associated with neurological health effects other than cancer due to breathing air toxics over many years.',
                    'description':'Non-Cancer Neurological Risk',
                    'xtitle': 'Compound',
                    'unit':'Hazard Quotient²',
                    'surfix':'(Hazard Quotient²)',
                    'divid':'3-3',
                    'cumdata':{},
                    'fields':{
                        'NEUROLOGICAL_HI':{'description':'Cumulative Neurological Risk³','cumulate':false,'digits':2},
                        'NR_LEAD':{'description': 'Lead','digits':3, 'metalink':'https://www.epa.gov/sites/production/files/2016-09/documents/lead-compounds.pdf'}
                    },
                    'status':false
                },
                'amb_conc':{
                    'note': 'These data show the estimated ambient concentrations (outdoor air) for a selection of air toxics from the 2014 NATA.',
                    'description':'Ambient Concentrations',
                    'xtitle': 'Compound',
                    'unit':'Concentration (μg/m3)',
                    'surfix':'Bar',
                    'divid':'3-4',
                    'cumdata':{},
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
                }
            }
        },
        'demog':{
            'description':'Demographic Indicators',
            'note': 'These demographic data were sourced by <a href="https://www.epa.gov/ejscreen/download-ejscreen-data" target="_blank">U.S. EPA</a> from the <a href="https://www.census.gov/programs-surveys/acs/data/summary-file.2016.html" target="_blank">U.S. Census Bureau</a> and are available by census tract, county, and state.',
            'isNATA': false,
            'hasscinote': false,
            'xtitle': '',
            'unit':'Percent of Population',
            'divid':'4',
            'fields':{
                'TOTALPOP':{'description':'Total Population', 'cumulate':true, 'digits':3},
                'PCT_MINORITY':{'description':'Minority'},
                'PCT_BPOV':{'description':'Below Poverty Level'},
                'PCT_LOWINC':{'description':'Low Income (<2x poverty level)'},
                'PCT_AGE_LT5':{'description':'Less than age 5'},
                'PCT_AGE_LT18':{'description':'Less than age 18'},
                'PCT_AGE_GT64':{'description':'Greater than age 64'},
                'PCT_EDU_LTHS':{'description':'Greater than age 25 with less than a H.S. degree'},
                'PCT_LINGISO':{'description':'Linguistically Isolated Households'},
                'PCT_AMERIND':{'description':'American Indian and Alaskan Native'},
                'PCT_AMERIND_BPOV':{'description':'American Indian and Alaskan Native below poverty'}
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
            //'Shape_Area': {'description':'Percent land'},
            'pdev': {'description':'Developed'},
            'Pimprv': {'description':'Impervious'},
            'pfor': {'description':'Forest'},
            'pagr': {'description':'Agriculture'},
            'pagrp': {'description':'Pasture'},
            'pagrc': {'description':'Cropland'},
            'pwetl': {'description':'Wetlands'},
            'pfor90': {'description':'Forest and Woody Wetlands'},
            'pwetl95': {'description':'Emergent Herbaceous Wetlands'},
            'rNI45': {'description':'Natural Land Cover in Waterbody Buffer'},
            'rfor45': {'description':'Forest Land in Waterbody Buffer'},
            'rfor9045': {'description':'Forest and Woody Wetlands in Waterbody Buffer'},
            'NINDEX': {'description':'Natural Land Cover'},
            
        }
    },

    "print":{
        "mapurl": printservice
    }
};
return _config;
  
});

