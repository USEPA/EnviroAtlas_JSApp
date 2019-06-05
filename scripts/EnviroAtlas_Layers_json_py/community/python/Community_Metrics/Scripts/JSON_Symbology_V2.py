#-----------------------------------------------------------------------------
# Name:     JSON_Symbology.py
#
# Author:   Ali Mackey
# Editor:   John Lovette
#
# Created:  03/06/2017
# Updated:  10/24/2017
#
# Purpose:  Writes a JSON file for each community layer describing that layer's
#           prefered symbology. Accounts for NULLs and
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the  function.
#           The data needed to process this scripts is:
#               1. All the final data tables and feature classes (community)
#               3. Block Groups (community)
#
#
# Update 10/24/2017:   Update to include code for community floodplain variables
# Update 12/01/2017:   Changed field min and max values to correct rounding issues
#-----------------------------------------------------------------------------

##def json_symbol(cities, inDir, workFld):
""" Identify the City, Do not inlcude WIA """
startcity = ['CombComm', 'SLCUT', 'CIL']

""" Set the Directories """
##if startcity == 'CIL':
##    workFld = 'G:/GIS/Cities/' + str(startcity)
##elif startcity[0] < 'N':
##    workFld = 'E:/GIS/Cities/' + str(startcity)
##else:
##    workFld = 'N:/GIS/Cities/' + str(startcity)

inDir = 'E:/GIS/Input'

natFld = 'E:/GIS/CC_Symbol'

""" Import Modules """
import traceback, time, arcpy, os, json, locale, shutil
from arcpy import env
locale.setlocale(locale.LC_ALL, 'english-us')
print 'JSON Symbology Start Time: ' + time.asctime()

""" Set JSON Directory """
dirs = [d for d in os.listdir(natFld) if os.path.isdir(os.path.join(natFld, d))]
dirs = sorted(dirs)
newDir = dirs[-1]

jsonFld = natFld + '/' + newDir
jsonGDB = natFld + '/' + newDir + '/Full.gdb'

""" Set up the Cities List """
if isinstance(startcity, basestring) == True:
    cities = []
    cities.append(startcity)
elif isinstance(startcity, list) == True:
    cities = startcity
else:
    print 'Error in city input: city is not a string or list. Please correct and rerun.'

""" Run CombComm, if necessary """
if 'CombComm' in cities:
    pass
else:
    if arcpy.Exists(jsonFld + '/CombComm') == False:
        cities = ['CombComm'] + cities
        print 'Running Combined Community JSON before running for the specific community.'

