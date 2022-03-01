
#returns ssl value and user token def getToken(adminUser, pw): data =
def getToken(adminUser, pw):
        data = {'username': adminUser,
            'password': pw,
            'referer' : 'https://www.arcgis.com',
            'f': 'json'}
        url  = 'https://www.arcgis.com/sharing/rest/generateToken'
        jres = requests.post(url, data=data, verify=False).json()
        print (jres)
        return jres['token'],jres['ssl']

#RETURNS UNIQUE ORGANIZATION URL and OrgID
def GetAccount(pref, token):
        
        URL= pref+'www.arcgis.com/sharing/rest/portals/self?f=json&token=' + token
        response = requests.get(URL, verify=False)
        jres = json.loads(response.text)
        return jres['urlKey'], jres['id']

def GetViewLayerItemID(token, layerName):
        #https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/testBji11/FeatureServer/0?f=pjson&token=ii7G...
        updateUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + layerName + '/FeatureServer/0' + '?f=pjson&token=' + token

        
        data = {"f":'pjson'}
        response = requests.post(updateUrl, data=data, verify=False).json()
        
        #  "serviceItemId" : "5c4b6618ee57456082910edf57daf2f5",

        return response["serviceItemId"]
## This function is not used in the code, since FieldNameRelatedToLayerName is got from function UpdateViewLayerDefinition
def GetFieldNameRelatedToLayerName(srcLayerJson):
        totalNumFields = len(srcLayerJson["fields"])
        print(totalNumFields)

        fieldName = ""
        for fieldIndex in range(totalNumFields):
                if ((srcLayerJson["fields"][fieldIndex]["alias"] != srcLayerNameNew) or  (srcLayerJson["fields"][fieldIndex]["alias"] != srcLayerJson["name"])):
                        fieldName = srcLayerJson["fields"][fieldIndex]["name"]
                        break
        return fieldName      

def UpdateViewLayerDefinition(userName, portalUrl, token, layerName, srcLayerJson):

        #updateUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/admin/services/testBji11/FeatureServer/0/updateDefinition'
        updateUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/admin/services/' + layerName + '/FeatureServer/0/updateDefinition'
        fieldData = []
        totalNumFields = len(srcLayerJson["fields"])
        print(totalNumFields)
        FieldNameRelatedToLayerName = ""
        
        posOfparentheses = srcLayerJson["name"].find('(')
        if posOfparentheses < 0:
                srcLayerNameNew = srcLayerJson["name"]
        else:
                srcLayerNameNew = srcLayerJson["name"][0:posOfparentheses].strip()
        print(srcLayerNameNew)

        ## prepare to update hidden fields
        fieldToHide = '{"fields":['
        for fieldIndex in range(totalNumFields):
                if ((srcLayerJson["fields"][fieldIndex]["alias"] != srcLayerNameNew) and  (srcLayerJson["fields"][fieldIndex]["alias"] != srcLayerJson["name"])):
                        if  (not (srcLayerJson["fields"][fieldIndex]["name"].upper() in ArrAttributesVisible)):
                                fieldToHide = fieldToHide + '{"name":"'+ srcLayerJson["fields"][fieldIndex]["name"] + '","visible":false},'
                else:
                        FieldNameRelatedToLayerName = srcLayerJson["fields"][fieldIndex]["name"]
        if FieldNameRelatedToLayerName == "":
                FieldNameRelatedToLayerName = srcLayerJson["drawingInfo"]["renderer"]["field"]

        fieldToHideNew = fieldToHide.rstrip(fieldToHide[-1]) + ']}'
        #print('my json for field: ' + fieldToHideNew)        
                        
##        data = {'f':'json',
##            'token':token,
##            'async': 'true',
##            'updateDefinition':'{"fields":[{"name":"Pct_Land","visible":true},{"name":"HUC_12","visible":false}]}'
##        }               
        
        data = {'f':'json',
            'token':token,
            'async': 'true',
            'updateDefinition':fieldToHideNew
        }
        ## Client do not want to hide the attributes
        #response = requests.post(updateUrl, data=data, verify=False).json()

        ## prepare to update symbology
        symbology = json.dumps(srcLayerJson["drawingInfo"])
        symbologyDefinition = '{"drawingInfo":'+  symbology + '}'
        #print('bji update definition: ' +symbologyDefinition)
        
        dataSymbology = {'f':'json',
            'token':token,
            'async': 'false',
            'updateDefinition':symbologyDefinition
        }     
        response = requests.post(updateUrl, data=dataSymbology, verify=False).json()
       

        return FieldNameRelatedToLayerName


