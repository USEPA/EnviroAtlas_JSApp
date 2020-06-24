define({
  "_widgetLabel": "Afegeix dades",
  "noOptionsConfigured": "No s'ha configurat cap opció.",
  "tabs": {
    "search": "Cerca",
    "url": "URL",
    "file": "Fitxer"
  },
  "search": {
    "featureLayerTitlePattern": "{serviceName}: {layerName}",
    "layerInaccessible": "No es pot accedir a la capa.",
    "loadError": "AddData, no es pot carregar:",
    "searchBox": {
      "search": "Cerca",
      "placeholder": "Cerca..."
    },
    "bboxOption": {
      "bbox": "Al mapa"
    },
    "scopeOptions": {
      "anonymousContent": "Contingut",
      "myContent": "El meu contingut",
      "myOrganization": "La meva organització",
      "curated": "Depurat",
      "ArcGISOnline": "ArcGIS Online"
    },
    "sortOptions": {
      "prompt": "Ordenar per:",
      "relevance": "Rellevància",
      "title": "Títol",
      "owner": "Propietari",
      "rating": "Qualificació",
      "views": "Visualitzacions",
      "date": "Data",
      "switchOrder": "Canvia"
    },
    "typeOptions": {
      "prompt": "Tipus",
      "mapService": "Servei de mapes",
      "featureService": "Servei d'entitats",
      "imageService": "Servei d'imatges",
      "vectorTileService": "Servei de tessel·les vectorials",
      "kml": "KML",
      "wms": "WMS"
    },
    "resultsPane": {
      "noMatch": "No s'han trobat resultats."
    },
    "paging": {
      "first": "<<",
      "firstTip": "Primer",
      "previous": "<",
      "previousTip": "Anterior",
      "next": ">",
      "nextTip": "Següent",
      "pagePattern": "{page}"
    },
    "resultCount": {
      "countPattern": "{count} {type}",
      "itemSingular": "Element",
      "itemPlural": "Elements"
    },
    "item": {
      "actions": {
        "add": "Afegeix",
        "close": "Tanca",
        "remove": "Elimina",
        "details": "Detalls",
        "done": "Fet",
        "editName": "Edita el nom"
      },
      "messages": {
        "adding": "S'està afegit...",
        "removing": "S'està eliminant...",
        "added": "Afegit",
        "addFailed": "No s'ha pogut afegir",
        "unsupported": "No s'admet"
      },
      "typeByOwnerPattern": "{type} de {owner}",
      "dateFormat": "MMMM d, aaaa",
      "datePattern": "{date}",
      "ratingsCommentsViewsPattern": "{ratings} {ratingsIcon} {comments} {commentsIcon} {views} {viewsIcon}",
      "ratingsCommentsViewsLabels": {
        "ratings": "puntuacions\", \"comentaris\": \"comentaris\", \"visualitzacions\": \"visualitzacions"
      },
      "types": {
        "Map Service": "Servei de mapes",
        "Feature Service": "Servei d'entitats",
        "Image Service": "Servei d'imatges",
        "Vector Tile Service": "Servei de tessel·les vectorials",
        "WMS": "WMS",
        "KML": "KML"
      }
    }
  },
  "addFromUrl": {
    "type": "Tipus",
    "url": "URL",
    "types": {
      "ArcGIS": "Servei web de l'ArcGIS Server",
      "WMS": "Servei web del WMS OGC",
      "WMTS": "Servei web del WMTS OGC",
      "WFS": "Servei web del WFS OGC",
      "KML": "Fitxer KML",
      "GeoRSS": "Fitxer GeoRSS",
      "CSV": "Fitxer CSV"
    },
    "samplesHint": "Adreces URL de mostra"
  },
  "addFromFile": {
    "intro": "Podeu col·locar o cercar un dels tipus de fitxer següents:",
    "types": {
      "Shapefile": "Shapefile (.zip, arxiu ZIP que conté tots els fitxers shapefile)",
      "CSV": "Fitxer CSV (.csv, amb adreça o latitud, longitud i delimitat per coma, punt i coma o tabulador)",
      "KML": "Fitxer KML (.kml)",
      "GPX": "Fitxer GPX (.gpx, format d'intercanvi GPS)",
      "GeoJSON": "Fitxer GeoJSON (.geo.json o .geojson)"
    },
    "generalizeOn": "Generalitza les entitats per a la visualització web",
    "dropOrBrowse": "Col·loca o cerca",
    "browse": "Navega",
    "invalidType": "Aquest tipus de fitxer no és compatible.",
    "addingPattern": "{filename}: s'està afegint...",
    "addFailedPattern": "{filename}: error en afegir",
    "featureCountPattern": "{filename}: {count} entitats",
    "invalidTypePattern": "{filename}: aquest tipus no és compatible",
    "maxFeaturesAllowedPattern": "Es permet un màxim de {count} entitats",
    "layerNamePattern": "{filename}: {name}",
    "generalIssue": "Hi ha hagut un problema.",
    "kmlProjectionMismatch": "La referència espacial del mapa i la capa KML no coincideixen. No es pot fer la conversió al client."
  },
  "layerList": {
    "caption": "Capes",
    "noLayersAdded": "No s'ha afegit cap capa.",
    "removeLayer": "Elimina la capa",
    "back": "Enrere"
  }
});