#-----------------------------------------------------------------------------
# Name:     ImpProx.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/27/2017
#
# Purpose:  Calculates the square meters of Impervious Area within 250 square
#           meters at any given point within the study area.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the ImpP function.
#           The data needed to process this scripts is:
#               1. Land Cover/Impervious and Water Binaries (community)
#               2. 300m2 Water Bodies Raster (if created, community)
#               3. Boundary (community)
#-----------------------------------------------------------------------------
def ImpP(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_ImpProx.gdb')
    except:
        pass
    workGDB = str(workFld) + '/' + str(city) + '_ImpProx.gdb'

    """ Window Views of Water Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_WaterWV.gdb')
    except:
        pass
    rgGDB = str(workFld) + '/' + str(city) + '_WaterWV.gdb'

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

    """ Split Raster Directory """
    if os.path.isdir(str(workFld) + '/' + city + '_Split') == True:
        pass
    else:
        os.makedirs(str(workFld) + '/' + city + '_Split')
    splitDir = str(workFld) + '/' + city + '_Split'

    """ Set Workspace Environments """
    arcpy.env.workspace = workGDB
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

    #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """
        tmpName = city + '_ImpProx_' + time.strftime('%Y%m%d_%H-%M')
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
        print 'Impervious Proximity Start Time: ' + time.asctime()
        reportFile.write("Begin with EnviroAtlas 1-meter Land Cover for the EnviroAtlas community--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = str(freqDir) + '/LC'
        arcpy.env.snapRaster = str(freqDir) + '/LC'

        """ Set Projection Files """
        prjfileALB = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
        prjNumb = arcpy.Describe(str(freqDir) + '/LC').spatialReference.name
        prjNumb = prjNumb[-3:]
        prjfileUTM = prjDir + '/NAD 1983 UTM Zone ' + prjNumb + '.prj'

        """-------- Reclassify LC into Binary Impervious ----------------------------- """
        if arcpy.Exists(freqDir + '/ImpIO') == False:
            #Run the Imp Space reclassification
            outReclass5 = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,1],[21,1],[22,1],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
            outReclass5.save(freqDir + '/ImpIO')
            del outReclass5
            reportFile.write("Reclassify the Land Cover into Binary Impervious. (Impervious - 20 = 1; All Else = 0)--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("ImpIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            reportFile.write("Reclassify the Land Cover into Binary Impervious. (Impervious - 20 = 1; All Else = 0)--ImpIO" + '--\n')

        """-------- Create 1001m Moving Window ------------------------------------- """
        outFocalStat4 = arcpy.sa.FocalStatistics(freqDir + '/ImpIO', arcpy.sa.NbrRectangle (1001, 1001, 'CELL'),'SUM', 'NODATA')
        outFocalStat4.save('Imp_1001R')
        arcpy.CalculateStatistics_management('Imp_1001R')
        del outFocalStat4
        print("1001m moving winow complete... " + time.asctime())
        reportFile.write("Compute Focal Statistics on the Impervious Binary with 1001 pixel wide by 1001 pixel high rectangular window with statistics type = sum.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Reclassify Moving Window into 20% Breaks ----------------------- """
        outReclass3 = arcpy.sa.Reclassify('Imp_1001R', 'Value', arcpy.sa.RemapRange([[0,200400.2,20],[200400.2,400800.4,40],[400800.4,601200.6,60],[601200.6,801600.80,80],[801600.8,1002001,100]]), 'NODATA')
        outReclass3.save('Imp_Pct')
        del outReclass3
        print("1001m moving winow reclassification complete... " + time.asctime())
        reportFile.write("Reclassify the Focal Statistics into 5 classes at 20% intervals.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Check that the Analysis Area is covered by the LC -------------- """
    	""" Create a Polygon Version of the LC """
        if arcpy.Exists(freqDir + '/LC_Poly') == False:
            arcpy.env.extent = freqDir + '/LC'
            arcpy.env.snapRaster = freqDir + '/LC'
            ReC = arcpy.sa.arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
            ReC.save(str(freqDir) + '/AreaIO')
            del ReC
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

        """ Create the Water Binary, if necessary """
        if arcpy.Exists(freqDir + '/WaterIO') == True:
            reportFile.write("Create a water binary from the 1-M EnviroAtlas Land Cover. (Water - 10 = 1; All Else = 0).--WaterIO" + '--\n')
        else:
            outReclass3 = arcpy.sa.Reclassify(freqDir + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,0],[21,0],[22,0],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
            outReclass3.save(freqDir + '/WaterIO')
            del outReclass3
            reportFile.write("Create a water binary from the 1-M EnviroAtlas Land Cover. (Water - 10 = 1; All Else = 0.)--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("WaterIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create the Water Region Group, if necessary """
        if arcpy.Exists(rgGDB + '/WatIO_300') == True:
            reportFile.write("Run the region group tool to group waterbodies together with options number of neighbors to use: EIGHT, zone grouping method: WITHIN, and ADD_LINK (add link field to output).--WaterRG" + '--\n')
        else:
            RG = arcpy.sa.RegionGroup(freqDir + '/WaterIO', 'EIGHT', 'WITHIN', 'ADD_LINK')
            RG.save(rgGDB + '/WatIO_300')
            del RG
            arcpy.AddField_management(rgGDB + '/WatIO_300', 'Count_2', 'DOUBLE')
            arcpy.CalculateField_management(rgGDB + '/WatIO_300', 'Count_2', '!COUNT!', 'PYTHON')
            reportFile.write("Run the region group tool to group waterbodies together with options number of neighbors to use: EIGHT, zone grouping method: WITHIN, and ADD_LINK (add link field to output).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("WaterRG--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Limit the WatIO_300 to the Extent of Imp_Pct """
##        if bigEnough == 0:
##            EbM = arcpy.sa.ExtractByMask(rgGDB + '/WatIO_300', 'Imp_Pct')
##            EbM.save('WatRG_Lim_1001')
##            del EbM
##            print("Extract by mask complete... " + time.asctime())
##            reportFile.write("Restrict the extent of the water bodies raster to that of the percent impervious raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        if bigEnough == 0:
            desc = arcpy.Describe('Imp_Pct')
            rectangle = "%s %s %s %s" % (desc.extent.XMin, desc.extent.YMin, desc.extent.XMax, desc.extent.YMax)
            IP01 = arcpy.sa.Reclassify('Imp_Pct','Value',arcpy.sa.RemapRange([[0,100,1]]), 'NODATA')
            arcpy.RasterToPolygon_conversion(IP01, 'Imp_Pct_poly', "NO_SIMPLIFY", "Value")
            del IP01
            arcpy.Clip_management(rgGDB + '/WatIO_300', rectangle,'WatRG_Lim_251', 'Imp_Pct_poly','#','ClippingGeometry')
            reportFile.write("Restrict the extent of the water bodies raster to that of the percent impervious raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Burn water into the Imp_Pct """
        if bigEnough == 0:
            burnwater = arcpy.sa.Con('WatRG_Lim_1001', '-99999', 'Imp_Pct', 'Count_2 > 299 AND LINK = 1')
        else:
            burnwater = arcpy.sa.Con(rgGDB + '/WatIO_300', '-99999', 'Imp_Pct', 'Count_2 > 299 AND LINK = 1')
        burnwater.save('Imp_Pct_Wat')
        del burnwater
        print("Water burned into Imp_Pct... " + time.asctime())
        reportFile.write("Using the region group output, burn water bodies over 300m2 into the impervious percent raster using a conditional statement if Region Group Count > 299 AND Link = 1; for true: -99999; for false: impervious percent raster--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to Esri GRID format """
        try:
            arcpy.Delete_management(splitDir + '/imp_pct_wat')
        except:
            pass
        arcpy.RasterToOtherFormat_conversion('Imp_Pct_Wat', splitDir, 'GRID')
        reportFile.write("Convert the raster into Esri GRID format--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Split the Raster As Needs, Process Each Piece ----------------- """
        """ Check if the raster should be split """
        columns = arcpy.GetRasterProperties_management('Imp_Pct_Wat', 'COLUMNCOUNT').getOutput(0)
        xsplit = int(float(columns) / 40000) + 1
        rows = arcpy.GetRasterProperties_management('Imp_Pct_Wat', 'ROWCOUNT').getOutput(0)
        ysplit = int (float(rows) / 40000) + 1

        """--------- Clip the EA Boundaries to the County Lines, if necessary ----- """
        if arcpy.Exists(str(freqDir) + '/Bnd_Cty') == False:
            """ Copy Counties to Frequent and Project """
            arcpy.MakeFeatureLayer_management(str(inDir) + '/Input.gdb/Counties_Alb', 'Cty')
            arcpy.SelectLayerByLocation_management('Cty', 'CONTAINS', 'BG_Alb', '', 'NEW_SELECTION')
            arcpy.FeatureClassToFeatureClass_conversion(str(inDir) + '/Input.gdb/Counties_Alb', str(freqDir), 'Counties_Alb')
            arcpy.SelectLayerByAttribute_management('Cty', 'CLEAR_SELECTION')
            descLC = arcpy.Describe(str(freqDir) + '/LC')
            arcpy.Project_management('Counties_Alb', 'Counties', descLC.spatialReference)

            """ Clip Boundary to County Lines """
            arcpy.Clip_analysis(str(freqDir) + '/Bnd', str(freqDir) + '/Counties', str(freqDir) + '/Bnd_Cty')
            reportFile.write("Clip the EnviroAtlas Community Boundary to the county lines for the community to limit the output to land area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("Bnd_Cty--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            reportFile.write("Clip the EnviroAtlas Community Boundary to the county lines for the community to limit the output to land area.--Bnd_Cty" + '--\n')

            """-------- If no split, run the analysis --------------------------------- """
        if xsplit*ysplit == 1:
            """ Convert Raster to Polygon """
            arcpy.RasterToPolygon_conversion('Imp_Pct_Wat', 'Poly_Imp', 'NO_SIMPLIFY')
            reportFile.write("Convert the raster into a polygon feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Clip the polygons to Bnd_Cty """
            arcpy.Clip_analysis('Poly_Imp', freqDir + '/Bnd_Cty', 'Clip_Imp')
            reportFile.write("Clip the polygon feature class to the clipped EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Dissolve the polygons """
            arcpy.Dissolve_management('Clip_Imp', 'ImpDiss', 'gridcode')
            reportFile.write("Dissolve the clipped polygons based on grid_code.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """-------- If split, run the analysis on each piece and recombine --------- """
        else:
            """ Delete the raster, if necessary """
            xy = (xsplit * ysplit)
            for rast in range(xy):
                try:
                    arcpy.Delete_management(splitDir + '/impp_' + str(rast))
                except:
                    pass

            """ Split the Raster """
            print("Raster too big, splitting into " + str(xy) + " pieces... " + time.asctime())
            arcpy.SplitRaster_management(splitDir + '/imp_pct_wat', splitDir, 'impp_', 'NUMBER_OF_TILES', 'GRID', '', str(xsplit) + ' ' + str(ysplit))
            print("Raster split complete... " + time.asctime())
            reportFile.write("Split the raster into pieces of no more than 40,000x40,000 pixels.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ For each raster: """
            for Chunk in range(0,xy):
                try:
                    result = float(arcpy.GetRasterProperties_management(splitDir + '/impp_' + str(Chunk), 'MEAN').getOutput(0))
                    """ If the raster piece has data: """
                    if (result <> 0):
                        """ Set Environments """
                        arcpy.env.snapRaster = 'Imp_1001R'
                        arcpy.env.extent = 'Imp_1001R'
                        """ Copy the piece back to the Working Directory """
                        arcpy.RasterToOtherFormat_conversion(splitDir + '/impp_' + str(Chunk), workGDB)
                        """ Convert Raster to Polygon """
                        arcpy.RasterToPolygon_conversion('impp_' + str(Chunk), 'ImpPoly_' + str(Chunk), 'NO_SIMPLIFY')
                        """ Clip the polygons to Bnd_Cty """
                        arcpy.Clip_analysis('ImpPoly_' + str(Chunk), freqDir + '/Bnd_Cty', 'ImpClip_' + str(Chunk))
                        """ Dissolve the polygons """
                        arcpy.Dissolve_management('ImpClip_' + str(Chunk), 'ImpD1_' + str(Chunk), 'gridcode')
                        print("Processed Chunk " + str(Chunk) + " / " + str(xy) + "..."  + time.asctime())
                    else:
                        pass
                except:
                    pass
            reportFile.write("Convert each of the raster pieces into a polygon feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            reportFile.write("Clip the polygon feature classes to the clipped EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            reportFile.write("Dissolve each piece based on grid_code.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Merge the polygons back together """
            fcList = arcpy.ListFeatureClasses('ImpD1*')
            arcpy.Merge_management(fcList, 'ImpDiss')
            reportFile.write("Merge the pieces back together.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Dissolve the pieces again """
        arcpy.Dissolve_management('ImpDiss', 'ImpProx_UTM', 'gridcode')
        reportFile.write("Dissolve again based on grid_code.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Change gridcode to ImpProxP """
        arcpy.AlterField_management('ImpProx_UTM', 'gridcode', 'ImpProxP')
        reportFile.write("Rename field 'gridcode' into field 'ImpProxP'--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ If the LC isn't large enough, edit erroneous BGS """
        if bigEnough == 0:
##            """ Extract the area where the boundary extends beyond the analysis area """
##            arcpy.Erase_analysis(freqDir + '/Bnd_Cty', 'ImpProx_UTM', 'EE_Area')
##            arcpy.AddField_management('EE_Area', 'ImpProxP', 'LONG')
##            arcpy.CalculateField_management('EE_Area', 'ImpProxP', -99998, 'PYTHON_9.3')
##            """ Append the non-analyzed area onto the main output """
##            arcpy.Append_management('EE_Area', 'ImpProx_UTM')
##            """ Dissolve the output, again """
##            arcpy.Dissolve_management('ImpProx_UTM', 'ImpProx_EE_D', 'ImpProxP')
##            reportFile.write("Due to the extent of the Land Cover, the analysis area is smaller than the EnviroAtlas Community Boundary. Extract the area within the boundary that is not within the analysis area, add field 'ImpProxP' = -99998 and append on to the output file. Dissolve based on ImpProxP.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Buffer each GreClip feature by 1 cm and erase from Bnd_Cty """
            fcList = arcpy.ListFeatureClasses('ImpClip*')
            for idx,fc in enumerate(fcList):
                arcpy.Buffer_analysis(fc, (fc + "_1cmbuff"), "1 Centimeters", "FULL", "ROUND", "ALL")
                #arcpy.Buffer_analysis(fc + "_inbuff", fc + "outbuff", "1 Centimeter", "FULL", "ROUND", "ALL")
                if idx == 0:
                    arcpy.Erase_analysis(freqDir + '/Bnd_Cty', (fc + "_1cmbuff"), 'EE_Area_' + str(idx))
                else:
                    arcpy.Erase_analysis('EE_Area_' + str(idx - 1), fc + "_1cmbuff", 'EE_Area_' + str(idx))
                a = idx
                print("Processed Chunk " + str(Chunk) + " / " + str(xy) + "..."  + time.asctime())
            arcpy.Buffer_analysis('EE_Area_' + str(a), 'EE_Area_2cmbuff', '2 Centimeters',"FULL", "ROUND", "ALL")
            arcpy.Clip_analysis('EE_Area_2cmbuff', freqDir + '/Bnd_Cty', 'EE_Area')
            arcpy.AddField_management('EE_Area', 'ImpProxP', 'LONG')
            arcpy.CalculateField_management('EE_Area', 'ImpProxP', -99998, 'PYTHON_9.3')
            """ Append the non-analyzed area onto the main output """
            arcpy.Append_management('EE_Area', 'ImpProx_UTM')
            """ Dissolve the output, again """
            arcpy.Dissolve_management('ImpProx_UTM', 'ImpProx_EE_D', 'ImpProxP')
            print("Big enough workflow complete... " + time.asctime())
            reportFile.write("Due to the extent of the Land Cover, the analysis area is smaller than the EnviroAtlas Community Boundary. Extract the area within the boundary that is not within the analysis area, add field 'ImpProxP' = -99998 and append on to the output file. Dissolve based on ImpProxP.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')


            """ Project the output """
        try:
            arcpy.Project_management('ImpProx_EE_D', city + '_ImpProx', prjfileALB)
        except:
            arcpy.Project_management('ImpProx_UTM', city + '_ImpProx', prjfileALB)
        reportFile.write("Project the feature class into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add to Final Directory """
        arcpy.FeatureClassToFeatureClass_conversion(city + '_ImpProx', finalDir, city + '_ImpProx')
        reportFile.write("Copy the feature class to the final geodatabase.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        print 'Impervious Proximity End Time: ' + time.asctime() + '\n'

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