import requests, json, time
import arcgis
from arcgis import GIS
from arcgis.features import FeatureLayerCollection


#### Here to modify the user name and password
user= '' #raw_input('What is the ArcGIS Online Username?')
pw = ''#raw_input('What is the ArcGIS Online Password?')
logFile = 'log.txt'

# This is to test creating single layer view, but is replaced by lebResponseSingleLayer["name"] in loop 
#layerName = "testBji15"

# This is the original feature layer on ArcGIS online upon which layer views are created

OriginalFeatureLayerName = "EnviroAtlas National 2016 Metrics"
#OriginalFeatureLayerName = "EnviroAtlas_WBD_WM17"
#OriginalFeatureLayerName = "EnviroAtlas National 2021 Metrics"


# This is the leb layer upon which we draw hidden fields and symbology info for the creating layer views
SourceSymbologyLayer = "https://leb.epa.gov/arcgis/rest/services/National/National2016_master/MapServer"
#SourceSymbologyLayer = "https://leb.epa.gov/arcgis/rest/services/National/National2017_metrics/MapServer"
#SourceSymbologyLayer = "https://leb.epa.gov/arcgis/rest/services/National/National2021_metrics/MapServer" ##EnviroAtlas National 2021 Metrics
#SourceSymbologyLayer = "https://enviroatlas.epa.gov/arcgis/rest/services/National/National2021_metrics/MapServer"

# This the list of fiels which we like to make visible
ArrAttributesVisible = ["OBJECTID", "HUC_12", "SHAPE__AREA", "SHAPE__LENGTH", "SHAPE"]
createdLayerName = []

SpecialCharacterDict = {
"&":"_",
"<":"LessThan",
">":"GreaterThan",
"\"":"_",
"'":"_",
"?":"_",
"@":"_",
"=":"EqualTo",
"$":"_",
"~":"_",
"^":"",
"(":"_",
")":"_",
" ":"",
"/":"_",
"`":"",
"#":"_",
"%":"percent",
"*":"_",
"-":"_",
"}":"",
",":"",
"[":"_",
"]":"_"
}

#get account information
token= getToken(user, pw)
if token[1] == False:
           pref='http://'
else:
           pref='https://'

t=GetAccount(pref,token[0])
urlKey=t[0]
orgID=t[1]
portalUrl=pref+urlKey

gis = GIS("https://www.arcgis.com", user,pw)

source_search = gis.content.search(query='title:"{}"'.format(OriginalFeatureLayerName), item_type='Feature Service')[0]
print("source_search: " + str(source_search))
source_flc = FeatureLayerCollection.fromitem(source_search)

#Get the all the layer infos from leb server
SourceSymbologyLayerMapserver = SourceSymbologyLayer + '?f=pjson'
lebData = {"f":'pjson'}
lebResponseLayerList = requests.post(SourceSymbologyLayerMapserver, data=lebData, verify=False).json()

totalNumLebLayer = len(lebResponseLayerList["layers"])
print(totalNumLebLayer)

with open(logFile, 'a+') as writer:
        writer.write('___________________' + '\n')
#check if there is existing viewlayers. If there is any, prompt user to delete these layers
existingViewLayer = False
listOfExistingLayers = []

testIndex = 110
startAfterIndex = 41

for eachLayer in lebResponseLayerList["layers"]:
 
        layerIndex = eachLayer["id"]
##        if (int(layerIndex) !=testIndex):
##                continue
##        if (int(layerIndex) < startAfterIndex):
##                continue 
        SourceSymbologyLayerSubLayer = SourceSymbologyLayer + '/' + str(layerIndex) + '?f=pjson'

        lebDataSingleLayer = {"f":'pjson'}

        lebResponseSingleLayer = requests.post(SourceSymbologyLayerSubLayer, data=lebDataSingleLayer, verify=False).json()
        
        layerViewName = lebResponseSingleLayer["name"]

        for keyCharacter in SpecialCharacterDict:
                if layerViewName.find(keyCharacter) > -1:
                        layerViewNameNew = layerViewName.replace(keyCharacter, SpecialCharacterDict[keyCharacter])
                        layerViewName = layerViewNameNew
        print("layerViewName: " + layerViewName)

        #with open(logFile, 'a+') as writer:
        #        writer.write("layerIndex: "+str(layerIndex) + "; check layerViewName: "+layerViewName + '\n')
                
        updateUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/' + layerViewName.replace(" ", "_") + '/FeatureServer/0' + '?f=pjson&token=' + token[0]
        
        data = {"f":'pjson'}
        response = requests.post(updateUrl, data=data, verify=False).json()

        if "serviceItemId" in response:
                existingViewLayer = True
                listOfExistingLayers.append(layerViewName)