for city in cities:
    #-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    os.makedirs(str(jsonFld) + '/' + str(city))
    jsonDir = str(jsonFld) + '/' + str(city)
    natFinalTbl = natFld + '/' + newDir + '/Full.gdb/CombComm_BG_Alb'

    """ Report File Directory """
    """ Set the Directories """
    if city == 'CIL':
        workFld = 'F:/GIS/Cities/' + str(city)
        reportfileDir = str(workFld) + '/Logs'
    elif city == 'CombComm':
        workFld = jsonFld
        reportfileDir = workFld
    elif city[0] < 'N':
        workFld = 'E:/GIS/Cities/' + str(city)
        reportfileDir = str(workFld) + '/Logs'
    else:
        workFld = 'N:/GIS/Cities/' + str(city)
        reportfileDir = str(workFld) + '/Logs'

    """ Projection Directory """
    prjDir = str(inDir) + '/Prj'
    prjfileALB = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'

    """ Set Workspace Environments """
    arcpy.env.workspace = jsonGDB
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
    #-----------------------------------------------------------------------------
    ##    try:
    #-------- LOGFILE CREATION ---------------------------------------------
    """ Create report file for each metric """
    tmpName = city + '_JSON_' + time.strftime('%Y%m%d_%H-%M')
    reportfileName = reportfileDir + '/' + tmpName  + '.txt'
    reportFile = open(reportfileName, 'w')

    """ Write out first line of report file """
    print 'JSON Symbology for ' + city + ' Start Time: ' + time.asctime()

    """-------- OPEN MAP DOCUMENT -------------------------------------------"""
    mxd_master = arcpy.mapping.MapDocument(str(inDir) + '/JSON_Symbol.mxd')
    mxd_master.saveACopy(natFld + '/' + newDir + '/JSON_Symbol_' + str(city) + '.mxd')
    mxd = arcpy.mapping.MapDocument(natFld + '/' + newDir + '/JSON_Symbol_' + str(city) + '.mxd')

    df = arcpy.mapping.ListDataFrames(mxd, "Layers")[0]

    """-------- GATHER FC AND FIELDS ----------------------------------------"""
    bgFC = jsonGDB + '/CombComm_BG_Alb'

    fields = [f.name for f in arcpy.ListFields(bgFC)]
    for remv in ['OBJECTID', 'FID', 'Shape', 'Shape_Area', 'Shape_Length', 'bgrp', 'FIRST_State', 'Shape_Length_1', 'Shape_Area_1', 'GEOID10', 'CommST', 'bgrp_12_13', 'Wet_M', 'Imp_M', 'Ag_M', 'MFor_M', 'Green_M', 'Wet_M', 'SUM_HOUSIN', 'PM25_Work_Loss_Days_I', 'PM25_Work_Loss_Days_V', 'Community', 'STATEFP10', 'COUNTYFP10', 'TRACTCE10', 'ALAND10', 'AWATER10']:
        try:
            fields.remove(remv)
        except:
            pass

    """ Catch rounding errors """
    roundErrors = []

    """ Loop through the fields """
    for field in fields:
