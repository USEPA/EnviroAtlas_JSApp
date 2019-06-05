#-----------------------------------------------------------------------------
# Name:     LCSum.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/25/2017
#
# Purpose:  This script calculates the area, percentage, and per capita area
#           of certain land cover types and groups by block group.
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the LCSum function.
#           The data needed to process this scripts is:
#               1. Land Cover (community)
#               2. Block Groups (community - In Albers, with populations)
#-----------------------------------------------------------------------------

def LCSum(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_LCSum.gdb')
    except:
        print 'LCSum GDB already exists'
    workDir = str(workFld) + '/' + city + '_LCSum.gdb'
    arcpy.env.workspace = workDir

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

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
        tmpName = city + '_LCSum_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        reportFile = open(reportfileName, 'w')

        """ Write out first line of report file """
        reportFile.write("Begin with the Census Block Groups and the 1-Meter Land Cover Classification for the EnviroAtlas community.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        print 'LC Summary Start Time: ' + time.asctime()

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """-------- Tabulate the Area of Each LC Class in Each BG --------------"""
        """ Rasterize the BGs, If Necessary """
        if arcpy.Exists(freqDir + '/BG_Rlc'):
            reportFile.write('Convert the Block Groups to Raster snapped to the land cover, with 1 meter pixels.--BG_Rlc--' + "\n")
        else:
            """ Add Field to BG to use as the value for rasterization """
            arcpy.AddField_management(freqDir + '/BG', 'EAID', 'SHORT')
            arcpy.CalculateField_management(freqDir + "/BG", "EAID", "autoIncrement()", "PYTHON_9.3", "rec=0\\ndef autoIncrement():\\n global rec\\n pStart = 1 #adjust start value, if req'd \\n pInterval = 1 #adjust interval value, if req'd\\n if (rec == 0): \\n  rec = pStart \\n else: \\n  rec = rec + pInterval \\n return rec")

            """ Convert the block groups into raster format """
            arcpy.PolygonToRaster_conversion(freqDir + '/BG', 'EAID', 'BG_Rlc', 'MAXIMUM_Area', '', 1)
            reportFile.write('Convert the Block Groups to Raster snapped to the land cover, with 1 meter pixels--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        """ Run Tabulate Area """
        arcpy.sa.TabulateArea(freqDir + '/BG_Rlc', 'Value', freqDir + '/LC', 'Value', 'LC_TA', 1)
#        arcpy.TableToTable_conversion('LC_TA', workDir, 'LCSum')
        reportFile.write('Tabulate the area of each land cover class within each block group.--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        LCtbl = 'LC_TA'
        """-------- Calculate All Needed Table Values ------------------------"""
        """ Alter Names for Raster Value Fields, Add Field if Missing """
        absentFields = []
        arcpy.AlterField_management(LCtbl, 'VALUE_10', 'Wat_M')
        arcpy.AlterField_management(LCtbl, 'VALUE_20', 'Imp_M')
        arcpy.AlterField_management(LCtbl, 'VALUE_30', 'SAB_M')
        arcpy.AlterField_management(LCtbl, 'VALUE_40', 'TAF_M')
        arcpy.AlterField_management(LCtbl, 'VALUE_70', 'GAH_M')
        try:
			arcpy.AlterField_management(LCtbl, 'VALUE_52', 'S_M')
        except:
            arcpy.AddField_management(LCtbl, 'S_M', 'LONG')
            arcpy.CalculateField_management(LCtbl, 'S_M', 0, 'PYTHON')
        try:
			arcpy.AlterField_management(LCtbl, 'VALUE_80', 'Crops_M')
        except:
            arcpy.AddField_management(LCtbl, 'Crops_M', 'LONG')
            arcpy.CalculateField_management(LCtbl, 'Crops_M', 0, 'PYTHON')
            absentFields.append('Ag')
        try:
			arcpy.AlterField_management(LCtbl, 'VALUE_82', 'Orch_M')
        except:
            arcpy.AddField_management(LCtbl, 'Orch_M', 'LONG')
            arcpy.CalculateField_management(LCtbl, 'Orch_M', 0, 'PYTHON')
        try:
			arcpy.AlterField_management(LCtbl, 'VALUE_91', 'WW_M')
			arcpy.AlterField_management(LCtbl, 'VALUE_92', 'EW_M')
        except:
            arcpy.AddField_management(LCtbl, 'WW_M', 'LONG')
            arcpy.CalculateField_management(LCtbl, 'WW_M', 0, 'PYTHON')
            arcpy.AddField_management(LCtbl, 'EW_M', 'LONG')
            arcpy.CalculateField_management(LCtbl, 'EW_M', 0, 'PYTHON')
            absentFields.append('Wet')
        reportFile.write('Rename VALUE_## fields to their abbreviated land cover class and "_M". If any of the LC classes were not evaluated in the community, add the field for that LC and calculate all records = 0. REPLACE-MissLC--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        """ Add Fields for area totals for LC Combinations """
        comboLCTypes = ['LandA', 'MFor', 'Green', 'Ag', 'Wet']
        for field in comboLCTypes:
			arcpy.AddField_management(LCtbl, str(field) + '_M', 'LONG')

        """ Add Fields for percents for LC Types"""
        pctLCTypes = ['MFor', 'Green', 'Imp', 'Ag', 'Wet']
        for field in pctLCTypes:
			arcpy.AddField_management(LCtbl, str(field) + '_P', 'FLOAT')

        """ Add Fields for per capita measures for LC Combinations """
        pcLCTypes = ['MFor', 'Green', 'Imp', 'Ag']
        for field in pcLCTypes:
			arcpy.AddField_management(LCtbl, str(field) + '_PC', 'LONG')

        """ Execute area calculations """
        arcpy.CalculateField_management(LCtbl, 'LandA_M', '!Imp_M!+!SAB_M!+!TAF_M!+!S_M!+!GAH_M!+!Crops_M!+!Orch_M!+!WW_M!+!EW_M!', 'PYTHON_9.3')
        arcpy.CalculateField_management(LCtbl, 'Ag_M', '!Crops_M!+!Orch_M!', 'PYTHON_9.3')
        arcpy.CalculateField_management(LCtbl, 'Wet_M', '!WW_M!+!EW_M!', 'PYTHON_9.3')
        arcpy.CalculateField_management(LCtbl, 'Green_M', '!TAF_M!+!S_M!+!GAH_M!+!Ag_M!+!WW_M!+!EW_M!', 'PYTHON')
        arcpy.CalculateField_management(LCtbl, 'MFor_M', '!TAF_M!+!WW_M!', 'PYTHON')
        reportFile.write('Use the block group tabulate area table to calculate block group land cover combinations: LandA_M = Impervious + Soil & Barren + Trees & Forest + Shrubs + Grass and Herbaceous + Agriculture + Orchards + Woody Wetlands + Emergent Wetlands; MFor_M = Trees & Forest + Woody Wetlands; Green_M = Trees & Forest + Shrubs + Grass and Herbaceous + Agriculture + Orchards + Woody Wetlands + Emergent Wetlands; Ag_M = Agriculture + Orchards; Wet_M = Woody Wetlands + Emergent Wetlands. Note, if certain classes were not evaluated in this community, they will have 0 values in these fields.--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        """ Execute percent calculations """
        for field in pctLCTypes:
			arcpy.CalculateField_management(LCtbl, str(field) + '_P', '"%.2f" % (float(!' + str(field) + '_M!)/float(!LandA_M!)*100)', 'PYTHON_9.3')
        reportFile.write('Calculate the percentage of the block group area that is forest, impervious, green space, wetlands, and agriculture using the total land area. Note, if certain classes were not evaluated in this community, they will have 0 values in these fields.--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        """ Execute per capita calculations """
        arcpy.JoinField_management(LCtbl, 'Value', freqDir + '/BG', 'EAID', ['bgrp', 'SUM_POP10'])
        arcpy.MakeTableView_management(LCtbl, 'LC_Area_tbl')
        arcpy.SelectLayerByAttribute_management('LC_Area_tbl', 'NEW_SELECTION', "SUM_POP10 > 0")
        for field in pcLCTypes:
			arcpy.CalculateField_management('LC_Area_tbl', str(field) + '_PC', '"%.2f" % (float(!'+ str(field) + '_M!) / float(!SUM_POP10!))', 'PYTHON_9.3')
        reportFile.write('Calculate the area per capita of impervious, forest, green space, and agriculture cover using SUM_POP10 from the block group shapefile. Note, if certain classes were not evaluated in this community, they will have 0 values in these fields.--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

    	""" Add Per Capita Nulls """
    	arcpy.SelectLayerByAttribute_management('LC_Area_tbl', 'SWITCH_SELECTION')
    	for field in pcLCTypes:
			arcpy.CalculateField_management('LC_Area_tbl', str(field) + '_PC', -99999, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('LC_Area_tbl', 'CLEAR_SELECTION')
    	reportFile.write('Calculate fields where SUMPOP10 = 0: Area Per Capita fields = -99999.--' + time.strftime('%Y%m%d--%H%M%S') + "--\n")

    	""" Join the Land Area with the BG layer """
    	arcpy.JoinField_management(freqDir + '/BG', 'bgrp', 'LC_Area_tbl', 'bgrp', ['LandA_M'])

##        """-------- Check that the Analysis Area is covered by the LC -------------- """
##    	""" Create a Polygon Version of the LC """
##        if arcpy.Exists(freqDir + '/LC_Poly') == False:
##            arcpy.env.extent = freqDir + '/LC'
##            arcpy.env.snapRaster = freqDir + '/LC'
##            ReC = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,1],[21,1],[22,1],[30,1],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
##            ReC.save(str(freqDir) + '/AreaIO')
##            arcpy.RasterToPolygon_conversion(str(freqDir) + '/AreaIO', str(freqDir) + '/LC_Poly', 'SIMPLIFY')
##            arcpy.EliminatePolygonPart_management(str(freqDir) + '/LC_Poly', str(freqDir) + '/LC_Poly_EP', 'PERCENT', '', '5', 'CONTAINED_ONLY')
##            arcpy.Delete_management(str(freqDir) + '/LC_Poly')
##            arcpy.Rename_management(str(freqDir) + '/LC_Poly_EP', str(freqDir) + '/LC_Poly')
##
##    	""" Buffer the LC Polygon by -500m """
##        if arcpy.Exists(freqDir + '/Bnd_Cty_500m') == False:
##            arcpy.Buffer_analysis(str(freqDir) + '/Bnd_Cty', str(freqDir) + '/Bnd_Cty_500m', '500 meters')
##            arcpy.EliminatePolygonPart_management(str(freqDir) + '/Bnd_Cty_500m', str(freqDir) + '/Bnd_Cty_500m_EP', 'PERCENT', '', '30', 'CONTAINED_ONLY')
##            arcpy.Delete_management(str(freqDir) + '/Bnd_Cty_500m')
##            arcpy.Rename_management(str(freqDir) + '/Bnd_Cty_500m_EP', str(freqDir) + '/Bnd_Cty_500m')
##
##    	""" Identify whether LC is large enough """
##        arcpy.MakeFeatureLayer_management(str(freqDir) + '/LC_Poly', 'LClyr')
##        arcpy.MakeFeatureLayer_management(str(freqDir) + '/Bnd_Cty_500m', 'BC_500lyr')
##
##        arcpy.SelectLayerByLocation_management('BC_500lyr', 'COMPLETELY_WITHIN', 'LClyr', '', 'NEW_SELECTION')
##        bigEnough = float(arcpy.GetCount_management('BC_500lyr').getOutput(0))
##        arcpy.SelectLayerByAttribute_management('BC_500lyr', 'CLEAR_SELECTION')
##
##    	""" If the LC isn't large enough, edit erroneous BGS """
##        if bigEnough == 0:
##            """ Identify BGs at extend byeond the LC edge """
##            arcpy.MakeFeatureLayer_management(freqDir + '/LC_Poly', 'LCPoly')
##            arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG')
##
##            arcpy.SelectLayerByLocation_management('BG', 'WITHIN', 'LCPoly', '', 'NEW_SELECTION', 'INVERT')
##
##            bgValue = float(arcpy.GetCount_management('BG').getOutput(0))
##
##            """ For all BGs too close to the LC edge, assign both fields a value of -99998 """
##            if bgValue > 0:
##                bgrps = []
##                cursor = arcpy.SearchCursor('BG')
##                for row in cursor:
##                    value = row.getValue('bgrp')
##                    bgrps.append(value)
##                bgrps = list(set(bgrps))
##                expression = ''
##                for bgrp in bgrps:
##                    expression = expression + " OR bgrp = '" + str(bgrp) + "'"
##                expression = expression[4:]
##                arcpy.SelectLayerByAttribute_management('LC_Area_tbl', 'NEW_SELECTION', expression)
##
##                for field in ['Wat_M', 'Imp_M', 'SAB_M', 'TAF_M', 'GAH_M', 'WW_M', 'EW_M', 'S_M', 'Crops_M', 'Orch_M', 'LandA_M', 'MFor_M', 'Green_M', 'Ag_M', 'Wet_M', 'MFor_P', 'Green_P', 'Imp_P', 'Ag_P', 'Wet_P', 'MFor_PC', 'Green_PC', 'Imp_PC', 'Ag_PC']:
##					arcpy.CalculateField_management('LC_Area_tbl', str(field), -99998, 'PYTHON_9.3')
##
##                arcpy.SelectLayerByAttribute_management('LC_Area_tbl', 'CLEAR_SELECTION')
##                reportFile.write("Calculate Field for BGs within 50m of the edge of the land cover, all fields = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Add NULLs where Ag and Wetlands were not calculated """
    	if 'Ag' in absentFields:
            for end in ['M', 'P', 'PC']:
				arcpy.CalculateField_management('LC_Area_tbl', 'Ag_' + str(end), -888888, 'PYTHON_9.3')
            reportFile.write("Calculate fields Ag_M, Ag_P, and Ag_PC = -888888 to indicate that Agriculture was not evaluated in this community's land cover.--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")
        if 'Wet' in absentFields:
            for end in ['M', 'P']:
				arcpy.CalculateField_management('LC_Area_tbl', 'Wet_' + str(end), -888888, 'PYTHON_9.3')
            reportFile.write("Calculate fields Wet_M, and Wet_P = -888888 to indicate that Wetlands were not evaluated in this community's land cover.--" + time.strftime('%Y%m%d--%H%M%S') + "--\n")

        """ Copy Table to Final Table in Working Directory and Final Directory """
        arcpy.TableToTable_conversion('LC_Area_tbl', workDir, city + '_LCSum')
        arcpy.DeleteField_management(city + '_LCSum', ['EAID', 'VALUE_0', 'VALUE_10', 'VALUE_20', 'VALUE_22', 'VALUE_30', 'VALUE_40', 'VALUE_52', 'VALUE_70', 'VALUE_80', 'VALUE_82', 'VALUE_91', 'VALUE_92'])
        try:
            arcpy.Delete_management(finalDir + '/' + city + '_LCSum')
        except:
            pass
        arcpy.TableToTable_conversion(city + '_LCSum', finalDir, city + '_LCSum')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_LCSum')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'Imp_M', 'MFor_M', 'Green_M', 'Ag_M', 'Wet_M', 'Imp_P', 'MFor_P', 'Green_P', 'Ag_P', 'Wet_P', 'Imp_PC', 'MFor_PC', 'Green_PC', 'Ag_PC']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_LCSum', [field])
        reportFile.write('Copy the table to the final geodatabase, removing extraneous fields.--' + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        print 'LC Summary End Time: ' + time.asctime() + '\n'

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

