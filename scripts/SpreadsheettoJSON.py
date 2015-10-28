''' SpreadsheettoJSON.py

This script is designed to produce a JSON file compliant with Project Open Data Schema 1.1
using values from an Excel table.  
Utilizes openpyxl, available here: https://openpyxl.readthedocs.org/en/latest/

Torrin Hultgren, October 2015
'''
import sys, json, csv, openpyxl

inputSpreadsheet = r"C:\inetpub\wwwroot\EnviroAtlas\scripts\EnviroAtlas2json.xlsx"
startingRow = 2
mapTablePath = r"C:\inetpub\wwwroot\EnviroAtlas\scripts\jsonfieldmap.csv"  
outputFileName = r"C:\inetpub\wwwroot\EnviroAtlas\scripts\config.json"
errorLogFile = r"C:\inetpub\wwwroot\EnviroAtlas\scripts\errors.log"

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
    # Get the active worksheet (hopefully it's the only worksheet)
    inputWorksheet = inputWorkbook.active
    # Compile a dictionary of Spreadsheet field headers
    mapTable = open(mapTablePath)
    mapTableReader = csv.DictReader(mapTable,delimiter=',')
    mapDictionary = dict([(row['jsonElem'], row['Column']) for row in mapTableReader])
    
    # Create a dictionary of field titles to column letters
    fieldsToColumns = dict([(cell.value, cell.column) for cell in inputWorksheet.rows[0]])
    
    # Map the dictionary of csv titles to columns letters via the intermediate dictionary
    key = dict([(key, fieldsToColumns[mapDictionary[key]]) for key in mapDictionary.keys()])
    
    # Get row index numbers for non-empty rows:
    rowsToKeep = removeEmptyRows(inputWorksheet.rows[startingRow:])
    
    validationErrors = open(errorLogFile,'w+')
    
    fullJSON = {"layers": {"layer": []}}
    
    fullJSON["layers"]["layer"].append({
        "type": "Basemap",
        "name": "DeLorme's basemap",
        "layers": {
          "layer": [
            {
              "url": "http://services.arcgisonline.com/arcgis/rest/services/Specialty/DeLorme_World_Base_Map/MapServer",
              "isReference": "false",
              "opacity": 1
            }
          ]
        }
      })

    for rowID in rowsToKeep:
        layerJSON = {"type" : "Feature",
                    "opacity": 0.5,
                    "visible": "false",
                    "autorefresh": 0,
                    "mode": "ondemand"}
        
        name = inputWorksheet.cell(key["name"]+rowID).value
        layerJSON["name"] = name
        layerJSON["url"] = inputWorksheet.cell(key["url"]+rowID).value
        layerJSON["popup"] = {
          "title": "HUC 12 ID: {HUC_12}",
          "fieldInfos": [
            {
              "visible": "true"
            }
          ],
          "showAttachments": "false"
        }
        layerJSON["popup"]["fieldInfos"][0]["fieldName"] = inputWorksheet.cell(key["fieldName"]+rowID).value
        layerJSON["popup"]["fieldInfos"][0]["label"] = name
        layerJSON["eaScale"] = inputWorksheet.cell(key["eaScale"]+rowID).value
        layerJSON["eaDescription"] = inputWorksheet.cell(key["eaDescription"]+rowID).value
        layerJSON["eaMetric"] = inputWorksheet.cell(key["eaMetric"]+rowID).value
        layerJSON["eaDfsLink"] = inputWorksheet.cell(key["eaDfsLink"]+rowID).value
        layerJSON["eaLyrNum"] = inputWorksheet.cell(key["eaLyrNum"]+rowID).value
        layerJSON["eaCategory"] = inputWorksheet.cell(key["eaCategory"]+rowID).value
        layerJSON["eaMetadata"] = inputWorksheet.cell(key["eaMetadata"]+rowID).value
        
        fullJSON["layers"]["layer"].append(layerJSON)
    
    validationErrors.close()
    outputFile = open(outputFileName,'w+')
    json.dump(fullJSON,outputFile,indent=4)
    outputFile.close()

if __name__ == "__main__":
    main(sys.argv)
