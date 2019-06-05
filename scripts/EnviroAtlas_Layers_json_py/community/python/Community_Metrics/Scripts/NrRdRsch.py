#-----------------------------------------------------------------------------
# Name:     NrRdRsch.py
#
# Author:   Ali Mackey
#
# Created:  11/19/2014
# Updated:  04/28/2017
#
# Purpose:  Calculates the percent of any near-road zone containing tree cover
#           within 250 and 300 meter buffers.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the NrRdRsch function.
#           The data needed to process this scripts is:
#               1. BuffLineUse from NrRd.py (if available, community)
#-----------------------------------------------------------------------------

def NrRdRsch(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_NrRdRsch.gdb')
    except:
        print 'NrRdRsch GDB already exists'
    workDir = str(workFld) + '/' + city + '_NrRdRsch.gdb'
    arcpy.env.workspace = workDir

    """ Near Road Directory """
    nrrdDir = workFld + '/' + city + '_NrRd.gdb'
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

    """ Output Directory """
    harvDir = 'G:/OtherFolks/Harvard/'

    """ Set Workspace Environments """
    arcpy.env.scratch = str(inDir) + '/Scratch.gdb'
    arcpy.env.overwriteOutput = True

   #-----------------------------------------------------------------------------
    # BEGIN ANALYSIS
	#-----------------------------------------------------------------------------
    try:
        #-------- LOGFILE CREATION ---------------------------------------------
        """ Create report file for each metric """

        steps = []
        try:
            loglist = sorted (f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_NrRd_PF'))
            tmpName = loglist[-1]
            reportfileName = reportfileDir + '/' + tmpName
            reportFile = open(reportfileName, 'r')
            lines = reportFile.readlines()

            for i in range(0, 6):
            	steps.append(lines[i])
            for i in range(9, 14):
                steps.append(lines[i])
            reportFile.close()
        except:
            print 'Near Road has not been completed, starting from NavTeq_D'

        print 'Near Road Research Start Time: ' + time.asctime()

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """--------- Prep Roads, If Necessary ----------------------------------"""
        if arcpy.Exists(nrrdDir + '/BuffLineUse') == False:

            """ Figure out the correct UTM Zone """
            prjNumb = arcpy.Describe(str(freqDir) + '/LC').spatialReference.name
            prjNumb = prjNumb[-3:]
            prjfile = prjDir + '/NAD 1983 UTM Zone ' + prjNumb + '.prj'

            if arcpy.Exists(str(inDir) + '/NavTeq_D.gdb/' + str(city) + '_NavTeq_D') == False:
                print 'NavTeq_D does not exist, please create and re-run'
                exit
            else:
                """ Set Environments """
                arcpy.env.workspace = nrrdDir
                Expression = 'Shape_Length <= 1050'

                """ Opening Steps """
                steps.append("Begin with 2011 NavTeq Streets Layer and 1-Meter Land Cover Classification for the EnviroAtlas community created by the US EPA EnviroAtlas Team.--ANALYST-TIME--\n")
                steps.append("Project NavTeq Streets layer into UTM.--ANALYST-TIME--\n")
                steps.append("Clip NavTeq Streets Layer to 1-km Buffer of the EnviroAtlas community boundary.--ANALYST-TIME--\n")
                steps.append("Extract roads from NavTeq Streets where Func_Class = 1-4 to a new layer.--ANALYST-TIME--\n")
                steps.append("Add Field to the new streets layer: LANES (double) and calculate where LANES = TO_LANES + FROM_LANES.--ANALYST-TIME--\n")
                steps.append("For any records where LANES = 0, use Esri Aerial basemap to fill in correct lane value.--ANALYST-TIME--\n")

                """ Create Road Polygons """
                arcpy.CopyFeatures_management(str(inDir) + '/NavTeq_D.gdb/' + str(city) + '_NavTeq_D', 'NavTeq_D')
                arcpy.AddField_management('NavTeq_D', 'HalfWidth', 'DOUBLE')
                arcpy.CalculateField_management('NavTeq_D', 'HalfWidth', '!Width! / 2', 'PYTHON_9.3')
                steps.append("Add Field to streets layer: HALFWIDTH (double) and calculate where HALFWIDTH = LANES * 3.6576 / 2.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                arcpy.Buffer_analysis('NavTeq_D', 'RoadEdge', 'HalfWidth', 'FULL', 'FLAT', 'ALL')
                steps.append("Buffer streets using the value in HALFWIDTH with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Create road buffer """
                arcpy.Buffer_analysis('RoadEdge', 'RoadBuffer', '11.5 Meters', 'FULL', 'FLAT', 'ALL')
                steps.append("Rebuffer the buffered streets by 11.5 meters with options FULL, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Convert the buffer into lines """
                arcpy.PolygonToLine_management('RoadBuffer', 'RdBuffLine')
                steps.append("Convert the resulting polygons into polylines -- referred to as analysis lines.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Remove interior lines based on cut-off point """
                arcpy.MakeFeatureLayer_management('RdBuffLine', 'BuffLine_lyr')
                arcpy.SelectLayerByAttribute_management('BuffLine_lyr', 'NEW_SELECTION', Expression)
                arcpy.DeleteFeatures_management('BuffLine_lyr')
                arcpy.CopyFeatures_management('BuffLine_lyr', 'BuffLineUse')
                steps.append("Delete analysis lines that are unnecessary for analysis, for example, lines in between two lanes of a divided highway and lines on the interior of a freeway ramp.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        """ Set Environments """
        arcpy.env.workspace = workDir

        #Create Road Buffer Areas
        arcpy.Buffer_analysis(nrrdDir + '/BuffLineUse', 'Left_14', '14.5 Meters', 'LEFT', 'FLAT', 'ALL')
        arcpy.Buffer_analysis(nrrdDir + '/BuffLineUse', 'Right_11', '11.5 Meters', 'RIGHT', 'FLAT', 'ALL')
        steps.append("Buffer the analysis line by 14.5 meters with options LEFT, FLAT, ALL and by 11.5 meters with options RIGHT, FLAT, ALL.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Merge_management(['Left_14', 'Right_11'], 'Buff_26_M')
        arcpy.Dissolve_management('Buff_26_M', 'RoadBuffer')
        steps.append("Merge the two buffers together and dissolve.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #Extract Land Cover in Road Buffer Area
        EbM = arcpy.sa.ExtractByMask(freqDir + '/LC', 'RoadBuffer')
        EbM.save('RoadBuffLC')
        print 'Done EbM: ' + time.asctime()
        steps.append("Extract by Mask the land cover within the merged buffers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #Convert into Forest and Total Area
        ReC1 = arcpy.sa.Reclassify('RoadBuffLC', 'Value', arcpy.sa.RemapRange([[0,92,1],["NODATA",0]]), 'DATA')
        ReC1.save('RoadBuffArea')
        steps.append("Reclassify the extracted Land Cover into Binary Area. (All Classes = 1; All Else = 0).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        ReC2 = arcpy.sa.Reclassify('RoadBuffLC', 'Value', arcpy.sa.RemapRange([[0,39,0],[40,40,1],[41,81,0],[82,82,1],[83,90,0],[91,91,1],[92,200,0],["NODATA","NODATA",0]]), 'DATA')
        ReC2.save('TreeBuffArea')
        steps.append("Reclassify the extracted Land Cover into Binary Forest. REPLACE-MF.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        for buffer in(300, 250):
            steps = steps [0:16]
            print("Running buffer : " + str(buffer) + "...\t" + time.asctime())
            #Run moving windows on two buffer areas
            MW1 = arcpy.sa.FocalStatistics('RoadBuffArea', arcpy.sa.NbrCircle(str(buffer), 'MAP'), 'SUM', 'DATA')
            MW1.save('Area_C' + str(buffer))
            steps.append("Run Focal Statistics on the Binary Area Raster with a circular window of " + str(buffer) + " meters with statistics = SUM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            MW2 = arcpy.sa.FocalStatistics('TreeBuffArea', arcpy.sa.NbrCircle(str(buffer), 'MAP'), 'SUM', 'DATA')
            MW2.save('Tree_C' + str(buffer))
            steps.append("PRun Focal Statistics on the Binary Forest Raster with a circular window of " + str(buffer) + " meters with statistics = SUM.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            #Calculate Ratios
            outPct = arcpy.sa.Float(arcpy.sa.Raster('Tree_C' + str(buffer))) / arcpy.sa.Float(arcpy.sa.Raster('Area_C' + str(buffer))) * 100
            outPct.save('PctTreeBuff' + str(buffer))
            steps.append("Calculate the percentage of potential tree buffer that is forested by dividing the Forest Focal Statistics by the Area Focal Statistics and multiplying by 100.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            #Convert to Tiff
            #arcpy.CopyRaster_management('PctTreeBuff' + str(buffer), str(harvDir) + '/' + str(city) + '_PctTreeBuff' + str(buffer) + '.tif')
            steps.append("Copy Final Raster to a Tiff for Distribution.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            tmpName = str(city) + '_PctTreeBuff' + str(buffer) + '_' + time.strftime('%Y%m%d_%H-%M')
            reportfileName = reportfileDir + '/' + tmpName  + '.txt'
            reportFile1 = open(reportfileName, 'w')

            for step in steps:
            	reportFile1.write(step)

            reportFile1.close()
            print("Finished buffer : "+ str(buffer) + "...\t" + time.asctime())

        print 'Near Road Research End Time: ' + time.asctime()

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