##            try:
##    for field in['BWDP_Pop']:
##            print field
            """ Special Fields """
            demofields = ['SUM_POP10', 'under_1','under_1pct',  'under_13', 'under_13pc', 'over_70', 'over_70pct', 'PLx2_Pop', 'PLx2_Pct','NonWhite', 'NonWt_Pct', 'Day_Count', 'K12_Count']
            noDataFields = ['Ag_M', 'Ag_PC', 'Ag_P', 'Wet_M', 'Wet_P', 'maxtempreduction', 'maxtempreductionnight']

            """ Set the Number of Breaks """
            if field in demofields:
                breakNumber = 4
            else:
                breakNumber = 5

            """ Limit Data to the Community, if necessary """
            if city == 'CombComm':
                arcpy.MakeFeatureLayer_management(bgFC, 'comm_bg_lyr', '', jsonGDB)
            else:
                arcpy.MakeFeatureLayer_management(bgFC, 'comm_bg_lyr', "CommST = '" + str(city) + "'", jsonGDB)

            """ Extract the values for the field of interest """
            lyr = arcpy.mapping.Layer('comm_bg_lyr')
            valueList = []
            nullTypes= []
            cursor = arcpy.SearchCursor(lyr)
            for row in cursor:
                value = row.getValue(str(field))
                valueList.append(value)
            valueList = sorted(valueList)

            """ Identify NULLs """
            lyrsW8s = []
            if len(valueList) == 0:
                print str(field) + ' is not present in ' +  str(city) + ' and does not have -888888 values. Add values and copy combined symbology for this field + community.'
            if -888888 in valueList:
                lyrsW8s = lyrsW8s + [[city, field]]
                nullTypes.append(-888888)
            if -99999 in valueList:
                nullTypes.append(-99999)
            if -99998 in valueList:
                nullTypes.append (-99998)
            if -99997 in valueList:
                nullTypes.append(-99997)

            """ Limit the Feature Layer and Value List to the non-Null values """
            if len(nullTypes) > 0:
                valueList2 = sorted(i for i in valueList if i >-10)
                valueList = valueList2
                arcpy.Delete_management(lyr)
                if city == 'CombComm':
                    arcpy.MakeFeatureLayer_management(bgFC, 'comm_bg_lyr', str(field) + " > -10", jsonGDB)
                else:
                    arcpy.MakeFeatureLayer_management(bgFC, 'comm_bg_lyr', "CommST = '" + str(city) + "' and " + str(field) + " > -10", jsonGDB)
                lyr = arcpy.mapping.Layer('comm_bg_lyr')

            """ If there is no data for the field, skip processing """
            if -888888 in nullTypes and city <> 'CombComm':

                """ Copy the JSON for the Combined Community for that field """
                ccName = str(jsonFld) + '/CombComm/CombComm_' + str(field) + '.json'
                singleName = str(jsonDir) + '/' + str(city) + '_' + str(field) + '.json'
                shutil.copyfile(ccName, singleName)

                """ Add the City + Field to a replication list """
                replicateList = open(natFld + '/JSON_Replication.txt', 'a')
                replicateList.write(str(city) + '--' + str(field) + '--' + time.strftime('%Y%m%d_%H-%M') + '\n')
                replicateList.close()

            elif len(valueList) == 0 and nullTypes: ##If the whole community has data calculated but it is all null (e.g. Floodplains in BTX)

                """ Copy the JSON for the Combined Community for that field """
                ccName = str(jsonFld) + '/CombComm/CombComm_' + str(field) + '.json'
                singleName = str(jsonDir) + '/' + str(city) + '_' + str(field) + '.json'
                shutil.copyfile(ccName, singleName)

                """ Add the City + Field to a replication list """
                replicateList = open(natFld + '/JSON_Replication.txt', 'a')
                replicateList.write(str(city) + '--' + str(field) + '--' + time.strftime('%Y%m%d_%H-%M') + '\n')
                replicateList.close()

            else:

                """-------- Find the Class Breaks ---------------------------"""
                """ Add Layer to the map and format """
                arcpy.mapping.AddLayer(df, lyr)

                srclyr = arcpy.mapping.Layer(inDir + '/Templates/Base_Symbol.lyr')
                arcpy.mapping.UpdateLayer(df, lyr, srclyr, 'TRUE')

                """ Dealing with CombComm only, in progress """
                if len(valueList) < 10001:

                    lyr.symbology.valueField = field
                    lyr.symbology.numClasses = breakNumber
                    lyr.symbology.reclassify()

                    breaks = lyr.symbology.classBreakValues
                    if breaks[-1] <> max(valueList):
                        breaks = breaks[:-1] + [max(valueList)]

                elif field in ['Day_Count', 'Day_Low', 'K12_Count', 'K12_Low', 'total_his_count']: ## fields with categorical data
                    lyr.symbology.valueField = field
                    lyr.symbology.numClasses = breakNumber
                    lyr.symbology.reclassify()

                    breaks = lyr.symbology.classBreakValues
                    if breaks[-1] <> max(valueList):
                        breaks = breaks[:-1] + [max(valueList)]

                else:
                    breaks0 = []
                    obsClass = len(valueList)/breakNumber
                    breaks0.append(min(valueList))
                    for i in range(breakNumber-1):
                        breaks0.append(valueList[obsClass*(i+1)])
                    breaks0.append(max(valueList))
                    if breaks0[1] == breaks0[0]:
                        breaks = []
                        breaks.append(min(valueList))
                        breaks.append(valueList[obsClass*(1)])
                        valueList2 = sorted(n for n in valueList if n > breaks[-1])
                        obsClass2 = len(valueList2)/(breakNumber - 1)
                        for i in range(breakNumber-2):
                            #valueList2 = [valueList[valueList > breaks[-1]]]
                            breaks.append(valueList2[obsClass2*(i+1)])
                        breaks.append(max(valueList))
                    else:
                        breaks = breaks0

                """ Capture the break values """
                if breakNumber == 4:
                    breakValues = breaks[1:4]
                else:
                    breakValues = breaks[1:5]

                """-------- Determine the number of decimal places needed ---------"""
                """ Decimal Limits """
                decLimit0 = ['SUM_POP10', 'under_1', 'under_13', 'over_70', 'PLx2_Pop', 'NonWhite', 'Day_Count', 'K12_Count', 'Day_Low', 'K12_Low', 'RB50_LArea',
                        'RB15_LArea', 'Buff_Pop', 'IBuff_Pop', 'SBuff_Pop', 'IWDP_Pop', 'BWDP_Pop', 'WVT_Pop', 'WVW_Pop', 'FP1_Imp_M', 'FP02_Imp_M', 'FP1_Land_M', 'FP02_Land_M', 'FP1_Pop_C', 'FP02_Pop_C']
                decLimit2 = ['MFor_P', 'Imp_P', 'Green_P', 'Ag_P', 'Wet_P', 'Lane_PctSB', 'Lane_PctIB', 'RB50_LABGP', 'RB15_LABGP', 'MFor_PC', 'Imp_PC', 'Green_PC',
                'Ag_PC', 'Buff_Pct', 'IWDP_Pct', 'BWDP_Pct', 'WVT_Pct', 'WVW_Pct', 'RB50_ImpP', 'RB50_ForP', 'RB50_VegP', 'RB15_ImpP', 'RB15_ForP', 'RB15_VegP', 'FP1_Imp_P', 'FP02_Imp_P', 'FP1_Land_P', 'FP02_Land_P', 'FP1_Pop_P', 'FP02_Pop_P']
                decLimit4 = ['under_1pct', 'under_13pc', 'over_70pct']

                """ Set maximum allowed strange values """
                pct5 = round(len(valueList) * 0.05, 0)
                if pct5 > 50:
                    pushLimit = 50
                else:
                    pushLimit = pct5

                """ Set maximum decimal places """
                if field in decLimit0:
                    decmax = 0
                elif field in decLimit2:
                    decmax = 2
                else:
                    decmax = 4

                """ Set loop starting points """
                pushCounts = []
                pushCount = 1000000000000000000000000000
                dec = -1

                """ Starting with 0 Decimal points, while the number of strange values
                is less than the limit of strange values AND the number of decimal
                points is <= the max number of decimal points """
                while pushCount > pushLimit and dec <= decmax - 1:
                    dec = dec + 1
                    roundList = []
                    pushValues = []
                    ## Round the break values
                    for v in breakValues:
                        roundList.append(round(float(v), dec))

                    ## For each value in the value List:
                    for r in valueList:
                        ## Check the value against each break value
                        for m in range(0, len(breakValues)):
                            ## If the value is greater than the rounded break value
                            if r > roundList[m]:
                                ## AND rounds to the same rounded break value at the
                                ## given number of decimal points
                                if round(r, dec) == roundList[m]:
                                    ## The value is strange
                                    pushValues.append(r)

                    """ Count all strange values at that number of decimals """
                    pushCount = int(len(pushValues))
                    pushCounts.append([pushCount, dec])
                    """ If the number of strange values is above the strange value
                    limit, the while loop will continue by adding another decimal
                    point and calculating the number of strange values again """

                """-------- Format the lables, breaks, and colors -------------- """
                """ Correct the labels for the number of decimals needed
                The lower bounds should be 1, 0.1, 0.01, 0.001, or 0.0001 above
                the previous upper bound if the number of decimal places is 0, 1,
                2, 3, or 4, respectively; decplus calculates that value """
                decplus = round(float(1.00000000000000001/(10**float(dec))), dec)

                """ Format each value's label """
                labelNums = [breaks[0]]
                for i in range(1, len(breaks)-1):
                    labelNums.append(breaks[i])
                    labelNums.append(breaks[i] + decplus)
                labelNums.append(breaks[-1])

                """ option 1 to fix rounding issues with JSON viz on EA site
                labelNums = [breaks[0] - decplus]
                for i in range(1, len(breaks)-1):
                    labelNums.append(breaks[i])
                    labelNums.append(breaks[i] + decplus)
                labelNums.append(breaks[-1] + decplus)
                """

                """ Correct errors in rounding if there is a full class of 100s """
                if round(labelNums[-3], dec) == 100 and round(labelNums[-1], dec) == 100:
                    labelNums[-3] = 99
                    labelNums[-2] = 100
                    print str(field) + ' has a hundreds class to check'

                labels = []
                colors = []

                """ Format Labes for -99997 """
                if -99997 in nullTypes:
                    labels = ['No FEMA Coverage'] + labels
                    breaks = [-99997, -99997] + breaks[1:]
                    colors = [[156, 156, 156, 255]] + colors

                """ Format Labes for -99998 """
                if -99998 in nullTypes:
                    labels = ['Block Group Beyond Analysis Extent'] + labels
                    breaks = [-99998, -99998] + breaks[1:]
                    colors = [[156, 156, 156, 255]] + colors

                """ Format Labes for -99999 """
                if -99999 in nullTypes:
                    if field in ['MFor_PC', 'Buff_Pop', 'Buff_Pct', 'SBuff_Pop', 'IBuff_Pop', 'Green_PC', 'Imp_PC', 'IWDP_Pop', 'IWDP_Pct', 'BWDP_Pop', 'BWDP_Pct', 'WVT_Pop', 'WVT_Pct', 'WVW_Pop', 'WVW_Pct', 'Ag_PC']:
                        nulllabel = ["No People Living in Block Group"]
                    elif field in ['RB15_ForP', 'RB15_VegP', 'RB50_ForP', 'RB50_VegP', 'RB15_ImpP', 'RB50_ImpP']:
                        nulllabel = ["No Buffer Area"]
                    elif field in ['K12_Low']:
                        nulllabel = ["No Schools"]
                    elif field in ['Day_Low']:
                        nulllabel = ["No Day Cares"]
                    elif field in['FP1_Imp_M', 'FP1_Imp_P', 'FP02_Imp_M', 'FP02_Imp_P', 'FP1_LandA_M', 'FP1_LandA_P', 'FP02_LandA_M', 'FP02_LandA_P']:
                        nulllabel = ["No Floodplain Area"]
                    elif field in['FP1_Pop_C', 'FP1_Pop_M', 'FP02_Pop_C', 'FP02_Pop_M']:
                        nulllabel = ["No Floodplain Area or No People in Block Group"]
                    labels = nulllabel + labels
                    breaks = [-99999, -99999] + breaks[1:]
                    colors = [[204, 204, 204, 255]]  + colors

                """ Format Labels for -888888 """
                if field in noDataFields:
                    labels = ['No Data for Community'] + labels
                    breaks = [-888888, -888888] + breaks[1:]
                    colors = [[255, 255, 255, 255]]  + colors


                """ Add the numeric labels """
                actualLabels = []
                for i in range(0, len(labelNums), 2):
                    if labelNums[i] == labelNums[i+1]:
                        actualLabel = [str(locale.format('%.' + str(dec) + 'f', (round(labelNums[i], dec)), grouping=True))]
                    else:
                        actualLabel = [str(locale.format('%.' + str(dec) + 'f', (round(labelNums[i], dec)), grouping=True)) + ' - ' + str(locale.format('%.' + str(dec) + 'f', (round(labelNums[i+1], dec)), grouping=True))]
                    actualLabels = actualLabels + actualLabel
                labels = labels + actualLabels
    ##            print str(field) + ' Breaks: ' + str(breaks)
    ##            print str(field) + ' Labels:' + str(labels)
    ##            print str(field) + ' Label Numbers: ' + str(labelNums)

                """-------- Create a Dictionary to dump to a JSON file ----------"""
                """ Create the dicitonary for demographic layers """
                if field in demofields:
                    backgroundFillSymbol = {"color": [0,0,0,0], "style": "esriSFSSolid", "type": "esriSFS", "outline": {"color": [0,0,0,0], "width": 0.4, "style": "esriSLSSolid", "type": "esriSLS"}}
                    if field in noDataFields:
                        size = [4, 4, 7, 10, 13]
                    else:
                        size = [4, 7, 10, 13]
                    minBreak = math.floor(breaks[0])
                    data = {"backgroundFillSymbol": backgroundFillSymbol, "classificationMethod": "esriClassifyQuantile", "minValue": minBreak, "field": field, "type": "classBreaks"}
                    classBreakInfos = []
                    for i in range(0, len(labels)):
                        if i == 0 and field in noDataFields:
                            symbol = {"style": "esriSMSCircle", "angle": 0, "outline": {"color": [0, 0, 0, 255], "width": 1}, "color": [225, 225, 225, 255], "yoffset": 0, "type":"esriSMS", "xoffset": 0}
                        else:
                            symbol = {"style": "esriSMSCircle", "angle": 0, "outline": {"color": [0, 0, 0, 255], "width": 1}, "color": [230, 152, 0, 255], "yoffset": 0, "type":"esriSMS", "xoffset": 0}
                        symbol["size"] = size[i]
                        if i < len(labels) - 1:
                            classBreak = {"classMaxValue": breaks[i+1], "symbol": symbol, "desciption": "", "label": labels[i]}
                            classBreakInfos.append(classBreak)
                        else:
                            maxBreak = math.ceil(breaks[i+1])
                            classBreak = {"classMaxValue": maxBreak, "symbol": symbol, "description": "", "label": labels[i]}
                            classBreakInfos.append(classBreak)
                    data["classBreakInfos"] = classBreakInfos

                else:
                    """ Create the dicitonary for non-demographic layers """
                    """ Establish the color scheme """
                    colors_5 = [[255, 255, 128, 255], [113, 235, 47, 255], [61, 184, 104, 255], [33, 110, 158, 255], [12, 16, 120, 255]]
                    colors_4 = [[255, 255, 128, 255], [56, 224, 9, 255], [26, 147, 171, 255], [12, 16, 120, 255]]
                    colors_3 = [[255, 255, 128, 255], [61, 154, 104, 255], [12, 16, 120, 255]]
                    colors_2 = [[255, 255, 128, 255], [12, 16, 120, 255]]

                    colorBase = {'5': colors_5, '4': colors_4, '3': colors_3, '2': colors_2}

                    colors = colors + colorBase[str(len(actualLabels))]

                    """ Write the dicitonary
                    data = {"field": field, "minValue": breaks[0], "type": "classBreaks"}
                    outline = {"color": [110, 110, 110, 255], "width": 1, "style": "esriSLSSolid", "type":"esriSLS"}
                    classBreakInfos = []
                    for i in range(0, len(labels)):
                        symbol = {"color": colors[i], "style": "esriSFSSolid", "type": "esriSFS", "outline": outline}
                        classBreak = {"classMaxValue": breaks[i+1], "symbol": symbol, "description": "", "label": labels[i]}
                        classBreakInfos.append(classBreak)
                    data["classBreakInfos"] = classBreakInfos
                    data["classificationMethod"] = "esriClassifyQuantile"
                     """

                    """ option 2 fix, just change "minValue" and "classMaxValue"(max), have to account for possibility of nulls"""
                    minBreak = math.floor(breaks[0])
                    data = {"field": field, "minValue": minBreak, "type": "classBreaks"}
                    outline = {"color": [110, 110, 110, 255], "width": 1, "style": "esriSLSSolid", "type":"esriSLS"}
                    classBreakInfos = []
                    for i in range(0, len(labels)):
                        if i < len(labels) - 1:
                            symbol = {"color": colors[i], "style": "esriSFSSolid", "type": "esriSFS", "outline": outline}
                            classBreak = {"classMaxValue": breaks[i+1], "symbol": symbol, "description": "", "label": labels[i]}
                            classBreakInfos.append(classBreak)
                        else:
                            maxBreak = math.ceil(breaks[i+1])
                            symbol = {"color": colors[i], "style": "esriSFSSolid", "type": "esriSFS", "outline": outline}
                            classBreak = {"classMaxValue": maxBreak, "symbol": symbol, "description": "", "label": labels[i]}
                            classBreakInfos.append(classBreak)
                    data["classBreakInfos"] = classBreakInfos
                    data["classificationMethod"] = "esriClassifyQuantile"


                """-------- Write the JSON file -----------------------------"""
                finalName = str(jsonDir) + '/' + str(city) + '_' + str(field) + '.json'
                with open(finalName, 'w') as singleJSON:
                    json.dump(data, singleJSON)
                singleJSON.close()

                """ Write the report file """
                reportFile.write(str(field) + ';' + str(dec) + ';' + str(labels) + ';' + str(breaks) + '\n')
                arcpy.mapping.RemoveLayer(df, lyr)
                arcpy.Delete_management('comm_bg_lyr')

                """ Does the JSON need to be edited for python rounding issues """
                numbs = []
                testLabels = []
                for label in labels:
                    if '-' in label:
                        testLabels.append(label)
                vals = []
                for label in testLabels:
                    pieces = label.split(' - ')
                    for piece in pieces:
                        vals.append(piece)
                error = False
                for i in range(0, len(numbs)-1):
                    if numbs[i] == numbs[i+1]:
                        error = True

                if error == True:
                    roundErrors.append([city, field])

            arcpy.Delete_management(lyr)

    """ List the fields with rounding errors """
    print 'Fields with rounding errors: ' + str(roundErrors)

    """ For CombComm, copy JSON to cities missing certain fields """
    if city == 'CombComm':
        replicateList = open(natFld + '/JSON_Replication.txt', 'r')
        os.makedirs(str(jsonFld) + '/CC_Replication')
        replicateFolder = str(jsonFld) + '/CC_Replication'
        rlLines = replicateList.readlines()
        for line in rlLines:
            pieces = line.split('--')
            ccJSON = str(jsonDir) + '/' + str(city) + '_' + str(pieces[1]) + '.json'
            copyJSON = str(jsonFld) + '/CC_Replication/' + str(pieces[0]) + '_' + str(pieces[1]) + '.json'
            shutil.copyfile(ccJSON, copyJSON)

        replicateList.close()

        """ Also replicate all of CombComm for Woodbine """
        os.makedirs(str(jsonFld) + '/WIA')
        wiaDir = str(jsonFld) + '/WIA'
        ccList = [f for f in os.listdir(jsonDir)]
        for file in ccList:
            wiaFile = file.replace('CombComm', 'WIA')
            shutil.copyfile(jsonDir + '/' + file, wiaDir + '/' + wiaFile)

