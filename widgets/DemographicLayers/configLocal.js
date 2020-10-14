define(
    [],
    function() {
     var _config = {"demogJSON": {
       
        "ejdemog": { "title": "2012-2016 ACS", "tiptext": "2012-2016 ACS", "dynamic": false, "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2017acs", "lookupindex": 4,
            "description": "2012-2016 ACS demographics are a set of variables derived based on a subset of 2012-2016 American Community Survey data.",
            "process": false,"transparency": "0.5", "identify": "yes", "filter": "yes","defaultCategory": "Population","defaultfield":"POP_DEN",
            "baselayers": {
                "bg": { "minlevel": 10, "maxlevel": 20,"renderobj":{}, "layeridx": 0, "level": "2013-2017 ACS (Blockgroup)","headerfields": { "STCNTRBG": "Blockgroup ID", "STUSAB": "State", "TOTALPOP": "Total Population"} }
                , "tr": { "minlevel": 8, "maxlevel": 10,"renderobj":{}, "layeridx": 1, "level": "2013-2017 ACS (Tract)", "headerfields": { "STCNTR": "Tract ID", "STUSAB": "State", "TOTALPOP": "Total Population"} }
                , "cnty": { "minlevel": 4, "maxlevel": 8,"renderobj":{}, "layeridx": 2, "level": "2013-2017 ACS (County)", "headerfields": { "CNTYNAME":"County Name","STUSAB":"State", "STCN": "County FIPS", "TOTALPOP": "Total Population"} }
                , "st": { "minlevel": 0, "maxlevel": 4,"renderobj":{}, "layeridx": 3, "level": "2013-2017 ACS (State)", "headerfields": { "STATE_NAME": "State", "TOTALPOP": "Total Population"} }
            },
            "dynamiclayers": {}
        }
        , "census2010": { "title": "2010 Census", "tiptext": "2010 ACS", "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2010sf1", "lookupindex": 5,
            "description": "2010 Census contains a set of variables derived based on a subset of 2010 Census data.",
            "process": false, "transparency": "0.8", "defaultCategoryIndex": 3,
            "baselayers": {
                "blk": { "minlevel": 16, "maxlevel": 20, "renderobj":{},"layeridx": 0, "level": "2010 Census (Block)", "headerfields": { "STCNTRBLK": "Block ID", "STATE": "State", "TOTALPOP": "Total Population"} }
               , "bg": { "minlevel": 10, "maxlevel": 16, "renderobj":{},"layeridx": 1, "level": "2010 Census (Blockgroup)", "headerfields": { "GEOID10": "Blockgroup ID", "STATE": "State", "TOTALPOP": "Total Population"} }
            , "tr": { "minlevel": 8, "maxlevel": 10, "renderobj":{},"layeridx": 2, "level": "2010 Census (Tract)", "headerfields": { "GEOID10": "Tract ID", "STATE": "State", "TOTALPOP": "Total Population"} }
            , "cnty": { "minlevel": 4, "maxlevel": 8, "renderobj":{},"layeridx": 3, "level": "2010 Census (County)", "headerfields": { "STCN": "County FIPS", "STATE": "State", "TOTALPOP": "Total Population"} }
            , "st": { "minlevel": 0, "maxlevel": 4, "renderobj":{},"layeridx": 4, "level": "2010 Census (State)", "headerfields": { "STATE": "State", "TOTALPOP": "Total Population"} }
            },
            "dynamiclayers": {}
        }
        , "census2k": { "title": "2000 Census", "tiptext": "2000 SF3", "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2000sf3", "lookupindex": 4,
            "description": "2000 Census contains a set of variables derived based on a subset of 2000 Census data.",
            "process": false, "transparency": "0.8", "defaultCategoryIndex": 6,
            "baselayers": {
                "bg": { "minlevel": 10, "maxlevel": 20, "renderobj":{},"layeridx": 0, "level": "2000 Census (Blockgroup)", "headerfields": { "STCNTRBG": "Blockgroup ID", "STATE": "State", "TOTALPOP": "Total Population"} }
            , "tr": { "minlevel": 8, "maxlevel": 10, "renderobj":{},"layeridx": 1, "level": "2000 Census (Tract)", "headerfields": { "STCNTR": "Tract ID", "STATE": "State", "TOTALPOP": "Total Population"} }
            , "cnty": { "minlevel": 4, "maxlevel": 8, "renderobj":{},"layeridx": 2, "level": "2000 Census (County)", "headerfields": { "STCN": "County FIPS", "STUSAB": "State", "TOTALPOP": "Total Population"} }
            , "st": { "minlevel": 0, "maxlevel": 4, "renderobj":{},"layeridx": 3, "level": "2000 Census (State)", "headerfields": { "STUSAB": "State", "TOTALPOP": "Total Population"} }
            },
            "dynamiclayers": {}
        }
        }
    };
    return _config;
      
    });