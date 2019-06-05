#-----------------------------------------------------------------------------
# Name:     WaterViews.py
#
# Author:   Ali Mackey
#
# Created:  06/05/2014
# Updated:  04/25/2017
#
# Purpose:  Calculates the population within 50m of a water body that is at
#           least 300m2 in area.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the WVW function.
#           The data needed to process this scripts is:
#               1. Land Cover/Water Binary (community)
#               3. Block Groups (community)
#-----------------------------------------------------------------------------
def WVW(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

    #-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_WaterWV.gdb')
    except:
        print 'WaterWV GDB already exists'
    workDir = str(workFld) + '/' + city + '_WaterWV.gdb'
    arcpy.env.workspace = workDir

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'
    prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'

    """ Split Raster Directory """
    if os.path.isdir(str(workFld) + '/' + city + '_Split') == True:
        pass
    else:
        os.makedirs(str(workFld) + '/' + city + '_Split')
    splitDir = str(workFld) + '/' + city + '_Split'

    """ Set Workspace Environments """
    arcpy.env.workspace = workDir
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    print("Directory and Environment set-up complete...--" + time.strftime('%Y%m%d--%H%M%S'))

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """
        tmpName = city + '_WaterWV_' + time.strftime('%Y%m%d_%H-%M')
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
        print 'Water Views Start Time: ' + time.asctime()
        reportFile.write("Begin with EnviroAtlas 1-meter Land Cover for the EnviroAtlas community--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.snapRaster = freqDir + '/LC'
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.overwriteOutput = True

    	"""-------- Reclassify LC into Binary Water ----------------------------- """
        if arcpy.Exists(str(freqDir) + '/WaterIO') == False:
            outReclass = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,0],[21,0],[22,0],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
            outReclass.save(str(freqDir) + '/WaterIO')
            print("Reclassify to water binary complete...--" + time.strftime('%Y%m%d--%H%M%S'))
            reportFile.write("Reclassify the Land Cover into a Water binary. (Water - 10 = 1; All Else = 0).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("WaterIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            print("Reclassify to water previously completed...--" + time.strftime('%Y%m%d--%H%M%S'))
            reportFile.write("Reclassify the Land Cover into a Water binary. (Water - 10 = 1; All Else = 0).--WaterIO" + '--\n')

        """-------- Create the Water Bodies Raster ------------------ """
        """ Create the Water Region Group """
        if arcpy.Exists('WatIO_300') == False:
            RG = arcpy.sa.RegionGroup(freqDir + '/WaterIO', 'EIGHT', 'WITHIN', 'ADD_LINK')
            RG.save('WatIO_300')
            arcpy.AddField_management('WatIO_300', 'Count_2', 'DOUBLE')
            arcpy.CalculateField_management('WatIO_300', 'Count_2', '!COUNT!', 'PYTHON')
            print("Water region groups created...--" + time.strftime('%Y%m%d--%H%M%S'))
            reportFile.write("Run the region group tool to group waterbodies together with options number of neighbors to use: EIGHT, zone grouping method: WITHIN, and ADD_LINK (add link field to output).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("WaterRG--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        else:
            print("Water region groups previously created...--" + time.strftime('%Y%m%d--%H%M%S'))
            reportFile.write("Run the region group tool to group waterbodies together with options number of neighbors to use: EIGHT, zone grouping method: WITHIN, and ADD_LINK (add link field to output).--WaterRG" + '\n')

        """ Extract Water Bodies From the Region Group """
        EBA = arcpy.sa.ExtractByAttributes('WatIO_300', 'Count_2 > 299 AND LINK = 1')
        EBA.save('WatBod_300')
        reportFile.write("Extract by Attributes from the Region Group raster groups of pixels where Count > 299 and Link = 1.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Split the Raster As Needs, Process Each Piece ----------------- """
        """ Check if the raster should be split """
        columns = arcpy.GetRasterProperties_management('WatBod_300', 'COLUMNCOUNT').getOutput(0)
        xsplit = int(float(columns) / 40000) + 1
        rows = arcpy.GetRasterProperties_management('WatBod_300', 'ROWCOUNT').getOutput(0)
        ysplit = int (float(rows) / 40000) + 1
        print("Determining if split is necessary...--" + time.strftime('%Y%m%d--%H%M%S'))

        """-------- If no split, run the analysis --------------------------------- """
        if xsplit*ysplit == 1:
            """ Convert Raster to Polygon """
            arcpy.RasterToPolygon_conversion('WatBod_300', 'Poly_WatBod', 'NO_SIMPLIFY')
            reportFile.write("Convert the raster into polygons--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            print("\t Raster is small enough, split not necessary...--" + time.strftime('%Y%m%d--%H%M%S'))

            """-------- If split, run the analysis on each piece and recombine --------- """
        else:
            """ Delete the raster, if necessary """
            xy = (xsplit * ysplit)
            for rast in range(xy):
                try:
                    arcpy.Delete_management(splitDir + '/watbod_' + str(rast))
                except:
                    pass
            try:
                arcpy.Delete_management(splitDir + '/watbod_300')
            except:
                pass

            """ Split the Raster """
            print("\t Raster is big, spliting into " + str(xsplit) + " rows and " + str(ysplit) + " columns...--" + time.strftime('%Y%m%d--%H%M%S'))
            arcpy.RasterToOtherFormat_conversion('WatBod_300', splitDir, 'GRID')
            arcpy.SplitRaster_management(splitDir + '/WatBod_300', splitDir, 'WatBod_', 'NUMBER_OF_TILES', 'GRID', '', str(xsplit) + ' ' + str(ysplit))
            reportFile.write("Split the raster into pieces for easier processing. The Python script determines the number of pieces based on the number of rows and columns in the raster where no piece can have a side larger than 40,000 cells.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ For each raster: """
            prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
            xy = xsplit*ysplit
            for Chunk in range(0, xy):
                try:
                    result = float(arcpy.GetRasterProperties_management(splitDir + '/WatBod_' + str(Chunk), 'MEAN').getOutput(0))
                    """ If the raster piece has data: """
                    if (result > 0):
                        """ Set Environments """
                        arcpy.env.snapRaster = freqDir + '/WaterIO'
                        arcpy.env.extent = freqDir + '/WaterIO'
                        """ Copy the piece back to the Working Directory """
                        arcpy.RasterToOtherFormat_conversion(splitDir + '/WatBod_' + str(Chunk), workDir)
                        """ Convert Raster to Polygon """
                        arcpy.RasterToPolygon_conversion('WatBod_' + str(Chunk), 'Poly_' + str(Chunk), 'NO_SIMPLIFY')
                        print("Processed Chunk " + str(Chunk) + " / " + str(xy) + "..."  + time.asctime())
                    else:
                        pass
                except:
                    pass
            reportFile.write("Convert the pieces individually into polygons then recombine them into one feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            WVchunks = arcpy.ListFeatureClasses('Poly_*')
            """ Merge the polygons back together """
            arcpy.Merge_management(WVchunks, 'Poly_WatBod')
            print("All raster chunks with data converted to polygons and merged...--" + time.strftime('%Y%m%d--%H%M%S'))
            reportFile.write("Merge the pieces back together.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- End of Split Processing ---------------------------------------- """
        """ Buffer pieces by 50m """
        arcpy.Buffer_analysis('Poly_WatBod', 'WatView_Buff', '50 METERS', 'FULL', '', 'NONE')
        reportFile.write("Buffer the Water Bodies by 50 Meters.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Project into Albers """
        arcpy.Project_management('WatView_Buff', 'WatView_Alb', prjfile)
        reportFile.write("Project the buffer polygons into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Set Environments """
        arcpy.env.snapRaster = freqDir + '/Dasy'
        arcpy.env.extent = freqDir + '/Dasy'

        """ Extract Daysmetric Pixels """
        EbM_P = arcpy.sa.ExtractByMask(freqDir + '/Dasy', 'WatView_Alb')
        EbM_P.save('Pop_WaterView')
        print("Dasy pixels extracted for all buffered water polygons...--" + time.strftime('%Y%m%d--%H%M%S'))
        reportFile.write("Extract by mask the EnviroAtlas Dasymetric (2011/October 2015) pixels using the projected buffer to produce a raster showing population with potential views of water.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate the Extracted Dasy Population with Each CBG """
        arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', 'Pop_WaterView', 'BG_WWV', 'DATA', 'SUM')
        reportFile.write("Calculate Zonal Statistics as Table for the extracted dasymetrics with the zones being the 2010 block groups for the EnviroAtlas community.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Total Dasy Population, if necessary ------------------ """
        """ Use the existing data """
        fieldNames = [f.name for f in arcpy.ListFields(freqDir + '/BG_Alb')]
        if 'Dasy_Pop' in fieldNames:
            reportFile.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop--Dasy_Pop" + '--\n')

            """ Create population data """
        else:
            arcpy.AddField_management(freqDir + '/BG_Alb', 'Dasy_Pop', 'LONG')
            arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy', freqDir + '/Dasy_ZS', '', 'SUM')
            arcpy.JoinField_management(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy_ZS', 'bgrp', ['SUM'])
            arcpy.CalculateField_management(freqDir + '/BG_Alb', 'Dasy_Pop', '!SUM!', 'PYTHON_9.3')
            arcpy.DeleteField_management(freqDir + '/BG_Alb', ['SUM'])
            arcpy.JoinField_management(freqDir + '/BG', 'bgrp',freqDir + '/BG_Alb', 'bgrp', ['Dasy_Pop'])
            reportFile.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("Dasy_Pop--"+ time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Create Final Table --------------------------------------------- """
        arcpy.TableToTable_conversion(freqDir + '/BG_Alb', workDir, 'WatWV', '', 'bgrp')
        arcpy.DeleteField_management('WatWV', ['PLx2_Pop', 'PLx2_Pct', 'SUM_HOUSIN', 'NonWhite', 'LandA_M', 'Density', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite_Pop', 'NonWt_Pct', 'Area_M', 'Shape_Le_1', 'Shape_Area', 'ALAND', 'NonWhite_P', 'H_Income_M', 'State'])
        WaterView = 'WatWV'
        reportFile.write("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP and Dasy_Pop fields--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add fields to new table """
        arcpy.AddField_management(WaterView, 'WVW_Pop', 'LONG')
        arcpy.AddField_management(WaterView, 'WVW_Pct', 'FLOAT', 5, 2)
        reportFile.write("Add fields to the new table for WVW_Pop (long), WVW_Pct (float).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join Each Table to the final table and WVW_Pop """
        arcpy.JoinField_management(WaterView, 'bgrp', 'BG_WWV', 'bgrp', ['SUM'])
        arcpy.CalculateField_management(WaterView, 'WVW_Pop', '!SUM!', 'PYTHON_9.3')
        arcpy.MakeTableView_management(WaterView, 'WaterView_Tbl')
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'NEW_SELECTION', 'SUM IS NULL')
        arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pop', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'CLEAR_SELECTION')
        arcpy.DeleteField_management('WaterView_Tbl', 'SUM')
        reportFile.write("Join the zonal statistics table with the new table to calculate the new fields: WVW_Pop = zonal statistics.SUM; remove join--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate WVW_Pct """
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'NEW_SELECTION', 'Dasy_Pop >0')
        arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pct', '"%.2f" % (float(!WVW_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'CLEAR_SELECTION')
        reportFile.write("Calculate field WVW_Pct = WVW_Pop / Dasy_Pop * 100 (limited to 2 decimal places).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate NULL values, where applicable """
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'NEW_SELECTION', 'Dasy_Pop = 0')
        arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pop', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'CLEAR_SELECTION')
        arcpy.DeleteField_management('WaterView_Tbl', ['SUM_POP10', 'EAID', 'NonWhite', 'LandA_M', 'Density', 'Dasy_Pop','SUM'])
        print("Statistics for all fields and buffered water bodies calculated...--" + time.strftime('%Y%m%d--%H%M%S'))
        reportFile.write("Calculate fields where Dasy_Pop = 0: All Fields = -99999.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Check that the Analysis Area is covered by the LC -------------- """
    	""" Create a Polygon Version of the LC """
        if arcpy.Exists(freqDir + '/LC_Poly') == False:
            arcpy.env.snapRaster = freqDir + '/LC'
            arcpy.env.extent = freqDir + '/LC'
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
            print("Land Cover does not extend beyond BG boundary, editing possibly erroneous BGs...--" + time.strftime('%Y%m%d--%H%M%S'))
            arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus50', '-50 meters')
            arcpy.MakeFeatureLayer_management('LC_Poly_Minus50', 'Minus50')
            arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG')

            arcpy.SelectLayerByLocation_management('BG', 'COMPLETELY_WITHIN', 'Minus50', '', 'NEW_SELECTION', 'INVERT')

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
                arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'NEW_SELECTION', expression)
                arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pop', '-99998', 'PYTHON_9.3')
                arcpy.CalculateField_management('WaterView_Tbl', 'WVW_Pct', '-99998', 'PYTHON_9.3')
                arcpy.SelectLayerByAttribute_management('WaterView_Tbl', 'CLEAR_SELECTION')
        reportFile.write("Calculate Field for BGs within 50m of the edge of the land cover, WVW_Pop and WVW_Pct = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create final table """
        arcpy.CopyRows_management('WaterView_Tbl', 'WaterWV_Fnl')

        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_WaterWV')
        except:
            pass
        arcpy.TableToTable_conversion('WaterWV_Fnl', finalDir, city + '_WaterWV')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_WaterWV')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'WVW_Pop', 'WVW_Pct']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_WaterWV', [field])
        reportFile.write("Export the fields to be displayed in the EnviroAtlas to a final gdb table. WVW_Pop, WVW_Pct--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        print 'Window Views of Water End Time: ' + time.asctime() + '\n'

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

