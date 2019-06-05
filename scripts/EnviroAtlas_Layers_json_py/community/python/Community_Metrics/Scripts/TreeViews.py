#-----------------------------------------------------------------------------
# Name:     TreeViews.py
#
# Author:   Ali Mackey
#
# Created:  06/09/2013
# Updated:  04/25/2017
#
# Purpose:  Calculates the population within 50m of a tree
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the WVT function.
#           The data needed to process this scripts is:
#               1. Land Cover/Forest Binary (community)
#               3. Block Groups (community)
#-----------------------------------------------------------------------------
def WVT(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

    #-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_TreeWV.gdb')
    except:
        print 'TreeWV GDB already exists'
    workDir = str(workFld) + '/' + city + '_TreeWV.gdb'
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

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """
        tmpName = city + '_TreeWV_' + time.strftime('%Y%m%d_%H-%M')
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
        print 'Window Views of Trees Start Time: ' + time.asctime()
        reportFile.write("Begin with EnviroAtlas 1-meter Land Cover for the EnviroAtlas community--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.snapRaster = freqDir + '/LC'
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.overwriteOutput = True

        """-------- Reclassify LC into Binary Forest ----------------------------- """
        if arcpy.Exists(str(freqDir) + '/MForestIO') == False:
            outReclass = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,0],[70,0],[80,0],[82,1],[91,1],[92,0]]))
            outReclass.save(str(freqDir) + '/MForestIO')
            reportFile.write("Reclassify the Land Cover into a Forest binary REPLACE-MFE" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            print("Forest area reclassified to binary raster..." + time.asctime())
            ReuseRF.write("MForestIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        else:
            print("Forest binary raster already exists..." + time.asctime())
            reportFile.write("Reclassify the Land Cover into a Forest binary REPLACE-MFE--MForestIO" + '--\n')

        """-------- Create 50m Moving Window ------------------------------------- """
        MW=arcpy.sa.FocalStatistics(freqDir + '/MForestIO', arcpy.sa.NbrCircle (50, 'CELL'),'SUM', 'NODATA')
        MW.save('MFor_50C')
        print("Moving window complete..."+ time.asctime())
        reportFile.write("Run Focal Statistics on the Forest Binary Raster with a circular window of 50 meters and statistics = SUM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Reclassify Moving Window into Trees/NoTrees ------------------- """
        ReC=arcpy.sa.Reclassify('MFor_50C', 'Value', arcpy.sa.RemapRange([[0,0.99999,1],[0.99999,10300,0]]))
        ReC.save('NoForView')
        print("Moving window completed and reclassified to tree / no trees..."+ time.asctime())
        reportFile.write("Reclassify the Focal Statistics into Forest (>0 -> 0) or No Forest (0 -> 1).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Split the Raster As Needs, Process Each Piece ----------------- """
        """ Check if the raster should be split """
        columns = arcpy.GetRasterProperties_management('NoForView', 'COLUMNCOUNT').getOutput(0)
        xsplit = int(float(columns) / 20000) + 1
        rows = arcpy.GetRasterProperties_management('NoForView', 'ROWCOUNT').getOutput(0)
        ysplit = int (float(rows) / 20000) + 1

        """-------- If no split, run the analysis --------------------------------- """
        if xsplit*ysplit == 1:
            """ Convert Raster to Polygon """
            arcpy.RasterToPolygon_conversion('NoForView', 'NFVP_Whole', 'NO_SIMPLIFY')

            """ Extract areas with no forest in 50m """
            arcpy.Select_analysis('NFVP_Whole', 'NFVS_Whole', 'gridcode=1')
            reportFile.write("Convert the raster into a polygon and select the features where gridcode = 1.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Project into Albers for use with Dasymetric """
            arcpy.Project_management('NFVS_Whole', 'NFVA_Whole', prjfile)
            print("Raster small enough, carry on..."+ time.asctime())
            reportFile.write("Convert the polygons into Albers projection.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """-------- If split, run the analysis on each piece and recombine --------- """
        else:
            """ Delete the raster, if necessary """
            xy = (xsplit * ysplit)
            for rast in range(xy):
                try:
                    arcpy.Delete_management(splitDir + '/nfvsp_' + str(rast))
                except:
                    pass
            try:
                arcpy.Delete_management(splitDir + '/noforview')
            except:
                pass

            """ Split the Raster """
            arcpy.RasterToOtherFormat_conversion('NoForView', splitDir, 'GRID')
            print("Raster too big, splitting into " + str(xsplit) +" rows and " +str(ysplit)+ " columns..."+ time.asctime())
            arcpy.SplitRaster_management(splitDir + '/NoForView', splitDir, 'NFVSp_', 'NUMBER_OF_TILES', 'GRID', '', str(xsplit) + ' ' + str(ysplit))
            reportFile.write("Split the raster into pieces for easier processing. The Python script determines the number of pieces based on the number of rows and columns in the raster where no piece can have a side larger than 20,000 cells--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ For each raster: """
            prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
            xy = (xsplit * ysplit)
            for Chunk in range(0,xy):
                try:
                    result = float(arcpy.GetRasterProperties_management(splitDir + '/NFVSp_' + str(Chunk), 'MEAN').getOutput(0))
                    """ If the raster piece has data: """
                    if (result > 0):
                        """ Set Environments """
                        arcpy.env.snapRaster = freqDir + '/MForestIO'
                        arcpy.env.extent = freqDir + '/MForestIO'
                        """ Copy the piece back to the Working Directory """
                        arcpy.RasterToOtherFormat_conversion(splitDir + '/NFVSp_' + str(Chunk), workDir)
                        """ Convert Raster to Polygon """
                        arcpy.RasterToPolygon_conversion('NFVSp_' + str(Chunk), 'NFVP_' + str(Chunk), 'NO_SIMPLIFY')
                        """ Extract areas with no forest in 50m """
                        arcpy.Select_analysis('NFVP_' + str(Chunk), 'NFVS_' + str(Chunk), 'gridcode=1')
                        """ Project into Albers for use with Dasymetric """
                        arcpy.Project_management('NFVS_' + str(Chunk), 'NFVA_' + str(Chunk), prjfile)
                        print("Chunk " + str(Chunk) + " / " + str(xy) + " processed..."+ time.asctime())
                except:
                    pass
            reportFile.write("For each piece, convert the raster into a polygon and select the features where gridcode = 1--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            reportFile.write("For each piece, convert the polygons into Albers projection.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Combine the resulting polygons """
            NFVchunks = arcpy.ListFeatureClasses('NFVA_*')
            arcpy.Merge_management(NFVchunks, workDir + '/NFVA_Whole')
            print("All chunks remerged..."+ time.asctime())
            reportFile.write("Merge all of the projected polygons together.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Set Environments """
        arcpy.env.snapRaster = freqDir + '/Dasy'
        arcpy.env.extent = freqDir + '/Dasy'

        """-------- End of Split Processing ---------------------------------------- """
        """ Extract Dasymetric Pixels where there is no forest in 50m """
        EbM = arcpy.sa.ExtractByMask(freqDir + '/Dasy', 'NFVA_Whole')
        EbM.save('Pop_NoForView')
        reportFile.write("Extract by Mask the EnviroAtlas Dasymetric (2011/October 2015) pixels within the polygons--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate the Extracted Dasy Population with Each CBG """
        arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', 'Pop_NoForView', 'BG_TWV', 'DATA', 'SUM')
        reportFile.write("Calculate Zonal Statistics as Table for the extracted dasymetrics with the zones being the 2010 block groups for the EnviroAtlas community.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Total Dasy Population, if necessary ------------------ """
        """ Use the existing data """
        fieldNames = [f.name for f in arcpy.ListFields(freqDir + '/BG_Alb')]
        if 'Dasy_Pop' in fieldNames:
            reportFile.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop--Dasy_Pop" + '--\n')

            """ Create population data """
        else:
            arcpy.AddField_management(freqDir + '/BG_Alb', 'Dasy_Pop', 'LONG')
            ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy', freqDir + '/Dasy_ZS', '', 'SUM')
            arcpy.JoinField_management(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy_ZS', 'bgrp', ['SUM'])
            arcpy.CalculateField_management(freqDir + '/BG_Alb', 'Dasy_Pop', '!SUM!', 'PYTHON_9.3')
            arcpy.DeleteField_management(freqDir + '/BG_Alb', ['SUM'])
            arcpy.JoinField_management(freqDir + '/BG', 'bgrp',freqDir + '/BG_Alb', 'bgrp', ['Dasy_Pop'])
            reportFile.write("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("Dasy_Pop--"+ time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Create Final Table --------------------------------------------- """
        arcpy.TableToTable_conversion(freqDir + '/BG_Alb', workDir, 'TreeWV', '', 'bgrp')
        arcpy.DeleteField_management('TreeWV', ['PLx2_Pop', 'PLx2_Pct', 'SUM_HOUSIN', 'NonWhite', 'LandA_M', 'Density', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite_Pop', 'NonWt_Pct', 'Area_M', 'Shape_Le_1', 'Shape_Area', 'ALAND', 'NonWhite_P', 'H_Income_M', 'State'])
        TreeView = 'TreeWV'
        reportFile.write("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP and Dasy_Pop fields--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add fields to new table """
        arcpy.AddField_management(TreeView, 'WVT_Pop', 'LONG')
        arcpy.AddField_management(TreeView, 'WVT_Pct', 'FLOAT', 5, 2)
        reportFile.write("Add fields to the new table for WVT_Pop (long), WVT_Pct (float).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join Each Table to the final table and WVW_Pop """
        arcpy.JoinField_management(TreeView, 'bgrp', 'BG_TWV', 'bgrp', ['SUM'])
        arcpy.CalculateField_management(TreeView, 'WVT_Pop', '!SUM!', 'PYTHON_9.3')
        arcpy.MakeTableView_management(TreeView, 'TreeView_Tbl')
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'NEW_SELECTION', 'SUM IS NULL')
        arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pop', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'CLEAR_SELECTION')
        arcpy.DeleteField_management('TreeView_Tbl', 'SUM')
        reportFile.write("Join the zonal statistics table with the new table to calculate the new fields: WVT_Pop = zonal statistics.SUM; remove join--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Calculate WVT_Pct """
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'NEW_SELECTION', 'Dasy_Pop >0')
        arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pct', '"%.2f" % (float(!WVT_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'CLEAR_SELECTION')
        reportFile.write("Calculate field WVT_Pct = WVT_Pop / Dasy_Pop * 100 (limited to 2 decimal places).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate NULL values, where applicable """
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'NEW_SELECTION', 'Dasy_Pop = 0')
        arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pop', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'CLEAR_SELECTION')
        arcpy.DeleteField_management('TreeView_Tbl', ['SUM_POP10', 'EAID', 'NonWhite', 'LandA_M', 'Density', 'Dasy_Pop','SUM'])
        print("Dasy raster summarized to BGs and stats calculated..."+ time.asctime())
    	reportFile.write("Calculate fields where Dasy_Pop = 0: All Fields = -99999.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

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
            arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus50', '-50 meters', 'FULL', 'FLAT', 'ALL')
            arcpy.MakeFeatureLayer_management('LC_Poly_Minus50', 'Minus50')
            arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG')

            arcpy.SelectLayerByLocation_management('BG', 'COMPLETELY_WITHIN', 'Minus50', '', 'NEW_SELECTION', 'INVERT')

            bgValue = float(arcpy.GetCount_management('BG').getOutput(0))
            print("LC extends beyond BG boundary, carry on..."+ time.asctime())

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
                arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'NEW_SELECTION', expression)
                arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pop', '-99998', 'PYTHON_9.3')
                arcpy.CalculateField_management('TreeView_Tbl', 'WVT_Pct', '-99998', 'PYTHON_9.3')
                arcpy.SelectLayerByAttribute_management('TreeView_Tbl', 'CLEAR_SELECTION')
            print("LC doesn't extend beyond BGs, removing border BGs from analysis..."+ time.asctime())
            reportFile.write("Calculate Field for BGs within 50m of the edge of the land cover, WVT_Pop and WVW_Pct = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create final table """
        arcpy.CopyRows_management('TreeView_Tbl', 'TreeWV_Fnl')
        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_TreeWV')
        except:
            pass
        arcpy.TableToTable_conversion('TreeWV_Fnl', finalDir, city + '_TreeWV')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_TreeWV')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'WVT_Pop', 'WVT_Pct']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_TreeWV', [field])
            print 'Window Views of Trees End Time: ' + time.asctime() + '\n'
        reportFile.write("Export the fields to be displayed in the EnviroAtlas to a final gdb table. WVT_Pop, WVT_Pct--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

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


