# -*- coding: utf-8 -*-
"""
Created on Mon May 08 08:17:59 2017
This script has to be run after running PrepFloodplian.py

Purpose:
(1) Summarize dasymetric pop. in 1% or 0.2% floodplain areas for each BG
(2) summarizes total area and percentage of impervious surfaces on 1PCT or 0.2PCT flood zones by BG for each community
This script is modifield to work with Ali's package

Path needs to be set up:
(1) Path to state boundary (entire US) (LINE#180)
(2) Path to Dasymetric population layer (LINE#216)
(3) Path to LCSum table with total LandA_M (LINE#477, should be in LC_Sum.gdb)
(4) inDir is set to PrepFloodplain.gdb (the PrepFloodplain script needs to run before this one)

----------
**READ ME before running the script**
For communities that have BGs mostly reside on water, it may have inaccurate "NoFEMACoverage" layer. (LINE#153 - #210).
Therefore, the final table may need to be manually corrected.
@author: Wei-Lun Tsai


----------
Updates on Nov.30, 2017 by Wei-Lun Tsai
(1) Statistics_analysis function is added to summarie total land area and Impervious area after TabulateArea

"""
#-----------------------------------------------------------------------------


#set up inDir to PrepFloodplain.gdb
def Floodplain(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    #from arcpy.sa import *
    arcpy.CheckOutExtension('Spatial')

# VARIABLES-------------------------------------------------------------------
    #sets script name for report file
    script = 'Floodplain'
    #holds the report files
    reportfileDir = str(workFld) + '\\Logs'
    #holds the frequently used data
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'

    if not os.path.exists(reportfileDir):
        os.makedirs(reportfileDir)
    else:
        print "Logs folder already exists"

    # Check if workDir exists
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_Floodplain.gdb')
    except:
        print 'Floodplain GDB already exists'

    workDir = str(workFld) + '/' + city + '_Floodplain.gdb'
    #holds the geodatabase for final data
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    #Set up geodatebase for Scratch if not existed
    try:
        arcpy.CreateFileGDB_management(str(workFld), '/Scratch.gdb')
    except:
        print 'Scratch GDB already exists'

    #set workspace
    arcpy.env.workspace = workDir
    arcpy.env.scratch = str(workFld) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    try:
        # LOGFILE CREATION
        #-------------------------------------------------------------------------
        # Create report file
        tmpName = city + '_' + script + '_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '\\' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')
		
		rf_fpprep_list = sorted(f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_Prep'))
		rf_fpprep = rf_fpprep_list[-1]
		fpprep = open(reportfileDir + '/' + rf_fpprep, 'r')
        lines = fpprep.readlines()
		for line in lines:
			if len(line) > 2:
				reportFile.write(line)
			else:
				pass
		fpprep.close()
        #-------------------------------------------------------------------------

        # PROCESSING LAYERS
        #-------------------------------------------------------------------------

        print 'Floodplain Start Time: ' + time.asctime()

        #Set Variables
        arcpy.env.extent = freqDir + "\\" + "LC"
        arcpy.env.snapRaster = freqDir + "\\" + "LC"

        #-------------------------------------------------------------------------
        #---UPDATE on 2017-05-23: Added a code to filter out those communities entirely without FEMA coverage---#
        #Path to flood hazard layer
        #---SET inDir to str(workFld) + '/' + str(city) + '_PrepFloodplain.gdb/'
        commFEMA = workDir + "/" + city + "_FLD_BG"
        #Path to community boundary
        commBndry = freqDir + '/' + 'BG_Alb'
        #path to NFHL layer for the community
        cityNFHL = workDir + "/" + city + "_NFHL"

        #Filter those communities without any FEMA coverage
        if arcpy.management.GetCount(cityNFHL)[0] == "0":

            reportFile.write("Totally No FEMA coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Totally No FEMA coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Generate final table
            arcpy.TableToTable_conversion(commBndry, finalDir, city + "_Floodplain")
            arcpy.DeleteField_management(finalDir + "/" + city + "_Floodplain", ['PopWithin', 'Include', 'State', 'Shape', 'FID_BG_Alb', 'SUM_HOUSIN', 'SUM_POP10', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'NonWhite', 'NonWt_Pct', \
            'Black', 'Blackpct', 'PLx2_Pop', 'PLx2_Pct', 'MAX_SUM_HOUSIN', 'MAX_SUM_POP10', 'MAX_under_1', 'MIN_under_1pct', 'MAX_under_13', 'MIN_under_13pc', 'MAX_over_70', 'MAX_over_70pct', 'MIN_NonWhite', \
            'MEAN_NonWt_Pct', 'MAX_PLx2_Pop', 'MAX_PLx2_Pct', 'FIRST_State', 'City', 'STATUS', 'FID_' + city +'_NFHL', 'FLD_ZONE', 'ZONE_SUBTY', 'GFID', 'FLDSUBTY', \
            'Shape_Length', 'Shape_Area', 'Shape_Leng', 'FEMABG'])
            reportFile.write("Start creating final table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
            print "Start creating final table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Add fields to final table for the communities without any FEMA coverage
            arcpy.MakeTableView_management(finalDir + "/" + city + "_Floodplain", 'NoFEMAFinal_tb')
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP1_Land_M', 'LONG')
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP1_Land_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP02_Land_M', 'LONG')
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP02_Land_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP1_Imp_M', 'LONG')
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP1_Imp_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP02_Imp_M', 'LONG')
            arcpy.AddField_management('NoFEMAFinal_tb', 'FP02_Imp_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', "FP1_Pop_C", 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', "FP1_Pop_P", 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', "FP02_Pop_C", 'FLOAT', 5, 2)
            arcpy.AddField_management('NoFEMAFinal_tb', "FP02_Pop_P", 'FLOAT', 5, 2)
            reportFile.write("Add fields for all 12 metrics -" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add fields for all 12 metrics -" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Land_M', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Land_P', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Land_M', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Land_P', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Imp_M', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Imp_P', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Imp_M', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Imp_P', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Pop_C', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP1_Pop_P', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Pop_C', -99997, 'PYTHON_9.3')
            arcpy.CalculateField_management('NoFEMAFinal_tb', 'FP02_Pop_P', -99997, 'PYTHON_9.3')
            reportFile.write("Assign -99997 to all the fields-" + city + "---" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign -99997 to all the fields-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            reportFile.write("Complete-People and Land Cover in floodplains-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "\n\n")
            print "Complete-People and Land Cover in floodplains-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "\n"
        else:
            #CREATE "NO FEMA COVERAGE" LAYER
            #-------------------------------------------------------------------------
            #Get polygon differences from floodplain layer and community boundary
            noFEMAAlb = workDir + "\\" + city + "_NoFEMA_Alb"   #Output path
            arcpy.Erase_analysis(commFEMA, cityNFHL, noFEMAAlb) #Execute ERASE function
            #No differences exist
            if arcpy.management.GetCount(noFEMAAlb)[0] == "0":
                reportFile.write("FEMA has full coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                print "FEMA has full coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')
            #Have differences. Then, add a filter to avoid counting slivers as no FEMA coverage
            else:
                reportFile.write("FEMA doesn't have full coverage or has slivers-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                print "FEMA doesn't have full coverage  or has slivers-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')
                #Path to community MULC
                inRast = freqDir + "\\" + "LC"
                #set up the projection
                descLC = arcpy.Describe(inRast) #should be UTM projection
                #set up output name for projection
                noFEMAUTM = workDir + "\\temp" + city + "_NoFEMA_UTM"

                 #---Update on June 9, 2017: Exculde the ocean part using state boundary
                #path to state boundary
                ##***NOTE: PME has 4 BGs mostly residing on ocean and therefore the table has to be corrected after calculation
                statebndry = inDir + '/Input.gdb/Counties_Alb'
                clipNoFEMA = workDir + "\\" + city + "_landNoFEMA"
                arcpy.Clip_analysis(noFEMAAlb, statebndry, clipNoFEMA)
                #Add selection to avoid slivers
                selectNoFEMA = workDir + "\\" + city + "_NoFEMA_UTM"

                arcpy.Project_management(clipNoFEMA, noFEMAUTM, descLC.SpatialReference)
                reportFile.write("Project no FEMA coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                print "Project no FEMA coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

                #define No FEMA as polygon area greater than
                #The min. thresholds for current communities as of June 2017 is 221027.105346
                #Exculde slivers by selecting shape area > 200000
                arcpy.Select_analysis(noFEMAUTM, selectNoFEMA, '"Shape_Area" > 200000')

                #check if selectNoFEMA has records or it's an empty layer
                #if selectNoFEMA has records (only have partial FEMA coverage)
                if arcpy.management.GetCount(selectNoFEMA)[0] == "0":
                    reportFile.write("FEMA has slivers but full coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                    print "FEMA has slivers but full coverage-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


                else:

                    #Add a field to identify BGs without FEMA coverage
                    arcpy.AddField_management(selectNoFEMA, "NoFEMABG", "TEXT", 15)
                    arcpy.CalculateField_management(selectNoFEMA, "NoFEMABG", '"{}"'.format("NoFEMACoverage"), "PYTHON_9.3")
                    arcpy.DeleteField_management(selectNoFEMA, ['SUM_HOUSIN', 'SUM_POP10', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'NonWhite', 'NonWt_Pct', \
                    'Black', 'Blackpct', 'PLx2_Pop', 'PLx2_Pct', 'MAX_SUM_HOUSIN', 'MAX_SUM_POP10', 'MAX_under_1', 'MIN_under_1pct', 'MAX_under_13', 'MIN_under_13pc', 'MAX_over_70', 'MAX_over_70pct', 'MIN_NonWhite', \
                    'MEAN_NonWt_Pct', 'MAX_PLx2_Pop', 'MAX_PLx2_Pct', 'FIRST_State', 'CITY', 'STATUS'])

                    reportFile.write("No FEMA coverage area (partial FEMA coverage) for-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                    print "No FEMA coverage area (partial FEMA coverage) for-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            #CALCULATE DASYMETRIC POPULATION
            #-------------------------------------------------------------------------
            #Path to dasymetric population raster
            #Dasy. pop is run on Alb projection

            dasyRast = inDir + '/Input.gdb/Dasy_10232015'  #The porjection should be Alb
            #Set up environment for snap raster to dasymetric population layer
            arcpy.env.SnapRaster = dasyRast
            #Path to output zonal table for flood zones by BG
            outDasyTab = workDir + "\\" + city + "_dasyFEMA"

            #Execute Zonal Stats for dasymetric population
            arcpy.sa.ZonalStatisticsAsTable(commFEMA, "FEMABG", dasyRast, outDasyTab, "#", "SUM")
            reportFile.write("Zonal stats as Table using FEMABG-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Zonal stats as Table using FEMABG-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Get total population by BG
            #Path to output zonal table for total population in BG
            outCommPop = workDir + "\\" + city + "_commPop"
            arcpy.sa.ZonalStatisticsAsTable(commBndry, "bgrp", dasyRast, outCommPop, "#", "SUM")
            reportFile.write("Zonal stats as Table for community total population-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Zonal stats as Table for community total population-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Add a field for zonal pop. in floodplains
            arcpy.AddField_management(outDasyTab, "FldPop", "FLOAT")
            reportFile.write("Add fields  for zonal FLD Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add fields  for zonal FLD Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Make tables for zonal pop. in floodplains & Calculate fields to change field name to fldPop to aviod confusion in later calculation
            arcpy.MakeTableView_management(outDasyTab, 'Dasy_tab')
            arcpy.CalculateField_management('Dasy_tab', "FldPop", '"%.2f" % (float(!SUM!)/1)', "PYTHON_9.3")
            reportFile.write("Calculate fields  for bgrp & FEMACat in zonal FLD Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Calculate fields  for bgrp & FEMACat in zonal FLD Dasy table-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')

            #Add field to community pop table to give another name for SUM
            arcpy.AddField_management(outCommPop, "TotalPop", "FLOAT")
            arcpy.MakeTableView_management(outCommPop, 'Pop_tab')
            arcpy.CalculateField_management('Pop_tab', "TotalPop", '"%.2f" % (float(!SUM!)/1)', "PYTHON_9.3")
            arcpy.DeleteField_management('Pop_tab', "SUM")
            reportFile.write("Calculate fields  for total Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Calculate fields  for total Dasy table-" + city + "------" + time.strftime('%Y%m%d--%H%M%S')

            #Add bgrp and FEMACat back for later use
            arcpy.AddField_management(outDasyTab, "bgrp", "TEXT", 12)
            arcpy.AddField_management(outDasyTab, "FEMACat", "TEXT", 60)
            arcpy.CalculateField_management(outDasyTab, "bgrp",'!FEMABG!.split("_")[0]', "PYTHON_9.3")
            arcpy.CalculateField_management(outDasyTab, "FEMACat",'!FEMABG!.split("_")[1]', "PYTHON_9.3")
            reportFile.write("Calculate bgrp & FEMACat for total Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Calculate bgrp & FEMACat for total Dasy table-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')


            #Select only 1% or 0.2% records
            dasy1PCT = workDir + "\\" + city + "_dasy1PCT"
            arcpy.TableSelect_analysis(outDasyTab, dasy1PCT, '"FEMACat" = \'1PCT ANNUAL CHANCE FLOOD HAZARD\'')
            dasy02PCT = workDir + "\\" + city + "_dasy02PCT"
            arcpy.TableSelect_analysis(outDasyTab, dasy02PCT, '"FEMACat" = \'0.2PCT ANNUAL CHANCE FLOOD HAZARD\'')
            reportFile.write("Create a final dasy table from community zonal dasy pop-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Create a final dasy table from community zonal dasy pop-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')

            dasyTableFinal = city + "_DasyFinal_tab"
            arcpy.TableToTable_conversion(outCommPop, workDir, dasyTableFinal)
            arcpy.DeleteField_management(dasyTableFinal, ['ZONE_CODE', 'COUNT', 'AREA'])
            arcpy.AddField_management(dasyTableFinal, "ZonalPop", "FLOAT")
            arcpy.AddField_management(dasyTableFinal, "temDasy1PCT", "FLOAT")
            arcpy.AddField_management(dasyTableFinal, "temDasy1PCT_P", "FLOAT")
            arcpy.AddField_management(dasyTableFinal, "temDasy02PCT", "FLOAT")
            arcpy.AddField_management(dasyTableFinal, "temDasy02PCT_P", "FLOAT")
            reportFile.write("Add temp dasy fields for total Dasy table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add temp dasy fields for total Dasy table-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')

            arcpy.MakeTableView_management(dasyTableFinal, 'DasyFinal_tab')
            arcpy.CalculateField_management('DasyFinal_tab', "ZonalPop",'!TotalPop!', "PYTHON_9.3")

            arcpy.JoinField_management('DasyFinal_tab', "bgrp", dasy1PCT, "bgrp", 'FldPop')
            arcpy.CalculateField_management('DasyFinal_tab', "temDasy1PCT", "!FldPop!", "PYTHON_9.3")
            arcpy.CalculateField_management('DasyFinal_tab', "temDasy1PCT_P", '"%.2f" % (float(!temDasy1PCT!)/float(!ZonalPop!)*100)', 'PYTHON_9.3')
            arcpy.DeleteField_management(dasyTableFinal, ['FldPop'])
            arcpy.JoinField_management('DasyFinal_tab', "bgrp", dasy02PCT, "bgrp", 'FldPop')
            arcpy.CalculateField_management('DasyFinal_tab', "temDasy02PCT", "!FldPop!", "PYTHON_9.3")
            arcpy.CalculateField_management('DasyFinal_tab', "temDasy02PCT_P", '"%.2f" % (float(!temDasy02PCT!)/float(!ZonalPop!)*100)', 'PYTHON_9.3')
            arcpy.DeleteField_management(dasyTableFinal, ['FldPop', 'TotalPop'])
            reportFile.write("Finish dasy final table in floodplains-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Finish dasy final table in floodplains-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')

            #CALCULATE LAND AREA & IMPERVIOUS SURFACE IN FLOODPLAINS
            #-------------------------------------------------------------------------
            #Extract the parts with 1% and/or 0.2% to run tabulate area
            #Land area & impervious is run on UTM projection
            arcpy.Select_analysis(commFEMA, city + "_FLDOnly", '"FEMACat" = \'1PCT ANNUAL CHANCE FLOOD HAZARD\' OR "FEMACat" = \'0.2PCT ANNUAL CHANCE FLOOD HAZARD\'')
            reportFile.write(city + "_FLDOnly_Alb layer made on " + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print city + "_FLDOnly_Alb layer made on " + time.strftime('%Y%m%d--%H%M%S')

            #obtain LC file to project the layer to grid's projection
            """Need to make sure the path to MULC"""
            inRast = freqDir + "\\" + "LC"
            #set up the projection
            descLC = arcpy.Describe(inRast)
            #Path to UTM projection flood hazard layer for community
            inFLD = workDir + "\\" + city + "_FLDOnly_UTM"

            arcpy.Project_management(workDir + "\\" + city + "_FLDOnly", inFLD, descLC.SpatialReference)
            reportFile.write("Project FLD layer for-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Project FLD layer for-" + city + "----" + time.strftime('%Y%m%d--%H%M%S')

            #set up snap raster
            arcpy.env.extent = inRast
            arcpy.env.SnapRaster = inRast

            #Convert FLD to raster
            fldRast =  inFLD + "_Rast"
            arcpy.AddField_management(inFLD, 'EAID', 'SHORT')
            arcpy.CalculateField_management(inFLD, "EAID", "autoIncrement()", "PYTHON_9.3", "rec=0\\ndef autoIncrement():\\n global rec\\n pStart = 1 #adjust start value, if req'd \\n pInterval = 1 #adjust interval value, if req'd\\n if (rec == 0): \\n  rec = pStart \\n else: \\n  rec = rec + pInterval \\n return rec")
            arcpy.PolygonToRaster_conversion(inFLD, "EAID", fldRast, 'MAXIMUM_Area', '', 1)
            reportFile.write("FLD convert to raster-" + city + "--" +  time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "FLD convert to raster-" + city + "--on--" +  time.strftime('%Y%m%d--%H%M%S')

            #Execuate tabluate area for flood layer
            #Path to output table
            outTable = workDir + "\\" + city + "_FEMALCtb"
            arcpy.sa.TabulateArea(fldRast, "VALUE", inRast, "VALUE", outTable, 1)
            reportFile.write(workDir + "\\" + city + "_tabulateArea+ --" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print workDir + "\\" + city + "_tabulateArea --" + time.strftime('%Y%m%d--%H%M%S')

            #add field to get bgrp id from the field FEMABG
            arcpy.AddField_management(outTable, 'bgrp', 'TEXT', 12)
            #add field to get FEMA type from the field FEMABG
            arcpy.AddField_management(outTable, 'FEMACat', 'TEXT', 60)
            #Link to original table
            arcpy.JoinField_management(outTable, "VALUE", inFLD, "EAID", "FEMABG")
            #get bgrp
            arcpy.CalculateField_management(outTable, 'FEMACat', '!FEMABG!.split("_")[1]', "PYTHON_9.3")
            #get FEMA type
            arcpy.CalculateField_management(outTable, 'bgrp', '!FEMABG!.split("_")[0]', "PYTHON_9.3")
            reportFile.write("Calculate fields  for bgrp & FEMACat in tabluate FLD LC table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Calculate fields  for bgrp & FEMACat in tabluate FLD LC table-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #CALCULATION FOR LAND AREA & IMPERVIOUS in FLOODPLAINS
            #-------------------------------------------------------------------------
            """Ali's LCSum code without Per Capita & Percent"""

            #Create fields for known land cover classes
            arcpy.AddField_management(outTable, 'Wat_M', 'LONG')
            arcpy.AddField_management(outTable, 'Imp_M', 'LONG')
            arcpy.AddField_management(outTable, 'SAB_M', 'LONG')
            arcpy.AddField_management(outTable, 'TAF_M', 'LONG')
            arcpy.AddField_management(outTable, 'GAH_M', 'LONG')
            arcpy.AddField_management(outTable, 'LandA_M', 'FLOAT', 15, 2)
            arcpy.AddField_management(outTable, 'MFor_M', 'LONG')
            arcpy.AddField_management(outTable, 'Green_M', 'LONG')

            #Calculate fields for known land cover classes
            arcpy.CalculateField_management(outTable, 'Wat_M', '!VALUE_10!', "PYTHON_9.3")
            arcpy.CalculateField_management(outTable, 'Imp_M', '!VALUE_20!', "PYTHON_9.3")
            arcpy.CalculateField_management(outTable, 'SAB_M', '!VALUE_30!', "PYTHON_9.3")
            arcpy.CalculateField_management(outTable, 'TAF_M', '!VALUE_40!', "PYTHON_9.3")
            arcpy.CalculateField_management(outTable, 'GAH_M', '!VALUE_70!', "PYTHON_9.3")
            #-------------------------------------------------------------------------

            #Create fields for questionable land cover classes
            listFields = arcpy.ListFields(outTable)

            A = False
            O = False
            S = False
            W = False
            Y = False #Add Y to filter code 92
            #Check/Calculate Shurbland
            for field in listFields:
                if field.name == 'VALUE_52':
                    S = True
                    arcpy.AddField_management(outTable, 'S_M', 'LONG')
                    arcpy.CalculateField_management(outTable, 'S_M', '!VALUE_52!', 'PYTHON')

            #Check/Calculate Agriculture
            for field in listFields:
                if field.name == 'VALUE_80':
                    A = True
                    arcpy.AddField_management(outTable, 'Ag_M', 'LONG')
                    for field in listFields:
                        if field.name == 'VALUE_82':
                            O = True
                            arcpy.CalculateField_management(outTable, 'Ag_M', '!VALUE_80! + !VALUE_82!', 'PYTHON')
                    if O <> True:
                        arcpy.CalculateField_management(outTable, 'Ag_M', '!VALUE_80!', 'PYTHON')

            #Check/Calculate Wetlands
            for field in listFields:
                if field.name == 'VALUE_91':
                    W = True
                    arcpy.AddField_management(outTable, 'WW_M', 'LONG')
                    arcpy.AddField_management(outTable, 'Wet_M', 'LONG')
                    for field in listFields:
                        if field.name == 'VALUE_92':
                            Y = True
                            arcpy.AddField_management(outTable, 'EW_M', 'LONG')
                            arcpy.CalculateField_management(outTable, 'EW_M', '!VALUE_92!', 'PYTHON')
                            arcpy.CalculateField_management(outTable, 'Wet_M', '!VALUE_91!+!VALUE_92!', 'PYTHON')
                    if Y <> True:
                        arcpy.CalculateField_management(outTable, 'Wet_M', '!VALUE_91!', 'PYTHON')
            #-------------------------------------------------------------------------
            #Calculate Land Area and Green Space Area
            if (A == True and S == True and W == True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!S_M!+!GAH_M!+!Ag_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!S_M!+!GAH_M!+!Ag_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!+!WW_M!', 'PYTHON')
            elif (A == True and S == True and W <> True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!S_M!+!GAH_M!+!Ag_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!S_M!+!GAH_M!+!Ag_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!', 'PYTHON')
            elif (A == True and S <> True and W == True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!GAH_M!+!Ag_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!GAH_M!+!Ag_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!+!WW_M!', 'PYTHON')
            elif (A <> True and S == True and W == True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!S_M!+!GAH_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!S_M!+!GAH_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!+!WW_M!', 'PYTHON')
            elif (A == True and S <> True and W <> True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!GAH_M!+!Ag_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!GAH_M!+!Ag_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!', 'PYTHON')
            elif (A <> True and S == True and W <> True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!S_M!+!GAH_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!S_M!+!GAH_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!', 'PYTHON')
            elif (A <> True and S <> True and W == True):
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!GAH_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!GAH_M!+!Wet_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!+!WW_M!', 'PYTHON')
            else:
                arcpy.CalculateField_management(outTable, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!GAH_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'Green_M', '!TAF_M!+!GAH_M!', 'PYTHON')
                arcpy.CalculateField_management(outTable, 'MFor_M', '!TAF_M!', 'PYTHON')
            reportFile.write("Area(m) calculations-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')+ "\n")
            print "Area(m) calculations-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            """CORRECT COUNTS USING PIVOT ON NOV 2017"""
            lc1PCT = workDir + "\\" + city + "_lc1PCT"
            arcpy.TableSelect_analysis(outTable, lc1PCT, '"FEMACat" = \'1PCT ANNUAL CHANCE FLOOD HAZARD\'')
            lc02PCT = workDir + "\\" + city + "_lc02PCT"
            arcpy.TableSelect_analysis(outTable, lc02PCT, '"FEMACat" = \'0.2PCT ANNUAL CHANCE FLOOD HAZARD\'')
            outPivot = workDir  + "\\" + city + "_Pivot_FLDImp"
            outPivotTotal = workDir + "\\" + city + "_Pivot_FLDTotal"

            outSumm1PCT = workDir + "\\" + city + "_FP1CPTSum"
            arcpy.Statistics_analysis (lc1PCT, outSumm1PCT, [['LandA_M', 'SUM'],['Imp_M', 'SUM']], 'bgrp')
            outSumm02PCT = workDir + "\\" + city + "_FP02CPTSum"
            arcpy.Statistics_analysis (lc02PCT, outSumm02PCT, [['LandA_M', 'SUM'],['Imp_M', 'SUM']], 'bgrp')
            # Replace a layer/table view name with a path to a dataset (which can be a layer file) or create the layer/table view within the script


            #add fields in pivot tables to distinguish impervious counts and total land area counts
            arcpy.AddField_management(outSumm1PCT, 'tempImp100_M', 'Long')
            arcpy.AddField_management(outSumm1PCT, 'tempLA100_M', 'Long')
            arcpy.AddField_management(outSumm02PCT, 'tempImp500_M', 'Long')
            arcpy.AddField_management(outSumm02PCT, 'tempLA500_M', 'Long')
            reportFile.write("Add fields in pivot tables-" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add fields in pivot tables-" + city + "---done " +time.strftime('%Y%m%d--%H%M%S')
            arcpy.CalculateField_management(outSumm1PCT, 'tempImp100_M', '!SUM_Imp_M!', 'PYTHON_9.3')
            arcpy.CalculateField_management(outSumm1PCT, 'tempLA100_M', '!SUM_LandA_M!', 'PYTHON_9.3')
            arcpy.CalculateField_management(outSumm02PCT, 'tempImp500_M', '!SUM_Imp_M!', 'PYTHON_9.3')
            arcpy.CalculateField_management(outSumm02PCT, 'tempLA500_M', '!SUM_LandA_M!', 'PYTHON_9.3')
            reportFile.write("Calculate fields in pivot tables-" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')


            #set up join table path
            """Need path to LCSum table"""
            inSumTable = workFld + "/" + city + "_LCSum.gdb/" + city + '_LCSum'
            outSumTable = city + "_LCSumforFLD"

            #Make a copy of LCSum
            arcpy.TableToTable_conversion(inSumTable, workDir , outSumTable)
            arcpy.DeleteField_management(outSumTable, ['VALUE', 'EAID', 'Ag_M', 'Ag_P', 'Ag_PC', 'WW_M', 'EW_M', 'Wet_M', 'Wat_M', 'SAB_M', 'TAF_M', 'GAH_M', 'MFor_M', 'MFor_P', 'Imp_P', 'Green_M', 'Green_P', 'Green_PC', 'MFor_PC', 'Imp_PC', 'WW_M', 'EW_M', 'S_M', 'Wet_P', 'SUM_POP10'])

            #Make table view for join function
            arcpy.MakeTableView_management(outSumTable, 'FLDLC_tb')
            #Add fields for impervious & total land area in 1PCT or 0.2PCT zones
            arcpy.AddField_management('FLDLC_tb', 'FP1_Land_M', 'LONG')
            arcpy.AddField_management('FLDLC_tb', 'FP1_Land_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', 'FP02_Land_M', 'LONG')
            arcpy.AddField_management('FLDLC_tb', 'FP02_Land_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', 'FP1_Imp_M', 'LONG')
            arcpy.AddField_management('FLDLC_tb', 'FP1_Imp_P', 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', 'FP02_Imp_M', 'LONG')
            arcpy.AddField_management('FLDLC_tb', 'FP02_Imp_P', 'FLOAT', 5, 2)
            reportFile.write("Add fields for impervious & total land area-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add fields for impervious & total land area-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')
            arcpy.AddField_management('FLDLC_tb', "FP1_Pop_C", 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', "FP1_Pop_P", 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', "FP02_Pop_C", 'FLOAT', 5, 2)
            arcpy.AddField_management('FLDLC_tb', "FP02_Pop_P", 'FLOAT', 5, 2)
            reportFile.write("Add fields for dasy pop-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Add fields for dasy pop-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            arcpy.JoinField_management('FLDLC_tb', "bgrp", outSumm1PCT, "bgrp", ['tempLA100_M', 'tempImp100_M'])
            #calcaulte total counts and percent impervious for 1PCT
            arcpy.CalculateField_management('FLDLC_tb', 'FP1_Land_M', '!tempLA100_M!', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "FP1_Land_M > 0")
            arcpy.CalculateField_management('FLDLC_tb', 'FP1_Land_P', '"%.2f" % (float(!tempLA100_M!)/float(!LandA_M!)*100)', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "FP1_Land_M = 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP1_Land_P", '0', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")

            arcpy.CalculateField_management('FLDLC_tb', 'FP1_Imp_M', '!tempImp100_M!', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "tempImp100_M > 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP1_Imp_P", '"%.2f" % (float(!tempImp100_M!)/float(!tempLA100_M!)*100)', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "tempImp100_M = 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP1_Imp_P", '0', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            reportFile.write("Total Land Counts and Percent for 1PCT-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Total Land Counts and Percent for 1PCT-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            arcpy.JoinField_management('FLDLC_tb', "bgrp", outSumm02PCT, "bgrp", ['tempLA500_M', 'tempImp500_M'])
            #calcaulte total counts and percent impervious for 0.2PCT
            arcpy.CalculateField_management('FLDLC_tb', 'FP02_Land_M', '!tempLA500_M!', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "FP02_Land_M > 0")
            arcpy.CalculateField_management('FLDLC_tb', 'FP02_Land_P', '"%.2f" % (float(!tempLA500_M!)/float(!LandA_M!)*100)', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "FP02_Land_M = 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP02_Land_P", '0', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")

            arcpy.CalculateField_management('FLDLC_tb', 'FP02_Imp_M', '!tempImp500_M!', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "tempImp500_M > 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP02_Imp_P", '"%.2f" % (float(!tempImp500_M!)/float(!tempLA500_M!)*100)', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "NEW_SELECTION", "tempImp500_M = 0")
            arcpy.CalculateField_management('FLDLC_tb', "FP02_Imp_P", '0', "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FLDLC_tb', "CLEAR_SELECTION")
            reportFile.write("Total Land Counts and Percent for 0.2PCT-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Total Land Counts and Percent for 0.2PCT-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            #Set up a temp table to clean unnecessary fields
            ##lcTable = city + '_FLDFinal'
            lcTable = city + '_FLDFinal_Nov17'
            arcpy.TableToTable_conversion('FLDLC_tb', workDir, lcTable)
            arcpy.DeleteField_management(lcTable, ['F0_2PCT_ANNUAL_CHANCE_FLOOD_HAZARD_1', 'F0_2PCT_ANNUAL_CHANCE_FLOOD_HAZARD', 'F1PCT_ANNUAL_CHANCE_FLOOD_HAZARD', 'F1PCT_ANNUAL_CHANCE_FLOOD_HAZARD_1', '1PCT ANNUAL CHANCE FLOOD HAZARD', '0.2PCT ANNUAL CHANCE FLOOD HAZARD', 'BGRP_1', 'EAID', 'BGRP_12'])
            reportFile.write("Impervious & Land TEMP table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Impervious & Land TEMP table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            # COMBINE PEOPLE & LAND COVER
            #-------------------------------------------------------------------------
            arcpy.JoinField_management(lcTable, "bgrp", workDir + "/" + dasyTableFinal , "bgrp", ['temDasy1PCT', 'temDasy1PCT_P', 'temDasy02PCT', 'temDasy02PCT_P'])
            #Calculate fields for dasy pop
            arcpy.CalculateField_management(lcTable, "FP1_Pop_C", '"%.2f" % (float(!temDasy1PCT!)/1)', "PYTHON_9.3")
            arcpy.CalculateField_management(lcTable, "FP1_Pop_P",  '"%.2f" % (float(!temDasy1PCT_P!)/1)', "PYTHON_9.3")

            arcpy.CalculateField_management(lcTable, "FP02_Pop_C", '"%.2f" % (float(!temDasy02PCT!)/1)', "PYTHON_9.3")
            arcpy.CalculateField_management(lcTable, "FP02_Pop_P", '"%.2f" % (float(!temDasy02PCT_P!)/1)', "PYTHON_9.3")
            reportFile.write("Calculate fields for dasy pop in land cover table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Calculate fields for dasy pop in land cover table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

            #Combine dasy & land cover tables
            ##tempTab = city + "_CombineDasyLC"
            tempTab = city + "_CombineDasyLC_Nov17"

            arcpy.TableToTable_conversion(lcTable, workDir, tempTab)
            arcpy.MakeTableView_management(tempTab, 'FEMA_tbl')
            #Assign 0 for No FLD Zone in Land Area #Land Area will never be -99999 according to Ali
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "NEW_SELECTION", "FP1_Land_M IS NULL")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Land_M', "0", "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Land_P', "0", "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 1 PCT Land Area as 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 1 PCT Land Area as 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "NEW_SELECTION", "FP02_Land_M IS NULL")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Land_M', "0", "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Land_P', "0", "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 02 PCT Land Area as 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 02 PCT Land Area as 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            #Assign -99999 for No FLD Zone in Impervious Surface
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "NEW_SELECTION", 'FP1_Imp_M IS NULL AND FP1_Land_M =0')
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Imp_M', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Imp_P', -99999, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 1 PCT Impervious as -99999 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 1 PCT Impervious as -99999 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "NEW_SELECTION", 'FP02_Imp_M IS NULL AND FP02_Land_M = 0')
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Imp_M', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Imp_P', -99999, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 02 PCT Impervious as -99999 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 02 PCT Impervious as -99999 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            #Assign -99999 fpr No FLD Zone for Dasy pop
            outCommPop = workDir + "\\" + city + "_commPop"
            arcpy.JoinField_management('FEMA_tbl', 'bgrp', outCommPop, 'bgrp', ['TotalPop'])
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', 'NEW_SELECTION', 'TotalPop = 0')
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_C', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_P', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_C', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_P', -99999, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 1 & 02 PCT Dasy Pop as -99999 when Total Dasy Pop = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 1 & 02 PCT Dasy Pop as -99999 when Total Dasy Pop = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', 'NEW_SELECTION', 'FP1_Land_M = 0')
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_C', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_P', -99999, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 1 PCT Dasy Pop as -99999 when FP1_Land_M = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 1 PCT Dasy Pop as -99999 when FP1_Land_M = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', 'NEW_SELECTION', 'FP02_Land_M = 0')
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_C', -99999, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_P', -99999, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 02 PCT Dasy Pop as -99999 when FP1_Land_M = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 02 PCT Dasy Pop as -99999 when FP1_Land_M = 0 -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', 'NEW_SELECTION', 'FP1_Pop_C IS NULL')
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_C', 0, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_P', 0, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 1 PCT Dasy Pop as 0 when FP1_Pop_C IS NULL -" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 1 PCT Dasy Pop as 0 when FP1_Pop_C IS NULL -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            arcpy.SelectLayerByAttribute_management('FEMA_tbl', 'NEW_SELECTION', 'FP02_Pop_C IS NULL')
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_C', 0, "PYTHON_9.3")
            arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_P', 0, "PYTHON_9.3")
            arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
            reportFile.write("Assign fields with null value for 02 PCT Dasy Pop as 0 when FP02_Pop_C IS NULL-" + city + "--" +time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Assign fields with null value for 02 PCT Dasy Pop as 0 when FP02_Pop_C IS NULL -" + city + "--" +time.strftime('%Y%m%d--%H%M%S')

            #Assign -99997 for No FEMA Coverage
            selectNoFEMA = workDir + "\\" + city + "_NoFEMA_UTM"
            commBndryUTM = freqDir + '\\BG'
            ##if arcpy.Exists(selectNoFEMA):
            if arcpy.management.GetCount(selectNoFEMA)[0] == "0":
                reportFile.write("No -99997 needed-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                print "No -99997 needed-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')
            else:
                 #---Updated on June 8, 2017: use spatial join to identiy BGs wihtout FEMA coverage
                #Assign no FEMA coverage to BGs using community boundary
                arcpy.MakeFeatureLayer_management(commBndryUTM, "bndry_lyr")
                arcpy.AddField_management("bndry_lyr", "NoFEMABG", "TEXT", 15)

                #Identify no FEMA coverage using Spatial Join
                arcpy.SelectLayerByLocation_management("bndry_lyr", 'HAVE_THEIR_CENTER_IN', selectNoFEMA)
                arcpy.CalculateField_management("bndry_lyr", "NoFEMABG", '"{}"'.format("NoFEMACoverage"), "PYTHON_9.3")

                arcpy.JoinField_management(tempTab, "bgrp", commBndryUTM, "bgrp", ['NoFEMABG'])
                #Assign -99997 for No FEMA Coverage
                arcpy.SelectLayerByAttribute_management('FEMA_tbl', "NEW_SELECTION", "NoFEMABG = 'NoFEMACoverage'")
                arcpy.CalculateField_management('FEMA_tbl', "FP1_Land_M", -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', "FP1_Land_P", -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', "FP02_Land_M", -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', "FP02_Land_P", -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP1_Imp_M', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP1_Imp_P', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP02_Imp_M', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP02_Imp_P', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_C', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP1_Pop_P', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_C', -99997, "PYTHON_9.3")
                arcpy.CalculateField_management('FEMA_tbl', 'FP02_Pop_P', -99997, "PYTHON_9.3")
                arcpy.SelectLayerByAttribute_management('FEMA_tbl', "CLEAR_SELECTION")
                reportFile.write("No FEMA Coverage assigned as -99997-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
                print "No FEMA Coverageassigned as -99997-" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            #final table for each community
            tempfinalTable = city + "_Floodplain"
            ##tempfinalTable = city + "_Floodplain_Nov17"
            arcpy.TableToTable_conversion('FEMA_tbl', workDir +"\\", tempfinalTable)

            #Add city name for QA
            arcpy.AddField_management(tempfinalTable, "CITY", "TEXT", 10)
            arcpy.CalculateField_management(tempfinalTable, "CITY", '"{}"'.format(city), "PYTHON_9.3")
            reportFile.write("Create floodplain QA table-" + city + "--" +  time.strftime('%Y%m%d_%H-%M') + "\n")
            print "Create floodplain QA table-" + city + "--" +  time.strftime('%Y%m%d_%H-%M')

            #delete unnecessary fields.
            arcpy.DeleteField_management(workDir +"\\" + tempfinalTable, ['tempImp100_M', 'tempImp500_M', 'tempLA_M', 'FEMACat', 'tempLA100_M', 'tempLA500_M', 'FEMACat', 'temDasy1PCT', 'temDasy1PCT_P', 'temDasy02PCT', 'temDasy02PCT_P'])
            reportFile.write("Final table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Final table -" + city + "--" + time.strftime('%Y%m%d--%H%M%S')


            #EXPORT TABLE to FINAL GDB
            #-------------------------------------------------------------------------
            ##finalTable = finalDir + "\\" + city + "_Floodplain"
            finalTable = finalDir + "\\" + city + "_Floodplain"
            arcpy.TableToTable_conversion(workDir +"\\" + tempfinalTable, finalDir + "\\", city + "_Floodplain")
            ##arcpy.TableToTable_conversion(workDir +"\\" + tempfinalTable, finalDir + "\\", city + "_Floodplain_Nov17")
            arcpy.DeleteField_management(finalTable, ['CITY', 'FEMACat', 'Imp_M', 'LandA_M','temDasy1PCT', 'temDasy1PCT_P', 'temDasy02PCT', 'temDasy02PCT_P', 'NoFEMABG', 'bgrp_1', 'TotalPop'])
            reportFile.write("Final People and Land Cover in Floodplains -" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + '\n')
            print "Final People and Land Cover in Floodplains -" + city + "--" + time.strftime('%Y%m%d--%H%M%S')

        reportFile.write("People and Land Cover in floodplains-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "--\n\n")
        print "Session Done--People and Land Cover in floodplains-" + city + "--" + time.strftime('%Y%m%d--%H%M%S') + "\n"


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

