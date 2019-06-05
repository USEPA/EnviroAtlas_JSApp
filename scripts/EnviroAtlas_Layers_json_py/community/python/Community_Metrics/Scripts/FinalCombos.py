#-----------------------------------------------------------------------------
# Name:     FinalCombos.py
#
# Author:   Ali Mackey
# Editor:   John Lovette
#
# Created:  05/09/2017
# Updated:  10/24/2017 -- to include Floodplain data from WLT
#
# Purpose:  Combine the community table data into one file then combine it with
#           the national community data.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the  function.
#           The data needed to process this scripts is:
#               1. All the final data tables and feature classes (community)
#               3. Block Groups (community)
#-----------------------------------------------------------------------------

cities = ['SLCUT']


inDir = 'E:/GIS/Input'

natFld = 'E:/GIS/CC_Symbol'

import traceback, time, arcpy, os
from arcpy import env

##def finalCombo(city, inDir, workFld, natFld='E:/GIS/CC_Symbol'):
for city in cities:
    """ Identify the City """
    #city = 'PNJ'

    """ Set the Directories """
    if city == 'CIL':
        workFld = 'F:/GIS/Cities/' + city
    elif city[0] < 'N':
        workFld = 'E:/GIS/Cities/' + city
    else:
        workFld = 'N:/GIS/Cities/' + city


    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'
    """ iTree Dirctory """
    iTreeDir = str(workFld) + '/' + city + '_iTree.gdb'
    """ BenMap Dirctory """
    benMapDir = str(workFld) + '/' + city + '_BenMap.gdb'
    """ Floodplain Directory """
    floodDir = str(workFld) + '/' + city + '_Floodplain.gdb'

    """ Set Workspace Environments """
    arcpy.env.workspace = finalDir
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True
    arcpy.env.extent = finalDir + '/' + city + '_BG'
    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
    #-----------------------------------------------------------------------------

    #-------- LOGFILE CREATION ---------------------------------------------
    """ Create report file for each metric """
    tmpName = city + '_Final_Combo_' + time.strftime('%Y%m%d_%H-%M')
    reportfileName = reportfileDir + '/' + tmpName  + '.txt'
    reportFile = open(reportfileName, 'w')

    """ Write out first line of report file """
    reportFile.write('Begin with the final tables the EnviroAtlas community.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Final Combination Start Time: ' + time.asctime()
    #-------------------------------------------------------------------------

    #-------- CREATE FINAL iTREE TABLE ---------------------------------------
    """ Copy Table to Final """
    if arcpy.Exists(iTreeDir + '/' + city + '_iTree') == False:
        print 'The iTree Table does not exist.'
        exit
    arcpy.CopyRows_management(iTreeDir + '/' + city + '_iTree', finalDir + '/' + city + '_iTree')

    """ Check and/or make MaxTempReduction Fields """
    # Current Fields
    alliTreeFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_iTree')]

    maxTempField = filter((lambda x: x.lower().startswith("maxtempreduction_")),alliTreeFields)
    maxTempNightField = filter((lambda x: x.lower().startswith("maxtempreductionnight_")),alliTreeFields)

    if maxTempField:
        print('Adding and calculating maxtempreduction and maxtempreductionnight fields...')
        arcpy.AddField_management(finalDir + '/' + city + '_iTree', 'maxtempreduction')
        arcpy.AddField_management(finalDir + '/' + city + '_iTree', 'maxtempreductionnight')
        arcpy.CalculateField_management(finalDir + '/' + city + '_iTree','maxtempreduction', '!' + str(maxTempField[0]) + '!', 'PYTHON_9.3')
        arcpy.CalculateField_management(finalDir + '/' + city + '_iTree','maxtempreductionnight', '!' + str(maxTempNightField[0]) + '!', 'PYTHON_9.3')
    else:
        pass

    alliTreeFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_iTree')]
    """ Collect Fields"""
    # Needed Fields
    neededTreeFields = ['COAQYr', 'NO2AQYr', 'O3AQYr', 'P10AQYr', 'P25AQYr', 'SO2AQYr', 'KGCSTOR', 'KGCSEQ', 'DOLCSTOR', 'DOLCSEQ', 'maxtempreductionnight', 'maxtempreduction', 'CORemoval', 'NO2Removal', 'O3Removal', 'PM25Remova', 'SO2Removal', 'PM10Remova', 'PM10Value', 'COValue', 'Change', 'Runoff', 'TSSmed', 'BODmed', 'CODmed', 'Tpmed', 'SolPmed', 'TKNmed', 'NO2_3med', 'Cumed', 'TSSmean', 'BODmean', 'CODmean', 'TPmean', 'SolPmean', 'TKNmean', 'NO23mean', 'Cumean', 'MTCSTOR', 'MTCSEQ']

    """ Check to see if any fields are missing """
    missingFields = []
    for field in neededTreeFields:
        if field in alliTreeFields:
            pass
        else:
            missingFields.append(field)

    """ If the field is incorrectly named, fix the name """
    if len(missingFields) > 0:
        for field in neededTreeFields:
            for fieldA in alliTreeFields:
                if field in missingFields:
                    if field.lower() == fieldA.lower():
                        missingFields.remove(field)
        if len(missingFields) <> 0:
            print 'An iTree field is acutally missing and not just misnamed.'
            exit()
        alliTreeFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_iTree')]

    ##""" If fields are still missing, end the analysis """
    ##for field in neededTreeFields:
    ##    if field not in alliTreeFields:
    ##        print field + ' still missing. Fix the problem and rerun.'
    ##        exit

    """ Delete unnecesary fields from the final table """
    neededTreeFieldsL = [f.lower() for f in neededTreeFields]
    for field in alliTreeFields:
        if field.lower() not in neededTreeFieldsL:
            if field == 'OBJECTID' or field == 'bgrp':
                pass
            else:
                try:
                    arcpy.DeleteField_management(finalDir + '/' + city + '_iTree', field)
                except:
                    print('Can not delete field: ' + str(field))
                    pass

    reportFile.write('Finished with iTree.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Finished with iTree: ' + time.asctime()

    #-------- CREATE FINAL BenMap TABLE --------------------------------------
    """ Copy Table to Final """
    if arcpy.Exists(benMapDir + '/' + city + '_BenMap') == False:
        print 'The BenMap Table does not exist.'
        exit
    arcpy.CopyRows_management(benMapDir + '/' + city + '_BenMap', finalDir + '/' + city + '_BenMap')

    """ Collect Fields"""
    # Current Fields
    allBMFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_BenMap')]
    # Needed Fields
    neededBMFields = ['NO2_Hospital_Admissions_V', 'NO2_Asthma_Exacerbation_I', 'NO2_Asthma_Exacerbation_V', 'O3_Acute_Respiratory_Symptoms_I', 'O3_Mortality_V', 'O3_School_Loss_Days_I', 'O3_School_Loss_Days_V', 'PM25_Acute_Respiratory_Symptoms_I', 'PM25_Mortality_V', 'PM25_Work_Loss_Days_I', 'PM25_Work_Loss_Days_V', 'SO2_Asthma_Exacerbation_I', 'SO2_Asthma_Exacerbation_V', 'SO2_Hospital_Admissions_V']

    """ Check to see if any fields are missing """
    missingFields = []
    for field in neededBMFields:
        if field in allBMFields:
            pass
        else:
            missingFields.append(field)

    """ If the field is incorrectly named, fix the name """
    if len(missingFields) > 0:
        for field in neededBMFields:
            for fieldA in allBMFields:
                if field in missingFields:
                    if field.lower() == fieldA.lower():
                        missingFields.remove(field)
        if len(missingFields) <> 0:
            print 'A BenMap field is acutally missing and not just misnamed.'
            exit
        allBMField = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_BenMap')]

    """ If fields are still missing, end the analysis """
    allBMFieldsL = [f.lower() for f in allBMFields]
    for field in neededBMFields:
        if field.lower() not in allBMFieldsL:
            print field + ' still missing. Fix the problem and rerun.'
            exit()

    """ Delete unnecesary fields from the final table """
    for field in allBMFields:
        if field not in neededBMFields:
            if field == 'OBJECTID' or field == 'bgrp':
                pass
            else:
                arcpy.DeleteField_management(finalDir + '/' + city + '_BenMap', field)

    reportFile.write('Finished with BenMap.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Finished with BenMap: ' + time.asctime()

    #-------- CREATE FINAL Floodplain TABLE --------------------------------------
    """ Copy Table to Final """
    ##try:
    ##  floodTable = str(floodDir) + '/' + city + '_Floodplain'
    ##  arcpy.MakeTableView_management(floodTable, 'allcomm_fp_lyr', "CommST = '" + str(city) + "'", floodDir)
    ##  arcpy.CopyRows_management('allcomm_fp_lyr', finalDir + '/' + city + '_Floodplain')
    ##except:
    ##    print 'The floodplain table does not exist or does not have Community codes associated with block groups.\nTry again.'
    ##    exit

    """ Collect Fields """
    # Current Fields
    allFPFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_Floodplain')]
    # Needed Fields
    neededFPFields = ['FP1_Land_M', 'FP1_Land_P', 'FP02_Land_M', 'FP02_Land_P', 'FP1_Imp_M', 'FP1_Imp_P', 'FP02_Imp_M', 'FP02_Imp_P', 'FP1_Pop_C', 'FP1_Pop_P', 'FP02_Pop_C', 'FP02_Pop_P']

    """ Check to see if any fields are missing """
    missingFields = []
    for field in neededFPFields:
        if field in allFPFields:
            pass
        else:
            missingFields.append(field)

    """ If the field is incorrectly named, fix the name """
    if len(missingFields) > 0:
        for field in neededFPFields:
            for fieldA in allFPFields:
                if field in missingFields:
                    if field.lower() == fieldA.lower():
                        missingFields.remove(field)
        if len(missingFields) <> 0:
            print 'A Floodplain field is acutally missing and not just misnamed.'
            exit
        allFPFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_Floodplain')]

    """ Delete unnecessary fields from the final table """
    neededFPFieldsL = [f.lower() for f in neededFPFields]
    for field in allFPFields:
        if field.lower() not in neededFPFieldsL:
            if field == 'OBJECTID' or field == 'bgrp':
                pass
            else:
                arcpy.DeleteField_management(finalDir + '/' + city + '_Floodplain', field)

    reportFile.write('Finished with Floodplain.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Finished with Floodplain: ' + time.asctime()

    #-------- COPY FINAL DRINKING WATER AND HISTORIC PLACES TABLES -----------
    try:
        arcpy.CopyRows_management(workFld + '/' + city + '_historical_places.gdb/' + city + '_historical_places', city + '_historical_places')
        arcpy.CopyRows_management(workFld + '/' + city + '_DWDemand.gdb/' + city + '_DWDemand', city + '_DWDemand')
    except:
        print 'Either Drinking Water Demand or Historical Places is missing. Please find and rerun.'

    #-------- CREATE FINAL Combined BG TABLE ---------------------------------
    """ Create the blank FC """
    arcpy.FeatureClassToFeatureClass_conversion(finalDir + '/' + city + '_BG', finalDir, city + '_BG_AllData')
    BGFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_BG_AllData')]
    for field in BGFields:
        if field not in ['bgrp']:
            try:
                arcpy.DeleteField_management(finalDir + '/' + city + '_BG_AllData', field)
            except:
                pass
        else:
            pass


    finalTbls = arcpy.ListTables()
    allTbls = [t for t in finalTbls]
    while len(allTbls) > 13:
        for t in allTbls:
            if str(t) not in [str(city + "_BenMap"), str(city + "_BG_Pop"),str(city + "_Floodplain"),str(city + "_DWDemand"),str(city + "_EduLowGS"),str(city + "_historical_places"),str(city + "_iTree"),str(city + "_LCSum"),str(city + "_NrRd_Pop"),str(city + "_Park_Pop"),str(city + "_RB_LC"),str(city + "_TreeWV"),str(city + "_WaterWV")]:
                allTbls.remove(t)
                print("Removed extraneous table: " + str(t))
            else:
                pass
    finalTbls = allTbls
    """ Add the fields for each final table """
    for i,tbl in enumerate(finalTbls,1):
        print("Joining table " + str(i) + " / 13: " + tbl)
        fields = [f.name for f in arcpy.ListFields(tbl)]
        try:
            fields.remove('bgrp')
        except:
            pass
        try:
            fields.remove('OBJECTID')
        except:
            pass
        try:
            fields.remove('CommST')
        except:
            pass
        try:
            fields.remove('Shape_Length')
        except:
            pass
        try:
            fields.remove('Shape_Area')
        except:
            pass
        try:
            fields.remove('IBuff_Pct')
            fields.remove('SBuff_Pct')
        except:
            pass
        arcpy.JoinField_management(city + '_BG_AllData', 'bgrp', tbl, 'bgrp', fields)
    commFinalTbl = city + '_BG_AllData'
    arcpy.AddField_management(commFinalTbl, 'GEOID10', 'TEXT')
    arcpy.CalculateField_management(commFinalTbl, 'GEOID10', '!bgrp!', 'PYTHON_9.3')
    arcpy.AddField_management(commFinalTbl, 'CommST', 'TEXT')
    arcpy.CalculateField_management(commFinalTbl, 'CommST', '"'+str(city)+'"', 'PYTHON_9.3')

    reportFile.write('Finished with Final Community Table.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Finished with Final Community Table: ' + time.asctime()

    """ Find the previous National Final Table """
    dirs = sorted([d for d in os.listdir(natFld) if os.path.isdir(os.path.join(natFld, d))])
    lastDir = dirs[-1]
    lastFinalTbl = natFld + '/' + lastDir + '/Full.gdb/CombComm_BG_Alb'
    lastFinalFields =[f.name for f in arcpy.ListFields(lastFinalTbl)]

    """ Make sure all the fields are there """
    commFinalFields = [f.name for f in arcpy.ListFields(commFinalTbl)]
    ##for field in ['Shape_Length_1', 'Shape_Area_1']:
    ##    try:
    ##        commFinalFields.remove(field)
    ##    except:
    ##        pass

    missFromFinal = []
    for field in commFinalFields:
        lastFinalFieldsL = [f.lower() for f in lastFinalFields]
        if field.lower() not in lastFinalFieldsL:
            missFromFinal.append(str(field))

    missFromComm = []
    for field in lastFinalFields:
        commFinalFieldsL = [f.lower() for f in commFinalFields]
        if field.lower() not in commFinalFieldsL:
            missFromComm.append(str(field))


    """ Check for land cover fields with Nulls, change to -888888s"""
    for field in missFromComm:
        if field in lastFinalFields:
            if field in ['Ag_M', 'Wet_M']:
                arcpy.AddField_management(commFinalTbl, field, "LONG")
                arcpy.CalculateField_management(commFinalTbl, field, "-888888", "PYTHON")
            if field in ['Ag_P', 'Wet_P']:
                arcpy.AddField_management(commFinalTbl, field, "FLOAT")
                arcpy.CalculateField_management(commFinalTbl, field, "-888888", "PYTHON")
            if field in ['Ag_PC']:
                arcpy.AddField_management(commFinalTbl, field, "DOUBLE")
                arcpy.CalculateField_management(commFinalTbl, field, "-888888", "PYTHON")

    ##for field in lastFinalFields:
    ##    if field not in commFinalFields:
    ##        print field + ' is not in the community table.'
    ##        """DOES THIS WORK???"""
    ##        arcpy.AddField_management(commFinalTbl, field, 'LONG')
    ##        arcpy.CalculateField_management(commFinalTbl, field, -888888, 'PYTHON_9.3')

    """ Create the new directory """
    #os.makedirs(str(natFld) + '/' + str(time.strftime('%Y%m%d')))
    dirs = sorted([d for d in os.listdir(natFld) if os.path.isdir(os.path.join(natFld, d))])
    newDir = dirs[-1]

    #arcpy.CreateFileGDB_management(natFld + '/' + newDir, 'Full.gdb')
    ##    for i in range(len(cities)):
    ##        if i < 10:
    ##            i1s = str('0' + str(i + 1))
    ##        else:
    ##            i1s = str(i+1)
    ##        newFinalTbl = natFld + '/' + newDir + '/Full.gdb/CombComm_BG_Alb' + str(i1s)
    newFinalTbl = natFld + '/' + newDir + '/Full.gdb/CombComm_BG_Alb1'

    """ Merge the Old National BGs with the New Community BGs """
    arcpy.env.extent = inDir + '/Input.gdb/Counties_Alb'
    arcpy.Merge_management([lastFinalTbl, city + '_BG_AllData'], newFinalTbl)
    #arcpy.FeatureClassToFeatureClass_conversion(newFinalTbl, natFld + '/' + newDir + '/Full.gdb', lastFinalTbl)



    reportFile.write('Finished with Final National Table.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    print 'Finished with Final National Table: ' + time.asctime()

    reportFile.close()

