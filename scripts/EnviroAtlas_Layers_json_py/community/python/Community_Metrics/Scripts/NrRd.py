#-----------------------------------------------------------------------------
# Name:     NrRd.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/27/2017
#
# Purpose:  Examines near-road tree cover including people living near road,
#           with and without 25% cover, creates a foundational polyline layer
#           describing tree cover along roads.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the Schools function.
#           The data needed to process this scripts is:
#               1. Land Cover/Forest Binary (community)
#               2. NavTeq_D (community, fill in empty RoadWidths)
#               3. Block Groups (community)
#               4. Boundary (community)
#
# Directions:
#           1.  Create NavTeq_D and fill in empty road widths according to
#               New Communities Procedures document.
#-----------------------------------------------------------------------------
def NrRd(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_NrRd.gdb')
    except:
        print 'NrRd GDB already exists'
    workDir = str(workFld) + '/' + city + '_NrRd.gdb'
    arcpy.env.workspace = workDir

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

    """ Input Roads Data """
    navDir = inDir + '/Input.gdb/Streets_1234_Alb'

    """ Set Workspace Environments """
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """
        tmpName = city + '_NrRd_Pop_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        popRF = open(reportfileName, 'w')

    	tmpName = city + '_NrRd_PFor_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        pctRF = open(reportfileName, 'w')

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
        print 'Near Road Start Time: ' + time.asctime()
        popRF.write("Begin with 2011 NavTeq Streets Layer and 1-Meter Land Cover Classification for the EnviroAtlas community created by the US EPA EnviroAtlas Team.--ANALYST-TIME--\n")
        pctRF.write("Begin with 2011 NavTeq Streets Layer and 1-Meter Land Cover Classification for the EnviroAtlas community created by the US EPA EnviroAtlas Team.--ANALYST-TIME--\n")

        popRF.write("Project NavTeq Streets layer into UTM.--ANALYST-TIME--\n")
        pctRF.write("Project NavTeq Streets layer into UTM.--ANALYST-TIME--\n")

        popRF.write("Clip NavTeq Streets Layer to 1-km Buffer of the EnviroAtlas community boundary.--ANALYST-TIME--\n")
    	pctRF.write("Clip NavTeq Streets Layer to 1-km Buffer of the EnviroAtlas community boundary.--ANALYST-TIME--\n")

    	popRF.write("Extract roads from NavTeq Streets where Func_Class = 1-4 to a new layer.--ANALYST-TIME--\n")
    	pctRF.write("Extract roads from NavTeq Streets where Func_Class = 1-4 to a new layer.--ANALYST-TIME--\n")

    	popRF.write("Add Field to the new streets layer: LANES (double) and calculate where LANES = TO_LANES + FROM_LANES.--ANALYST-TIME--\n")
    	pctRF.write("Add Field to the new streets layer: LANES (double) and calculate where LANES = TO_LANES + FROM_LANES.--ANALYST-TIME--\n")

    	popRF.write("For any records where LANES = 0, use Esri Aerial basemap to fill in correct lane value.--ANALYST-TIME--\n")
    	pctRF.write("For any records where LANES = 0, use Esri Aerial basemap to fill in correct lane value.--ANALYST-TIME--\n")

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'
    	Expression = 'Shape_Length <= 1050'

        """-------- Reclassify LC into Binary Forest ----------------------------- """
        if arcpy.Exists(str(freqDir) + '/MForestIO') == False:
            outReclass = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,0],[70,0],[80,0],[82,1],[91,1],[92,0]]))
            outReclass.save(str(freqDir) + '/MForestIO')
            popRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            popRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("MForestIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            popRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFE--MForestIO" + '--\n')
            pctRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFE--MForestIO" + '--\n')

    	"""-------- Create 29m Moving Window ------------------------------------- """
        outFocalStat = arcpy.sa.FocalStatistics(freqDir + '/MForestIO', arcpy.sa.NbrCircle (14.5, 'MAP'),'SUM', 'NODATA')
        outFocalStat.save('MFor_29C')
        popRF.write("Run Focal Statistics on the Forest Binary Raster with a circular cell neighborhood with a radius of 14.5m in map units--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Run Focal Statistics on the Forest Binary Raster with a circular cell neighborhood with a radius of 14.5m in map units--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Figure out the correct UTM Zone """
        prjNumb = arcpy.Describe(str(freqDir) + '/LC').spatialReference.name
        prjNumb = prjNumb[-3:]
        prjfile = prjDir + '/NAD 1983 UTM Zone ' + prjNumb + '.prj'

        """ -------- Create Road Buffer Lines ----------------------------------"""
    	""" Create Road Polygons """
        arcpy.CopyFeatures_management(str(inDir) + '/NavTeq_D.gdb/' + str(city) + '_NavTeq_D', 'NavTeq_D')
        arcpy.AddField_management('NavTeq_D', 'HalfWidth', 'DOUBLE')
        arcpy.CalculateField_management('NavTeq_D', 'HalfWidth', '!Width! / 2', 'PYTHON_9.3')
        popRF.write("Add Field to streets layer: HALFWIDTH (double) and calculate where HALFWIDTH = LANES * 3.6576 / 2.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Add Field to streets layer: HALFWIDTH (double) and calculate where HALFWIDTH = LANES * 3.6576 / 2.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Buffer_analysis('NavTeq_D', 'RoadEdge', 'HalfWidth', 'FULL', 'FLAT', 'ALL')
        arcpy.CalculateField_management('NavTeq_D', 'HalfWidth', '!Width! / 2', 'PYTHON_9.3')
        popRF.write("Buffer streets using the value in HALFWIDTH with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Buffer streets using the value in HALFWIDTH with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create road buffer """
        arcpy.Buffer_analysis('RoadEdge', 'RoadBuffer', '11.5 Meters', 'FULL', 'FLAT', 'ALL')
        popRF.write("Rebuffer the buffered streets by 11.5 meters with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Rebuffer the buffered streets by 11.5 meters with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert the buffer into lines """
        arcpy.PolygonToLine_management('RoadBuffer', 'RdBuffLine')
        popRF.write("Convert the resulting polygons into polylines - referred to as analysis lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Convert the resulting polygons into polylines - referred to as analysis lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Remove interior lines based on cut-off point """
        arcpy.MakeFeatureLayer_management('RdBuffLine', 'BuffLine_lyr')
        arcpy.SelectLayerByAttribute_management('BuffLine_lyr', 'NEW_SELECTION', Expression)
        arcpy.DeleteFeatures_management('BuffLine_lyr')
        arcpy.CopyFeatures_management('BuffLine_lyr', 'BuffLineUse')
        popRF.write("Delete analysis lines that are unnecessary for analysis, for example, lines in between two lanes of a divided highway and lines on the interior of a freeway ramp.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Delete analysis lines that are unnecessary for analysis, for example, lines in between two lanes of a divided highway and lines on the interior of a freeway ramp.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	"""-------- Calculate Forest Area -----------------------------"""
        """ Extract the tree values """
        outExtractByMask=arcpy.sa.ExtractByMask(workDir + '/MFor_29C', 'BuffLineUse')
        outExtractByMask.save('ForBuff')
        popRF.write("Extract the Focal Statistics Raster using the analysis lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        pctRF.write("Extract the Focal Statistics Raster using the analysis lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

		#-------- POPULATION ANALYSIS ---------------------------------------------

        """ Reclassify into sufficient and insufficent tree buffer. """
        outReclass2 = arcpy.sa.Reclassify('ForBuff', 'Value', arcpy.sa.RemapRange([[0,154,1],[155,620,2]]))
        outReclass2.save('ForBinary')
        popRF.write("Reclassify the extracted raster into above and below 25% tree cover: 0-154 = 1; 155-613 = 2.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create lines of sufficent and insufficient tree buffer """
        arcpy.RasterToPolygon_conversion('ForBinary', 'For_YN', 'NO_SIMPLIFY')
        popRF.write("Convert the reclassified raster into a polygon WITHOUT simplifying.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Intersect_analysis(['BuffLineUse', 'For_YN',freqDir + '/BG'], 'Line_YN')
        popRF.write("Intersect the analysis line with the polygons and the community block groups, splitting the analysis line into pieces of greater than and less than 25% tree cover within each block group.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.AddField_management('Line_YN', 'KMs', 'FLOAT')
        arcpy.CalculateField_management('Line_YN', 'KMs', '!shape.length@kilometers!', 'PYTHON_9.3')
        popRF.write("Add a new field to the analysis line: Length_KM (double) and calculate the geometry of the lines using length in kilometers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calcualte statistics on road lenghts """
        arcpy.Select_analysis('Line_YN', 'Line_Y', '"gridcode" = 2')
        arcpy.Statistics_analysis('Line_Y', 'KMpBG_Y', [['KMs', 'SUM']], [['bgrp']])
        arcpy.Select_analysis('Line_YN', 'Line_N', '"gridcode" = 1')
        arcpy.Statistics_analysis('Line_N', 'KMpBG_N', [['KMs', 'SUM']], [['bgrp']])
        popRF.write("Summarize the analysis line layer by block group and greater than vs less than 25% tree cover where the summary statistics is the sum of Length_KM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create full buffer of roads for popualtion counts """
        arcpy.Buffer_analysis('Line_YN', 'YN_289L', '288.5 Meters', 'LEFT', 'FLAT', 'ALL')
        arcpy.Buffer_analysis('Line_YN', 'YN_11R', '11.5 Meters', 'RIGHT', 'FLAT', 'ALL')
        arcpy.Buffer_analysis('Line_YN', 'YN_14L', '14.5 Meters', 'LEFT', 'FLAT', 'ALL')
        arcpy.Merge_management(['YN_289L', 'YN_11R'], 'YN_300')
        popRF.write("Buffer the analysis line twice: by 288.5m with LEFT, FLAT, ALL and by 11.5m with RIGHT, FLAT, ALL. Merge the two buffers together to create the population analysis zone.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create insufficient buffer area """
        arcpy.SplitLine_management('Line_N', 'Line_N_Split')
        arcpy.Buffer_analysis('Line_N_Split', 'N_289L_ND', '288.5 Meters', 'LEFT', 'FLAT', 'NONE')
        arcpy.Buffer_analysis('Line_N_Split', 'N_289L_D', '288.5 Meters', 'LEFT', 'FLAT', 'ALL')
        arcpy.Merge_management(['N_289L_D', 'N_289L_ND', 'YN_11R', 'YN_14L'], 'N_300_ND')
        arcpy.Dissolve_management('N_300_ND', 'N_300')
        popRF.write("Buffer the analysis line twice again: by 14.5m with LEFT, FLAT, ALL and by 11.5m with RIGHT, FLAT, ALL. Select the analysis line pieces with grid_code = 1 and buffer by 288.5m with LEFT, FLAT, ALL. Merge the three buffers together to identify areas of less than 25% tree cover.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create sufficient buffer area """
        arcpy.Erase_analysis('YN_300', 'N_300', 'BuffSuff')
        popRF.write("Erase the areas of less than 25% tree cover from the population analysis area to identify areas buffered by greater than 25% tree cover.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create real insufficient buffer area """
        arcpy.Erase_analysis('YN_300', 'BuffSuff', 'BuffInSuff')
        popRF.write("Clip the area buffered by less than 25% tree cover to the population analysis zone for consistency's sake.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert sufficient and insufficient areas into Albers and rasters """
        prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
        arcpy.Project_management('BuffInSuff', 'BuffInSuff_Alb', prjfile)
        arcpy.Project_management('BuffSuff', 'BuffSuff_Alb', prjfile)
        popRF.write("Project both the less than and greater than areas into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.AddField_management('BuffInSuff_Alb', 'InSuff', 'SHORT')
        arcpy.CalculateField_management('BuffInSuff_Alb', 'InSuff', '1', 'PYTHON_9.3')
        arcpy.AddField_management('BuffSuff_Alb', 'Suff', 'SHORT')
        arcpy.CalculateField_management('BuffSuff_Alb', 'Suff', '1', 'PYTHON_9.3')
        popRF.write("Add a field to each polygon layer: Value (short) and calculate where Value=1.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Set Environments """
        arcpy.env.snapRaster = freqDir + '/Dasy'
        arcpy.env.extent = freqDir + '/Dasy'

    	""" Convert Rasters to Polygons """
        arcpy.PolygonToRaster_conversion('BuffInSuff_Alb', 'InSuff', 'InSuff_R', 'Maximum_Area', '', 30)
        arcpy.PolygonToRaster_conversion('BuffSuff_Alb', 'Suff', 'Suff_R', 'Maximum_Area', '', 30)
        popRF.write("Convert each polygon layer into a raster. --" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Extract by Mask and Calculate Zonal Statistics for Insufficient and Sufficient Areas """
        for val in ('InSuff', 'Suff'):
            EbM = arcpy.sa.ExtractByMask(freqDir + '/Dasy', val + '_R')
            EbM.save(val + '_Pop')
            arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', val + '_Pop','Pop_' + str(val), 'DATA', 'SUM')
        popRF.write("Extract by Mask the EnviroAtlas Dasymetric (2011/October 2015) within each of the rasterized zones.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        popRF.write("Calculate Zonal Statistics as a Table for the two extracted dasymetric rasters with the zones being the 2010 block groups within the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Total Dasy Population, if necessary ------------------ """
        """ Use the existing data """
        fieldNames = [f.name for f in arcpy.ListFields(freqDir + '/BG_Alb')]
        if 'Dasy_Pop' in fieldNames:
            popRF.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop--Dasy_Pop" + '--\n')

            """ Create population data """
        else:
            arcpy.AddField_management(freqDir + '/BG_Alb', 'Dasy_Pop', 'LONG')
            arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy', freqDir + '/Dasy_ZS', '', 'SUM')
            arcpy.JoinField_management(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy_ZS', 'bgrp', ['SUM'])
            arcpy.CalculateField_management(freqDir + '/BG_Alb', 'Dasy_Pop', '!SUM!', 'PYTHON_9.3')
            arcpy.DeleteField_management(freqDir + '/BG_Alb', ['SUM'])
            arcpy.JoinField_management(freqDir + '/BG', 'bgrp',freqDir + '/BG_Alb', 'bgrp', ['Dasy_Pop'])
            popRF.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write('Dasy_Pop--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Create Final Table --------------------------------------------- """
        arcpy.TableToTable_conversion(freqDir + '/BG', workDir, 'NrRd_Pop', '', 'bgrp')
        arcpy.DeleteField_management('NrRd_Pop', ['NonWhite', 'PLx2_Pop', 'PLx2_Pct', 'SUM_HOUSIN', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite_Pop', 'NonWt_Pct', 'Density', 'Shape_Le_1', 'Shape_Area', 'Black', 'Blackpct', 'PopWithin', 'PctWithin', 'Include', 'City', 'Area', 'LandA_M', 'LandA_M_1', 'NonWhite_P', 'H_Income_M', 'State'])
        nrrdtbl = 'NrRd_Pop'
        popRF.write("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP and Dasy_Pop fields--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add fields to new table """
        arcpy.AddField_management(nrrdtbl, 'IBuff_Pop', 'LONG')
        arcpy.AddField_management(nrrdtbl, 'SBuff_Pop', 'LONG')
        arcpy.AddField_management(nrrdtbl, 'Buff_Pop', 'LONG')
        arcpy.AddField_management(nrrdtbl, 'IBuff_Pct', 'FLOAT', 5, 2)
        arcpy.AddField_management(nrrdtbl, 'SBuff_Pct', 'FLOAT', 5, 2)
        arcpy.AddField_management(nrrdtbl, 'Buff_Pct', 'FLOAT', 5, 2)
        arcpy.AddField_management(nrrdtbl, 'Lane_KMN', 'DOUBLE', 7, 2)
        arcpy.AddField_management(nrrdtbl, 'Lane_KMY', 'DOUBLE', 7, 2)
        arcpy.AddField_management(nrrdtbl, 'Lane_KMAll', 'DOUBLE', 7, 2)
        arcpy.AddField_management(nrrdtbl, 'Lane_PctSB', 'FLOAT', 5, 2)
        arcpy.AddField_management(nrrdtbl, 'Lane_PctIB', 'FLOAT', 5, 2)
        popRF.write("Add fields to the new table for IBuff_Pop (long), SBuff_Pop (long), Buff_Pop (long), IBuff_Pct (float), SBuff_Pct (float), Buff_Pct (float), Lane_KMN (double), Lane_KMY (double), Lane_KMAll (double), Lane_PctSB (float), Lane_PctIB (float).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join Each Table to the final table and calculate necessary records """
        arcpy.JoinField_management(nrrdtbl, 'bgrp', 'Pop_InSuff', 'bgrp', ['SUM'])
        arcpy.CalculateField_management(nrrdtbl, 'IBuff_Pop', '!SUM!', 'PYTHON_9.3')
        arcpy.DeleteField_management(nrrdtbl, 'SUM')

        arcpy.JoinField_management(nrrdtbl, 'bgrp', 'Pop_Suff', 'bgrp', ['SUM'])
        arcpy.CalculateField_management(nrrdtbl, 'SBuff_Pop', '!SUM!', 'PYTHON_9.3')
        arcpy.DeleteField_management(nrrdtbl, 'SUM')

        arcpy.JoinField_management(nrrdtbl, 'bgrp', 'KMpBG_N', 'bgrp', ['SUM_KMs'])
        arcpy.CalculateField_management(nrrdtbl, 'Lane_KMN', '!SUM_KMs!', 'PYTHON_9.3')
        arcpy.DeleteField_management(nrrdtbl, 'SUM_KMs')

        arcpy.JoinField_management(nrrdtbl, 'bgrp', 'KMpBG_Y', 'bgrp', ['SUM_KMs'])
        arcpy.CalculateField_management(nrrdtbl, 'Lane_KMY', '!SUM_KMs!', 'PYTHON_9.3')
        arcpy.DeleteField_management(nrrdtbl, 'SUM_KMs')
        popRF.write("Join the zonal statistics and length statistics tables with the new table and calculate IBuff_Pop, SBuff_Pop, Lane_KMN, Lane_KMY. Remove Joins.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Fill Null Values with Zeros """
        arcpy.MakeTableView_management(nrrdtbl, 'NrRdTbl')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'SBuff_Pop IS NULL')
        arcpy.CalculateField_management('NrRdTbl', 'SBuff_Pop', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'IBuff_Pop IS NULL')
        arcpy.CalculateField_management('NrRdTbl', 'IBuff_Pop', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Lane_KMN IS NULL')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_KMN', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Lane_KMY IS NULL')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_KMY', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'CLEAR_SELECTION')

        """ Calculate additional fields. """
        arcpy.CalculateField_management('NrRdTbl', 'Buff_Pop', '!IBuff_Pop! + !SBuff_Pop!', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_KMAll', '!Lane_KMN! + !Lane_KMY!', 'PYTHON_9.3')

        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Dasy_Pop > 0')
        arcpy.CalculateField_management('NrRdTbl', 'IBuff_Pct', '"%.2f" % (float(!IBuff_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'SBuff_Pct', '"%.2f" % (float(!SBuff_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Buff_Pct', '"%.2f" % (float(!Buff_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')

        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Lane_KMAll > 0')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_PctIB', '"%.2f" % (!Lane_KMN!/!Lane_KMAll! * 100)', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_PctSB', '"%.2f" % (!Lane_KMY!/!Lane_KMAll! * 100)', 'PYTHON_9.3')

        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Lane_KMAll = 0')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_PctIB', '0', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Lane_PctSB', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'CLEAR_SELECTION')
        popRF.write("Calculate remaining fields: Buff_Pop = IBuff_Pop + SBuff_Pop; IBuff_Pct = IBuff_Pop/Dasy_Pop*100; SBuff_Pct = SBuff_Pop/Dasy_Pop*100; Lane_KMAll = Lane_KMN + Lane_KMY; Lane_PctSB = Lane_KMY/Lane_KMAll*100; Lane_PctIB = Lane_KMN/Lane_KMAll*100. --" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Copy into Working Directory """
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', 'Dasy_Pop = 0')
        arcpy.CalculateField_management('NrRdTbl', 'IBuff_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'SBuff_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Buff_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'IBuff_Pop', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'SBuff_Pop', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('NrRdTbl', 'Buff_Pop', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('NrRdTbl', 'CLEAR_SELECTION')
        popRF.write("Calculate Fields where Dasy_Pop = 0: IBuff_Pop, SBuff_Pop, Buff_Pop, IBuff_Pct, SBuff_Pct, Buff_Pct = -99999--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	"""-------- Check that the Analysis Area is covered by the LC -------------- """
    	""" Create a Polygon Version of the LC """
        if arcpy.Exists(freqDir + '/LC_Poly') == False:
            ReC = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
            ReC.save(str(freqDir) + '/AreaIO')
            arcpy.RasterToPolygon_conversion(str(freqDir) + '/AreaIO', str(freqDir) + '/LC_Poly', 'SIMPLIFY')
            arcpy.EliminatePolygonPart_management(str(freqDir) + '/LC_Poly', str(freqDir) + '/LC_Poly_EP', 'PERCENT', '', '5', 'CONTAINED_ONLY')
            arcpy.Delete_management(str(freqDir) + '/LC_Poly')
            arcpy.Rename_management(str(freqDir) + '/LC_Poly_EP', str(freqDir) + '/LC_Poly')

    	""" Buffer the LC Polygon by -500m """
        if arcpy.Exists(freqDir + '/Bnd_Cty_500m') == False:
            arcpy.env.extent = freqDir + '/LC'
            arcpy.env.snapRaster = freqDir + '/LC'
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
            arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus15', '-15 meters')
            arcpy.MakeFeatureLayer_management('LC_Poly_Minus15', 'Minus15')
            arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG')

            arcpy.SelectLayerByLocation_management('BG', 'COMPLETELY_WITHIN', 'Minus15', '', 'NEW_SELECTION', 'INVERT')

            bgValue = float(arcpy.GetCount_management('BG').getOutput(0))

            """ For all BGs too close to the LC edge, assign both fields a value of -99998 """
            if bgValue > 0:
                bgrps = []
                cursor = arcpy.SearchCursor('BG')
                for row in cursor:
                    value = row.getValue('bgrp')
                    bgrps.append(value)
                bgrps = list(set(bgrps))
                expression = ''
                for bgrp in bgrps:
                    expression = expression + " OR bgrp = '" + str(bgrp) + "'"
                expression = expression[4:]
                arcpy.SelectLayerByAttribute_management('NrRdTbl', 'NEW_SELECTION', expression)
                for field in ['IBuff_Pct', 'SBuff_Pct', 'Buff_Pct', 'IBuff_Pop', 'SBuff_Pop', 'Buff_Pop', 'Lane_PctIB', 'Lane_PctSB']:
					arcpy.CalculateField_management('NrRdTbl', str(field), '-99998', 'PYTHON_9.3')
                arcpy.SelectLayerByAttribute_management('NrRdTbl', 'CLEAR_SELECTION')
                popRF.write("Calculate Field for BGs within 50m of the edge of the land cover, all fields = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create final table """
        arcpy.CopyRows_management('NrRdTbl', 'NrRd_Pop_Final')
        try:
            arcpy.Delete_management(finalDir + '/' + city + '_NrRd_Pop')
        except:
            pass
        arcpy.TableToTable_conversion('NrRd_Pop_Final', finalDir, city + '_NrRd_Pop')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_NrRd_Pop')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'IBuff_Pop', 'SBuff_Pop', 'Buff_Pop', 'Buff_Pct', 'Lane_PctSB', 'Lane_PctIB']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_NrRd_Pop', [field])
        popRF.write("Export the fields to be displayed in the EnviroAtlas to a final gdb table: IBuff_Pop, SBuff_Pop, Buff_Pop, Buff_Pct, Lane_PctSB, Lane_PctIB.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- FOUNDATIONAL LAYER ANALYSIS -----------------------------------

        """ Set Environments """
        arcpy.env.extent = workDir + '/MFor_29C'
        arcpy.env.snapRaster = workDir + '/MFor_29C'

        """-------- Reclassify Moving Window into Percentage Breaks ------------------- """
        outReclass2 = arcpy.sa.Reclassify('ForBuff', 'Value', arcpy.sa.RemapRange([[0,77,12],[78,154,25],[155,307,50],[308,460,75],[461,613,100]]))
        outReclass2.save('For_5Cls')
        pctRF.write("Reclassify the extracted raster into percentage classes: 0-77 = 12.5; 78-154 = 25; 155-307 = 50; 308-460 = 75; 461-613 = 100.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to polygon """
        arcpy.RasterToPolygon_conversion('For_5Cls', 'For_5Poly', 'NO_SIMPLIFY')
        pctRF.write("Convert the reclassified raster into a polygon WITHOUT simplifying.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join the Polygon with the Road Buffer lines """
        arcpy.Intersect_analysis(['BuffLineUse', 'For_5Poly'], 'Class5', 'ALL', '', 'LINE')
        pctRF.write("Intersect the analysis line with the polygons, splitting the analysis line into pieces representing each percentage class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Clip_analysis('Class5', freqDir + '/Bnd_Cty', 'Class5_Bnd')
        pctRF.write("Clip the analysis line to the EnviroAtlas community boundary and the county lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Dissolve_management('Class5_Bnd', 'Class5_D', 'gridcode')
        pctRF.write("Dissolve the analysis line based on the percentage classes.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.AddField_management('Class5_D', 'PctTree', 'FLOAT')
        codeblock = '''def CalPctTree(gc):
                if (gc == 12):
                    return "12.5"
                else:
                    return gc
                '''
        arcpy.CalculateField_management('Class5_D', 'PctTree', 'CalPctTree(!gridcode!)', 'PYTHON_9.3', codeblock)
        arcpy.DeleteField_management('Class5_D', ['gridcode'])
        pctRF.write("Add field to the analysis line: PctTree (float) and calculate where PctTree = gridcode--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')


    	""" If the LC isn't large enough, delete erroneous line segments """
        if bigEnough == 0:
            arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus_15', '15 meters')
            arcpy.Union_analysis([str(freqDir) + '/Bnd_Cty', 'LC_Poly_Minus_15'], 'LC_Minus_BndCty_Union_15', 'ONLY_FID')
            arcpy.Select_analysis('LC_Minus_BndCty_Union_15', 'EdgeAffectedArea_15', 'FID_Bnd_Cty > 0 AND FID_LC_Poly_Minus_15 = -1')

            arcpy.MakeFeatureLayer_management('Class5_D', 'Class5_lyr')
            arcpy.MakeFeatureLayer_management('EdgeAffectedArea_15', 'EEArea')
            arcpy.SelectLayerByLocation_management('Class5_lyr', 'INTERSECT', 'EEArea', '', 'NEW_SELECTION')
            arcpy.SelectLayerByAttribute_management('Class5_lyr', 'SWITCH_SELECTION')
            arcpy.CopyFeatures_management('Class5_lyr', 'NrRd_PFor_EdgeCorrected')
            arcpy.SelectLayerByAttribute_management('Class5_lyr', 'CLEAR_SELECTION')
            pctRF.write("Calculate Field for BGs within 50m of the edge of the land cover, all fields = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Project into Albers """
        prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
    	try:
			arcpy.Project_management('NrRd_PFor_EdgeCorrected', 'NrRd_PFor', prjfile)
        except:
			arcpy.Project_management('Class5_D', 'NrRd_PFor', prjfile)
        pctRF.write("Project the analysis line into Albers--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Create final feature class """
        try:
            arcpy.Delete_management(finalDir + '/' + city + '_NrRd_PFor')
        except:
            pass
        try:
            arcpy.FeatureClassToFeatureClass_conversion('NrRd_PFor_EdgeCorrected', finalDir, city + '_NrRd_PFor')
        except:
            arcpy.FeatureClassToFeatureClass_conversion('NrRd_PFor', finalDir, city + '_NrRd_PFor')
        pctRF.write("Export the analysis line to a geodatabase for display in EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'NrRd_PFor End Time: ' + time.asctime() + '\n'

        #-------- COMPELETE LOGFILES ---------------------------------------------
        pctRF.close()
    	popRF.close()
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
        pctRF.write("\nSomething went wrong.\n\n")
        pctRF.write("Pyton Traceback Message below:")
        pctRF.write(traceback.format_exc())
        pctRF.write("\nArcMap Error Messages below:")
        pctRF.write(arcpy.GetMessages(2))
        pctRF.write("\nArcMap Warning Messages below:")
        pctRF.write(arcpy.GetMessages(1))

        pctRF.write( "\n\nEnded at " + time.asctime() + '\n')
        pctRF.write("\n---End of Log File---\n")

        if pctRF:
            pctRF.close()
