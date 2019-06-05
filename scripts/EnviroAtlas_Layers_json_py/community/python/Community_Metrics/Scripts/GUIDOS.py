#-----------------------------------------------------------------------------
# Name:     GUIDOS.py
#
# Author:   Ali Mackey
#
# Created:  07/31/2014
# Updated:  04/27/2017
#
# Purpose:  This script takes the prepared land cover and calculates the MSPA
#           for the community. It also burns in waterbodies.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the Guidos_Post function.
#           The data needed to process this scripts is:
#               1. Prepared 3 Class Striped TIFF (community)
#               2. 300m2 Water Bodies Raster (if created, community)
#               3. Boundary (community)
#-----------------------------------------------------------------------------

def Guidos_Post(city, inDir, workFld):
    import traceback, time, arcpy, os, subprocess
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    if arcpy.Exists(str(workFld) + '/' + city + '_GUIDOS.gdb') == False:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_GUIDOS.gdb')
    else:
        pass
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
##        try:
        loglist = sorted(f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_Conn'))
        tmpName = loglist[-1]
##        except:
##            tmpName = city + '_Conn_' + time.strftime('%Y%m%d_%H-%M')  + '.txt'
        reportfileName = reportfileDir + '/' + tmpName

        try:
			reportFile = open(reportfileName, 'a')
        except:
			reportFile = open(reportfileName, 'w')
			print 'No log for GUIDOS_Prep'

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

        print 'Connectivity Start Time: ' + time.asctime()
        reportFile.write("For each piece, convert the raster from a tiled TIFF to a striped TIFF.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        #Figure out the correct UTM Zone
        prjNumb = arcpy.Describe(str(freqDir) + '/LC').spatialReference.name
        prjNumb = prjNumb[-3:]
        prjfileUTM = prjDir + '/NAD 1983 UTM Zone ' + prjNumb + '.prj'

        AllRast = 'yes'

        """ -------- RUN GUIDOS ---------------------------------------------- """
        arcpy.env.workspace = splitDir
    	guidlist = arcpy.ListRasters('S_FWW*')
    	""" For each raster piece, run GUIDOS """
    	for r in guidlist:
			guidexe = str(inDir) + '/mspa_win64.exe'
			inrast = str(splitDir) + '/' + str(r)
			outrast = 'G_' + str(r)
			outdir = str(splitDir) + '/'
			argu = (guidexe, '-i', inrast, '-o', outrast, '-eew', '30', '-internal', '0', '-odir', outdir, '-transition', '0')
			subprocess.call(argu)

			""" If GUIDOS worked, Reproject the rasters """
			if arcpy.Exists(outrast) == True:
				# Project the output raster
				oLeft = arcpy.GetRasterProperties_management(r, "LEFT").getOutput(0)
				oBottom = arcpy.GetRasterProperties_management(r, "BOTTOM").getOutput(0)
				nBottom = arcpy.GetRasterProperties_management(outrast, 'BOTTOM').getOutput(0)

				xMove = float(oLeft) + 0.5
				yMove = float(oBottom) - float(nBottom)

				arcpy.Shift_management(outrast, 'Sh_' + str(r), xMove, yMove, r)

				numb = r.replace('S_FWW_WB_', '')

				arcpy.env.extent = "MAXOF"
				arcpy.env.snapRaster = str(splitDir) + '/' + str(r)
				descLC = arcpy.Describe(str(freqDir) + '/LC')
				arcpy.ProjectRaster_management('Sh_' + str(r), 'Conn_' + str(numb), descLC.spatialReference, '', '', '', '', descLC.spatialReference)
			else:
				""" If GUIDOS didn't work, quit after loop """
				AllRast = 'no'
				print str(outrast) + ' not run properly'

        reportFile.write("For each piece, run the GUIDOS (Graphical User Interface for the Description of image Objects and their Shapes) v2.1 MSPA (Morphological Spatial Pattern Analysis) Standalone Tool (http://forest.jrc.ec.europa.eu/download/software/guidos) using 8 neighbor connectivity, 30 pixel edge, transition off, and intext off.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        reportFile.write("Project each GUIDOS piece into UTM, shifting to the location of the original piece.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- If all the GUIDOS Rasters worked, Post-Process ------------ """
        if AllRast == 'yes':
            """-------- Split the Raster As Needs, Process Each Piece ----------------- """
            """ Check if the raster should be split """
            columns = arcpy.GetRasterProperties_management(splitDir + '/FWW_WB.tif', 'COLUMNCOUNT').getOutput(0)
            xsplit = int(float(columns) / 8000) + 1
            rows = arcpy.GetRasterProperties_management(splitDir + '/FWW_WB.tif', 'ROWCOUNT').getOutput(0)
            ysplit = int (float(rows) / 8000) + 1

            """-------- If no split, run the analysis --------------------------------- """
            if xsplit*ysplit == 1:
                """ Copy Raster """
                arcpy.CopyRaster_management(splitDir + '/Conn.TIF', workDir + '/Conn')
                reportFile.write("Copy Tiff into Working GDB.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """-------- If split, run the analysis on each piece and recombine --------- """
            else:
                """ Set Environments """
                arcpy.env.extent = 'FWW_WB.tif'
                arcpy.env.snapRaster = 'FWW_WB.tif'

                """ Split the Raster """
                arcpy.SplitRaster_management('FWW_WB.tif', splitDir, 'NoO_WB_', 'NUMBER_OF_TILES', 'TIFF', '', str(xsplit) + ' ' + str(ysplit), '',  '', '')
                reportFile.write("Split the reclassified land cover into the same pieces as previous but with no overlap.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Clip the overlap off the tiles """
                pieces = int(xsplit) * int(ysplit)
                for tiles in range(int(pieces)):
                    if arcpy.Exists('NoO_WB_' + str(tiles) + '.TIF') == True:
                        """ Set Environments """
                        arcpy.env.extent = 'NoO_WB_' + str(tiles) + '.TIF'
                        arcpy.env.snapRaster = 'NoO_WB_' + str(tiles) + '.TIF'

                        """ Extract the Area of Interest """
                        EbM = arcpy.sa.ExtractByMask('Conn_' + str(tiles) + '.TIF', 'NoO_WB_' + str(tiles) + '.TIF')
                        EbM.save(workDir + '/Conn_' + str(tiles))
                    else:
                        pass
                reportFile.write("Clip each GUIDOS output to the corresponding piece of the second raster split to eliminate overlap.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Set Environments """
                arcpy.env.extent = workDir + '/FWW_WB'
                arcpy.env.snapRaster = workDir + '/FWW_WB'
                arcpy.env.workspace = workDir

                """ Mosaic tiles together """
                RastList = arcpy.ListRasters('Conn_*')
                arcpy.MosaicToNewRaster_management(RastList, workDir, 'Conn', '', '8_BIT_UNSIGNED', 1, 1, '', '')
                reportFile.write("Mosaic all of the clipped GUIDOS output tiles into one raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Burn water into the Output Raster """
            watercon = arcpy.sa.Con(freqDir + '/LC', 10, 'Conn', 'value = 10')
            watercon.save('Conn_WithWat')
            reportFile.write("Using the original land cover, burn water pixels into raster using a conditional statement if Land Cover Value = 10; for true: 10; for false: GUIDOS raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

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

        	"""-------- Check that the Analysis Area is covered by the LC -------------- """
        	""" Create a Polygon Version of the LC """
            if arcpy.Exists(freqDir + '/LC_Poly') == False:
                arcpy.env.snapRaster = str(freqDir) + '/LC'
                arcpy.env.extent = str(freqDir) + '/LC'
                ReC = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
                ReC.save(str(freqDir) + '/AreaIO')
                arcpy.RasterToPolygon_conversion(str(freqDir) + '/AreaIO', str(freqDir) + '/LC_Poly', 'SIMPLIFY')
                arcpy.env.extent = workDir + '/FWW_WB'
                arcpy.env.snapRaster = workDir + '/FWW_WB'

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
    			arcpy.Clip_analysis(freqDir + '/Bnd_Cty', freqDir + '/LC_Poly', 'Bnd_Cty_LC')
    			reportFile.write("Because the community boundary extends beyond the Land Cover, clip the boundary to the land cover.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Clip the Raster to Bnd_Cty """
            try:
    			EbM = arcpy.sa.ExtractByMask('Conn_WithWat', 'Bnd_Cty_LC')
            except:
    			EbM = arcpy.sa.ExtractByMask('Conn_WithWat', freqDir + '/Bnd_Cty')
            EbM.save('Conn_Bnd')
            reportFile.write("Extract by Mask the area of the projected raster that is within the clipped EnviroAtlas Community Boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Add Colormap """
            arcpy.AddColormap_management('Conn_Bnd', '', str(inDir) + '/Templates/GUIDOS2.clr')

            """ Convert to TIFF for sharing """
            arcpy.CopyRaster_management('Conn_Bnd', splitDir + '/' + str(city) + '_Conn.tif')
            reportFile.write("Add a default GUIDOS colormap to the final raster from any of the original GUIDOS output tiles.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Convert to Web Mercator """
            prjfileWM = prjDir + '/WGS 1984 Web Mercator (auxiliary sphere).prj'
            if arcpy.Exists(freqDir + '/Bnd_WM') == False:
                arcpy.Project_management(freqDir + '/Bnd', freqDir + '/Bnd_WM', prjfileWM)
            arcpy.env.extent = freqDir + '/Bnd_WM'
            arcpy.ProjectRaster_management('Conn_Bnd', 'Conn_WM', prjfileWM)
            reportFile.write("Convert raster into TIFF format for distribution.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Copy to Final Directory """
            arcpy.CopyRaster_management('Conn_WM', finalDir + '/' + str(city) + '_Conn')
    ##            reportFile.write("Step 15--Copy to Final GDB--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            print 'GUIDOS End Time: ' + time.asctime()

        else:
            print 'Some MSPA functions did not complete. Please run manually.'
        #-------------------------------------------------------------------------

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