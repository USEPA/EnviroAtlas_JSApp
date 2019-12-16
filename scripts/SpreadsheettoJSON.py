''' SpreadsheettoJSON.py

This script is designed to produce a JSON file for use with the WAB Local Layer Widget
using values from an Excel table.
Utilizes openpyxl, available here: https://openpyxl.readthedocs.org/en/latest/
Tested using Python 3.4, might be backward compatible?
Torrin Hultgren, October 2015

********** Need to update popup configuration, community layers are not HUC 12s **********
'''
import sys, json, csv, openpyxl

# This is the spreadsheet that contains all the content
rootpath = r"C:\inetpub\wwwroot\EnviroAtlas\scripts\\"
inputSpreadsheet = rootpath + r"EAWAB4JSON.xlsx"
# Just in case there are rows to ignore at the top - header is row 1
startingRow = 2
# This should be a csv table that maps spreadsheet column headers to json elements
# no great reason it needs to be in a standalone file rather than embedded in this
# script as a dictionary.
mapTablePath = rootpath + r"jsonfieldmap.csv"
# Output json file
outputFileName = rootpath + r"config.json"
errorLogFile = rootpath + r"errors.log"

# Empty rows cause python problems, remove them
def removeEmptyRows(rows):
    rowsToKeep = []
    for row in rows:
        rowEmpty = True
        for cell in row:
            if cell.value is not None:
                # If any non-null value in the row, flag this as a row to keep
                rowEmpty = False
                break
        if rowEmpty == False:
            rowsToKeep.append(str(cell.row))
    return rowsToKeep

def main(_argv):
    # Open the Excel spreadsheet
    inputWorkbook = openpyxl.load_workbook(filename = inputSpreadsheet,data_only=True)
    # Get the worksheet titled "EA_main"
    inputWorksheet = inputWorkbook["EA_main"]
    # Compile a dictionary of Spreadsheet field headers
    mapTable = open(mapTablePath)
    mapTableReader = csv.DictReader(mapTable,delimiter=',')
    mapDictionary = dict([(row['jsonElem'], row['Column']) for row in mapTableReader])
    
    # Create a dictionary of field titles to column letters
    fieldsToColumns = dict([(cell.value, cell.column) for cell in inputWorksheet[1]])

    # Map the dictionary of csv titles to columns letters via the intermediate dictionary
    key = dict([(key, fieldsToColumns[mapDictionary[key]]) for key in mapDictionary.keys()])

    # Get row index numbers for non-empty rows:
    rowsToKeep = removeEmptyRows(inputWorksheet[startingRow:len(inputWorksheet["A"])])

    # Nothing is being piped to the error file right now
    validationErrors = open(errorLogFile,'w+')

    # Root structure of the JSON file
    fullJSON = {"layers": {"layer": []}}

    for rowID in rowsToKeep:
        name = inputWorksheet[key["name"]+rowID].value
        layerJSON = {"opacity": 0.6,
                    "visible": False}
        if (inputWorksheet[key["serviceType"]+rowID].value == "feature"):
            layerJSON["type"] ="FEATURE"
            layerJSON["autorefresh"] = 0
            layerJSON["mode"] = "ondemand"
        else:
            if (inputWorksheet[key["serviceType"]+rowID].value == "dynamic" or inputWorksheet[key["serviceType"]+rowID].value == "image"):
                layerJSON["type"] = "DYNAMIC"
            if (inputWorksheet[key["serviceType"]+rowID].value == "tile"):
                layerJSON["type"] = "TILED"
            if (inputWorksheet[key["serviceType"]+rowID].value == "image"):
                layerJSON["type"] = "IMAGE"
            ### code for reading in saved json files with layer/popup definitions.
            #with open(rootpath + inputWorksheet.cell(key["popupDefinition"]+rowID).value) as json_data:
            #    layerJSON["layers"] = json.load(json_data)
            ### the excel spreadsheet should include a relative path to a json file containing the layer/popup definition, which should be a JSON array of layer objects.
        layerJSON["name"] = name
        layerJSON["url"] = inputWorksheet[key["url"]+rowID].value
        # Convert the plain text popupJSON into Python Dictionary for loading
        popupTxt = inputWorksheet[key["popupDefinition"]+rowID].value
        if popupTxt != None:
            try:
                popupDefinition = json.loads(popupTxt)
                layerJSON.update(popupDefinition)
            except:
                print("This layer had invalid JSON for the popup: " + name)
                print(popupTxt)
        stringList = ["eaID","eaScale","eaDescription","eaMetric","eaDfsLink","eaLyrNum","eaMetadata","eaBC","eaCA","eaCPW","eaCS","eaFFM","eaNHM","eaRCA","eaPBS","eaTopic","tileLink","tileURL","numDecimal","IsSubLayer","SubLayerNames","SubLayerIds","sourceType","cacheLevelNat","categoryTab","drawSelectLayer","DownloadSource"]
        for elem in stringList:
            cell = inputWorksheet[key[elem]+rowID]
            if cell.value != None:
                cellValue = cell.value
                if cellValue == 'x':
                    cellValue = True
                layerJSON[elem] = cellValue
        arrayList = [("eaTags",","),("eaBCSDD",";"),("SubLayerNames", ","), ("SubLayerIds", ";"), ("areaGeog",",")]
        for elem,separator in arrayList:
             if inputWorksheet[key[elem]+rowID].value:
                fullString = inputWorksheet[key[elem]+rowID].value
                cleanString = fullString.strip(separator+' ')
                fullArray = cleanString.split(separator)
                cleanArray = [elemVal.strip() for elemVal in fullArray]
                layerJSON[elem] = cleanArray
        fullJSON["layers"]["layer"].append(layerJSON)

    validationErrors.close()
    outputFile = open(outputFileName,'w+')
    json.dump(fullJSON,outputFile,indent=4)
    outputFile.close()

if __name__ == "__main__":
    main(sys.argv)
