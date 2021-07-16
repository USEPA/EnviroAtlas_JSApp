define({
  root: {
    selectLabel: "Select Area and Analysis Parameters",
    resultsLabel: "Results",
    clear: "Clear selection",
    calculate: "Calculate",
    sizeError: "The area you have selected is too large, please try again with a smaller selection.",
    tooSmallError: "The area you have selected is too small, please try again with a larger selection.",
    genericError: "Something went wrong, please re-select an area on the map to try again.",
    processingError: "Failed to process results. Please select another area, or try again later.",
    hucServiceMsg: "Zoom in to see HUC boundaries",
    stateHash: {
      'Alabama': 'AL',
      'Alaska': 'AK',
      'American Samoa': 'AS',
      'Arizona': 'AZ',
      'Arkansas': 'AR',
      'California': 'CA',
      'Colorado': 'CO',
      'Connecticut': 'CT',
      'Delaware': 'DE',
      'District Of Columbia': 'DC',
      'Federated States Of Micronesia': 'FM',
      'Florida': 'FL',
      'Georgia': 'GA',
      'Guam': 'GU',
      'Hawaii': 'HI',
      'Idaho': 'ID',
      'Illinois': 'IL',
      'Indiana': 'IN',
      'Iowa': 'IA',
      'Kansas': 'KS',
      'Kentucky': 'KY',
      'Louisiana': 'LA',
      'Maine': 'ME',
      'Marshall Islands': 'MH',
      'Maryland': 'MD',
      'Massachusetts': 'MA',
      'Michigan': 'MI',
      'Minnesota': 'MN',
      'Mississippi': 'MS',
      'Missouri': 'MO',
      'Montana': 'MT',
      'Nebraska': 'NE',
      'Nevada': 'NV',
      'New Hampshire': 'NH',
      'New Jersey': 'NJ',
      'New Mexico': 'NM',
      'New York': 'NY',
      'North Carolina': 'NC',
      'North Dakota': 'ND',
      'Northern Mariana Islands': 'MP',
      'Ohio': 'OH',
      'Oklahoma': 'OK',
      'Oregon': 'OR',
      'Palau': 'PW',
      'Pennsylvania': 'PA',
      'Puerto Rico': 'PR',
      'Rhode Island': 'RI',
      'South Carolina': 'SC',
      'South Dakota': 'SD',
      'Tennessee': 'TN',
      'Texas': 'TX',
      'Utah': 'UT',
      'Vermont': 'VT',
      'Virgin Islands': 'VI',
      'Virginia': 'VA',
      'Washington': 'WA',
      'West Virginia': 'WV',
      'Wisconsin': 'WI',
      'Wyoming': 'WY'
    },
    stateCodeHash: {
      'AL': '01', 
      'AZ': '04',
      'AR': '05',
      'CA': '06',
      'CO': '08',
      'CT': '09',
      'DE': '10',
      'FL': '12',
      'GA': '13',
      'ID': '16',
      'IL': '17',
      'IN': '18',
      'IA': '19',
      'KS': '20',
      'KY': '21',
      'LA': '22',
      'ME': '23',
      'MD': '24',
      'MA': '25',
      'MI': '26',
      'MN': '27',
      'MS': '28',
      'MO': '29',
      'MT': '30',
      'NE': '31',
      'NV': '32',
      'NH': '33',
      'NJ': '34',
      'NM': '35',
      'NY': '36',
      'NC': '37',
      'ND': '38',
      'OH': '39',
      'OK': '40',
      'OR': '41',
      'PA': '42',
      'RI': '44',
      'SC': '45',
      'SD': '46',
      'TN': '47',
      'TX': '48',
      'UT': '49',
      'VT': '50',
      'VA': '51',
      'WA': '53',
      'WV': '54',
      'WI': '55',
      'WY': '56'
    },
    stateLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_States_Generalized/FeatureServer/0',
    countyLayer: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Counties_Generalized/FeatureServer/0',
    HUC12Layer: 'https://enviroatlas2.epa.gov/arcgis/rest/services/test_services/allResults/MapServer/0',
    //HUC8Layer: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/HUC8/MapServer/0',
    //gpService: 'https://ags108.blueraster.io/server/rest/services/EnviroAtlas/WaterQualityPointsTimeEnabled/GPServer/WaterQualityPoints',

    HUC8Layer: 'https://leb.epa.gov/arcgis/rest/services/Supplemental/HUC8/MapServer/0',
    gpService: 'https://leb.epa.gov/arcgis/rest/services/Other/WaterQualityPoints/GPServer/WaterQualityPoints',
    classBreakColorsRGB: [[18, 186, 0], [134, 196, 25], [251, 206, 50], [253, 103, 25], [255, 0, 0]],
    classBreakColorsHex: ['#12BA00', '#86C419','#FBCE32', '#FD6719', '#FF0000']
  },
});
