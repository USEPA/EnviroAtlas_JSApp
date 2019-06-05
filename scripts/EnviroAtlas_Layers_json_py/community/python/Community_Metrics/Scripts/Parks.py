#-----------------------------------------------------------------------------
# Name:     Parks.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  05/01/2017
#
# Purpose:  Calculates the population within and beyond walking distance of a
#           park entrance on walkable raods. Walking distance is defined as 500m.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the ParksP function.
#           The data needed to process this scripts is:
#               1. Park Entrances (community, in Albers)
#               2. Walkable Roads (community, in Albers)
#               3. Block Groups (community, in Albers with populations)
#               4. Dasymetric (community)
#               5. Boundary (community, in Albers)
#
# Directions:
#           1.  Create the parks, walkable roads, and park entrances based on
#               the directions in the New Communities Procedures Document.
#           2.  After running, the research layers will need to be zipped and
#               shared with health researchers.
#-----------------------------------------------------------------------------

def ParksP(city, inDir, workFld, speckle = False):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_Parks.gdb')
    except:
        pass
    workGDB = str(workFld) + '/' + str(city) + '_Parks.gdb'

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'
    prjfileALB = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'

    """ Parks Input Directory """
    entrances = str(inDir) + '/' + 'Parks.gdb/' + str(city) + '_Park_Enter_Alb'
    walkroads = str(inDir) + '/' + 'Parks.gdb/' + str(city) + '_Walk_Road_Alb'
    harvDir ='G:/OtherFolks/Harvard'

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
        tmpName = city + '_Park_Pop_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        popRF = open(reportfileName, 'w')

    	tmpName = city + '_Park_Prox_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        proxRF = open(reportfileName, 'w')

    	tmpName = city + '_ParkDist_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        distRF = open(reportfileName, 'w')

        try:
            loglist = sorted (f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_Reuse'))
            tmpName = loglist[-1]
        except:
            tmpName = city + '_Reuse_' + time.strftime('%Y%m%d_%H-%M')   + '.txt'
        reportfileName = reportfileDir + '/' + tmpName

        try:
			ReuseRF = open(reportfileName, 'a')
        except:
            ReuseRF = open(reportfileName, 'w')
            print 'Creating Reuse Log'

        steps = []

        # Write out first line of report file
        print 'Parks Start Time: ' + time.asctime()
        steps.append("Begin with Esri 2011 Data and Maps Parks Layer and 2011 NavTeq Parks Layer, clipped to the 5km border of the EnviroAtlas community boundary. Using online parks and recreation departments for municipalities, counties, and states, hand digitize any missing parks. --ANALYST-TIME--\n")
        steps.append("From the 2011 NavTeq Streets, limit streets to walkable roads: FUNC_CLASS < 2; SPEED_CAT < 3; AR_PEDEST = 'Y'.--012017" + '--\n')
        steps.append("Clip NavTeq Streets to the 5km border of the EnviroAtlas community boundary.--ANALYST-TIME--\n")
        steps.append("Assign entrance locations to each park based on imagery and information from individual parks and recreation departments. For parks that are open to the street, assign entrances every 1,000m as well as at all intersections along the park edge.--ANALYST-TIME--\n")

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/Dasy'
        arcpy.env.snapRaster = freqDir + '/Dasy'

        """ Convert Walkable Roads and Park Entrances into Albers """
        arcpy.Project_management(freqDir + '/Bnd_5km', freqDir + '/Bnd_5km_Alb', prjfileALB)

        """ Copy entrances and walkable roads to working directory """
        arcpy.CopyFeatures_management(entrances, 'Park_Enter_Alb')
        arcpy.CopyFeatures_management(walkroads, 'Walk_Roads_Alb')

        """ Convert Roads to Raster Dataset """
        arcpy.AddField_management('Walk_Roads_Alb', 'Value', 'SHORT')
        arcpy.CalculateField_management('Walk_Roads_Alb', 'Value', '1', 'PYTHON_9.3')
        arcpy.PolylineToRaster_conversion('Walk_Roads_Alb', 'Value', 'Walkable', '', '', '10')
        steps.append("Convert roads to 10m raster, snapped to EnviroAtlas Dasymetric (2011/October 2015).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Calculate Distance away from Park Entrances """
        outCostDist = arcpy.sa.CostDistance('Park_Enter_Alb', 'Walkable')
        outCostDist.save('ParkDist')
        steps.append("Run Cost Distance tool with the entrance points as the source data and the rasterized roads as the cost raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

		#-------- POPULATION ANALYSIS ---------------------------------------------
        """ Create Walking Lines for Distances that are Walkable or Not Walkable """
        outReclass1 = arcpy.sa.Reclassify('ParkDist', 'Value', arcpy.sa.RemapRange([[0,500,1],[500,200000,2]]))
        outReclass1.save('WalkOrNot')
        steps.append("Reclassify distance raster into groups of 0-500m and above 500m.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to Polygons """
        arcpy.RasterToPolygon_conversion('WalkOrNot', 'WalkOrNot_Poly', 'NO_SIMPLIFY')
        steps.append("Convert the reclassified raster into polygons.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Select Walkable Polygons """
        arcpy.Select_analysis('WalkOrNot_Poly', 'WalkPark_Poly', 'gridcode = 1')
        steps.append("Select by attributes the polygons for the distance group representing 0-500 meters.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Intersect the Polygons with the Walkable Roads """
        arcpy.Intersect_analysis(['WalkPark_Poly', 'Walk_Roads_Alb'], 'WalkPark_Rd', 'ONLY_FID', '', 'LINE')
        steps.append("Clip the walkable roads layer to the selected records in the polygon layer.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create Population Analysis Area """
        arcpy.Buffer_analysis('WalkPark_Rd', 'W500_B60', '60 Meters', 'FULL', 'ROUND', 'ALL')
        steps.append("Buffer the new road segments by 60m.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.AddField_management('W500_B60', 'Value', 'SHORT')
        arcpy.CalculateField_management('W500_B60', 'Value', '1', 'PYTHON_9.3')
        arcpy.PolygonToRaster_conversion('W500_B60', 'Value', 'W500_B60_R', 'MAXIMUM_AREA', '', '30')
        steps.append("Convert the buffer into a raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Extract the Population within the Walkable Area """
        outExtractByMask = arcpy.sa.ExtractByMask(freqDir + '/Dasy', 'W500_B60_R')
        outExtractByMask.save('Park_Pop')
        steps.append("Extract by Mask the EnviroAtlas dasymetrics (2011/October 2015) within the rasterized 60m buffer.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Zonal Statistics ------------------------------------- """
        outZSaT = arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', 'Park_Pop', 'ParkPop_ZS', '', 'SUM')
        steps.append("Calculate Zonal Statistics as a Table on the extracted dasymetics with the zones being the 2010 block groups within the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Calculate Total Dasy Population, if necessary ------------------ """
        """ Use the existing data """
        fieldNames = [f.name for f in arcpy.ListFields(freqDir + '/BG_Alb')]
        if 'Dasy_Pop' in fieldNames:
            steps.append("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop. --Dasy_Pop" + '--\n')
            """ Create population data """
        else:
            arcpy.AddField_management(freqDir + '/BG_Alb', 'Dasy_Pop', 'LONG')
            arcpy.sa.ZonalStatisticsAsTable(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy', freqDir + '/Dasy_ZS', '', 'SUM')
            arcpy.JoinField_management(freqDir + '/BG_Alb', 'bgrp', freqDir + '/Dasy_ZS', 'bgrp', ['SUM'])
            arcpy.CalculateField_management(freqDir + '/BG_Alb', 'Dasy_Pop', '!SUM!', 'PYTHON_9.3')
            arcpy.DeleteField_management(freqDir + '/BG_Alb', ['SUM'])
            arcpy.JoinField_management(freqDir + '/BG', 'bgrp',freqDir + '/BG_Alb', 'bgrp', ['Dasy_Pop'])
            steps.append("Calculate Zonal Statistics as a Table for the EnviroAtlas Dasymetrics (2011/October 2015) with the zones being the 2010 block groups within the EnviroAtlas community boundary. Add resulting population sums to the community block groups as attribute Dasy_Pop. --" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("Dasy_Pop--"+ time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Population Calculation ------------------------------------- """
        """ Copy BG Table """
        arcpy.TableToTable_conversion(freqDir + '/BG_Alb', workGDB, 'Parks_Pop_Wrk', '', 'bgrp')
        arcpy.DeleteField_management('Parks_Pop_Wrk', ['SUM_HOUSIN', 'Black', 'Blackpct', 'NonWhite', 'PopWithin', 'PctWithin', 'Area', 'PLx2_Pop', 'PLx2_Pct', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite_Pop', 'NonWt_Pct', 'Shape_Le_1', 'Shape_Area', 'Density', 'LandA_M', 'H_Income_M', 'test_med', 'Acres', 'NonWhite_P', 'State'])
        parktbl = 'Parks_Pop_Wrk'
        steps.append("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP and Dasy_Pop fields.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Add Fields """
        arcpy.AddField_management(parktbl, 'IWDP_Pop', 'LONG')
        arcpy.AddField_management(parktbl, 'BWDP_Pop', 'LONG')
        arcpy.AddField_management(parktbl, 'IWDP_Pct', 'FLOAT', 5, 2)
        arcpy.AddField_management(parktbl, 'BWDP_Pct', 'FLOAT', 5, 2)
        steps.append("Add fields to the new table for IWDP_Pop (Long), BWDP_Pop (Long), IWDP_Pct (Float), BWDP_Pct (Float).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Join ZS Table and Calculate Fields """
        arcpy.JoinField_management(parktbl, 'bgrp', 'ParkPop_ZS', 'bgrp', ['SUM'])
        steps.append("Join the results of the zonal statistics with the new table.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        arcpy.CalculateField_management(parktbl, 'IWDP_Pop', '!SUM!', 'PYTHON_9.3')
        steps.append("Calculate field: IWDP_POP = [zonal statistics results].SUM; remove join.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.MakeTableView_management(parktbl, 'Parks_tbl')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'IWDP_Pop IS NULL')
        arcpy.CalculateField_management('Parks_tbl', 'IWDP_Pop', '0', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')

        arcpy.CalculateField_management('Parks_tbl', 'BWDP_Pop', '!Dasy_Pop!-!IWDP_Pop!', 'PYTHON_9.3')

        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'IWDP_Pop > 0')
        arcpy.CalculateField_management('Parks_tbl', 'IWDP_Pct', '"%.2f" % (float(!IWDP_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')

        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'IWDP_Pop = 0')
        arcpy.CalculateField_management('Parks_tbl', 'IWDP_Pct', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')

        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'BWDP_Pop > 0')
        arcpy.CalculateField_management('Parks_tbl', 'BWDP_Pct', '"%.2f" % (float(!BWDP_Pop!)/float(!Dasy_Pop!) * 100)', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')

        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'BWDP_Pop = 0')
        arcpy.CalculateField_management('Parks_tbl', 'BWDP_Pct', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')
        steps.append("Calculate fields: BWDP_Pop = Dasy_Pop - IWDP_Pop; IWDP_Pct = IWDP_Pop/Dasy_Pop*100; BWDP_Pct = BWDP_Pop/Dasy_Pop*100. Limit _Pct values to 2 decimal points.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add Nulls """
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'NEW_SELECTION', 'SUM_POP10 = 0')
        arcpy.CalculateField_management('Parks_tbl', 'IWDP_Pop', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('Parks_tbl', 'IWDP_Pct', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('Parks_tbl', 'BWDP_Pop', '-99999', 'PYTHON_9.3')
        arcpy.CalculateField_management('Parks_tbl', 'BWDP_Pct', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Parks_tbl', 'CLEAR_SELECTION')
        steps.append("Calculate fields where Dasy_Pop = 0: All Fields = -99999.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.DeleteField_management('Parks_tbl', ['SUM_POP10', 'SUM', 'EAID', 'Dasy_Pop'])
        arcpy.CopyRows_management('Parks_tbl', 'Park_Pop_Fnl')

        """ Create Final Table """
        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_Park_Pop')
        except:
            pass
        arcpy.TableToTable_conversion('Park_Pop_Fnl', finalDir, str(city) + '_Park_Pop')

        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_Park_Pop')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'IWDP_Pop', 'IWDP_Pct', 'BWDP_Pop', 'BWDP_Pct']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_Park_Pop', [field])

        steps.append("Export the fields to be displayed in the EnviroAtlas to a final gdb table. IWDP_Pop, BWDP_Pop, IWDP_Pct, BWDP_Pct.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	for step in steps:
			popRF.write(step)
        popRF.close()

        print 'ParkPop End Time; ParkProx Start Time: ' + time.asctime()

        #-------- PARKS PROXIMITY ANALYSIS --------------------------------------------------------
        """ Reset Environments """
        arcpy.env.extent = 'ParkDist'
        arcpy.env.snapRaster = freqDir + '/Dasy'
    	steps = steps[0:6]

        """ Convert the cost distance raster into points """
        arcpy.RasterToPoint_conversion('ParkDist', 'DistPts', 'Value')
        steps.append("Convert the distance raster into a point feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Interpolate the walking distance to park entrances between the points """
        outNNIntp = arcpy.sa.NaturalNeighbor('DistPts', 'grid_code', 10)
        outNNIntp.save('NNIntp')
        steps.append("Run Natural Neighbor Interpolation with Cell Size = 10 to create raster proximity zones.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Reclassify the interpolation surface into distance classes """
        outReclass1 = arcpy.sa.Reclassify('NNIntp', 'Value', arcpy.sa.RemapRange([[0,250,250],[250,500,500],[500,750,750],[750,1000,1000],[1000,2000,2000],[2000,3000,3000],[3000,4000,4000],[4000,5000,5000],[5000,100000,-99999]]))
        outReclass1.save('NNIntp_ReC')
        steps.append("Reclassify Interpolation with breaks at 250, 500, 750, 1000, 2000, 3000, 4000, 5000, [Highest Value], New Value = Break Value except Highest Value = -99999.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Analyze potential speckling and fix """
        if speckle == True:
            majras = arcpy.sa.FocalStatistics(outReclass1, arcpy.sa.NbrRectangle(3,3,"CELL"), "MAJORITY")
            minras = outReclass1 - majras
            diffbin = arcpy.sa.Reclassify(minras, "VALUE", arcpy.sa.RemapRange([[-105000,-1,1],[0,0,0],[1,105000,1]]))
            fix = arcpy.sa.Con(diffbin == 1, majras, outReclass1)
            fix1 = arcpy.sa.Con(arcpy.sa.IsNull(fix), outReclass1, fix)

            rows = arcpy.SearchCursor(diffbin)
            for r in rows:
                v = r.getValue("VALUE")
                c = r.getValue("COUNT")
                print v,c

            rows1 = arcpy.SearchCursor(outReclass1)
            cells = []
            for r in rows1:
                cells.append(r.getValue("COUNT"))

            print("Changed " + str(c) + " cells out of " + str(sum(cells)) + " cells, or " + str(c/sum(cells)*100) + "%")

            fix1.save(workGDB + '/NNIntp_ReC_speck')
            del majras, minras, diffbin, fix, rows, rows1

            arcpy.RasterToPolygon_conversion('NNIntp_ReC_speck', 'Dist_Poly_speck', 'SIMPLIFY')
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
            else:
                pass

            """ Fill in area missed by Natural Neighbor Interpolation """
            arcpy.Project_management(freqDir + '/Bnd_Cty', freqDir + '/Bnd_Cty_Alb', prjfileALB)
            arcpy.Erase_analysis(freqDir + '/Bnd_Cty_Alb', 'Dist_Poly_speck', 'NullArea')
            arcpy.AddField_management('NullArea', 'gridcode', 'LONG')
            arcpy.CalculateField_management('NullArea', 'gridcode', '-99999', 'PYTHON_9.3')
            arcpy.Append_management('NullArea', 'Dist_Poly_speck', 'NO_TEST')

            """ Convert field from gridcode to ParkProxD """
            arcpy.MakeFeatureLayer_management('Dist_Poly_speck', 'Dist_Poly_lyr')
            arcpy.AddField_management('Dist_Poly_speck', 'ParkProxD')
            arcpy.CalculateField_management('Dist_Poly_speck', 'ParkProxD', '!gridcode!', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('Dist_Poly_lyr', 'NEW_SELECTION', 'ParkProxD = 20000')
            arcpy.CalculateField_management('Dist_Poly_lyr', 'ParkProxD', '-99999', 'PYTHON_9.3')
            arcpy.SelectLayerByAttribute_management('Dist_Poly_lyr', 'CLEAR_SELECTION')
            arcpy.DeleteField_management('Dist_Poly_lyr', ['gridcode', 'ID'])

            """ Clip the polygons to the boundary and the county lines. """
            arcpy.Clip_analysis('Dist_Poly_lyr', freqDir + '/Bnd_Cty_Alb', str(city) + '_Park_Prox_speck')
            steps.append("Single cell speckling in Reclassificed NN Interpolation corrected with 3x3 majority filter. Changed " + str(c) + " cells out of " + str(sum(cells)) + " cells, or " + str(c/sum(cells)*100) + "%. --" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        else:
            print "Speckling not checked"
            """ This part of the script executes if anything went wrong in the main script above """
            #-------- PRINT ERRORS ---------------------------------------------------
            print "\nSomething went wrong.\n\n"
            print "Python Traceback Message below:"
            print traceback.format_exc()
            print "\nArcMap Error Messages below:"
            print arcpy.GetMessages(2)
            print "\nArcMap Warning Messages below:"
            print arcpy.GetMessages(1)

            steps.append("Single cell speckling in Reclassificed NN Interpolation ignored.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')


        """ Convert the surface into polygons """
        arcpy.RasterToPolygon_conversion('NNIntp_ReC', 'Dist_Poly', 'SIMPLIFY')
        steps.append("Convert the reclassified raster into a polygon feature class.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

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
            steps.append("Clip the EnviroAtlas Community Boundary to the county lines for the community to limit the output to land area.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("Bnd_Cty--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            steps.append("Clip the EnviroAtlas Community Boundary to the county lines for the community to limit the output to land area.--Bnd_Cty" + '--\n')

        """ Fill in area missed by Natural Neighbor Interpolation """
        if arcpy.Exists(freqDir + '/Bnd_Cty_Alb') == False:
            arcpy.Project_management(freqDir + '/Bnd_Cty', freqDir + '/Bnd_Cty_Alb', prjfileALB)
        arcpy.Erase_analysis(freqDir + '/Bnd_Cty_Alb', 'Dist_Poly', 'NullArea')
        steps.append("Erase the interpolated polygons from the EnviroAtlas clipped community boundary to fill any gaps in the interpolation.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.AddField_management('NullArea', 'gridcode', 'LONG')
        arcpy.CalculateField_management('NullArea', 'gridcode', '-99999', 'PYTHON_9.3')
        steps.append("Add field gridcode = -99999 to the clipped area of the boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Append_management('NullArea', 'Dist_Poly', 'NO_TEST')
        steps.append("Append the clipped area of the boundary onto the interpolation polygon layer.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert field from gridcode to ParkProxD """
        arcpy.MakeFeatureLayer_management('Dist_Poly', 'Dist_Poly_lyr')
        arcpy.AddField_management('Dist_Poly', 'ParkProxD')
        arcpy.CalculateField_management('Dist_Poly', 'ParkProxD', '!gridcode!', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Dist_Poly_lyr', 'NEW_SELECTION', 'ParkProxD = 20000')
        arcpy.CalculateField_management('Dist_Poly_lyr', 'ParkProxD', '-99999', 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('Dist_Poly_lyr', 'CLEAR_SELECTION')
        arcpy.DeleteField_management('Dist_Poly_lyr', ['gridcode', 'ID'])
        steps.append("Convert field gridcode into field ParkProxD; delete extraneous fields.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Clip the polygons to the boundary and the county lines. """
        arcpy.Clip_analysis('Dist_Poly_lyr', freqDir + '/Bnd_Cty_Alb', str(city) + '_Park_Prox')
        steps.append("Clip ParkProx to the clipped EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Export the layer to the final folder """
        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_Park_Prox')
        except:
            pass
        arcpy.FeatureClassToFeatureClass_conversion(str(city) + '_Park_Prox', finalDir, str(city) + '_Park_Prox')

        print 'Parks End Time; House Level Park Distance Start Time: ' + time.asctime()
        steps.append("Copy the feature class to the final geodatabase.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        for step in steps:
			proxRF.write(step)
        proxRF.close()

        ###-------- PARKS DISTANCE ANALYSIS--------------------------------------------------------
        """ Set Environments """
        steps = steps[0:8]

        """ Reclassify the Natural Neighbor Raster """
        ReC2 = arcpy.sa.Reclassify('NNIntp', 'Value', arcpy.sa.RemapRange([[0,5000,1],[5000,2000000,2]]))
        ReC2.save('NNIntp_5000Split')
        steps.append("Reclassify the interpolated raster where Values 0-5000 = 1 and Values over 5000 = 2.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Add Nulls """
        ConWalk = arcpy.sa.Con('NNIntp_5000Split', 'NNIntp', '-8888', 'Value = 1')
        ConWalk.save('ParkDist_Corrected')
        steps.append("Use a conditinal statement on the reclassified raster if the value = 2, convert the value to -8888 and if the value = 1, use the value from the interpolated raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Conver to TIFF """
##        arcpy.CopyRaster_management('ParkDist_Corrected', str(harvDir) + '/' + str(city) + '_ParkDist.tif')
        steps.append("Convert the raster into a GeoTIFF for use with EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'House Level Park Distance End Time: ' + time.asctime() + '\n'

        for step in steps:
			distRF.write(step)
        distRF.close()

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
        distRF.write("\nSomething went wrong.\n\n")
        distRF.write("Pyton Traceback Message below:")
        distRF.write(traceback.format_exc())
        distRF.write("\nArcMap Error Messages below:")
        distRF.write(arcpy.GetMessages(2))
        distRF.write("\nArcMap Warning Messages below:")
        distRF.write(arcpy.GetMessages(1))

        distRF.write( "\n\nEnded at " + time.asctime() + '\n')
        distRF.write("\n---End of Log File---\n")

        if distRF:
            distRF.close()
