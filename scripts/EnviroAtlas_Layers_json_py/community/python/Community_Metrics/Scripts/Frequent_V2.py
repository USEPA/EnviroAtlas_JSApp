#-----------------------------------------------------------------------------
# Name:     Frequent_V2.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/25/2017
#
# Purpose:  Sets up base data needed for many EnviroAtlas community component
#           processing scripts.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the freq function.
#           The data needed to process this scripts is:
#               1. Dasymetric (national)
#               2. Land Cover (community)
#               3. Block Groups (community - in Albers, with populations)
#               4. Counties (national)
#-----------------------------------------------------------------------------

def freq(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

    #-------- DIRECTORY SETUP ------------------------------------------------
    """ Report File Directory """
    try: os.makedirs(str(workFld) + '/Logs')
    except: pass
    reportfileDir = str(workFld) + '/Logs'

    """ Frequent Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_Freq.gdb')
    except:
        pass
    freqDir = str(workFld) + '/' + city + '_Freq.gdb'

    """ Current Workspace """
    workDir = freqDir

    """ Final Geodatabase """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_Final.gdb')
    except:
        pass
    finDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Dasymetric Directory """
    dasyDir = str(inDir) + '/Input.gdb/Dasy_10232015'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

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
        tmpName = city + '_BG__' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        BGRF = open(reportfileName, 'w')

        tmpName = city + '_BG_Pop_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        BG_PopRF = open(reportfileName, 'w')

        tmpName = city + '_Bnd_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        BndRF = open(reportfileName, 'w')

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


        """ Write out first lines of report files """
        print 'Frequent Start Time: ' + time.asctime()
        BGRF.write("Obtain 2010 Urban Areas Polygon File, 2000 Urban Areas Polygon File, 2010 Block Groups, and 2010 Blocks from the US Census Bureau along with associated population tables.--201203--\n")
        BGRF.write("Join the population tables with the associated blocks and block groups.--201203--\n")
        BGRF.write("Clip blocks to the 2010 Urban Area for the EnviroAtlas city.--201203--\n")
    	BGRF.write("Summarize the block population by block group in a new table; urban areas are defined using blocks, so this will determine the amount of people within each block group who are within the defined urban area.--201203--\n")
    	BGRF.write("Join the summarized block population table with the block groups polygon file.--201203--\n")
    	BGRF.write("Calculate the percentage of the block group population that is within the urban area: [summarized block population by block group]/[total block group population] * 100--201203--\n")
    	BGRF.write("Extract the block groups with greater than or equal to 50% of their population within the urban area to a new feature class.--201203--\n")
    	BGRF.write("Append all block groups to the new feature class that will fill in any holes in the community boundary.--201203--\n")
    	BGRF.write("Delete any block groups that only touch the main body of the community boundary at one corner or are islands set apart from the main body of the community boundary.--201203--\n")

    	BG_PopRF.write("Begin with EnviroAtlas community block groups.--201203--\n")
    	BG_PopRF.write("Append select census data from 2010 US Census SF1 Tables to block groups.--201203--\n")

    	BndRF.write("Begin with the EnviroAtlas Community Block Groups.--201203--\n")
    	BndRF.write("Dissolve all the EnviroAtlas Community Block Groups into one polygon.--201203--\n")

		#-------- COPY INPUT DATA --------------------------------------------
        """ Copy LC to Frequent if needed """
        if arcpy.Exists(str(workDir) + '/LC') == False:
            arcpy.CopyRaster_management(str(inDir) + '/LC/' + city + '_LC.tif', str(workDir) + '/LC', '', '', '', '', 'NONE', '', '', 'NONE')
        else:
            pass

        """ Set Environment Variables """
        arcpy.env.extent = 'LC'
        arcpy.env.snapRaster = 'LC'

        """ Copy BGs to Frequent if needed """
        if arcpy.Exists(str(workDir) + '/BG_Alb') == False:
            arcpy.FeatureClassToFeatureClass_conversion(str(inDir) + '/Bnd_Final.gdb/' + city + '_BG_Alb', str(workDir), 'BG_Alb')
            arcpy.DeleteField_management('BG_Alb', ['Include', 'PopWithin'])
        else:
            pass

        #-------- PROCESS BOUNDARIES -----------------------------------------
        """ Set Environment Variables """
        arcpy.env.extent = 'BG_Alb'
        arcpy.env.snapRaster = dasyDir

        """ Get Projection Information """
        descLC = arcpy.Describe(str(workDir) + '/LC')

        """ Project BG into UTM """
        arcpy.Project_management('BG_Alb', 'BG', descLC.spatialReference)

        """ Copy Counties to Frequent Dir and Project to UTM """
        arcpy.MakeFeatureLayer_management(str(inDir) + '/Input.gdb/Counties_Alb', 'Cty')
        arcpy.SelectLayerByLocation_management('Cty', 'CONTAINS', 'BG_Alb', '', 'NEW_SELECTION')
        arcpy.FeatureClassToFeatureClass_conversion(str(inDir) + '/Input.gdb/Counties_Alb', str(workDir), 'Counties_Alb')
        arcpy.SelectLayerByAttribute_management('Cty', 'CLEAR_SELECTION')
        arcpy.Project_management('Counties_Alb', 'Counties', descLC.spatialReference)

        """ Create Boundary and Buffer files """
        arcpy.Dissolve_management('BG_Alb', 'Bnd_Alb')
        arcpy.Dissolve_management('BG', 'Bnd')

        arcpy.Buffer_analysis('Bnd', 'Bnd_1km', '1 kilometer')
        arcpy.Buffer_analysis('Bnd', 'Bnd_5km', '5 kilometers')
        arcpy.Clip_analysis('Bnd', 'Counties', 'Bnd_Cty')
        arcpy.Buffer_analysis('Bnd_Cty', 'Bnd_Cty_500m', '500 meters')
        ReuseRF.write("Bnd_Cty--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Remove Holes from Buffer files """
        for buf in ('Bnd_1km', 'Bnd_5km', 'Bnd_Cty_500m'):
            arcpy.EliminatePolygonPart_management(buf, buf + '_EP', 'PERCENT', '', '30', 'CONTAINED_ONLY')
            arcpy.Delete_management(buf)
            arcpy.Rename_management(buf + '_EP', buf)

		#-------- MANIPULATE RASTER INPUTS -------------------------------------------
        """ Set Environment Variables """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """ Create a polygon version of the LC Area """
        ReC = arcpy.sa.Reclassify(str(workDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
        ReC.save('AreaIO')
        arcpy.RasterToPolygon_conversion(str(freqDir) + '/AreaIO', str(freqDir) + '/LC_Poly', 'SIMPLIFY')
        arcpy.EliminatePolygonPart_management(str(freqDir) + '/LC_Poly', str(freqDir) + '/LC_Poly_EP', 'PERCENT', '', '5', 'CONTAINED_ONLY')
        arcpy.Delete_management(str(freqDir) + '/LC_Poly')
        arcpy.Rename_management(str(freqDir) + '/LC_Poly_EP', str(freqDir) + '/LC_Poly')

        """ Set Environments """
        arcpy.env.extent = 'BG_Alb'
        arcpy.env.snapRaster = dasyDir

        """ Extract the dasymetrics for the Atlas Area """
        arcpy.env.extent = 'Bnd_Alb'
        outExtractByMask = arcpy.sa.ExtractByMask(dasyDir, 'Bnd_Alb')
        outExtractByMask.save('Dasy')
        ReuseRF.write("Dasy--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create a raster with the same cells as the dasymetric but unique values """
        arcpy.RasterToPoint_conversion('Dasy', 'Dasy_Pts', 'VALUE')
        arcpy.PointToRaster_conversion('Dasy_Pts', 'pointid', 'Dasy_Cells', '', '', '30')
        ReuseRF.write("Dasy_Cells--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate Dasy_Pop """
        arcpy.sa.ZonalStatisticsAsTable('BG_Alb', 'bgrp', 'Dasy', 'Dasy_ZS', '', 'SUM')
        arcpy.AddField_management('BG_Alb', 'Dasy_Pop', 'LONG')
        arcpy.JoinField_management('BG_Alb', 'bgrp', 'Dasy_ZS', 'bgrp', ['SUM'])
        arcpy.CalculateField_management('BG_Alb', 'Dasy_Pop', '!SUM!', 'PYTHON_9.3')
        arcpy.DeleteField_management('BG_Alb', ['SUM'])
        arcpy.JoinField_management('BG', 'bgrp', 'BG_Alb', 'bgrp', ['Dasy_Pop'])
        ReuseRF.write("Dasy_Pop--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add Field to BG to use as the value for rasterization """
        arcpy.AddField_management('BG', 'EAID', 'SHORT')
        arcpy.CalculateField_management("BG", "EAID", "autoIncrement()", "PYTHON_9.3", "rec=0\\ndef autoIncrement():\\n global rec\\n pStart = 1 #adjust start value, if req'd \\n pInterval = 1 #adjust interval value, if req'd\\n if (rec == 0): \\n  rec = pStart \\n else: \\n  rec = rec + pInterval \\n return rec")

        """ Convert the block groups into raster format """
        arcpy.env.snapRaster = 'LC'
        arcpy.env.extent = 'LC'
        arcpy.PolygonToRaster_conversion('BG', 'EAID', 'BG_Rlc', 'MAXIMUM_AREA', '', 1)
        ReuseRF.write("BG_Rlc--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- CREATE FINAL FILES ----------------------------------------------
    	""" Create Final BG File """
        try:
            arcpy.Delete_management(finDir + '/' + str(city) + '_BG')
        except:
            pass
        arcpy.FeatureClassToFeatureClass_conversion('BG_Alb', finDir, city + '_BG')
        allFields = [f.name for f in arcpy.ListFields(finDir + '/' + city + '_BG')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'Shape', 'Shape_Area', 'Shape_Length']:
                arcpy.DeleteField_management(finDir + '/' + city + '_BG', [field])
        BGRF.write("Create a final version of the feature class for use in EnviroAtlas, removing all unnecessary attributes.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Create Final Bnd File """
        try:
            arcpy.Delete_management(finDir + '/' + str(city) + '_Bnd')
        except:
            pass
        arcpy.FeatureClassToFeatureClass_conversion('Bnd_Alb', finDir, city + '_Bnd')
        BndRF.write("Copy polygon to final geodatabase for display in EnviroAtlas removing any unnecessary attributes.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Create Final BG_Pop File """
        try:
            arcpy.Delete_management(finDir + '/' + str(city) + '_BG_Pop')
        except:
            pass

        arcpy.TableToTable_conversion('BG', finDir, city + '_BG_Pop')
        allFields = [f.name for f in arcpy.ListFields(finDir + '/' + city + '_BG_Pop')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'SUM_HOUSIN', 'SUM_POP10', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'NonWhite', 'NonWt_Pct', 'PLx2_Pop', 'PLx2_Pct']:
                arcpy.DeleteField_management(finDir + '/' + city + '_BG_Pop', [field])
        BG_PopRF.write("Copy records to final table for display in EnviroAtlas, removing any unnecessary attributes.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'Frequent End Time: ' + time.asctime() + '\n'

        #-------- COMPELETE LOGFILES ---------------------------------------------

        BGRF.close()
    	BndRF.close()
    	BG_PopRF.close()
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
        BGRF.write("\nSomething went wrong.\n\n")
        BGRF.write("Pyton Traceback Message below:")
        BGRF.write(traceback.format_exc())
        BGRF.write("\nArcMap Error Messages below:")
        BGRF.write(arcpy.GetMessages(2))
        BGRF.write("\nArcMap Warning Messages below:")
        BGRF.write(arcpy.GetMessages(1))

        BGRF.write( "\n\nEnded at " + time.asctime() + '\n')
        BGRF.write("\n---End of Log File---\n")

        if BGRF:
            BGRF.close()

