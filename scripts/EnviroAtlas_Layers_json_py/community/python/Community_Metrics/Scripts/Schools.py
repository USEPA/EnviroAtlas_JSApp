#-----------------------------------------------------------------------------
# Name:     Schools.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/25/2017
#
# Purpose:  Creates the schools per block group demographic layers and the
#           schools with little green space per block group layers.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the Schools function.
#           The data needed to process this scripts is:
#               1. Land Cover/Green Space Binary (community)
#               2. HSIP Education Points (national)
#               3. Block Groups (community)
#-----------------------------------------------------------------------------

def Schools(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_EduPts.gdb')
    except:
        print 'Schools GDB already exists'
    workDir = str(workFld) + '/' + city + '_EduPts.gdb'
    arcpy.env.workspace = workDir

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

    """ Input Directory """
    inDir = str(inDir) + '/Input.gdb'

    """ Set Workspace Environments """
    arcpy.env.workspace = workDir
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """
        tmpName = city + '_EduLowGS_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')

    	try:
            loglist = sorted (f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_Reuse'))
            tmpName = loglist[-1]
        except:
            tmpName = city + '_Reuse_' + time.strftime('%Y%m%d_%H-%M')  + '.txt'
        reportfileName = reportfileDir + '/' + tmpName

        try:
			ReuseRF = open(reportfileName, 'a')
        except:
            ReuseRF = open(reportfileName, 'w')
            print 'Creating Reuse Log'

        """ Write out first line of report file """
        print 'Schools Start Time: ' + time.asctime()
        state = city[-2:]
        if state in ['CO', 'IL', 'KS', 'MT', 'NE', 'NH', 'OR', 'WA']:
            reportFile.write("Begin with 2011 HSIP (Homeland Security Infrastructure Program) point layers for public schools, and private schools where public and private schools have been merged into one K-12 layer. Also, begin with the 2014 HSIP day cares point layer.--201203--\n")
        else:
    	   reportFile.write("Begin with 2011 HSIP (Homeland Security Infrastructure Program) point layers for daycares, public schools, and private schools where public and private schools have been merged into one K-12 layer.--201203--\n")
    	reportFile.write("Use spatial join to add the Census Block Group GeoID of each school to the school's attribute record--201203--\n")

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'
    	"""-------- Prepare Daycare and K12 Points -------------------------------"""
        """ Clip the Daycare and K12 points to the city boundary """
        arcpy.Clip_analysis(inDir + '/Daycares', freqDir + '/Bnd_5km', 'Daycares_Alb')
        arcpy.Clip_analysis(inDir + '/K12', freqDir + '/Bnd_5km', 'K12_Alb')
        reportFile.write("Clip each point layer to the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Determine the Projection of the LC """
        descLC = arcpy.Describe(str(freqDir) + '/LC')

    	""" Project the Daycare and K12 points into the LC's projection """
        arcpy.Project_management('Daycares_Alb', 'Daycares', descLC.spatialReference)
        arcpy.Project_management('K12_Alb', 'K12', descLC.spatialReference)
        reportFile.write("Project each point layer into the projection of the land cover.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	"""-------- Prepare Land Cover -------------------------------------------"""
        """ Reclassify LC into Binary Green Space """
        if arcpy.Exists(str(freqDir) + '/GreenIO') == False:
            outReclass5 = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
            outReclass5.save(str(freqDir) + '/GreenIO')
            reportFile.write("Reclassify the 1-Meter EnviroAtlas Land Cover Classification for the EnviroAtlas community into Binary Green Space. REPLACE-GSE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("GreenIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        else:
            reportFile.write("Reclassify the 1-Meter EnviroAtlas Land Cover Classification for the EnviroAtlas community into Binary Green Space. REPLACE-GSE--GreenIO--" + '--\n')

    	""" Moving Window for Schools - Greenspace, Circle 100 Meters """
        outFocalStat1 = arcpy.sa.FocalStatistics(str(freqDir) + '/GreenIO', arcpy.sa.NbrCircle (100, 'CELL'),'SUM', 'NODATA')
        outFocalStat1.save('Gre_100C')
        reportFile.write("Run Focal Statistics on the Green Space Binary Raster with a circular window of 100 meters and statistics = SUM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Analyze Green Space at School Locations -------------------"""
    	""" Extract GS Values at Points """
        arcpy.sa.ExtractValuesToPoints('Daycares', 'Gre_100C', 'Day_Green', 'NONE', 'VALUE_ONLY')
        arcpy.sa.ExtractValuesToPoints('K12', 'Gre_100C', 'K12_Green', 'NONE', 'VALUE_ONLY')
        reportFile.write("Extract Values to Points from the focal statistics raster to both the Daycare and K12 points with Census Block Group GeoIDs and append values to the point file--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add Field to Point Layers """
        arcpy.AddField_management('Day_Green', 'Green_Pct', 'DOUBLE')
        arcpy.AddField_management('K12_Green', 'Green_Pct', 'DOUBLE')

        """ Calculate Percent Greenspce """
        arcpy.CalculateField_management('Day_Green', 'Green_Pct', 'float(!RASTERVALU!) /31417 *100', 'PYTHON_9.3')
        arcpy.CalculateField_management('K12_Green', 'Green_Pct', 'float(!RASTERVALU!) /31417 *100', 'PYTHON_9.3')
        reportFile.write("Add new field to each point layer: Green_Pct (float) and calculate where Green_Pct = RASTERVALU / 31417 * 100 (limited to 2 decimal places).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Count number of Schools per Block Group """
        arcpy.Statistics_analysis('Day_Green', 'Day_Num', [['CAPACITY', 'COUNT']], 'bgrp')
        arcpy.Statistics_analysis('K12_Green', 'K12_Num', [['ENROLLMENT', 'COUNT']], 'bgrp')

        """ Select low Greespace Schools and Count per Block Group """
        arcpy.Select_analysis('Day_Green', 'Day_Low', 'Green_Pct <= 25')
        arcpy.Statistics_analysis('Day_Low', 'Day_NumLow', [['CAPACITY', 'COUNT']], 'bgrp')

        arcpy.Select_analysis('K12_Green', 'K12_Low', 'Green_Pct <= 25')
        arcpy.Statistics_analysis('K12_Low', 'K12_NumLow', [['ENROLLMENT', 'COUNT']], 'bgrp')
        reportFile.write("From each point layer, select records with Green_Pct <= 25, then summarize the count of selected schools by block group.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create final table """
        arcpy.TableToTable_conversion(freqDir + '/BG', workDir, 'EduPts', '', 'bgrp')
        arcpy.DeleteField_management('EduPts', ['PLx2_Pop', 'PLx2_Pct', 'SUM_HOUSIN', 'SUM_POP10', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite', 'NonWt_Pct', 'Shape_Le_1', 'Shape_Area', 'Density', 'LandA_M', 'EAID', 'Dasy_Pop', 'State'])
        reportFile.write("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP field.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add fields to new table """
        arcpy.AddField_management('EduPts', 'Day_Count', 'DOUBLE')
        arcpy.AddField_management('EduPts', 'Day_Low', 'DOUBLE')
        arcpy.AddField_management('EduPts', 'K12_Count', 'DOUBLE')
        arcpy.AddField_management('EduPts', 'K12_Low', 'DOUBLE')
        reportFile.write("Add fields to the new table for K12_Count (short), K12_Low (short), Day_Count (short), and Day_Low (short).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join Each Table to the final table and calculate necessary records """
        arcpy.JoinField_management('EduPts', 'bgrp', 'Day_Num', 'bgrp', ['FREQUENCY'])
        arcpy.CalculateField_management('EduPts', 'Day_Count', '!FREQUENCY!', 'PYTHON')
        arcpy.DeleteField_management('EduPts', 'FREQUENCY')

        arcpy.JoinField_management('EduPts', 'bgrp', 'Day_NumLow', 'bgrp', ['FREQUENCY'])
        arcpy.CalculateField_management('EduPts', 'Day_Low', '!FREQUENCY!', 'PYTHON')
        arcpy.DeleteField_management('EduPts', 'FREQUENCY')

        arcpy.JoinField_management('EduPts', 'bgrp', 'K12_Num', 'bgrp', ['FREQUENCY'])
        arcpy.CalculateField_management('EduPts', 'K12_Count', '!FREQUENCY!', 'PYTHON')
        arcpy.DeleteField_management('EduPts', 'FREQUENCY')

        arcpy.JoinField_management('EduPts', 'bgrp', 'K12_NumLow', 'bgrp', ['FREQUENCY'])
        arcpy.CalculateField_management('EduPts', 'K12_Low', '!FREQUENCY!', 'PYTHON')
        arcpy.DeleteField_management('EduPts', 'FREQUENCY')
        reportFile.write("Join each of the summarized tables with the new table and calculate the corresponding field in the new table.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate NULL values, where applicable """
        arcpy.MakeTableView_management('EduPts', 'EduPtsTbl')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', 'Day_Count IS NULL')
        arcpy.CalculateField_management('EduPtsTbl', 'Day_Count', '0', 'PYTHON_9.3')
        arcpy.CalculateField_management('EduPtsTbl', 'Day_Low', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', 'Day_Low IS NULL')
        arcpy.CalculateField_management('EduPtsTbl', 'Day_Low', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', 'K12_Count IS NULL')
        arcpy.CalculateField_management('EduPtsTbl', 'K12_Count', '0', 'PYTHON_9.3')
        arcpy.CalculateField_management('EduPtsTbl', 'K12_Low', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', 'K12_Low IS NULL')
        arcpy.CalculateField_management('EduPtsTbl', 'K12_Low', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')
        reportFile.write("Calculate fields where K12_Count = 0: K12_Low = -99999 and Day_Count = 0: Day_Low = -99999--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Check that the Analysis Area is covered by the LC -------------- """
    	""" Create a Polygon Version of the LC """
        if arcpy.Exists(freqDir + '/LC_Poly') == False:
            arcpy.env.extent = freqDir + '/LC'
            arcpy.env.snapRaster = freqDir + '/LC'
            ReC = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
            ReC.save(str(freqDir) + '/AreaIO')
            arcpy.RasterToPolygon_conversion(str(freqDir) + '/AreaIO', str(freqDir) + '/LC_Poly', 'SIMPLIFY')
            arcpy.EliminatePolygonPart_management(str(freqDir) + '/LC_Poly', str(freqDir) + '/LC_Poly_EP', 'PERCENT', '', '5', 'CONTAINED_ONLY')
            arcpy.Delete_management(str(freqDir) + '/LC_Poly')
            arcpy.Rename_management(str(freqDir) + '/LC_Poly_EP', str(freqDir) + '/LC_Poly')

    	""" Buffer the LC Polygon by -500m """
        if arcpy.Exists(freqDir + '/Bnd_Cty_500m') == False:
            arcpy.Buffer_analysis(str(freqDir) + '/Bnd_Cty', str(freqDir) + '/Bnd_Cty_500m', '500 meters')
            arcpy.EliminatePolygonPart_management(str(freqDir) + '/Bnd_Cty_500m', str(freqDir) + '/Bnd_Cty_500m_EP', 'PERCENT', '', '30', 'CONTAINED_ONLY')
            arcpy.Delete_management(str(freqDir) + '/Bnd_Cty_500m')
            arcpy.Rename_management(str(freqDir) + '/Bnd_Cty_500m_EP', str(freqDir) + '/Bnd_Cty_500m')

    	""" Identify whether LC is large enough """
        arcpy.MakeFeatureLayer_management(str(freqDir) + '/LC_Poly', 'LClyr')
        arcpy.MakeFeatureLayer_management(str(freqDir) + '/Bnd_Cty_500m', 'BC_500lyr')

        arcpy.SelectLayerByLocation_management('BC_500lyr', 'COMPLETELY_WITHIN', 'LClyr', '', 'NEW_SELECTION')
        bigEnough = float(arcpy.GetCount_management('BC_500lyr').getOutput(0))
        arcpy.SelectLayerByAttribute_management('BC_500lyr', 'CLEAR_SELECTION')

    	""" If the LC isn't large enough, edit erroneous BGS """
        if bigEnough == 0:

            """ Identify BGs within 50m of the LC edge """
            arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus100', '-100 meters')
            arcpy.MakeFeatureLayer_management('LC_Poly_Minus100', 'Minus100')
            arcpy.MakeFeatureLayer_management('Day_Low', 'D_L')
            arcpy.MakeFeatureLayer_management('K12_Low', 'K_L')

            arcpy.SelectLayerByLocation_management('D_L', 'WITHIN', 'Minus100', '', 'NEW_SELECTION', 'INVERT')
            arcpy.SelectLayerByLocation_management('K_L', 'WITHIN', 'Minus100', '', 'NEW_SELECTION', 'INVERT')

            dValue = float(arcpy.GetCount_management('D_L').getOutput(0))
            kValue = float(arcpy.GetCount_management('K_L').getOutput(0))

            """ For all BGs too close to the LC edge, assign both fields a value of -99998 """
            if dValue > 0:
                bgrps = []
                cursor = arcpy.SearchCursor('D_L')
                for row in cursor:
                    value = row.getValue('bgrp')
                    bgrps.append(value)
                bgrps = list(set(bgrps))
                expression = ''
                for bgrp in bgrps:
                    expression = expression + " OR bgrp = '" + str(bgrp) + "'"
                expression = expression[4:]
                arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', expression)
                arcpy.CalculateField_management('EduPtsTbl', 'Day_Low', '-99998', 'PYTHON_9.3')
                arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')

            if kValue > 0:
                bgrps = []
                cursor = arcpy.SearchCursor('K_L')
                for row in cursor:
                    value = row.getValue('bgrp')
                    bgrps.append(value)
                bgrps = list(set(bgrps))
                expression = ''
                for bgrp in bgrps:
                    expression = expression + " OR bgrp = '" + str(bgrp) + "'"
                expression = expression[4:]
                arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'NEW_SELECTION', expression)
                arcpy.CalculateField_management('EduPtsTbl', 'K12_Low', '-99998', 'PYTHON_9.3')
                arcpy.SelectLayerByAttribute_management('EduPtsTbl', 'CLEAR_SELECTION')
            arcpy.SelectLayerByAttribute_management('D_L', 'CLEAR_SELECTION')
            arcpy.SelectLayerByAttribute_management('K_L', 'CLEAR_SELECTION')

            if kValue > 0 or dValue > 0:
				reportFile.write("Calculate Field for BGs within 50m of the edge of the land cover, All Fields = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create final table """
        arcpy.CopyRows_management('EduPtsTbl', 'EduLowGS')
        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_EduLowGS')
        except:
            pass
        arcpy.TableToTable_conversion('EduLowGS', finalDir, city + '_EduLowGS')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_EduLowGS')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'Day_Count', 'Day_Low', 'K12_Count', 'K12_Low']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_EduLowGS', [field])

        reportFile.write("Export the fields to be displayed in EnviroAtlas to a final gdb table: K12_Count, K12_Low, Day_Count, Day_Low.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'Schools End Time: ' + time.asctime() + '\n'

        #-------- COMPELETE LOGFILES ---------------------------------------------
        reportFile.close()
    	ReuseRF.close()

	#-----------------------------------------------------------------------------
    # END ANALYSIS
	#-----------------------------------------------------------------------------
    except:
        """ This part of the script executes if anything went wrong in the main script above """
        #-------- PRINT ERRORS ---------------------------------------------------
        print "\nSomething went wrong.\n\n"
        print "Python Traceback Message below:"
        print traceback.format_exc()
        print "\nArcMap Error Messages below:"
        print arcpy.GetMessages(2)
        print "\nArcMap Warning Messages below:"
        print arcpy.GetMessages(1)

        #-------- COMPLETE LOGFILE ------------------------------------------------
        reportFile.write("\nSomething went wrong.\n\n")
        reportFile.write("Pyton Traceback Message below:")
        reportFile.write(traceback.format_exc())
        reportFile.write("\nArcMap Error Messages below:")
        reportFile.write(arcpy.GetMessages(2))
        reportFile.write("\nArcMap Warning Messages below:")
        reportFile.write(arcpy.GetMessages(1))

        reportFile.write( "\n\nEnded at " + time.asctime() + '\n')
        reportFile.write("\n---End of Log File---\n")

        if reportFile:
            reportFile.close()