with open(logFile, 'a+') as writer:
        writer.write('*********************' + '\n')
if existingViewLayer == True:
        print('The following layers have already existed. Please delete them before running the code:' + '\n')
        with open(logFile, 'a+') as writer:
                writer.write('The following layers already exist. Please delete them before running the code:' + '\n')  
        for exisingLayer in listOfExistingLayers:
                print(exisingLayer + '\n')
                with open(logFile, 'a+') as writer:
                        writer.write(exisingLayer + '\n')
        quit()
        
with open(logFile, 'a+') as writer:
        writer.write('*********************' + '\n')
        writer.write("Created view layer for " + OriginalFeatureLayerName + ":" + '\n')
        writer.write('*********************' + '\n')
        

sameCopyIndex = 0
strAllCreatedLayerName = ""
for eachLayer in lebResponseLayerList["layers"]:
        createdLayerName = strAllCreatedLayerName.split(",")
        if ((createdLayerName is None) or (createdLayerName == None)):
               createdLayerName = [] 
        layerIndex = eachLayer["id"]
        print("create view for layer: " + str(layerIndex))
##        if (int(layerIndex) <testIndex):
##              quit()  
##        if (int(layerIndex) !=testIndex):
##                continue
##        if (int(layerIndex) < startAfterIndex):
##                continue         
        SourceSymbologyLayerSubLayer = SourceSymbologyLayer + '/' + str(layerIndex) + '?f=pjson'
        lebDataSingleLayer = {"f":'pjson'}

        #print(json.dumps(lebDataSingleLayer))
        lebResponseSingleLayer = requests.post(SourceSymbologyLayerSubLayer, data=lebDataSingleLayer, verify=False).json()

        #print(lebResponseSingleLayer["name"])
        layerViewName = lebResponseSingleLayer["name"]

        for keyCharacter in SpecialCharacterDict:
                if layerViewName.find(keyCharacter) > -1:
                        layerViewName = layerViewName.replace(keyCharacter, SpecialCharacterDict[keyCharacter])

        print('created layer view name: ' + layerViewName + '\n')
        with open(logFile, 'a+') as writer:
                writer.write("created for sub layer " + str(layerIndex) + ": view layer name:" +  layerViewName +  "; view layer title: " + lebResponseSingleLayer["name"] + '\n')

        bNewLayerName = True
        if type(createdLayerName) is list:
                for existingLayerName in createdLayerName:
                        if(existingLayerName == layerViewName):
                                bNewLayerName = False
        
        if (bNewLayerName == False):
                layerViewName = str(layerViewName) + str(sameCopyIndex)
                sameCopyIndex = sameCopyIndex + 1
        else:
                #createdLayerName = createdLayerName.append(str(layerViewName))
                strAllCreatedLayerName= strAllCreatedLayerName + layerViewName + ","
        print('new created layer view name: ' + layerViewName + '\n')
        new_view = source_flc.manager.create_view(name=layerViewName)
        fieldNameRelatedToLayerName = UpdateViewLayerDefinition(user,portalUrl, token[0], layerViewName, lebResponseSingleLayer)
        print ('field name of same alias as the layer name: ' + fieldNameRelatedToLayerName + '\n')
        if fieldNameRelatedToLayerName == "":
                with open(logFile, 'a+') as writer:
                        writer.write("Field relative to layer name is not found in layer: " + str(layerIndex) + "; layer name: " + layerViewName + '\n')     

        LayerViewItemID = GetViewLayerItemID(token[0], layerViewName)
        print("itemID: " + LayerViewItemID + '\n')

        gis = arcgis.gis.GIS("https://www.arcgis.com", user, pw)
        
        # update visibility
        item = gis.content.get(LayerViewItemID)
        item_data = item.get_data()

        #print(item_data)
        field_infos = item_data['layers'][0]['popupInfo']['fieldInfos']

        for field in field_infos:
                if ((field["fieldName"] != fieldNameRelatedToLayerName) and (field["fieldName"] != "HUC_12")):
                        field["visible"] = False
                else:
                        field["visible"] = True

        print(json.dumps(item_data))
        item_properties = {"text": json.dumps(item_data)}
        item.update(item_properties=item_properties)
        # update title
        item_properties = {"title": lebResponseSingleLayer["name"]}
        item.update(item_properties=item_properties)
        




