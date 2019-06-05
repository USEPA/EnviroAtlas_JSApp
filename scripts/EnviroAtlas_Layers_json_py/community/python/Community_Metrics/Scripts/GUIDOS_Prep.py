#-----------------------------------------------------------------------------
# Name:     GUIDOS_Prep.py
#
# Author:   Ali Mackey
#
# Created:  07/31/2014
# Updated:  04/27/2017
#
# Purpose:  This script prepares the land cover for use in GUIDOS. It prepares
#           the land cover for a water-as-background analysis.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the guidos_prep function.
#           The data needed to process this scripts is:
#               1. Land Cover (community)
#
# Directions:
#           After this script completes, the resulting rasters must be converted
#           into striped tiffs (as opposed to tiled tiffs) before the second
#           part of the GUIDOS processing occurs. This is completed with an
#           ArcGIS Model. See New Communities Procedures for Details.
#-----------------------------------------------------------------------------
def Guidos_Prep(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_GUIDOS.gdb')
    except:
        print 'GUIDOS GDB already exists'
    workDir = str(workFld) + '/' + city + '_GUIDOS.gdb'
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
        tmpName = city + '_Conn_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')

    	""" Write out first line of report file """
        print 'Connectivity Data Prep Start Time: ' + time.asctime()
        reportFile.write("Begin with EnviroAtlas 1-meter Land Cover for the EnviroAtlas community--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """ -------- Reclassify LC into Forest Foreground, All Else Background ----- """
        outReclass2 = arcpy.sa.Reclassify(freqDir + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,2],[52,1],[52,1],[70,1],[80,1],[82,1],[91,2],[92,1],["NODATA", 0]]))
        outReclass2.save('FWW_WB')
        reportFile.write("Reclassify the land cover into Foreground (REPLACE-GUID), and Background (All Else = 1). --" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Split the Raster As Needs, Process Each Piece ----------------- """
        """ Check if the raster should be split """
        columns = arcpy.GetRasterProperties_management('FWW_WB', 'COLUMNCOUNT').getOutput(0)
        xsplit = int(float(columns) / 8000) + 1
        rows = arcpy.GetRasterProperties_management('FWW_WB', 'ROWCOUNT').getOutput(0)
        ysplit = int (float(rows) / 8000) + 1

        """ Delete the raster, if necessary """
        xy = (xsplit * ysplit)
        for rast in range(xy):
            try:
                arcpy.Delete_management(splitDir + '/FWW_WB_' + str(rast) + '.tif')
            except:
                pass
        try:
            arcpy.Delete_management(splitDir + '/fww_wb')
        except:
            pass
        try:
            arcpy.Delete_management(splitDir + '/fww_wb.tif')
        except:
            pass

        """-------- If no split, run the analysis --------------------------------- """
        if xsplit*ysplit == 1:
            print 'FWW_' + raster + ' is small enough as is.'
            arcpy.CopyRaster_management('FWW_WB', splitDir + '/FWW_WB.tif', '', '', 0, '', '', '8_BIT_UNSIGNED', '', '' )
            reportFile.write("Convert Raster into Tiff.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            """-------- If split, run the analysis on each piece and recombine --------- """
        else:
            arcpy.CopyRaster_management('FWW_WB', splitDir + '/FWW_WB.tif', '', '', 0, '', '', '8_BIT_UNSIGNED', '', '' )
            arcpy.SplitRaster_management(splitDir + '/FWW_WB.tif', splitDir, 'FWW_WB_', 'NUMBER_OF_TILES', 'TIFF', '', str(xsplit) + ' ' + str(ysplit), '',  '1000', 'PIXELS')
            reportFile.write("Split the reclassified land cover into pieces of 10,000 x 10,000 pixels or fewer with a 1,000 pixel overlap. Convert to Tiff.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'Connectivity Data Prep End Time: ' + time.asctime() + '\n'
        print 'Be sure to run the BatchStripedTile Model in ArcMap before GUIDOS.py runs.\n'

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
