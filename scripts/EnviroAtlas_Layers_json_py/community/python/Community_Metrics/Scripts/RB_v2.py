#-----------------------------------------------------------------------------
# Name:     RB.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  02/09/2016
# Updated:  10/31/2017 (John Lovette)
#
# Purpose:  Creates riparian buffer polygons and calculates the amount of
#           various land cover types within the ripairan buffers of a BG. Also
#           creates foundational polyline layers depicting amount of forest or
#           vegetation along a water body.
#
# Updates:  Oct2017: Updated NHD feature selection loop to handle "Invalid
#           Topology" error.
#
#
# Inputs:   The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the RB function.
#           The data needed to process this scripts is:
#               1. Land Cover/Forest, Vegetation, Water Binaries (community)
#               2. NHD Waterbodies, Flowlines, and Areas (national)
#               3. Block Groups (community)
#               4. Boundary (community)
#-----------------------------------------------------------------------------

def RB(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

#-------- DIRECTORY SETUP ------------------------------------------------
    """ Working Directory """
    try:
        arcpy.CreateFileGDB_management(str(workFld), str(city) + '_RB.gdb')
    except:
        pass
    workDir = str(workFld) + '/' + city + '_RB.gdb'

    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

    """ Projection File Directory """
    prjDir = str(inDir) + '/Prj'

    """ NHD Directory """
    NHDDir = str(inDir) + '/NHD.gdb/'

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
        tmpName = city + '_RB_LC_' + time.strftime('%Y%m%d_%H-%M')
        reportfileName = reportfileDir + '/' + tmpName  + '.txt'
        rbLCRF = open(reportfileName, 'w')

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

        steps = []

        """ Write out first line of report file """
        print 'Riparian Buffer Start Time: ' + time.asctime()
        steps.append("Begin with the High Resolution National Hydrography Dataset for REPLACE-STATE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """ Set Projection Files """
        prjNumb = arcpy.Describe(str(freqDir) + '/LC').spatialReference.name
        prjNumb = prjNumb[-3:]
        prjfile = prjDir + '/NAD 1983 UTM Zone ' + prjNumb + '.prj'

        """-------- PREPARE HYDROLINES ----------------------------- """
        """ Clip to 5km Boundary, Project, Clip to 1km Boundary """

        steps.append("Extract the Flowlines, Waterbodies, and Areas for 5-km around the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Project the Flowlines, Waterbodies, and Areas into UTM Projection.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Clip the Flowlines, Waterbodies, and Areas to the 1-km boundary of the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        for h in ['Area', 'Flowline', 'Waterbody']:
            arcpy.MakeFeatureLayer_management(inDir + '/Input.gdb/States', 'States')
            arcpy.SelectLayerByLocation_management('States', 'INTERSECT', freqDir + '/Bnd_5km', '', 'NEW_SELECTION')
            AbStates = []
            cursor = arcpy.SearchCursor("States", "", "", "Abbrev", "")
            for row in cursor:
                ab = row.getValue("Abbrev")
                AbStates.append(str(ab))
            if len(AbStates) > 1:
                for st in AbStates:
                    try:
                        if st == 'IN':
                            st = 'Indiana'
                        NHDDir2 = NHDDir + str(st) + '/' + st
                        arcpy.Clip_analysis(NHDDir2 + '_NHD' + str(h), freqDir + '/Bnd_5km', workDir + '/' + str(h) + '_5km_' + str(st))
                    except:
                        arcpy.env.outputMFlag = "Disabled"
                        arcpy.env.outputZFlag = "Disabled"
                        if st == 'IN':
                            st = 'Indiana'
                        NHDDir2 = NHDDir + str(st) + '/' + st
                        arcpy.Clip_analysis(NHDDir2 + '_NHD' + str(h), freqDir + '/Bnd_5km', workDir + '/' + str(h) + '_5km_' + str(st))
                        arcpy.ClearEnvironment("outputMFlag")
                        arcpy.ClearEnvironment("outputZFlag")
                        steps.append("The NHD layer -- " + str(st) + "_NHD" + str(h) + " -- reqiured disabling M/Z flags for clipping. Flags reset to defaults.")
                feat = arcpy.ListFeatureClasses(h + '_5km_*')
                arcpy.Merge_management(feat, h + '_5km')
                descLC = arcpy.Describe(str(freqDir) + '/LC')
                arcpy.Project_management(h + '_5km', h + '_UTM', descLC.spatialReference)
                arcpy.Clip_analysis(h + '_UTM', freqDir + '/Bnd_1km', 'City_' + h)

            else:
                state = city[-2:]
                NHDDir2 = NHDDir + str(state) + '/' + state
                arcpy.Clip_analysis(NHDDir2 + '_NHD' + str(h), freqDir + '/Bnd_5km', h + '_5km')
                descLC = arcpy.Describe(str(freqDir) + '/LC')
                arcpy.Project_management(h + '_5km', h + '_UTM', descLC.spatialReference)
                arcpy.Clip_analysis(h + '_UTM', freqDir + '/Bnd_1km', 'City_' + h)


        """ Select the appropriate types of features from each feature class """
        arcpy.Select_analysis('City_Area', 'Area_WLRSR', '"FType" = 484 OR "FType" = 398 OR "FType" = 431 OR "FType" = 460')
        steps.append("Select by Attribute the Areas that are classified as Wash, Lock, Rapid, Stream/River (484, 398, 431, 460).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Select_analysis('City_Flowline', 'Flowline_SRCAP','"FType" = 334 OR "FType" = 460 OR "FType" = 558')
        steps.append("Select by Attributes the Flowlines that are classified as Stream/River and Connector (460, 334).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Select_analysis('City_Flowline', 'Flowline_SRC', '"FType" = 334 OR "FType" = 460')
        steps.append("Select by Attributes the Flowlines that are classified as Stream/River, Connector, and Artificial Path (460, 334, 558).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.Select_analysis('City_Waterbody', 'Waterbody_RLPIM', '"FType" = 436 OR "FType" = 390 OR "FType" = 378')
        steps.append("Select by Attributes the Waterbodies that are classified as Reservoir, Lake/Pond, or Ice Mass (436, 390, 378).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Make Layer Files to use the Select by Location Tool """
        arcpy.MakeFeatureLayer_management('Area_WLRSR', 'Area_Lyr')
        arcpy.MakeFeatureLayer_management('Waterbody_RLPIM', 'Waterbody_Lyr')

        """ Select hydrologically connected waterbodies and areas and save as new feature classes """
        for t in ['Area', 'Waterbody']:
            arcpy.SelectLayerByLocation_management (t + '_Lyr', 'INTERSECT', 'Flowline_SRCAP')
            arcpy.CopyFeatures_management(t + '_Lyr', t + '_Conn')

        steps.append("Select by Location from the selected features in Areas and Waterbodies the features that intersect with the Stream/River, Connection, Artificial Path Flowlines (hydrologically connected areas).--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Run Block Group Summaries ----------------------------- """

        """ CREATE BUFFERS """
        for d in ['15', '50']:
            """ Create buffers """
            arcpy.Buffer_analysis('Flowline_SRC', 'Flowline_' + str(d), str(d) + ' Meters', 'FULL', 'ROUND', 'ALL')
            arcpy.Buffer_analysis('Waterbody_Conn', 'Waterbody_' + str(d), str(d) + ' Meters', 'OUTSIDE_ONLY', 'ROUND', 'ALL')
            arcpy.Buffer_analysis('Area_Conn', 'Area_' + str(d), str(d) + ' Meters', 'OUTSIDE_ONLY', 'ROUND', 'ALL')
            """ Merge Buffers """
            arcpy.Merge_management(['Flowline_' + str(d), 'Waterbody_' + str(d), 'Area_' + str(d)], 'RB_' + str(d) + '_mess')
            """ Dissolve Buffers """
            arcpy.Dissolve_management('RB_' + str(d) + '_mess', 'RB_' + str(d))
            """ Intersect Buffers with BGs """
            arcpy.Intersect_analysis(['RB_' + str(d), freqDir + '/BG'], 'RB_' + str(d) + '_BG', 'ALL')

            """ Tabulate the Land Cover Areas in the Buffers by BG """
            arcpy.sa.TabulateArea('RB_' + str(d) + '_BG', 'bgrp', freqDir + '/LC', 'Value', 'LC_RB' + str(d) + '_tbl', 1)
            arcpy.CopyRows_management('LC_RB' + str(d) + '_tbl', 'TA_' + str(d) + '_Copy')

        steps.append("Buffer the Hydrologically Connected Waterbodies and Areas and the Flowlines (Stream/River, Connector) by 15 meters and 50 meters.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Merge and dissolve the 50m buffers into one shapefile. Repeat for 15m buffers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Intersect each buffer area with the Census Block Groups for the EnviroAtlas community.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Using the 1-Meter Land Cover Classification for the EnviroAtlas community, tabulate the area of each land cover class within the riparian buffers in each Census Block Group as well as the area of each land cover class within each whole Census Block Group.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Rename fields in the Tabulate Area Tables """
        for d in['15', '50']:
            for type, val in[('UnC', 0),('Water', 10), ('Imp', 20), ('SB', 30), ('TF', 40), ('Shrub', 52), ('GH', '70'), ('Ag', 80), ('Orch', 81), ('WW', 91), ('EW', 92)]:
                try:
                    arcpy.AlterField_management('LC_RB' + str(d) + '_tbl', 'VALUE_' + str(val), str(type))
                except:
                    arcpy.AddField_management('LC_RB' + str(d) + '_tbl', str(type), 'DOUBLE')
                    arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', str(type), 0, 'PYTHON_9.3')

            """ Add Fields """
            for fld in['_LArea', '_ImpM', '_ForM', '_VegM']:
                arcpy.AddField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + str(fld), 'LONG')
            for fld in['_LABGP', '_ImpP', '_ForP', '_VegP']:
                arcpy.AddField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + str(fld), 'FLOAT')

            """ Calculate LC Combinations """
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_LArea', "!Imp! + !SB! + !TF! + !Shrub! + !GH! + !Ag! + !Orch! + !WW! + !EW!", 'PYTHON_9.3')
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_ImpM', "!Imp!", 'PYTHON_9.3')
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_ForM', "!TF! + !WW!", 'PYTHON_9.3')
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_VegM', "!TF! + !Shrub! + !GH! + !WW! + !EW!", 'PYTHON_9.3')

            """ Calcualte Percentages """
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_ImpP', '"%.2f" % ((float(!RB' + str(d) + '_ImpM!)/float(!RB' + str(d) + '_LArea!))*100)', 'PYTHON_9.3')
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_ForP', '"%.2f" % ((float(!RB' + str(d) + '_ForM!)/float(!RB' + str(d) + '_LArea!))*100)', 'PYTHON_9.3')
            arcpy.CalculateField_management('LC_RB' + str(d) + '_tbl', 'RB' + str(d) + '_VegP', '"%.2f" % ((float(!RB' + str(d) + '_VegM!)/float(!RB' + str(d) + '_LArea!))*100)', 'PYTHON_9.3')

        steps.append("In Tabulate Area Table for the 50 Meter buffers, add fields RB50_LArea, RB50_LABGP, RB50_ImpM, RB50_ForM, RB50_VegM, RB50_ImpP, RB50_ForP, RB50_VegP--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Calculate fields: RB50_LArea = REPLACE-RBLA; RB50_ImpM = Impervious; RB50_ForM = REPLACE-RBRF; RB50_VegM = REPLACE-RBVG.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Calculate fields: RB50_ImpP = RB50_ImpM/RB50_LArea*100; RB50_VegP = RB50_VegM/RB50_LArea*100; RB50_ForP = RB50_ForM/RB50_LArea*100. Limit all fields to 2 decimal places.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        steps.append("Repeat previous 3 steps for 15 Meter Tabulate Area Table.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Copy Fields to Combined Table """
        arcpy.TableToTable_conversion(freqDir + '/BG', workDir , city + '_RipBuff_LC', '', 'bgrp')
        arcpy.DeleteField_management(city + '_RipBuff_LC', ['SUM_POP10', 'NonWhite', 'Black', 'Blackpct', 'PLx2_Pop', 'PLx2_Pct', 'PopWithin', 'PctWithin', 'Area', 'SUM_HOUSIN', 'under_1', 'under_1pct', 'under_13', 'under_13pc', 'over_70', 'over_70pct', 'Shape_Length', 'Shape_Leng', 'NonWhite_Pop', 'NonWt_Pct', 'Shape_Le_1', 'Shape_Area', 'Dasy_Pop', 'State'])
        steps.append("Create a new table based on the EnviroAtlas community block groups table retaining the BGRP and LandA_M fields. Join all calculated fields from both of the Tabulate Area Tables with the new BG table.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """ Join Fields to Final Table """
        arcpy.JoinField_management(city + '_RipBuff_LC', 'bgrp', 'LC_RB50_tbl', 'bgrp', ['RB50_LArea', 'RB50_LABGP', 'RB50_ImpP', 'RB50_ForP', 'RB50_VegP'])
        arcpy.JoinField_management(city + '_RipBuff_LC', 'bgrp', 'LC_RB15_tbl', 'bgrp', ['RB15_LArea', 'RB15_LABGP', 'RB15_ImpP', 'RB15_ForP', 'RB15_VegP'])

        """ Fix Null Values """
        arcpy.MakeTableView_management(city + '_RipBuff_LC', 'RipBuff_tbl')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'NEW_SELECTION', 'RB50_LArea IS NULL')
        arcpy.CalculateField_management('RipBuff_tbl', 'RB50_LArea', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'CLEAR_SELECTION')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'NEW_SELECTION', 'RB15_LArea IS NULL')
        arcpy.CalculateField_management('RipBuff_tbl', 'RB15_LArea', 0, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'CLEAR_SELECTION')

        arcpy.CalculateField_management('RipBuff_tbl', 'RB50_LABGP', '"%.2f" % ((float(!RB50_LArea!)/float(!LandA_M!)) * 100)', 'PYTHON_9.3')
        arcpy.CalculateField_management('RipBuff_tbl', 'RB15_LABGP', '"%.2f" % ((float(!RB15_LArea!)/float(!LandA_M!)) * 100)', 'PYTHON_9.3')

        steps.append("For all BGs with no riparian buffer area, calculate field RB50_LArea = 0. Calculate Field RB50_LABGP = RB50_LArea/LandA_M*100. Repeat for 15 meter buffers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'NEW_SELECTION', 'RB50_LArea = 0')
        for fld in['RB50_ImpP', 'RB50_ForP', 'RB50_VegP']:
            arcpy.CalculateField_management('RipBuff_tbl', fld, -99999, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'CLEAR_SELECTION')

        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'NEW_SELECTION', 'RB15_LArea = 0')
        for fld in['RB15_ImpP', 'RB15_ForP', 'RB15_VegP']:
            arcpy.CalculateField_management('RipBuff_tbl', fld, -99999, 'PYTHON_9.3')
        arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'CLEAR_SELECTION')
        steps.append("Calculate fields where RB50_LArea = 0: RB50_ImpP, RB50_VegP, RB50_ForP = -99999; Repeat for RB15.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

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
            for width in[15, 50]:
                """ Identify BGs within half the analysis width of the LC edge """
                arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus' + str(int(width/2)), '-' + str(width) + ' meters')
                arcpy.MakeFeatureLayer_management('LC_Poly_Minus' + str(int(width/2)), 'Minus')
                arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG')

                arcpy.SelectLayerByLocation_management('BG', 'WITHIN', 'Minus', '', 'NEW_SELECTION', 'INVERT')

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
                    arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'NEW_SELECTION', expression)
                    arcpy.CalculateField_management('RipBuff_tbl', 'RB' + str(width) + '_LArea', '-99998', 'PYTHON_9.3')
                    arcpy.CalculateField_management('RipBuff_tbl', 'RB' + str(width) + '_LABGP', '-99998', 'PYTHON_9.3')
                    arcpy.CalculateField_management('RipBuff_tbl', 'RB' + str(width) + '_ImpP', '-99998', 'PYTHON_9.3')
                    arcpy.CalculateField_management('RipBuff_tbl', 'RB' + str(width) + '_ForP', '-99998', 'PYTHON_9.3')
                    arcpy.CalculateField_management('RipBuff_tbl', 'RB' + str(width) + '_VegP', '-99998', 'PYTHON_9.3')
                    arcpy.SelectLayerByAttribute_management('RipBuff_tbl', 'CLEAR_SELECTION')
                steps.append("Calculate Field for BGs within " + str(width) + "m of the edge of the land cover, all fields = -99998.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')


        """ Final Table """
        arcpy.CopyRows_management('RipBuff_tbl', 'RB_LC')
        try:
            arcpy.Delete_management(finalDir + '/' + str(city) + '_RB_LC')
        except:
            pass
        arcpy.TableToTable_conversion('RB_LC', finalDir, city + '_RB_LC')
        allFields = [f.name for f in arcpy.ListFields(finalDir + '/' + city + '_RB_LC')]
        for field in allFields:
            if field not in ['bgrp', 'OBJECTID', 'RB50_LArea', 'RB50_LABGP', 'RB50_ImpP', 'RB50_ForP', 'RB50_VegP', 'RB15_LArea', 'RB15_LABGP', 'RB15_ImpP', 'RB15_ForP', 'RB15_VegP']:
                arcpy.DeleteField_management(finalDir + '/' + city + '_RB_LC', [field])

        steps.append("Export the fields to be displayed in the EnviroAtlas to a final gdb table. RB15_LArea, RB15_LABGP, RB15_ImpP, RB15_VegP, RB15_ForP, RB50_LArea, RB50_LABGP, RB50_ImpP, RB50_VegP, RB50_ForP.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

    	""" Write Steps to the Logfile """
        for step in steps:
			rbLCRF.write(step)

        print 'RB_LC End Time; RBXm_LC Start Time: ' + time.asctime()

		#-------- CREATE FOUNDATIONAL LAYERS -----------------------------
        foundsteps = steps[0:9]
        """-------- PREP HYDROLINES ------------------------------------- """
        """ Create lines mid-15m and 51 buffer to extract moving window along """
        for b in ['7.5','25.5']:
            foundsteps = foundsteps[0:9]
            b2 = b[:-2] # chop the .5 off

            """ Buffer Hydro Features """
            arcpy.Buffer_analysis('Flowline_SRC','Flowline_' + str(b2) + 'm', str(b) + ' Meters','FULL','FLAT','ALL')
            arcpy.Buffer_analysis('Area_Conn','Area_' + str(b2) + 'm', str(b) + ' Meters','FULL','FLAT','ALL')
            arcpy.Buffer_analysis('Waterbody_Conn','Waterbody_' + str(b2) + 'm', str(b) + ' Meters','FULL','FLAT','ALL')
            foundsteps.append("Buffer the Hydrologically Connected Waterbodies and Areas and the Flowlines (Stream/River, Connector) by 7.5 meters and 25.5 meters.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Merge and Dissolve """
            arcpy.Merge_management(['Flowline_' + str(b2) + 'm','Area_' + str(b2) + 'm','Waterbody_' + str(b2) + 'm'],'RB_' + str(b2) + 'm_mess')
            arcpy.Dissolve_management('RB_' + str(b2) + 'm_mess','RB_' + str(b2) + 'm')
            foundsteps.append("Merge and dissolve all three 7.5m buffers into one feature. Repeat for 25.5m buffers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ Convert to polylines """
            arcpy.PolygonToLine_management('RB_' + str(b2) + 'm','RB_' + str(b2) + 'm_line','IGNORE_NEIGHBORS')
            foundsteps.append("Convert each set of buffer polygons (7.5m and 25.5m, separately) into a polyline that represents the analysis line in the center of each size riparian buffer.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        """-------- Create Land Cover Binaries ------------------------------------- """
        """ Riparian Forest """
        if arcpy.Exists(str(freqDir) + '/RipForIO') == False:
            outReclass4 = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,0],[70,0],[80,0],[82,0],[91,1],[92,0]]))
            outReclass4.save(str(freqDir) + '/RipForIO')
            foundsteps.append("Reclassify the Land Cover into Binary Forest. REPLACE-RFE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("RipForIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            foundsteps.append("Reclassify the Land Cover into Binary Forest. REPLACE-RFE--RipForIO--\n")

    	""" Vegetated Land """
        if arcpy.Exists(str(freqDir) + '/VegeIO') == False:
            outReclass5 = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,1],[70,1],[80,0],[82,0],[91,1],[92,1]]))
            outReclass5.save(str(freqDir) + '/VegeIO')
            foundsteps.append("Reclassify the Land Cover into Binary Vegetation. REPLACE-VGE--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("VegeIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
        else:
            foundsteps.append("Reclassify the Land Cover into Binary Vegetation. REPLACE-VGE--VegeIO--\n")

    	""" Water """
        if arcpy.Exists(str(freqDir) + '/WaterIO') == False:
            outReclass3 = arcpy.sa.Reclassify(str(freqDir) + '/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,0],[21,0],[22,0],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
            outReclass3.save(str(freqDir) + '/WaterIO')
            foundsteps.append("Reclassify the Land Cover into Binary Water. (Water - 10 = 1; All Else = 0.)--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
            ReuseRF.write("WaterIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')
    	else:
			foundsteps.append("Reclassify the Land Cover into Binary Water. (Water - 10 = 1; All Else = 0).--WaterIO--" + '\n')

        for i, div in [['15', 225], ['51', 2601]]:
            foundsteps = foundsteps[0:15]

            """ Run Moving Window Analyses """
            for bin, mw, name in [['VegeIO', 'Vege', 'Vegetation'], ['RipForIO', 'RFor', 'Forest'], ['WaterIO', 'Wat', 'Water']]:
                outFocalStat = arcpy.sa.FocalStatistics(str(freqDir) + '/' + str(bin), arcpy.sa.NbrRectangle(int(i), int(i), 'CELL'), 'SUM', 'NODATA')
                outFocalStat.save(str(mw) + '_' + str(i) + 'R')
                foundsteps.append("Run Focal Statistics on the " + str(name) + " binary with rectangular neighborhoods of " + str(i) + 'x' + str(i) + " cells.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            half = (int(i) / 2)
            """ Create a surface that represents percent of forest per land area within each moving window """
            outMinus = (int(i) * int(i)) - arcpy.sa.Raster('/Wat_' + str(i) + 'R')
            outMinus.save('LA_' + str(i))
            foundsteps.append("Create a land area raster for the " + str(i) + "m moving windows by subtracting the water moving window rasters from " + str(div) +", respectively.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

            """ If the LC isn't large enough, delete erroneous line segments """
            if bigEnough == 0:
                    arcpy.Buffer_analysis(str(freqDir) + '/LC_Poly', 'LC_Poly_Minus_' + str(half+1), '-' + str(half+1) + ' meters')
                    arcpy.Union_analysis([str(freqDir) + '/Bnd_Cty', 'LC_Poly_Minus_' + str(half+1)], 'LC_Minus_BndCty_Union_' + str(half+1), 'ONLY_FID')
                    arcpy.Select_analysis('LC_Minus_BndCty_Union_' + str(half+1), 'EdgeAffectedArea_' + str(half+1), 'FID_Bnd_Cty > 0 AND FID_LC_Poly_Minus_' + str(half+1) + ' = -1')

            for lc, name in [['Vege', 'Vegetated Land'], ['RFor', 'Forest']]:
                foundsteps = foundsteps[0:19]

                """ Divide the LC Moving Window by the Land Area Moving Window """
                outDivide = arcpy.sa.Float(arcpy.sa.Raster(lc + '_' + str(i) + 'R')) / arcpy.sa.Float(arcpy.sa.Raster('LA_' + str(i)))
                outDivide.save('Rat_' + lc + str(i))
                foundsteps.append("Divide the " + str(name) + " moving window raster by the new land area raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Multiply by 100 """
                # Note JPL 8/1/2018: probably don't need to save this layer #
                outTimes = arcpy.sa.Raster('Rat_' + lc + str(i)) * 100
                outTimes.save('P_' + lc + str(i))
                foundsteps.append("Multiply the ratio raster by 100 to obtain a percent " + str(name) + " raster.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Extract moving window pixels along mid-buffer lines """
                outExtractByMask1 = arcpy.sa.ExtractByMask ('P_' + lc + str(i),'RB_' + str(half) + 'm_line')
                outExtractByMask1.save(lc + '_RB' + str(i))
                foundsteps.append("Extract the percent " + str(name) + " raster along the " + str(i) + "m analysis line--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Reclassify extracted pixels into manageable groups """
                outReclass = arcpy.sa.Reclassify(lc + '_RB' + str(i),'Value', arcpy.sa.RemapRange([[0,20,20],[20,40,40],[40,60,60],[60,80,80],[80,100,100]]))
                outReclass.save(lc + str(i) + '_ReC')
                foundsteps.append("Reclassify the extracted raster into percentage classes 0-20:20; 20-40:40; 40-60:60; 60-80:80; 80-100:100.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Convert to Polygons """
                arcpy.RasterToPolygon_conversion(lc + str(i) + '_ReC',lc + str(i) + '_Poly','NO_SIMPLIFY')
                foundsteps.append("Convert the reclassified rasters into polygons without simplifying.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Intersect Polygon Areas with Original Buffer Lines to Create Foundational Lines """
                arcpy.Intersect_analysis([lc + str(i) + '_Poly','RB_' + str(half) + 'm_line'],lc + '_' + str(half) + 'm_Line','ALL','','LINE')
                foundsteps.append("Spatially join the polygons with the analysis line to add percent class breaks along the analysis line.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Clip to Bnd """
                arcpy.Clip_analysis(lc + '_' + str(half) + 'm_Line', freqDir + '/Bnd', 'RB' + str(i) + 'm_' + lc + '_UTM')
                foundsteps.append("Clip the new analysis lines to the EnviroAtlas community boundary.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Convert to Albers """
                prjfile = prjDir + '/USA Contiguous Albers Equal Area Conic USGS.prj'
                arcpy.Project_management('RB' + str(i) + 'm_' + lc + '_UTM', 'RB' + str(i) + 'm_' + lc, prjfile)
                foundsteps.append("Project lines into Albers.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                """ Change field name """
                if lc == 'Vege':
					arcpy.AlterField_management('RB' + str(i) + 'm_' + lc, 'gridcode', 'PVege')

                elif lc == 'RFor':
                    arcpy.AlterField_management('RB' + str(i) + 'm_' + lc, 'gridcode', 'PFor')

                """ If the LC isn't large enough, delete erroneous line segments """
                if bigEnough == 0:
                    arcpy.MakeFeatureLayer_management('RB' + str(i) + 'm_' + lc, 'RB_lyr')
                    arcpy.MakeFeatureLayer_management('EdgeAffectedArea_' + str(half+1), 'EEArea')
                    arcpy.SelectLayerByLocation_management('RB_lyr', 'INTERSECT', 'EEArea', '', 'NEW_SELECTION')
                    arcpy.SelectLayerByAttribute_management('RB_lyr', 'SWITCH_SELECTION')
                    arcpy.CopyFeatures_management('RB_lyr', 'RB' + str(i) + 'm_' + lc + '_EdgeEffect')
                    arcpy.SelectLayerByAttribute_management('RB_lyr', 'CLEAR_SELECTION')

                """ Dissolve Lines """
                try:
                    if lc == 'Vege':
                        arcpy.Dissolve_management('RB' + str(i) + 'm_' + lc + '_EdgeEffect', city + '_RB' + str(i) + 'm_' + lc + '_D', 'PVege')
                    elif lc == 'RFor':
                        arcpy.Dissolve_management('RB' + str(i) + 'm_' + lc + '_EdgeEffect', city + '_RB' + str(i) + 'm_' + lc + '_D', 'PFor')
                except:
                    if lc == 'Vege':
                        arcpy.Dissolve_management('RB' + str(i) + 'm_' + lc, city + '_RB' + str(i) + 'm_' + lc + '_D', 'PVege')
                    elif lc == 'RFor':
                        arcpy.Dissolve_management('RB' + str(i) + 'm_' + lc, city + '_RB' + str(i) + 'm_' + lc + '_D', 'PFor')

                """ Convert to final shapefiles """
                try:
                    arcpy.Delete_management(finalDir + '/' + str(city) + '_RB' + str(i) + 'm_' + lc)
                except:
                    pass

                arcpy.FeatureClassToFeatureClass_conversion(city + '_RB' + str(i) + 'm_' + lc + '_D', finalDir, city + '_RB' + str(i) + 'm_' + lc)
                foundsteps.append("Export the analysis lines to a geodatabase for display in EnviroAtlas.--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

                tmpName = city + '_RB' + str(i) + 'm_' + str(lc) + '_' + time.strftime('%Y%m%d_%H-%M')
                reportfileName = reportfileDir + '/' + tmpName  + '.txt'
                reportFile = open(reportfileName, 'w')

                for step in foundsteps:
					reportFile.write(step)

                reportFile.close()

                print 'Finshed with RB' + str(i) + 'm_' + str(lc) + ': ' + time.asctime()
        print 'RB End Time: ' + time.asctime() + '\n'

        #-------- COMPELETE LOGFILES ---------------------------------------------
        rbLCRF.close()
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
        rbLCRF.write("\nSomething went wrong.\n\n")
        rbLCRF.write("Pyton Traceback Message below:")
        rbLCRF.write(traceback.format_exc())
        rbLCRF.write("\nArcMap Error Messages below:")
        rbLCRF.write(arcpy.GetMessages(2))
        rbLCRF.write("\nArcMap Warning Messages below:")
        rbLCRF.write(arcpy.GetMessages(1))

        rbLCRF.write( "\n\nEnded at " + time.asctime() + '\n')
        rbLCRF.write("\n---End of Log File---\n")

        if rbLCRF:
            rbLCRF.close()
