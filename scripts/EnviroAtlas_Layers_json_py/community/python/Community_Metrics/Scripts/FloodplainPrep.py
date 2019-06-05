# -*- coding: utf-8 -*-
"""
Created on Fri May 05 13:49:49 2017
#---This script is modified from prepFEMAFloodHazardLayer.py---#
Purpose:
(1) Clip NFHL layer for the community and project the clipped layer to the same projection (Alb)
(2) Concatenate FLD_ZONE & ZONE_SUBTY (new field name: FLDSUBTY) to distinguish the FLD categories (see dictFEMA below)
(3) Assign the flood zones based on FLDSUBTY (dictFEMA)
(4) Union the block group boundary and flood layer boundary for calculation


Path needs to be set up:
(1) Path to National Flood Hazard Layer at the national level on LINE#78

Inputs:   FEMA NFHL data downloaded     by nationa from https://data.femadata.com/FIMA/Risk_MAP/NFHL/
                                        by state from https://msc.fema.gov/portal/advanceSearch
                                        by county from https://www.floodmaps.fema.gov/NFHL/status.shtml

@author: Wei-Lun Tsai
"""
#-----------------------------------------------------------------------------


#set up inDir to where the national flood layer is
def PrepFloodplain(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    from arcpy.sa import *
    arcpy.CheckOutExtension('Spatial')

    # VARIABLES-------------------------------------------------------------------
    # Set the Name for this report file
    script = 'PrepFloodplain'
    #holds the report files
    reportfileDir = str(workFld) + '/Logs'
    #holds the frequently used data
    freqDir = str(workFld) + '/' + str(city) + '_Freq.gdb'


    #Check if PrepFloodplain.gdb exists
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_Floodplain.gdb')
    except:
        print 'Floodplain GDB already exists'

    workGDB = str(workFld) + '/' + str(city) + '_Floodplain.gdb'

    #Set up geodatebase for Scratch if not existed
    try:
        arcpy.CreateFileGDB_management(str(workFld), '/Scratch.gdb')
    except:
        print 'Scratch GDB already exists'

    if not os.path.exists(reportfileDir):
        os.makedirs(reportfileDir)
    else:
        print "Logs folder already exists"

    #set workspace
    arcpy.env.workspace = workGDB
    arcpy.env.scratch = str(workFld) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    try:
        # LOGFILE CREATION
        #-------------------------------------------------------------------------
        # Create report file
        tmpName = city + '_' + script + '_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')
        #-------------------------------------------------------------------------

        # PROCESSING LAYERS
        #-------------------------------------------------------------------------
        #Prepare National Flood Hazard Layer (NFHL) for City
        #Path to Flood Hazard Layer for the entire nation
        fLDLayer = inDir + "/" + "Input.gdb/S_Fld_Haz_Ar"

        #Clip NFHL by community boundary
        #--Set up output file for clipped NFHL
        tempClipNFHL = workGDB + "/temp_" + city + "_NFHL"
        cityBG = freqDir + '/' + 'BG_Alb'
        arcpy.Clip_analysis(fLDLayer, cityBG, tempClipNFHL)
        reportFile.write("Clip NFHL layer by community boundary--" + city + "--"  + time.strftime('%Y%m%d--%H%M%S') + "--\n")
        print "Clip NFHL layer by community boundary---" + city + "---"  + time.strftime('%Y%m%d--%H%M%S')

        #--Project clipped NFHL to the same projection as boundary file
        cityNFHL = workGDB + "/" + city + "_NFHL"
        desc = arcpy.Describe(cityBG)
        arcpy.Project_management(tempClipNFHL, cityNFHL, desc.SpatialReference)
        reportFile.write("Project NFHL for--" + city + "--" + cityNFHL + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
        print "Project NFHL for--" + city + "--" + cityNFHL + "--" + time.strftime('%Y%m%d--%H%M%S')

        #--Clean up unsed fields for further processes
        arcpy.DeleteField_management(cityNFHL, ["DFIRM_ID", "VERSION_ID", "FLD_AR_ID", "STUDY_TYP", "SFHA_TF", "STATIC_BFE", "V_DATUM", "DEPTH", "LEN_UNIT", "VELOCITY", "VEL_UNIT", \
        "AR_REVERT", "AR_SUBTRV", "BFE_REVERT", "DEP_REVERT", "DUAL_ZONE", "SOURCE_CIT"])

        #Process attribute table of NFHL to identify flood hazard zones
        #--Concatenate FLD_ZONE & ZONE_SUBTY to identify flood hazard zones
        arcpy.AddField_management(cityNFHL, "FLDSUBTY", "TEXT", 80)
        expression="""!FLD_ZONE! + "_" + !ZONE_SUBTY!"""
        arcpy.CalculateField_management(cityNFHL, "FLDSUBTY", expression, "PYTHON_9.3")
        reportFile.write("Added field to concatenate FLD_ZONE & ZONE_SUBTY done--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
        print "Added field to concatenate FLD_ZONE & ZONE_SUBTY done--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

        #--UPDATED on 2017-05-22 Add codes to deal with nulls in ZONE_SUBTY--#
        #The national layer contains nulls in ZONE_SUBTY, not just empty fields
        arcpy.MakeTableView_management(cityNFHL, 'FP_Nulls')
        arcpy.SelectLayerByAttribute_management('FP_Nulls', 'NEW_SELECTION', 'ZONE_SUBTY IS NULL')
        arcpy.CalculateField_management('FP_Nulls', 'FLDSUBTY', '!FLD_ZONE! + "_ "', 'PYTHON_9.3')

        # IDENTIFY 1% and 0.2% FLOOD ZONES
        #-------------------------------------------------------------------------
        #Set up dictionary to define 1% or 0.2% annual flood hazard
        #All the concatenation of FLD_ZONE & ZONE_SUBTY were identified for the national flood hazard layer at the national level as of June 2017
        #New keys may need to be added if there is new coverage in the national layer
        dictFEMA = {
        '_ ': 'UNKNOWN',
        'A99_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'A_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AE_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AH_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AO_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'D_ ':'AREA OF UNDETERMINED FLOOD HAZARD',
        'V_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'VE_ ':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'A_1 PCT ANNUAL CHANCE FLOOD HAZARD CONTAINED IN CHANNEL': 'AREA OF MINIMAL FLOOD HAZARD',
        'A_ADMINISTRATIVE FLOODWAY':'REGULATORY FLOODWAY',
        'AE_1 PCT ANNUAL CHANCE FLOOD HAZARD CONTAINED IN CHANNEL':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AE_1 PCT ANNUAL CHANCE FLOOD HAZARD CONTAINED IN STRUCTURE':'1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AE_1 PCT CONTAINED IN STRUCTURE, FLOODWAY': 'REGULATORY FLOODWAY',
        'AE_1 PCT CONTAINED IN STRUCTURE, COMMUNITY ENCROACHMENT': 'REGULATORY FLOODWAY',
        'AE_ADMINISTRATIVE FLOODWAY':'ADMINISTRATIVE FLOODWAY',
        'AE_AREA OF SPECIAL CONSIDERATION':'SPECIAL FLOODWAY',
        'AE_COLORADO RIVER FLOODWAY':'SPECIAL FLOODWAY',
        'AE_AE': 'AREA OF MINIMAL FLOOD HAZARD',
        'AE_FLOODWAY':'REGULATORY FLOODWAY',
        'AE_FLOODWAY CONTAINED IN CHANNEL':'REGULATORY FLOODWAY',
        'AE_FLOODWAY CONTAINED IN STRUCTURE':'REGULATORY FLOODWAY',
        'AE_COMMUNITY ENCROACHMENT AREA': 'FLOODWAY',
        'AE_STATE ENCROACHMENT AREA': 'AREA OF MINIMAL FLOOD HAZARD',
        'AO_FLOODWAY': 'FLOODWAY',
        'NP_ ': 'UNKNOWN',
        'X_1 PCT FUTURE CONDITIONS, FLOODWAY':'FUTURE CONDITIONS 1PCT ANNUAL CHANCE FLOOD HAZARD',
        'AH_FLOODWAY':'FLOODWAY',
        'VE_RIVERINE FLOODWAY SHOWN IN COASTAL ZONE':'REGULATORY FLOODWAY',
        'X_0.2 PCT ANNUAL CHANCE FLOOD HAZARD':'0.2PCT ANNUAL CHANCE FLOOD HAZARD',
        'X_0.2 PCT ANNUAL CHANCE FLOOD HAZARD CONTAINED IN CHANNEL':'0.2PCT ANNUAL CHANCE FLOOD HAZARD',
        'X_0.2 PCT ANNUAL CHANCE FLOOD HAZARD CONTAINED IN STRUCTURE': 'AREA OF MINIMAL FLOOD HAZARD',
        'X_1 PCT DEPTH LESS THAN 1 FOOT':'OUTSIDE OF ANNUAL CHANCE FLOOD HAZARD',
        'X_AREA OF MINIMAL FLOOD HAZARD':'AREA OF MINIMAL FLOOD HAZARD',
        'X_AREA WITH REDUCED FLOOD RISK DUE TO LEVEE':'AREA WITH REDUCED RISK DUE TO LEVEE',
        'X_1 PCT DRAINAGE AREA LESS THAN 1 SQUARE MILE': 'AREA OF MINIMAL FLOOD HAZARD',
        'X_1 PCT FUTURE CONDITIONS':'FUTURE CONDITIONS 1PCT ANNUAL CHANCE FLOOD HAZARD',
        'X_1 PCT FUTURE CONDITIONS, COMMUNITY ENCROACHMENT': 'COMMUNITY ENCROACHMENT',
        'X_1 PCT CONTAINED IN STRUCTURE, COMMUNITY ENCROACHMENT': '1 PCT CONTAINED IN STRUCTURE, COMMUNITY ENCROACHMENT',
        'X_1 PCT CONTAINED IN STRUCTURE, FLOODWAY': '1 PCT CONTAINED IN STRUCTURE, FLOODWAY',
        'X_1 PCT FUTURE IN STRUCTURE, FLOODWAY': '1 PCT FUTURE IN STRUCTURE, FLOODWAY',
        'X_1 PCT FUTURE IN STRUCTURE, COMMUNITY ENCROACHMENT': '1 PCT FUTURE IN STRUCTURE, COMMUNITY ENCROACHMENT',
        'X_1 PCT FUTURE CONDITIONS CONTAINED IN STRUCTURE': 'AREA OF MINIMAL FLOOD HAZARD',
        'X_AREA OF SPECIAL CONSIDERATION': 'AREA OF SPECIAL CONSIDERATION',
        'AREA NOT INCLUDED_ ':'AREA NOT INCLUDED',
        'OPEN WATER_ ':'OPEN WATER'
        }

        #---UPDATE ON 2017-05-23: Added a filter for areas entirely without FEMA coverage---#
        if arcpy.management.GetCount(cityNFHL)[0] == "0":
            reportFile.write("No FEMA coverage--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "No FEMA coverage--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')
        else:
            #Add a field to assign flood zones
            #The max. length of FEMA value is 49 letters (incld. space)
            arcpy.AddField_management(cityNFHL, "FEMACat", "TEXT", 60)
            #Update FEMACat using cursors
            cursorFEMA = arcpy.UpdateCursor(cityNFHL)
            for rowFEMA in cursorFEMA:
                #Get KEY for dictFEMA
                dictKey = rowFEMA.getValue("FLDSUBTY")
                #Set up respective VALUE based on KEY from dictFEMA
                valueFEMA = dictFEMA.get(dictKey)
                #Update cursor
                rowFEMA.setValue("FEMACat", valueFEMA)
                cursorFEMA.updateRow(rowFEMA)
            del rowFEMA
            del cursorFEMA
            reportFile.write("Identify flood zones--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Identify flood zones--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            # UNION BOUNDARIES OF BLOCK GROUP AND CITY NFHL LAYER AS THE FINAL FLOOD LAYER FOR CALCUATION
            #-------------------------------------------------------------------------
            #Execute union fuction to combine community boundary and flood layer boundary
            unionFLDBG = workGDB + "/" + city + "_FLD_BG" #--Final community flood layer used for calculation
            arcpy.Union_analysis([cityBG, cityNFHL], unionFLDBG)
            reportFile.write("Combine community and flood layer boundaries--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Combine community and flood layer boundaries--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Add a field to get a unique id for flood zones in each BG by concatenating gbrp & FEMACat
            arcpy.AddField_management(unionFLDBG, "FEMABG", "TEXT", 100)
            arcpy.CalculateField_management(unionFLDBG, "FEMABG",  """!bgrp! + "_" + !FEMACat!""", "PYTHON_9.3")
            reportFile.write("Create a unique id for further calculation--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Create a unique id for further calculation--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Make a copy in the finalDir

            #Delete unnecessary fields
            arcpy.DeleteField_management(unionFLDBG, ['SUM_HOUSIN', 'SUM_POP10', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'NonWhite', 'NonWt_Pct', \
            'Black', 'Blackpct', 'PLx2_Pop', 'PLx2_Pct', 'MAX_SUM_HOUSIN', 'MAX_SUM_POP10', 'MAX_under_1', 'MIN_under_1pct', 'MAX_under_13', 'MIN_under_13pc', 'MAX_over_70', 'MAX_over_70pct', 'MIN_NonWhite', \
            'MEAN_NonWt_Pct', 'MAX_PLx2_Pop', 'MAX_PLx2_Pct', 'FIRST_State'])

            reportFile.write("Clean up unnecessary fields for final flood hazard layer for calculation--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Clean up unnecessary fields for final flood hazard layer for calculation--" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


        reportFile.write("Prepare flood layer--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n\n")
        print "Session done--Prepare flood layer--" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n"

        #-------------------------------------------------------------------------
        # COMPELETE LOGFILE
        # -------------------------------------------------------------------------
        reportFile.close()
        # -------------------------------------------------------------------------

    except:
        # This part of the script executes if anything went wrong in the main script above

        # PRINT ERRORS
        #-------------------------------------------------------------------------
        print "\nSomething went wrong.\n\n"
        print "Python Traceback Message below:"
        print traceback.format_exc()
        print "\nArcMap Error Messages below:"
        print arcpy.GetMessages(2)
        print "\nArcMap Warning Messages below:"
        print arcpy.GetMessages(1)
        #-------------------------------------------------------------------------


        # COMPLETE LOGFILE
        #-------------------------------------------------------------------------
        reportFile.write("\nSomething went wrong.\n\n")
        reportFile.write("Pyton Traceback Message below:")
        reportFile.write(traceback.format_exc())
        reportFile.write("\nArcMap Error Messages below:")
        reportFile.write(arcpy.GetMessages(2))
        reportFile.write("\nArcMap Warning Messages below:")
        reportFile.write(arcpy.GetMessages(1))

        reportFile.write( "\n\nEnded at " + time.asctime() + '\n')
        reportFile.write("\n--End of Log File--\n")

        if reportFile:
            reportFile.close()
        #-------------------------------------------------------------------------
##
####run for multiple commuities
##commList = ['CIL']
##for comm in commList:
##    PrepFloodplain(comm, "A:\\EnviroAtlas\\FEMA\\NFHLdata", "A:\\EnviroAtlas\\FEMA\\CommunityLandCover\\Z_" + comm)
