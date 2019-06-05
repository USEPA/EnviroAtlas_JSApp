#-----------------------------------------------------------------------------
# Name:     IntDenPrep.py
#
# Author:   Leah Yngve
# Updated:  Ali Mackey
#
# Created:  2015
# Updated:  05/01/2017
#
# Purpose:  This scripts creates the intersection density layer.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the IntDen function.
#           The data needed to process this scripts is:
#               1. Walkable Roads (community, in Albers)
#-----------------------------------------------------------------------------

def IntDen(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_IntDen.gdb')
    except:
        print 'IntDen GDB already exists'

    workDir = str(workFld) + '/' + str(city) + '_IntDen.gdb'

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

    if os.path.isdir(str(workFld) + '/' + city + '_Split') == True:
        pass
    else:
        os.makedirs(str(workFld) + '/' + city + '_Split')
    splitDir = str(workFld) + '/' + city + '_Split'

    """ Split Raster Directory """
    if os.path.isdir(str(workFld) + '/' + city + '_Split') == True:
        pass
    else:
        os.makedirs(str(workFld) + '/' + city + '_Split')
    splitDir = str(workFld) + '/' + city + '_Split'

    """ RdsForIntDen Directory """
    rdsIntDen = inDir + '/Input.gdb/RdsForIntDen'

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
        tmpName = city + '_IntDen_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')

        """ Write out first line of report file """
        print 'Intersection Density Start Time: ' + time.asctime()
        reportFile.write("Begin with the 2011 NavTeq Streets layer.--201701" + '--\n')
        reportFile.write("Limit streets to walkable roads: FUNC_CLASS < 2; SPEED_CAT < 3 AND > 7; AR_PEDEST = 'Y'.--201701" + '--\n')
        reportFile.write("Convert multipart roads to single part roads.--201701" + '--\n')
        reportFile.write("Use the 2011 NavTeq LandUseA and LandUseB to identify road segments within airports, amusement parks, beaches, cemeteries, hospitals, industrial complexes, military bases, railyards, shopping centers, and golf course. Remove these roads if they have no street name value (ST_NAME).--201701" + '--\n')
    	reportFile.write("Calculate new variable in the road layer for the direction of travel (0 for two ways, 1 for one way): Clps_Fld (SHORT) = 0 if DIR_TRAVEL=B, otherwise = 1--201701" + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.snapRaster = freqDir + '/LC'
        arcpy.env.extent = freqDir + '/LC'

    	"""-------- Finish Roads Prep ----------------------------- """

    	""" Clip RdsForIntDen """
    	arcpy.Clip_analysis(rdsIntDen, freqDir + '/Bnd_5km', 'RdsForIntDen')
    	reportFile.write("Clip the National Intersection Density Roads layer to the 5km buffer of the EnviroAtlas community.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Project into Albers """
    	arcpy.Project_management('RdsForIntDen', 'RdsForIntDen_Alb', prjfileALB)
    	reportFile.write("Project the clipped roads into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Merge Divided Roads """
        arcpy.MultipartToSinglepart_management('RdsForIntDen_Alb', 'RdsForIntDen_SglPrt')
    	arcpy.MergeDividedRoads_cartography('RdsForIntDen_SglPrt', "Clps_Fld", "30 meters", "PreppedRoads")
    	reportFile.write("Merge divided roads into one centered segment.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Unsplit Lines """
        arcpy.UnsplitLine_management('PreppedRoads', 'UnSplitRds', "ST_NAME")
        reportFile.write("Unsplit roads by street name.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Create Intersections """
        arcpy.Intersect_analysis(['UnSplitRds','UnSplitRds'], 'Intersections', "ONLY_FID",'',"POINT")
        reportFile.write("Create intersection points by intersecting the roads with themselves with output = point.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Delete multiples """
        arcpy.DeleteIdentical_management('Intersections', "Shape")
        reportFile.write("Delete identical points.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Run Density Calculation """
        den = arcpy.sa.KernelDensity('Intersections', "NONE", 10, 750, "SQUARE_KILOMETERS")
        den.save(workDir + "/IntDen_Raw")
        reportFile.write("Use the spatial analyst kernel density tool with a cell size of 10m, search radius of 750m and scale factor of square kilometers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Clip to the boundary and convert 0 to Null """
        arcpy.Clip_management("IntDen_Raw", '', city + "_IntDen", freqDir + '/Bnd', '0', 'ClippingGeometry', '')
        reportFile.write("Clip the raster to the community boundary and convert 0 values to No Data.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to TIFF for publishing """
        arcpy.RasterToOtherFormat_conversion(city + "_IntDen", splitDir, "TIFF")
        reportFile.write("Convert the raster to TIFF format for use in EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Convert to polygons for posting """
        newID = arcpy.sa.Reclassify('IntDen_Raw', 'VALUE', arcpy.sa.RemapRange([[0,20,20], [20,40,40], [40,60,60], [60,80,80], [80,100,100],
                      [100,150,150], [150,200,200], [200,250,250]]), 'NODATA')
        newID.save('IntDen_ReC')
        reportFile.write("Reclassify the Raster into Qualitative Breaks.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        arcpy.RasterToPolygon_conversion('IntDen_ReC', 'IntDen_Poly', 'SIMPLIFY', 'VALUE')
        reportFile.write("Convert the Reclassified Raster into a Polygon.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Clip and Convert to Albers """
        arcpy.Clip_analysis('IntDen_Poly', freqDir + '/Bnd', 'IntDen_Clip')
        reportFile.write("Clip the polygons to the EnviroAtlas Community Boundary--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        arcpy.AlterField_management('IntDen_Clip', 'gridcode', 'IntDen')

    	""" Add to Final Directory """
    	try:
            arcpy.Delete_management(finalDir + '/' + city + '_IntDen')
        except:
            pass
        arcpy.FeatureClassToFeatureClass_conversion('IntDen_Clip', finalDir, city + '_IntDen')
        print 'Intersection Density End Time: ' + time.asctime() + '\n'
        reportFile.write("Copy the feature class to the final geodatabase.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- COMPELETE LOGFILES ---------------------------------------------
        reportFile.close()

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
