/**
 * JS2Shapefile - A javascript class for generating ESRI shapefiles in the client
 * from Arcgis javascript map graphics
 * Support Geometries: Point, Line, Polygon.
 * support UTF-8 encoding
 *
 * dbf file format
 * http://www.clicketyclick.dk/databases/xbase/format/dbf.html#DBF_NOTE_6_TARGET
 *
 * shapefile format
 * https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
 *
 * Upgraded from:
 * https://code.google.com/archive/p/js2shapefile/
 **/

(function (root, factory) {

    // Node.
    //if(typeof module === 'object' && typeof module.exports === 'object') {
    //    exports = module.exports = factory();
    //}

    // Browser Global.
    if(typeof window === 'object') {
        root.JS2Shapefile = factory();
    }

}(this, function () {

    if (!''.lpad) {
        String.prototype.lpad = function (padString, length) {
            var str = this;
            while (str.length < length) {
              str = padString + str;
            }
            return str;
        };
    }
    //pad strings on the right
    if (!''.rpad) {
        String.prototype.rpad = function (padString, length) {
            var str = this;
            while (str.length < length) {
              str = str + padString;
            }
            return str;
        };
    }
    // array indexof method for IE
    if (!Array.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        };
    }


    /*Win1251encode--------------------------------------------------------------------------*/
    var DMap = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 12, 13: 13, 14: 14, 15: 15, 16: 16, 17: 17, 18: 18, 19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24, 25: 25, 26: 26, 27: 27, 28: 28, 29: 29, 30: 30, 31: 31, 32: 32, 33: 33, 34: 34, 35: 35, 36: 36, 37: 37, 38: 38, 39: 39, 40: 40, 41: 41, 42: 42, 43: 43, 44: 44, 45: 45, 46: 46, 47: 47, 48: 48, 49: 49, 50: 50, 51: 51, 52: 52, 53: 53, 54: 54, 55: 55, 56: 56, 57: 57, 58: 58, 59: 59, 60: 60, 61: 61, 62: 62, 63: 63, 64: 64, 65: 65, 66: 66, 67: 67, 68: 68, 69: 69, 70: 70, 71: 71, 72: 72, 73: 73, 74: 74, 75: 75, 76: 76, 77: 77, 78: 78, 79: 79, 80: 80, 81: 81, 82: 82, 83: 83, 84: 84, 85: 85, 86: 86, 87: 87, 88: 88, 89: 89, 90: 90, 91: 91, 92: 92, 93: 93, 94: 94, 95: 95, 96: 96, 97: 97, 98: 98, 99: 99, 100: 100, 101: 101, 102: 102, 103: 103, 104: 104, 105: 105, 106: 106, 107: 107, 108: 108, 109: 109, 110: 110, 111: 111, 112: 112, 113: 113, 114: 114, 115: 115, 116: 116, 117: 117, 118: 118, 119: 119, 120: 120, 121: 121, 122: 122, 123: 123, 124: 124, 125: 125, 126: 126, 127: 127, 1027: 129, 8225: 135, 1046: 198, 8222: 132, 1047: 199, 1168: 165, 1048: 200, 1113: 154, 1049: 201, 1045: 197, 1050: 202, 1028: 170, 160: 160, 1040: 192, 1051: 203, 164: 164, 166: 166, 167: 167, 169: 169, 171: 171, 172: 172, 173: 173, 174: 174, 1053: 205, 176: 176, 177: 177, 1114: 156, 181: 181, 182: 182, 183: 183, 8221: 148, 187: 187, 1029: 189, 1056: 208, 1057: 209, 1058: 210, 8364: 136, 1112: 188, 1115: 158, 1059: 211, 1060: 212, 1030: 178, 1061: 213, 1062: 214, 1063: 215, 1116: 157, 1064: 216, 1065: 217, 1031: 175, 1066: 218, 1067: 219, 1068: 220, 1069: 221, 1070: 222, 1032: 163, 8226: 149, 1071: 223, 1072: 224, 8482: 153, 1073: 225, 8240: 137, 1118: 162, 1074: 226, 1110: 179, 8230: 133, 1075: 227, 1033: 138, 1076: 228, 1077: 229, 8211: 150, 1078: 230, 1119: 159, 1079: 231, 1042: 194, 1080: 232, 1034: 140, 1025: 168, 1081: 233, 1082: 234, 8212: 151, 1083: 235, 1169: 180, 1084: 236, 1052: 204, 1085: 237, 1035: 142, 1086: 238, 1087: 239, 1088: 240, 1089: 241, 1090: 242, 1036: 141, 1041: 193, 1091: 243, 1092: 244, 8224: 134, 1093: 245, 8470: 185, 1094: 246, 1054: 206, 1095: 247, 1096: 248, 8249: 139, 1097: 249, 1098: 250, 1044: 196, 1099: 251, 1111: 191, 1055: 207, 1100: 252, 1038: 161, 8220: 147, 1101: 253, 8250: 155, 1102: 254, 8216: 145, 1103: 255, 1043: 195, 1105: 184, 1039: 143, 1026: 128, 1106: 144, 8218: 130, 1107: 131, 8217: 146, 1108: 186, 1109: 190 };

    function unicodeToWin1251(s) {
        var L = [];
        for (var i = 0; i < s.length; i++) {
            var ord = s.charCodeAt(i);
            if (!(ord in DMap)){
              throw 'Character ' + s.charAt(i) + " isn't supported by win1251!";
            }
            L.push(String.fromCharCode(DMap[ord]));
        }
        return L.join('');
    }
    /*------------------------------------------------------------------------------------*/

    /*utf8encode--------------------------------------------------------------------------*/

    var stringFromCharCode = String.fromCharCode;

    // Taken from https://mths.be/punycode
    function ucs2decode(string) {
        var output = [];
        var counter = 0;
        var length = string.length;
        var value;
        var extra;
        while (counter < length) {
            value = string.charCodeAt(counter++);
            if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt(counter++);
                if ((extra & 0xFC00) == 0xDC00) { // low surrogate
                    output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
                } else {
                    // unmatched surrogate; only append this code unit, in case the next
                    // code unit is the high surrogate of a surrogate pair
                    output.push(value);
                    counter--;
                }
            } else {
                output.push(value);
            }
        }
        return output;
    }

    function createByte(codePoint, shift) {
        return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
    }

    function encodeCodePoint(codePoint) {
        if ((codePoint & 0xFFFFFF80) === 0) { // 1-byte sequence
            return stringFromCharCode(codePoint);
        }
        var symbol = '';
        if ((codePoint & 0xFFFFF800) === 0) { // 2-byte sequence
            symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
        }
        else if ((codePoint & 0xFFFF0000) === 0) { // 3-byte sequence
            checkScalarValue(codePoint);
            symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
            symbol += createByte(codePoint, 6);
        }
        else if ((codePoint & 0xFFE00000) === 0) { // 4-byte sequence
            symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
            symbol += createByte(codePoint, 12);
            symbol += createByte(codePoint, 6);
        }
        symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
        return symbol;
    }

    function utf8encode(string) {
        var codePoints = ucs2decode(string);
        var length = codePoints.length;
        var index = -1;
        var codePoint;
        var byteString = '';
        while (++index < length) {
            codePoint = codePoints[index];
            byteString += encodeCodePoint(codePoint);
        }
        return byteString;
    }

    function checkScalarValue(codePoint) {
        if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
             throw Error(
                  'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
                  ' is not a scalar value'
             );
        }
    }


    /*--------------------------------------------------------------------------*/




    var exports = {};

    var ShapeTypes = {
        'POINT':1,
        'POLYLINE':3,
        'POLYGON':5
    };

    // dbf encoded
    // "Latin 1" (ISO8859-1) - default,
    // 'UTF8' For ArcGIS, Geopublisher and AtlasStyler SLD Editor, just create a .cpg file (with the same basename as the other Shapefiles) and fill it with the name of the encoding.
    // 'Win1251' for cyrillic

    // 'UTF8', 'Win1251' or default
    var dbfEncoded;

    //get Projected Coordinate Systems  from http://help.arcgis.com/en/arcgisserver/10.0/apis/rest/pcs.html

    //for Esri
    //    var coordSystem = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere", GEOGCS["GCS_WGS_1984", DATUM["D_WGS_1984", SPHEROID["WGS_1984", 6378137.0, 298.257223563]], PRIMEM["Greenwich", 0.0], UNIT["Degree", 0.0174532925199433]], PROJECTION["Mercator_Auxiliary_Sphere"], PARAMETER["False_Easting", 0.0], PARAMETER["False_Northing", 0.0], PARAMETER["Central_Meridian", 0.0], PARAMETER["Standard_Parallel_1", 0.0], PARAMETER["Auxiliary_Sphere_Type", 0.0], UNIT["Meter", 1.0]]';

    // for longitude and latitude
    //var coordSystem = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

    var coordSystem;

    var createShapeFiles = function (esrigraphics, encoded, cSys) {
        dbfEncoded = encoded;
        coordSystem = cSys;
        var pointgraphics = [], polylinegraphics = [], polygongraphics = [];
        for (var i = 0; i < esrigraphics.length; i++) {
            var thisgraphic = esrigraphics[i];

            switch (thisgraphic.geometry.type) {

                case 'point':
                    pointgraphics.push(thisgraphic);
                    break;

                case 'polyline':
                    polylinegraphics.push(thisgraphic);
                    break;

                case 'polygon':
                    polygongraphics.push(thisgraphic); break;

                default:
                    throw new Error('Unknown geometry type');
            }
        }
        var points = getShapefile('POINT', pointgraphics);
        var polylines = getShapefile('POLYLINE', polylinegraphics);
        var polygons = getShapefile('POLYGON', polygongraphics);

        return {
            pointShapefile: points,
            polylineShapefile: polylines,
            polygonShapefile: polygons
        };
    };

    var getShapefile = function (shapetype, arrayToUse) {
        var shapefile = {};
        if (typeof (shapetype) === 'undefined' && !(shapetype === 'POINT' || shapetype === 'POLYLINE' || shapetype === 'POLYGON')) {
            return {
                successful: false,
                message: 'Unknown or unspecified shapefile type requested'
            };
        }
        if (arrayToUse.length === 0) {
            return {
                successful: false,
                message: 'No graphics of type ' + shapetype + ' have been added!'
            };
        }
        var resultObject = createShapeShxFile(shapetype, arrayToUse);
        var attributeMap = createAttributeMap(arrayToUse);
        resultObject.dbf = createDbf(attributeMap, arrayToUse);

        shapefile.shp = {};
        var fileName = '_Huc_Navigation';
        shapefile.shp.blob = new Blob([resultObject.shape], { 'type': 'application/octet-stream' });
        shapefile.shp.name = shapetype + fileName + '.shp';
        shapefile.shx = {};
        shapefile.shx.blob = new Blob([resultObject.shx], { 'type': 'application/octet-stream' });
        shapefile.shx.name = shapetype + fileName + '.shx';
        shapefile.dbf = {};
        shapefile.dbf.blob = new Blob([resultObject.dbf], { 'type': 'application/octet-stream' });
        shapefile.dbf.name = shapetype + fileName + '.dbf';

        //this file is for ArcGIS Desktop for  UTF-8 encoding
        if (dbfEncoded == 'UTF8') {
            shapefile.cpg = {};
            shapefile.cpg.blob = new Blob(['65001'], { 'type': 'plain/text' });
            shapefile.cpg.name = shapetype + fileName + '.cpg';
        }

        if (coordSystem) {
            shapefile.prj = {};
            shapefile.prj.blob = new Blob([coordSystem], { 'type': 'plain/text' });
            shapefile.prj.name = shapetype + fileName + '.prj';
        }

        return {
            successful: true,
            shapefile: shapefile
        };
    };

    var createShapeShxFile = function(shapetype, graphics){
        var lengthShapeShxFile = getLengthShapeShxFile(shapetype, graphics);
        if (lengthShapeShxFile.successful === false) {
            return;
        }

        var byteFileLength = lengthShapeShxFile.byteFileLength;
        var byteShxLength = lengthShapeShxFile.byteShxLength;

        var shpBuffer = new ArrayBuffer(byteFileLength);
        var shpView = new DataView(shpBuffer);
        var shxBuffer = new ArrayBuffer(byteShxLength);
        var shxView = new DataView(shxBuffer);

        // start writing the headers
        // Big-endian 32 bit int of 9994 at byte 0 in both files
        shpView.setInt32(0, 9994);
        shxView.setInt32(0, 9994);
        // Little endian 32 bit int of 1000 at byte 28 in both files
        shpView.setInt32(28, 1000, true);
        shxView.setInt32(28, 1000, true);
        // Little endian 32 bit int at byte 32 in both files gives shapetype
        shpView.setInt32(32, ShapeTypes[shapetype], true);
        shxView.setInt32(32, ShapeTypes[shapetype], true);
        // That's the fixed info, rest of header depends on contents. Start building contents now.
        // will get extent by naive method of increasing or decreasing the min / max for each feature
        // outside those currently set
        var ext_xmin = Number.MAX_VALUE, ext_ymin = Number.MAX_VALUE, ext_xmax = -Number.MAX_VALUE, ext_ymax = -Number.MAX_VALUE;
        var numRecords = graphics.length;
        // track overall length of files in bytes
        var byteShpOffset = 100; // value is fixed 100 bytes from the header, plus the contents
        var byteShxOffset = 100;
        var byteLengthOfRecordHeader = 8; // 2 integers, same for all shape types
        var i, graphic, byteLengthOfRecordInclHeader;
        switch (shapetype) {
            case 'POINT':
                // length of record is fixed at 20 for points, being 1 int and 2 doubles in a point record
                var byteLengthOfRecord = 20;
                byteLengthOfRecordInclHeader = byteLengthOfRecord + byteLengthOfRecordHeader;
                for ( i = 1; i < numRecords + 1; i++) { // record numbers begin at 1 not 0
                    graphic = graphics[i - 1];
                    var x = graphic.geometry.x;
                    var y = graphic.geometry.y;
                    if (x < ext_xmin) {
                        ext_xmin = x;
                    }
                    if (x > ext_xmax) {
                        ext_xmax = x;
                    }
                    if (y < ext_ymin) {
                        ext_ymin = y;
                    }
                    if (y > ext_ymax) {
                        ext_ymax = y;
                    }
                    // we'll write the shapefile record header and content into a single arraybuffer
                    var recordDataView = new DataView(shpBuffer, byteShpOffset);
                    recordDataView.setInt32(0, i); // big-endian value at byte 0 of header is record number
                    // Byte 4 is length of record content only, in 16 bit words (divide y 2)
                    recordDataView.setInt32(4, byteLengthOfRecord / 2); // always 20 / 2 = 10 for points
                    //now the record content
                    recordDataView.setInt32(8, ShapeTypes[shapetype], true); // 1=Point. LITTLE endian!
                    recordDataView.setFloat64(12, x, true); //little-endian
                    recordDataView.setFloat64(20, y, true); //little-endian
                    // now do the shx record. NB no record header in shx, just fixed 8 byte records.
                    var shxRecordView = new DataView(shxBuffer, byteShxOffset);

                    // byte 0 of shx record gives offset in the shapefile of record start
                    // byte 4 of shx record gives length of the record in the shapefile
                    shxRecordView.setInt32(0, byteShpOffset / 2);
                    shxRecordView.setInt32(4, (byteLengthOfRecord / 2));

                    byteShxOffset += 8;
                    byteShpOffset += byteLengthOfRecordInclHeader;
                }
                break;
            case 'POLYLINE':
            case 'POLYGON':
                // file structure is identical for lines and polygons, we just use a different shapetype and refer to
                // a different property of the input graphic
                for ( i = 1; i < numRecords + 1; i++) {
                     graphic = graphics[i - 1];
                    var feat_xmin = Number.MAX_VALUE, feat_ymin = Number.MAX_VALUE, feat_xmax = -Number.MAX_VALUE, feat_ymax = -Number.MAX_VALUE;
                    var numParts;
                    if (shapetype == 'POLYLINE') {
                        numParts = graphic.geometry.paths.length;
                    }
                    else
                        if (shapetype == 'POLYGON') {
                            numParts = graphic.geometry.rings.length;
                        }
                    var partsIndex = [];
                    var pointsArray = [];
                    for (var partNum = 0; partNum < numParts; partNum++) {
                        var thisPart = shapetype === 'POLYLINE' ? graphic.geometry.paths[partNum] : graphic.geometry.rings[partNum];
                        var numPointsInPart = thisPart.length;
                        partsIndex.push(pointsArray.length);
                        for (var pointIdx = 0; pointIdx < numPointsInPart; pointIdx++) {
                            pointsArray.push(thisPart[pointIdx]); // would just joining be quicker? still got to get indices
                        }
                    }
                    var numPointsOverall = pointsArray.length;
                    var recordInfoLength = 8 + 44 + 4 * numParts;
                    byteLengthOfRecordInclHeader = recordInfoLength + 16 * numPointsOverall;
                    var byteLengthOfRecordContent = byteLengthOfRecordInclHeader - 8;

                    var pointsArrayView = new DataView(shpBuffer, byteShpOffset + recordInfoLength);
                    for (var pointIdx = 0; pointIdx < numPointsOverall; pointIdx += 1) {
                        var thisPoint = pointsArray[pointIdx];
                        pointsArrayView.setFloat64(pointIdx * 16, thisPoint[0], true); //little-endian
                        pointsArrayView.setFloat64(pointIdx * 16 + 8, thisPoint[1], true); //little-endian
                        if (thisPoint[0] < feat_xmin) {
                            feat_xmin = thisPoint[0];
                        }
                        if (thisPoint[0] > feat_xmax) {
                            feat_xmax = thisPoint[0];
                        }
                        if (thisPoint[1] < feat_ymin) {
                            feat_ymin = thisPoint[1];
                        }
                        if (thisPoint[1] > feat_ymax) {
                            feat_ymax = thisPoint[1];
                        }
                    }

                    var shpRecordInfoView = new DataView(shpBuffer, byteShpOffset);
                    shpRecordInfoView.setInt32(0, i);
                    shpRecordInfoView.setInt32(4, (byteLengthOfRecordContent / 2));//value is in 16 bit words
                    shpRecordInfoView.setInt32(8, ShapeTypes[shapetype], true);
                    shpRecordInfoView.setFloat64(12, feat_xmin, true);
                    shpRecordInfoView.setFloat64(20, feat_ymin, true);
                    shpRecordInfoView.setFloat64(28, feat_xmax, true);
                    shpRecordInfoView.setFloat64(36, feat_ymax, true);
                    shpRecordInfoView.setInt32(44, numParts, true);
                    shpRecordInfoView.setInt32(48, numPointsOverall, true);
                    for (var partNum = 0; partNum < partsIndex.length; partNum++) {
                        shpRecordInfoView.setInt32(52 + partNum * 4, partsIndex[partNum], true);
                    }
                    var shxDataView = new DataView(shxBuffer, byteShxOffset);
                    shxDataView.setInt32(0, byteShpOffset / 2);
                    shxDataView.setInt32(4, byteLengthOfRecordContent / 2);
                    if (feat_xmax > ext_xmax) {
                        ext_xmax = feat_xmax;
                    }
                    if (feat_xmin < ext_xmin) {
                        ext_xmin = feat_xmin;
                    }
                    if (feat_ymax > ext_ymax) {
                        ext_ymax = feat_ymax;
                    }
                    if (feat_ymin < ext_ymin) {
                        ext_ymin = feat_ymin;
                    }

                    byteShxOffset += 8;
                    byteShpOffset += byteLengthOfRecordInclHeader;
                }
                break;
            default:
                return ({
                    successful: false,
                    message: 'unknown shape type specified'
                });
        }
        // end of switch statement. build the rest of the file headers as we now know the file extent and length
        // set extent in shp and shx headers, little endian
        shpView.setFloat64(36, ext_xmin, true);
        shpView.setFloat64(44, ext_ymin, true);
        shpView.setFloat64(52, ext_xmax, true);
        shpView.setFloat64(60, ext_ymax, true);
        shxView.setFloat64(36, ext_xmin, true);
        shxView.setFloat64(44, ext_ymin, true);
        shxView.setFloat64(52, ext_xmax, true);
        shxView.setFloat64(60, ext_ymax, true);
        // overall shp file length in 16 bit words at byte 24 of shp header
        shpView.setInt32(24, byteFileLength / 2);
        // overall shx file length in 16 bit words at byte 24 of shx header, easily worked out
        shxView.setInt32(24, byteShxLength / 2);

        return {
            successful: true,
            shape: shpBuffer,
            shx: shxBuffer
        };
    };


    var getLengthShapeShxFile = function (shapetype, graphics) {

        var numRecords = graphics.length;
        var byteFileLength = 100; // value is fixed 100 bytes from the header, plus the contents
        var byteShxLength = 100 + 8 * numRecords;
        var byteLengthOfRecordHeader = 8; // 2 integers, same for all shape types
        switch (shapetype) {
            case 'POINT':
                var byteLengthOfRecord = 20;
                var byteLengthOfRecordInclHeader = byteLengthOfRecord + byteLengthOfRecordHeader;
                for (var i = 1; i < numRecords + 1; i++) { // record numbers begin at 1 not 0
                    byteFileLength += byteLengthOfRecordInclHeader;
                }
                break;
            case 'POLYLINE':
            case 'POLYGON':
                for (var i = 1; i < numRecords + 1; i++) {
                    var graphic = graphics[i - 1];
                    var numPointsOverall = 0;
                    var numParts;

                    if (shapetype == 'POLYLINE') {
                        numParts = graphic.geometry.paths.length;
                    }
                    else
                        if (shapetype == 'POLYGON') {
                            numParts = graphic.geometry.rings.length;
                        }

                    for (var partNum = 0; partNum < numParts; partNum++) {
                        var thisPart = shapetype === 'POLYLINE' ? graphic.geometry.paths[partNum] : graphic.geometry.rings[partNum];
                        numPointsOverall += thisPart.length;
                    }

                    var recordInfoLength = 8 + 44 + 4 * numParts;
                    var byteLengthOfRecordInclHeader = recordInfoLength + 16 * numPointsOverall;
                    byteFileLength += byteLengthOfRecordInclHeader;
                }
                break;

            default:
                return ({
                    successful: false,
                    message: 'unknown shape type specified'
                });
        }

        return {
            successful: true,
            byteFileLength: byteFileLength,
            byteShxLength: byteShxLength
        };
    };


    // DBF created by two separate functions for header and content. This function combines them
    var createDbf = function(attributeMap, graphics){
        if (attributeMap.length === 0) {
            attributeMap.push({
                name: 'ID_AUTO',
                type: 'C',
                length: '18'
            });
        }

        var numRecords = graphics.length;
        var numFields = attributeMap.length; // GET NUMBER OF FIELDS FROM PARAMETER
        var fieldDescLength = 32 * numFields + 1;
        var totalHeaderLength = fieldDescLength + 31 + 1;

        var numBytesPerRecord = 1; // total is the length of all fields plus 1 for deletion flag
        for (var i = 0; i < numFields; i++) {
            var datatype = attributeMap[i].type || 'C';
            var fieldLength;

            switch (datatype) {

                case 'L':
                    fieldLength = 1;
                    break;

                case 'D':
                    fieldLength = 8;
                    break;

                case 'N':
                    fieldLength = attributeMap[i].length && attributeMap[i].length < 19 ? attributeMap[i].length : 18;
                    break;

                case 'C':
                    fieldLength = attributeMap[i].length && attributeMap[i].length < 254 ? attributeMap[i].length : 254;
            }
            numBytesPerRecord += parseInt(fieldLength);
        }
        var dataLength = (numBytesPerRecord) * numRecords + 1;

        var dbfBuffer = new ArrayBuffer(totalHeaderLength + dataLength);
        var dbfFieldDescView = new DataView(dbfBuffer, 32);
        var namesUsed = [];
        var numBytesPerRecord = 1; // total is the length of all fields plus 1 for deletion flag
        for (var i = 0; i < numFields; i++) {
            // each field has 32 bytes in the header. These describe name, type, and length of the attribute
            var name = attributeMap[i].name.slice(0, 10);
            // need to check if the name has already been used and generate a altered one
            // if so. not doing the check yet, better make sure we don't try duplicate names!
            // NB older browsers don't have indexOf but given the other stuff we're doing with binary
            // i think that's the least of their worries
            if (namesUsed.indexOf(name) == -1) {
                namesUsed.push(name);
            }
            // write the name into bytes 0-9 of the field description
            for (var x = 0; x < name.length; x++) {
                dbfFieldDescView.setInt8(i * 32 + x, name.charCodeAt(x));
            }
            // nb byte 10 is left at zero
            /* Now data type. Data types are
             C = Character. Max 254 characters.
             N = Number, but stored as ascii text. Max 18 characters.
             L = Logical, boolean. 1 byte, ascii. Values 'Y', 'N', 'T', 'F' or '?' are valid
             D = Date, format YYYYMMDD, numbers
             */
            var datatype = attributeMap[i].type || 'C';
            var fieldLength;
            if (datatype == 'L') {
                fieldLength = 1; // not convinced this datatype is right, doesn't show as boolean in GIS
            }
            else
                if (datatype == 'D') {
                    fieldLength = 8;
                }
                else
                    if (datatype == 'N') {
                        // maximum length is 18
                        fieldLength = attributeMap[i].length && attributeMap[i].length < 19 ? attributeMap[i].length : 18;
                    }
                    else
                        if (datatype == 'C') {
                            fieldLength = attributeMap[i].length && attributeMap[i].length < 254 ? attributeMap[i].length : 254;
                        }
            else {
                datatype = 'C';
                fieldLength = 254;
            }
            // write the type into byte 11
            dbfFieldDescView.setInt8(i * 32 + 11, datatype.charCodeAt(0)); // FIELD TYPE
            // write the length into byte 16
            dbfFieldDescView.setInt8(i * 32 + 16, fieldLength); //FIELD LENGTH
            if (datatype == 'N') {
                var fieldDecCount = attributeMap[i].scale || 0;
                // write the decimal count into byte 17
                dbfFieldDescView.setInt8(i * 32 + 17, fieldDecCount); // FIELD DECIMAL COUNT
            }
            // modify what's recorded so the attribute map doesn't have more than 18 chars even if there are more
            // than 18 present
            attributeMap[i].length = parseInt(fieldLength);
            numBytesPerRecord += parseInt(fieldLength);
        }
        // last byte of the array is set to 0Dh (13, newline character) to mark end of overall header
        dbfFieldDescView.setInt8(fieldDescLength - 1, 13);
        // field map section is complete, now do the main header
        var dbfHeaderView = new DataView(dbfBuffer);
        dbfHeaderView.setUint8(0, 3); // File Signature: DBF - UNSIGNED
        var rightnow = new Date();
        dbfHeaderView.setUint8(1, rightnow.getFullYear() - 1900); // UNSIGNED
        dbfHeaderView.setUint8(2, rightnow.getMonth()); // UNSIGNED
        dbfHeaderView.setUint8(3, rightnow.getDate()); // UNSIGNED
        dbfHeaderView.setUint32(4, numRecords, true); // LITTLE ENDIAN, UNSIGNED
        // the 31 bytes of this section, plus the length of the fields description, plus 1 at the end
        dbfHeaderView.setUint16(8, totalHeaderLength, true); // LITTLE ENDIAN , UNSIGNED
        // the byte length of each record, which includes 1 initial byte as a deletion flag
        dbfHeaderView.setUint16(10, numBytesPerRecord, true); // LITTLE ENDIAN, UNSIGNED

        //Language driver for cyrillic - Win1251  ESRI
        if (dbfEncoded == 'Win1251') {
            dbfHeaderView.setUint16(29, 87, true);        // LITTLE ENDIAN, UNSIGNED
        }
        ////

        var dbfDataView = new DataView(dbfBuffer, totalHeaderLength);
        var currentOffset = 0;
        for (var rownum = 0; rownum < numRecords; rownum++) {
            var rowData = graphics[rownum].attributes || {};
            //console.log ('Writing DBF record for searchId '+rowData['SEARCHID'] +
            //    " and type " + rowData['TYPE'] + "to row "+rownum);
    //        var recordStartOffset = rownum * (numBytesPerRecord); // recordLength includes the byte for deletion flag
            //var currentOffset = rownum*(recordLength);
            dbfDataView.setUint8(currentOffset, 32); // Deletion flag: not deleted. 20h = 32, space
            currentOffset += 1;
            for (var attribNum = 0; attribNum < attributeMap.length; attribNum++) {
                // loop once for each attribute
                var attribInfo = attributeMap[attribNum];
                var attName = attribInfo.name;
                var dataType = attribInfo.type || 'C';
                var fieldLength = parseInt(attribInfo.length) || 0; // it isn't alterable for L or D type fields

                var attValue;
                switch (dbfEncoded) {
                    case 'UTF8':
                        attValue = utf8encode(rowData[attName] || rownum.toString());
                        break;

                    case 'Win1251':
                        attValue = unicodeToWin1251(rowData[attName] || rownum.toString());
                        break;

                    default:
                        attValue = rowData[attName] || rownum.toString();
                }

                if (dataType == 'L') {
                    fieldLength = 1;
                    if (attValue) {
                        dbfDataView.setUint8(currentOffset, 84); // 84 is ASCII for T
                    }
                    else {
                        dbfDataView.setUint8(currentOffset, 70); // 70 is ASCII for F
                    }
                    currentOffset += 1;
                }
                else
                    if (dataType == 'D') {
                        fieldLength = 8;
                        var numAsString = attValue.toString();
                        if (numAsString.length != fieldLength) {
                            // if the length isn't what it should be then ignore and write a blank string
                            numAsString = ''.lpad(' ', 8);
                        }
                        for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
                            dbfDataView.setUint8(currentOffset, numAsString.charCodeAt(writeByte));
                            currentOffset += 1;
                        }
                    }
                    else
                        if (dataType == 'N') {
                            // maximum length is 18. Numbers are stored as ascii text so convert to a string.
                            // fieldLength = attribinfo.length && attribinfo.length<19 ? attribinfo.length : 18;
                            var numAsString = attValue.toString();
                            if (fieldLength === 0) {
                                continue;
                            }
                            // bug fix: was calling lpad on != fieldLength i.e. for too-long strings too
                            if (numAsString.length < fieldLength) {
                                // if the length is too short then pad to the left
                                numAsString = numAsString.lpad(' ', fieldLength);
                            }
                            else if (numAsString.length > fieldLength) {
                                numAsString = numAsString.substr(0, 18);
                            }
                            for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
                                dbfDataView.setUint8(currentOffset, numAsString.charCodeAt(writeByte));
                                currentOffset += 1;
                            }
                        }
                        else
                            if (dataType === 'C' || dataType === '') {
                                if (fieldLength === 0) {
                                    continue;
                                }
                                if (typeof (attValue) !== 'string') {
                                    // just in case a rogue number has got in...
                                    attValue = attValue.toString();
                                }
                                if (attValue.length < fieldLength) {
                                    attValue = attValue.rpad(' ', fieldLength);
                                }
                                // doesn't matter if it's too long as we will only write fieldLength bytes
                                for (var writeByte = 0; writeByte < fieldLength; writeByte++) {
                                    dbfDataView.setUint8(currentOffset, attValue.charCodeAt(writeByte));
                                    currentOffset += 1;
                                }
                            }
            }
            // row done, rinse and repeat
        }
        // all rows written, write EOF
        dbfDataView.setUint8(dataLength - 1, 26);
        return dbfBuffer;
    };
    var createAttributeMap = function(graphicsArray){
        // creates a summary of the attributes in the input graphics
        // will be a union of all attributes present so it is sensible but not required that
        // all input graphics have same attributes anyway
        var allAttributes = {};
        for (var i = 0; i < graphicsArray.length; i++) {
            var graphic = graphicsArray[i];
            if (graphic.attributes) {
                for (var attribute in graphic.attributes) {
                    if (graphic.attributes.hasOwnProperty(attribute)) {
                        var attvalue = graphic.attributes[attribute];
                        if (allAttributes.hasOwnProperty(attribute)) {
                            // Call toString on all attributes to get the length in characters
                            if (allAttributes[attribute].length < attvalue.toString().length) {
                                allAttributes[attribute].length = attvalue.toString().length;
                            }
                        }
                        else {
                            switch (typeof(attvalue)) {
                                case 'number':
                                    if (parseInt(attvalue) === attvalue) {
                                        // it's an int
                                        allAttributes[attribute] = {
                                            type: 'N',
                                            length: attvalue.toString().length
                                        };
                                    }
                                    else
                                        if (parseFloat(attvalue) === attvalue) {
                                            // it's a float
                                            var scale = attvalue.toString().length -
                                            (attvalue.toString().split('.')[0].length + 1);
                                            allAttributes[attribute] = {
                                                type: 'N',
                                                length: attvalue.toString().length,
                                                scale: scale
                                            };
                                        }
                                    break;
                                case 'boolean':
                                    allAttributes[attribute] = {
                                        type: 'L'
                                    };
                                    break;
                                case 'string':
                                    allAttributes[attribute] = {
                                        type: 'C',
                                        length: attvalue.length
                                    };
                                    break;
                            }
                        }
                    }
                }
            }
        }
        var attributeMap = [];
        for (var attributeName in allAttributes) {
            if (allAttributes.hasOwnProperty(attributeName)) {
                var thisAttribute = {
                    name: attributeName,
                    type: allAttributes[attributeName].type,
                    length: allAttributes[attributeName].length
                };
                if (allAttributes[attributeName].hasOwnProperty('length')) {
                    thisAttribute.length = allAttributes[attributeName].length;
                }
                if (allAttributes[attributeName].hasOwnProperty('scale')) {
                    thisAttribute.scale = allAttributes[attributeName].scale;
                }
                attributeMap.push(thisAttribute);
            }
        }
        return attributeMap;
    };

    exports.createShapeFiles = createShapeFiles;
    return exports;
}));