##            except:
##                    print 'Something went wrong with ' + str(field)



#-------- COMPELETE LOGFILES ---------------------------------------------

    reportFile.close()

#-----------------------------------------------------------------------------
# END ANALYSIS
#-----------------------------------------------------------------------------

##    except:
##        """ This part of the script executes if anything went wrong in the main script above """
##
##        #-------- PRINT ERRORS ---------------------------------------------------
##        print "\nSomething went wrong.\n\n"
##        print "Python Traceback Message below:"
##        print traceback.format_exc()
##        print "\nArcMap Error Messages below:"
##        print arcpy.GetMessages(2)
##        print "\nArcMap Warning Messages below:"
##        print arcpy.GetMessages(1)
##
##        #-------- COMPLETE LOGFILE ------------------------------------------------
##        reportFile.write("\nSomething went wrong.\n\n")
##        reportFile.write("Pyton Traceback Message below:")
##        reportFile.write(traceback.format_exc())
##        reportFile.write("\nArcMap Error Messages below:")
##        reportFile.write(arcpy.GetMessages(2))
##        reportFile.write("\nArcMap Warning Messages below:")
##        reportFile.write(arcpy.GetMessages(1))
##
##        reportFile.write( "\n\nEnded at " + time.asctime() + '\n')
##        reportFile.write("\n---End of Log File---\n")
##
##        if reportFile:
##            reportFile.close()