#-----------------------------------------------------------------------------
# Name:     Frequent_V2.py
#
# Author:   Leah Yngve
# Updated:  Ali Mackey
#
# Created:  2015
# Updated:  04/28/2017
#
# Purpose:  This scripts creates the green space and tree cover along walkable
#           roads layers.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the GSTCnWR function.
#           The data needed to process this scripts is:
#               1. Land Cover/Forest, Green Space + Water Binaries (community)
#               2. Walkable Roads (community, in Albers)
#-----------------------------------------------------------------------------

def GSTCnWR(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_GSTCnWR.gdb')
    except:
        pass
    workGDB = str(workFld) + '/' + str(city) + '_GSTCnWR.gdb'

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'
    prjfileALB = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
    prjfileWM = prjDir + '/WGS 1984 Web Mercator (auxiliary sphere).prj'

    """ Input Walkable Roads Data """
    walkroads = str(inDir) + '/' + 'Parks.gdb/' + str(city) + '_Walk_Road_Alb'

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
        tmpName = city + '_PctStGS_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        gsRF = open(reportfileName, 'w')

        tmpName = city + '_PctStTC_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        tcRF = open(reportfileName, 'w')

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

        """ Write out first lines of report file """
        print 'Green Space and Tree Cover Along Walkable Roads Start Time: ' + time.asctime()
        gsRF.write("Begin with the 2011 Walkable Roads and the 1-M Land Cover for the EnviroAtlas community, created by the US EPA EnviroAtlas Team.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        tcRF.write("Begin with the 2011 Walkable Roads Layer and the 1-M Land Cover for the EnviroAtlas community, created by the US EPA EnviroAtlas Team.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        gsRF.write("The walkable roads layer was created from 2011 NavTeq Streets by removing roads with multiple entrance/exit ramps, roads with speed limits above 54 mph, roads with functional class less than 3, and roads where pedestrians are not allowed.--201611--\n")
        tcRF.write("The walkable roads layer was created from 2011 NavTeq Streets by removing roads with multiple entrance/exit ramps, roads with speed limits above 54 mph, roads with functional class less than 3, and roads where pedestrians are not allowed.--201611--\n")

		#-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = str(freqDir) + '/LC'
        arcpy.env.snapRaster = str(freqDir) + '/LC'

		#-------- PREPARE LAND COVER --------------------------------------
        """-------- Reclassify LC into Binary Green Space with Water ----------------------------- """
        if arcpy.Exists(str(freqDir) + '/GBS_Ionly') == False:
            outReclass = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,"NODATA"],[10,1],[20,"NODATA"],[21,"NODATA"],[22,"NODATA"],[30,"NODATA"],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
            outReclass.save(str(freqDir) + '/GBS_Ionly')
            gsRF.write("Reclassify into green space + water. REPLACE-GSBE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write('GBSI--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            gsRF.write("Reclassify into green space + water. REPLACE-GSBE--GBSI" + '--\n')

        """-------- Reclassify LC into Binary Forest ----------------------------- """
        if arcpy.Exists(str(freqDir) + '/Forest_Ionly') == False:
            outReclass = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,"NODATA"],[10,"NODATA"],[20,"NODATA"],[21,"NODATA"],[22,"NODATA"],[30,"NODATA"],[40,1],[52,"NODATA"],[70,"NODATA"],[80,"NODATA"],[82,1],[91,1],[92,"NODATA"]]))
            outReclass.save(str(freqDir) + '/Forest_Ionly')
            tcRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFIE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("ForI--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            tcRF.write("Reclassify the Land Cover into Binary Forest. REPLACE-MFIE--ForI" + '--\n')

        """ Convert rasters to TIFF """
        try:
            arcpy.Delete_management(splitDir + '/gbs_ionly')
        except:
            pass
        arcpy.RasterToOtherFormat_conversion(str(freqDir) + '/GBS_Ionly', splitDir, 'GRID')
        gsRF.write("Convert the reclassified raster into GeoTIFF for partial processing.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        try:
            arcpy.Delete_management(splitDir + '/forest_ionly')
        except:
            pass
        arcpy.RasterToOtherFormat_conversion(str(freqDir) + '/Forest_Ionly', splitDir, 'GRID')
        tcRF.write("Convert the reclassified raster into GeoTIFF for partial processing.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Split the Raster As Needs, Process Each Piece ----------------- """
        """ Check if the raster should be split """
        columns = arcpy.GetRasterProperties_management(str(freqDir) + '/Forest_Ionly', 'COLUMNCOUNT').getOutput(0)
        xsplit = int(float(columns) / 40000) + 1
        rows = arcpy.GetRasterProperties_management(str(freqDir) + '/Forest_Ionly', 'ROWCOUNT').getOutput(0)
        ysplit = int (float(rows) / 40000) + 1

        """-------- If no split, run the analysis --------------------------------- """
        if xsplit*ysplit == 1:
            """ Convert Rasters to Polygons """
            arcpy.RasterToPolygon_conversion(str(freqDir) + '/GBS_Ionly', workGDB + '/GBSPoly', 'SIMPLIFY')
            gsRF.write("Convert the TIFF into Polygons.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            arcpy.RasterToPolygon_conversion(str(freqDir) + '/Forest_Ionly', workGDB + '/ForPoly', 'SIMPLIFY')
            tcRF.write("Convert the TIFF into Polygons.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """-------- If split, run the analysis on each piece and recombine --------- """
        else:
            """ Delete the raster, if necessary """
            xy = (xsplit * ysplit)
            for rast in range(xy):
                try:
                    arcpy.Delete_management(splitDir + '/gbsp_' + str(rast))
                    arcpy.Delete_management(splitDir + '/forp_' + str(rast))
                except:
                    pass

            """ Split the Raster """
            arcpy.SplitRaster_management(splitDir + '/gbs_ionly', splitDir, 'gbsp_', 'NUMBER_OF_TILES', 'GRID', '', str(xsplit) + ' ' + str(ysplit))
            gsRF.write("Split the reclassified raster into pieces of no more than 40,000x40,000 pixels, if necessary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            arcpy.SplitRaster_management(splitDir + '/forest_ionly', splitDir, 'forp_', 'NUMBER_OF_TILES', 'GRID', '', str(xsplit) + ' ' + str(ysplit))
            tcRF.write("Split the reclassified raster into pieces of no more than 40,000x40,000 pixels, if necessary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Set Environments """
            arcpy.env.snapRaster = str(freqDir) + '/GBS_Ionly'
            arcpy.env.extent = str(freqDir) + '/GBS_Ionly'

            """ Convert Raster to Polygon for Green Space"""
            for Chunk in range(0,xy):
                try:
                    result = float(arcpy.GetRasterProperties_management(splitDir + '/gbsp_' + str(Chunk), 'MEAN').getOutput(0))
                    if (result <> 0):
                        arcpy.RasterToOtherFormat_conversion(splitDir + '/gbsp_' + str(Chunk), workGDB)
                        arcpy.RasterToPolygon_conversion('gbsp_' + str(Chunk), 'GBSPoly_' + str(Chunk), 'SIMPLIFY')
                        arcpy.RepairGeometry_management('GBSPoly_' + str(Chunk))
                    else:
                        pass
                except:
                    pass

            """ Convert Raster to Polygon for Tree Cover"""
            for Chunk in range(0,xy):
                try:
                    result = float(arcpy.GetRasterProperties_management(splitDir + '/forp_' + str(Chunk), 'MEAN').getOutput(0))
                    if (result <> 0):
                        arcpy.RasterToOtherFormat_conversion(splitDir + '/forp_' + str(Chunk), workGDB)
                        arcpy.RasterToPolygon_conversion('forp_' + str(Chunk), 'ForPoly_' + str(Chunk), 'SIMPLIFY')
                        arcpy.RepairGeometry_management('ForPoly_' + str(Chunk))
                    else:
                        pass
                except:
                    pass

            gsRF.write("Convert each raster into polygons.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            tcRF.write("Convert each raster into polygons.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Merge the polygons back together"""
            fcList = arcpy.ListFeatureClasses('GBSPoly_*')
            arcpy.Merge_management(fcList, 'GBSPoly')
            gsRF.write("Merge the polygons into one feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            fcList = arcpy.ListFeatureClasses('ForPoly_*')
            arcpy.Merge_management(fcList, 'ForPoly')
            tcRF.write("Merge the polygons into one feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

		#-------- PREPARE ROADS DATA --------------------------------------

        """ Copy Walkable Roads to the Working Directory """
        try:
			arcpy.CopyFeatures_management(walkroads, 'Walk_Road_Alb')
			gsRF.write("Clip the EnviroAtlas Walkable Roads layer to the EnviroAtlas community boundary and project into UTM.--ANALYST-TIME--\n")
			tcRF.write("Clip the EnviroAtlas Walkable Roads layer to the EnviroAtlas community boundary and project into UTM.--ANALYST-TIME--\n")
        except:
			arcpy.Clip_analysis(inDir + '/Input.gdb/Walkable_Roads', freqDir + '/Bnd_5km', 'Walk_Road_Alb')
			gsRF.write("Clip the NavTeq Streets layer to the EnviroAtlas community boundary and project into UTM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
			tcRF.write("Clip the NavTeq Streets layer to the EnviroAtlas community boundary and project into UTM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Project roads into UTM """
        descLC = arcpy.Describe(str(freqDir) + '/LC')
        arcpy.Project_management('Walk_Road_Alb', 'Walk_Road_UTM', descLC.spatialReference)
        walkroads = 'Walk_Road_UTM'

        """ Create Intersection Points """
        arcpy.UnsplitLine_management(walkroads, 'WalkRd_Unsplit', "ST_NAME")
        arcpy.Intersect_analysis(['WalkRd_Unsplit','WalkRd_Unsplit'], 'Intersections', "ONLY_FID",'',"POINT")
        arcpy.DeleteIdentical_management('Intersections', "shape")
        gsRF.write("Unsplit the Walkable roads and intersecting them with themselves to create a point at each intersection.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        tcRF.write("Unsplit the Walkable roads and intersecting them with themselves to create a point at each intersection.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

		#-------- RUN TREE COVER ANALYSIS --------------------------------------

        """ Make New Road Attributes """
        arcpy.AddField_management(walkroads, "totLanes", "SHORT")
        arcpy.AddField_management(walkroads, "dirTrvl", "SHORT")
        arcpy.AddField_management(walkroads, "numLanes", "SHORT")
        arcpy.CalculateField_management(walkroads, "totLanes", "!TO_LANES! + !FROM_LANES!", "PYTHON_9.3")
        codeblock = """def makeBin(x):
                if x == 'B':
                    return 2
                else:
                    return 1"""
        arcpy.CalculateField_management(walkroads, "dirTrvl", "makeBin(!DIR_TRAVEL!)", "PYTHON_9.3", codeblock)
        arcpy.CalculateField_management(walkroads, "numLanes", "!totLanes!", "PYTHON_9.3")
        with arcpy.da.UpdateCursor(walkroads, ('numLanes',), "numLanes = 0") as cursor:
            for row in cursor:
                row[0] = 2
                cursor.updateRow(row)

        tcRF.write("Add and calculate new fields: totLanes (short) = TO_LANES + FROM_LANES; dirTrvl (short) = 2 if DIR_TRAVEL='B'; else = 1; numLanes (short) = totLanes if totLanes > 0; else = 2--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Dissolve Roads """
        arcpy.Dissolve_management(walkroads, 'RdsByLanes_For', ["numLanes","dirTrvl"])
        tcRF.write("Dissolve the Walkable Roads by number of lanes (totLanes) and direction of travel (dirTrvl).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Split Roads at Intersections """
        arcpy.SplitLineAtPoint_management('RdsByLanes_For', 'Intersections', 'RdsByBlk_For', "3 Meters")
        tcRF.write("Split the dissolved walkable roads at each intersection point to create road blocks.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Create the Focal Areas --------------------------"""
        """ Create Max Buffer """
        arcpy.AddField_management('RdsByBlk_For', "Max_Buff", "FLOAT")
        arcpy.CalculateField_management('RdsByBlk_For', "Max_Buff", "(!numLanes! * 3.5 + 2.5 * !dirTrvl!)/2 + 7.5", "PYTHON_9.3")
        arcpy.Buffer_analysis('RdsByBlk_For', 'Max_Buff', "Max_Buff", "FULL", "FLAT")
        tcRF.write('Calculate the estimated width of the road (number of lanes * 3.5 meters/lane + 2.5 meters of parking lanes per direction of travel) plus the focus area: Mx_Buff (float) = (numLanes*3.5 + 2.5*dirTrvl)/2 + 7.5. Buffer the roads by this value.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create Min Buffer """
        arcpy.AddField_management('RdsByBlk_For', "Min_Buff", "FLOAT")
        arcpy.CalculateField_management('RdsByBlk_For', "Min_Buff", "(!numLanes! * 3.5 + 2.5 * !dirTrvl!)/2 - 1", "PYTHON_9.3")
        arcpy.Buffer_analysis('RdsByBlk_For', 'Min_Buff', "Min_Buff", "FULL", "FLAT")
        tcRF.write("Calculate the width of the road less one meter (to account for narrower roads; number of lanes * 3.5 meters/lane + 2.5 meters of parking lanes per direction of travel): Mn_Buff (float)= (numLanes*3.5 + 2.5*dirTrvl)/2 - 1. Buffer the roads by this value.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Subtract Buffers to Create Final Buffer """
        arcpy.Erase_analysis("Max_Buff", 'Min_Buff', 'FocalArea_For')
        tcRF.write("Create the focus area feature class by erasing the second, smaller buffer from the first, larger buffer.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Percent Forest in Focal Area ----------------"""
        arcpy.AddField_management('FocalArea_For', "road_ID", "FLOAT")
        arcpy.AddField_management('FocalArea_For', "seg_area", "FLOAT")
        arcpy.CalculateField_management('FocalArea_For', "road_ID", "!ORIG_FID!", "PYTHON_9.3")
        arcpy.CalculateField_management('FocalArea_For', "seg_area", "!Shape_area!", "PYTHON_9.3")

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
            arcpy.env.snapRaster = str(freqDir) + '/GBS_Ionly'
            arcpy.env.extent = str(freqDir) + '/GBS_Ionly'

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

    	""" If the LC isn't large enough, limit the output """
        if bigEnough == 0:
            arcpy.MakeFeatureLayer_management("FocalArea_For", 'FA_For_lyr')
            arcpy.SelectLayerByLocation_management('FA_For_Lyr', 'COMPLETELY_WITHIN', freqDir + '/LC_Poly', '', 'NEW_SELECTION')
            arcpy.CopyFeatures_management('FA_For_Lyr', 'FocalArea_For_EE')
            arcpy.SelectLayerByAttribute_management('FA_For_lyr', 'CLEAR_SELECTION')
            tcRF.write("Due to the extent of the Land Cover, the analysis area is smaller than the EnviroAtlas Community Boundary. Remove any features that are not within the analysis area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Percent Forest per Block ------------------------------ """
        """ Intersect the tree cover polygons with the focus areas """
        arcpy.RepairGeometry_management("ForPoly")
        try:
            arcpy.Intersect_analysis(["FocalArea_For_EE", "ForPoly"], 'SideWalk_For', "ALL", "", "INPUT")
        except:
            arcpy.Intersect_analysis(["FocalArea_For", "ForPoly"], 'SideWalk_For', "ALL", "", "INPUT")
        tcRF.write("Intersect the focus areas with the forest polygon layer to generate forest alongside roads.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Dissolve the roads by road_ID """
        arcpy.Dissolve_management('SideWalk_For', 'SiWa_For_Blk', ["road_ID"], [["seg_area", "FIRST"]])
        tcRF.write("Dissolve the forest along roads by the road identifier field: road_ID, maintain the Shape_Area field.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calcualte Percent Tree Cover """
        arcpy.AddField_management('SiWa_For_Blk', "Pct_TC", "FLOAT")
        arcpy.CalculateField_management('SiWa_For_Blk', "Pct_TC", "(!Shape_Area!*100)/!FIRST_seg_area!", "PYTHON_9.3")
        tcRF.write("Calculate new variable in the forest grouped by road identifier layer: Pct_TC (float) = Shape_Area*100 / seg_area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add the Percent Tree Cover back to the Block Segments """
        arcpy.JoinField_management('RdsByBlk_For', "OBJECTID", 'SiWa_For_Blk', "road_ID", "Pct_TC")
        tcRF.write("Join the Pct_TC field to the road layer based on the road_ID field.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        codeblock1 = """def changenull(x):
            if x < 0:
                return 0
            else:
                return x"""
        arcpy.CalculateField_management('RdsByBlk_For', "Pct_TC", "changenull(!Pct_TC!)", "PYTHON_9.3", codeblock1)
        arcpy.DeleteField_management('RdsByBlk_For', ['dirTrvl', 'numLanes', 'Mx_buff', 'Mn_buff'])
        tcRF.write("Change null values in the Pct_TC field to 0.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Clip to the Boundary """
        arcpy.Clip_analysis('RdsByBlk_For', freqDir + '/Bnd_Cty', 'PctStTC_Bnd')
        tcRF.write("Clip road file to the community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Project into Albers """
        arcpy.Project_management('PctStTC_Bnd', city + '_PctStTC', prjfileALB)
        tcRF.write("Project the road file into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add to Final Directory """
        arcpy.FeatureClassToFeatureClass_conversion(city + '_PctStTC', finalDir, city + '_PctStTC')
        tcRF.write("Copy the feature class to the final geodatabase for use in EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to Raster """
        arcpy.PolylineToRaster_conversion('PctStTC_Bnd', 'Pct_TC', splitDir + '/' + city + '_PctStTC.tif', '', '', 10)
        tcRF.write("Convert the road file to raster with the Pct_TC as the value field and a cell size of 10m.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- RUN GREEN SPACE ANALYSIS --------------------------------------

        """ Dissolve roads and split at intersections """
        arcpy.Dissolve_management(walkroads, 'GS_WalkRds')
        gsRF.write("Dissolve the Walkable Roads.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        arcpy.SplitLineAtPoint_management('GS_WalkRds', 'Intersections', 'RdsByBlk_GS', "3 Meters")
        gsRF.write("Split the dissolved walkable roads at each intersection point to create road blocks.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create 50m Green Space Buffers """
        arcpy.Buffer_analysis('RdsByBlk_GS', 'FocalArea_GS', "25 Meters", "FULL", "FLAT")
        gsRF.write("Create the focus areas by buffering the road blocks by 25 meters with options FULL, FLAT, and NONE.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create segment IDs and calculate segment areas """
        arcpy.AddField_management('FocalArea_GS', "road_ID", "FLOAT")
        arcpy.AddField_management('FocalArea_GS', "seg_area", "FLOAT")
        arcpy.CalculateField_management('FocalArea_GS', "road_ID", "!ORIG_FID!", "PYTHON_9.3")
        arcpy.CalculateField_management('FocalArea_GS', "seg_area", "!Shape_area!", "PYTHON_9.3")
        gsRF.write("Add and calculate fields road_ID (float) = ORIG_FID and seg_area (float) = Shape_area in the focus area feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ If the LC isn't large enough, limit the output """
        if bigEnough == 0:
            arcpy.MakeFeatureLayer_management("FocalArea_GS", 'FA_GS_lyr')
            arcpy.SelectLayerByLocation_management('FA_GS_Lyr', 'COMPLETELY_WITHIN', freqDir + '/LC_Poly', '', 'NEW_SELECTION')
            arcpy.CopyFeatures_management('FA_GS_Lyr', 'FocalArea_GS_EE')
            arcpy.SelectLayerByAttribute_management('FA_GS_lyr', 'CLEAR_SELECTION')
            gsRF.write("Due to the extent of the Land Cover, the analysis area is smaller than the EnviroAtlas Community Boundary. Remove any features that are not within the analysis area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Intersect the Green Space Polygons with the Green Space Focus Area """
        arcpy.RepairGeometry_management("GBSPoly")
        try:
            arcpy.Intersect_analysis(['FocalArea_GS_EE', "GBSPoly"], 'SideWalk_GS', "ALL", "", "INPUT")

        except:
            arcpy.Intersect_analysis(['FocalArea_GS', 'GBSPoly'], 'SideWalk_GS', "ALL", "", "INPUT")
        gsRF.write("Intersect the focus areas with the green space polygon layer to generate green space alongside roads.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Dissolve the road segments by segement and maintain the road ID """
        arcpy.Dissolve_management('SideWalk_GS', 'SiWa_GS_Blk', ["road_ID"], [["seg_area", "FIRST"]])
        gsRF.write("Dissolve the green space along roads by the road identifier field: road_ID, maintain the Shape_Area field.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate percent green space by segment """
        arcpy.AddField_management('SiWa_GS_Blk', "Pct_GS", "FLOAT")
        arcpy.CalculateField_management('SiWa_GS_Blk', "Pct_GS", "(!Shape_Area!*100)/!FIRST_seg_area!", "PYTHON_9.3")
        gsRF.write("Calculate new variable in the green space grouped by road identifier layer: Pct_GS (float) = Shape_Area*100 / seg_area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add the percent green space to the road segments """
        arcpy.JoinField_management('RdsByBlk_GS', "OBJECTID", 'SiWa_GS_Blk', "road_ID", "Pct_GS")
        gsRF.write("Join the Pct_GS field to the road layer based on the road_ID field.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert Nulls to 0 """
        codeblock2 = """def changenull(x):
            if x < 0:
                return 0
            else:
                return x"""
        arcpy.CalculateField_management('RdsByBlk_GS', "Pct_GS", "changenull(!Pct_GS!)", "PYTHON_9.3", codeblock2)
        arcpy.DeleteField_management('RdsByBlk_GS', ['dirTrvl', 'numLanes', 'Mx_buff', 'Mn_buff'])
        gsRF.write("Change null values in the Pct_GS field to 0.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Clip to the Boundary """
        arcpy.Clip_analysis('RdsByBlk_GS', freqDir + '/Bnd_Cty', 'PctStGS_Bnd')
        gsRF.write("Clip road file to the community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Project into Albers """
        arcpy.Project_management('PctStGS_Bnd', city + '_PctStGS', prjfileALB)
        gsRF.write("Project the road file into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add to Final Directory """
        arcpy.FeatureClassToFeatureClass_conversion(city + '_PctStGS', finalDir, city + '_PctStGS')
        gsRF.write("Copy the feature class to the final geodatabase for use in EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to Raster """
        arcpy.PolylineToRaster_conversion('PctStGS_Bnd', 'Pct_GS', splitDir + '/' + city + '_PctStGS.tif', '', '', 10)
        gsRF.write("Convert the road file to raster with the Pct_GS as the value field and a cell size of 10m.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'Green Space and Tree Cover Along Walkable Roads End Time: ' + time.asctime() + '\n'


        #-------- Block group summarized metrics (Ferdouz Cochran) ---------------
        """ Intersect street data with block groups """
        arcpy.Intersect_analysis([city + '_PctStTC', freqDir + '/' + 'BG_Alb'], city + '_BG_PctStTC', "ALL", "", "LINE")
        arcpy.Intersect_analysis([city + '_PctStGS', freqDir + '/' + 'BG_Alb'], city + '_BG_PctStGS', "ALL", "", "LINE")

        """ Calculate percent of total street length GS/TC """
        arcpy.AddField_management(city + '_BG_PctStTC', 'TC_length', "DOUBLE")
        arcpy.CalculateField_management(city + "_BG_PctStTC", 'TC_length', '(!Pct_TC! / 100.0) * !Shape_Length!', "PYTHON_9.3")
        arcpy.AddField_management(city + '_BG_PctStGS', 'GS_length', "DOUBLE")
        arcpy.CalculateField_management(city + "_BG_PctStGS", 'GS_length', '(!Pct_GS! / 100.0) * !Shape_Length!', "PYTHON_9.3")

        """ Summarize at block group level """
        arcpy.Statistics_analysis(city + '_BG_PctStTC', city + '_BG_PctStTC_sumstat', [["Shape_Length", "SUM"], ["TC_length", "SUM"]], "bgrp")
        arcpy.Statistics_analysis(city + '_BG_PctStGS', city + '_BG_PctStGS_sumstat', [["Shape_Length", "SUM"], ["GS_length", "SUM"]], "bgrp")

        """ Calculate percent of block group streets with GS/TC """
        arcpy.AddField_management(city + '_BG_PctStTC_sumstat', 'BG_PctStTC', "DOUBLE")
        arcpy.CalculateField_management(city + "_BG_PctStTC_sumstat", 'BG_PctStTC', '(!SUM_TC_length! / !SUM_Shape_Length!) * 100.0', "PYTHON_9.3")
        arcpy.AddField_management(city + '_BG_PctStGS_sumstat', 'BG_PctStGS', "DOUBLE")
        arcpy.CalculateField_management(city + "_BG_PctStGS_sumstat", 'BG_PctStGS', '(!SUM_GS_length! / !SUM_Shape_Length!) * 100.0', "PYTHON_9.3")

        """ Copy and join to BG features """
        arcpy.CopyFeatures_management(freqDir + '/' + 'BG_Alb', city + 'BG_GSTCnWR_summary')
        flds = [f.name for f in arcpy.ListFields(city + 'BG_GSTCnWR_summary')]
        for field in flds:
            if field not in ['bgrp']:
                try:
                    arcpy.DeleteField_management(city + 'BG_GSTCnWR_summary', field)
                except:
                    pass
            else:
                pass
        arcpy.JoinField_management(city + 'BG_GSTCnWR_summary', 'bgrp', city + '_BG_PctStTC_sumstat', 'bgrp','BG_PctStTC')
        arcpy.JoinField_management(city + 'BG_GSTCnWR_summary', 'bgrp', city + '_BG_PctStGS_sumstat', 'bgrp','BG_PctStGS')


        #-------- COMPELETE LOGFILES ---------------------------------------------
        gsRF.close()
        tcRF.close()
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
        gsRF.write("\nSomething went wrong.\n\n")
        gsRF.write("Pyton Traceback Message below:")
        gsRF.write(traceback.format_exc())
        gsRF.write("\nArcMap Error Messages below:")
        gsRF.write(arcpy.GetMessages(2))
        gsRF.write("\nArcMap Warning Messages below:")
        gsRF.write(arcpy.GetMessages(1))

        gsRF.write( "\n\nEnded at " + time.asctime() + '\n')
        gsRF.write("\n---End of Log File---\n")

        if gsRF:
            gsRF.close()
        if tcRF:
            tcRF.close()
