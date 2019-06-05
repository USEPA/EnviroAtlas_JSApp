"""In this script, Processes are scripts that produce at least one output metric which contains at least one layer.
For example, the Parks.py script runs the Park_Pop, Park_Prox, and ParkDist metrics and creates 4, 1, and 1, layers respectively."""

def metadata(city, inDir, workFld, cityName, processes='All', skips=[]):
    import traceback, time, arcpy, os, shutil, imp
    import xml.etree.ElementTree as ET
    if type(processes) <> 'list' == True:
        if processes <> 'All' == True:
            print "The scripts(s) you wish to process are not formatted correctly in the statement. Please format as ['process', 'process', ...]. For only one process, format as ['process']. To process all scripts, format as 'All'."
            exit()
    if processes <> 'All' == True:
        for p in processes:
            print p
            if p not in ['Freq', 'LCSum', 'School', 'GreenP', 'ImpP', 'Parks', 'NrRd', 'WVW', 'WVT', 'RB', 'GUIDOS', 'GSTCnWR', 'IntDen', 'NrRdRsch', 'Floodplains', 'All']:
                print 'Invalid metric in list'
                exit()
    if type(skips) <> list == True:
        print "The scripts(s) you wish to skip are not formatted correctly in the statement. Please format as ['process', 'process', ...]. For only one process, format as ['process']."
        exit()
    for p in skips:
        if p not in ['Freq', 'LCSum', 'School', 'GreenP', 'ImpP', 'Parks', 'NrRd', 'WVW', 'WVT', 'RB', 'GUIDOS', 'GSTCnWR', 'IntDen', 'NrRdRsch', 'Floodplains', 'All']:
            print 'Invalid metric in skip list'
            exit()

	#------------- INPUT DATA AND LOCATIONS ----------------------------------------
    freqDir = str(workFld) + '/' + str(city) + '_Freq.gdb'
    finalDir = str(workFld) + '/' + str(city) + '_Final.gdb'
    logDir = str(workFld) + '/Logs'
    metaTemplate = str(inDir) + '/Templates'
    if os.path.isdir(str(workFld) + '/Metadata') == True:
        pass
    else:
        os.makedirs(str(workFld) + '/Metadata')
    splitDir = str(workFld) + '/' + city + '_Split'
    metaDir = str(workFld) + '/Metadata'
    CoorConv = imp.load_source('CoorConv.name', 'E:/GIS/Scripts/Current/CoorConv.py')
    arcpy.env.overwriteOutput = True
    arcpy.env.workspace = freqDir
    print freqDir + '/BG'
    arcpy.env.extent = freqDir + '/BG'


    #-------------- LIST THE PROCESSES & METRICS NEEDED FOR THE GIVEN PROCESS(ES) --------------
    procWmetric = [['Freq', ['BG', 'BG_Pop', 'Bnd']], ['LCSum', ['LCSum']], ['School', ['EduLowGS']], ['GreenP', ['GreenProx']], ['ImpP', ['ImpProx']], ['Parks', ['Park_Pop', 'Park_Prox']], ['NrRd', ['NrRd_Pop', 'NrRd_PFor']], ['WVW', ['WaterWV']], ['WVT', ['TreeWV']], ['RB', ['RB_LC', 'RB15m_RFor', 'RB15m_Vege', 'RB51m_RFor', 'RB51m_Vege']], ['GUIDOS', ['Conn']], ['GSTCnWR', ['PctStGS', 'PctStTC']], ['IntDen', ['IntDen']], ['NrRdRsch', ['PctTreeBuff250', 'PctTreeBuff300']], ['Floodplains', ['Floodplain']]]

    if processes == 'All':
        runPandM = procWmetric
        for skip in skips:
            for process, metrics in procWmetric:
                if process == skip:
                    runPandM.remove([process, metrics])

    else:
        runPandM = []
        for process, metrics in procWmetric:
            if process in processes:
                runPandM.append([process, metrics])

    if len(runPandM) == 0:
        print 'Something funny is going on. Your process and metrics list is empty (runPandM). Look into that and rerun.'
        exit()

    #-------------- COLLECT CITY SPECIFIC INFORMATION ----------------------------------

    """-------- Place Keywords ------------------------------------------------------"""
    stateAbbrev = city[-2:]
##    stateAbbrev = 'MN'
    states = {'AK': 'Alaska','AL': 'Alabama','AR': 'Arkansas','AS': 'American Samoa','AZ': 'Arizona','CA': 'California','CO': 'Colorado','CT': 'Connecticut','DC': 'District of Columbia','DE': 'Delaware','FL': 'Florida','GA': 'Georgia','GU': 'Guam','HI': 'Hawaii','IA': 'Iowa','ID': 'Idaho','IL': 'Illinois','IN': 'Indiana','KS': 'Kansas','KY': 'Kentucky','LA': 'Louisiana','MA': 'Massachusetts','MD': 'Maryland','ME': 'Maine','MI': 'Michigan','MN': 'Minnesota','MO': 'Missouri','MP': 'Northern Mariana Islands','MS': 'Mississippi','MT': 'Montana','NA': 'National','NC': 'North Carolina','ND': 'North Dakota','NE': 'Nebraska','NH': 'New Hampshire','NJ': 'New Jersey','NM': 'New Mexico','NV': 'Nevada','NY': 'New York','OH': 'Ohio','OK': 'Oklahoma','OR': 'Oregon','PA': 'Pennsylvania','PR': 'Puerto Rico','RI': 'Rhode Island','SC': 'South Carolina','SD': 'South Dakota','TN': 'Tennessee','TX': 'Texas','UT': 'Utah','VA': 'Virginia','VI': 'Virgin Islands','VT': 'Vermont','WA': 'Washington','WI': 'Wisconsin','WV': 'West Virginia','WY': 'Wyoming'}
    stateName = states[stateAbbrev]

    """-------- Bounding Box --------------------------------------------------------"""
    """ Find the UTM Coordinates for the Bounding Box """
    CoorConv = imp.load_source('CoorConv.name', 'E:/GIS/Scripts/Current/CoorConv.py')
    desc = arcpy.Describe(freqDir + '/Bnd')
    tf = 'UTM' in str(desc.spatialReference.name)

    """ Figure out the correct UTM Zone """
    if tf == True:
        prjNumb = desc.spatialReference.name[-3] + desc.spatialReference.name[-2]

        SW = CoorConv.utmToLatLng(float(prjNumb), float("%.2f" % desc.extent.XMin), float("%.2f" % desc.extent.YMin), True)
        NE = CoorConv.utmToLatLng(float(prjNumb), float("%.2f" % desc.extent.XMax), float("%.2f" % desc.extent.YMax), True)
        southBound = str(round(SW[0], 5))
        westBound = str(round(SW[1], 5))
        northBound = str(round(NE[0], 5))
        eastBound = str(round(NE[1], 5))

    else:
        print 'Data is not in UTM. Cannot update bounding box(es).'
        southBound = 'NA'
        westBound = 'NA'
        northBound = 'NA'
        eastBound = 'NA'


    """-------- LC Statements -------------------------------------------------------"""
    """ Obtain the Land Cover Classes from the Land Cover"""
    lcRaster = freqDir + '/LC'
    cursor = arcpy.SearchCursor(lcRaster)
    lcClasses = []
    for row in cursor:
        value = row.getValue('Value')
        lcClasses.append(value)

    """ All Potential LC Classes"""
    allClasses = [[10, 'Water'], [20, 'Impervious'], [30, 'Soil & Barren'], [40, 'Trees & Forest'], [52, 'Shrubs'], [70, 'Grass & Herbaceous'], [80, 'Agriculture'], [82, 'Orchards'], [91, 'Woody Wetlands'], [92, 'Emergent Wetlands']]

    """ Make a list of actual LC class values and labels for each LC grouping """
    gsClasses = []
    mfClasses = []
    rfClasses = []
    vgClasses = []
    laClasses = []

    for num, label in allClasses:
        if num in lcClasses:
            if num in [40, 52, 70, 80, 82, 91, 92]:
                gsClasses.append([num, label])
            if num in [40, 82, 91]:
                mfClasses.append([num, label])
            if num in [40, 91]:
                rfClasses.append([num, label])
            if num in [40, 52, 70, 91, 92]:
                vgClasses.append([num, label])
            if num in [20, 30, 40, 52, 70, 80, 82, 91, 92]:
                laClasses.append([num, label])

    """ Create the Green Space Text & Equation for the Metadata"""
    gsText = ' green space is defined as '
    gsEquation = '('
    gsbEquation = '(Water - 10, '
    for i in range(0, len(gsClasses)-1):
        gsText = gsText + gsClasses[i][1] + ', '
        gsEquation = gsEquation + str(gsClasses[i][1]) + ' - ' + str(gsClasses[i][0]) + ', '
    gsText = gsText + ' and ' + str(gsClasses[-1][1]) + '.'
    gsEquation = gsEquation + str(gsClasses[-1][1]) + ' - ' + str(gsClasses[-1][0]) + ' = 1; All Else = 0)'
    gsbEquation = gsbEquation + gsEquation[1:-2] + '"NODATA")'

    """ Create the Tree Cover Text & Equation for the Metadata"""
    mfText = 'In this community, tree cover is defined as '
    mfEquation = '('

    if len(mfClasses) > 1:
        for i in range(0, len(mfClasses)-1):
            mfText = mfText + mfClasses[i][1] + ', '
            mfEquation = mfEquation + str(mfClasses[i][1]) + ' - ' + str(mfClasses[i][0]) + ', '
        mfText = mfText + ' and ' + str(mfClasses[-1][1]) + '.'
        mfEquation = mfEquation + str(mfClasses[-1][1]) + ' - ' + str(mfClasses[-1][0]) + ' = 1; All Else = 0)'

    else:
        mfText = mfText + 'Trees & Forest.'
        mfEquation = mfEquation + 'Trees & Forest - 40 = 1; All Else = 0)'
    mfIEquation = mfEquation[0:-2] + '"NODATA")'

    """ Create the Riparian Tree Cover Text & Equation for the Metadata"""
    rfText = 'In this community, tree cover is defined as '
    rfEquation = '('
    rfrbEquation = ''
    guidEquation = ''

    if len(rfClasses) > 1:
        for i in range(0, len(rfClasses)-1):
            rfText = rfText + rfClasses[i][1] + ', '
            rfEquation = rfEquation + str(rfClasses[i][1]) + ' - ' + str(rfClasses[i][0]) + ', '
            rfrbEquation = rfrbEquation + str(rfClasses[i][1]) + ' + '
            guidEquation = guidEquation + str(rfClasses[i][1]) + ' - ' + str(rfClasses[i][0]) + ', '
        rfText = rfText + ' and ' + str(rfClasses[-1][1]) + '.'
        rfEquation = rfEquation + str(rfClasses[-1][1]) + ' - ' + str(rfClasses[-1][0]) + ' = 1; All Else = 0)'
        rfrbEquation = rfrbEquation + str(rfClasses[-1][1])
        guidEquation = guidEquation + str(rfClasses[i][1]) + ' - ' + str(rfClasses[i][0]) + ' = 2'


    else:
        rfText = rfText + 'Trees & Forest.'
        rfEquation = rfEquation + 'Trees & Forest - 40 = 1; All Else = 0)'
        rfrbEquation = 'Trees & Forest'
    	guidEquation = 'Trees & Forest - 40 = 2'

    """ Create the Vegetated Land Text & Equation for the Metadata"""
    vgText = 'In this community, vegetated land is defined as '
    vgEquation = '('
    vgrbEquation = ''

    for i in range(0, len(vgClasses)-1):
        vgText = vgText + vgClasses[i][1] + ', '
        vgEquation = vgEquation + str(vgClasses[i][1]) + ' - ' + str(vgClasses[i][0]) + ', '
        vgrbEquation = vgrbEquation + str(vgClasses[i][1]) + ' + '
    vgText = vgText + ' and ' + str(vgClasses[-1][1]) + '.'
    vgEquation = vgEquation + str(vgClasses[-1][1]) + ' - ' + str(vgClasses[-1][0]) + ' = 1; All Else = 0)'
    vgrbEquation = vgrbEquation + str(vgClasses[-1][1])

    """ Create the Land Area Text & Equation for the Metadata"""
    laText = 'In this community, land is defined as '
    laEquation = '('
    larbEquation = ''

    for i in range(0, len(laClasses)-1):
        laText = laText + laClasses[i][1] + ', '
        laEquation = laEquation + str(laClasses[i][1]) + ' - ' + str(laClasses[i][0]) + ', '
        larbEquation = larbEquation + str(laClasses[i][1]) + ' + '
    laText = laText + ' and ' + str(laClasses[-1][1]) + '.'
    laEquation = laEquation + str(laClasses[-1][1]) + ' - ' + str(laClasses[-1][0]) + ' = 1; All Else = 0)'
    larbEquation = larbEquation + str(laClasses[-1][1])

    """ Create the text for the LCSum Abstract """
    lcSumText = 'In this commmunity, forest is defined as '

    if len(mfClasses) > 1:
        for i in range(0, len(mfClasses)-1):
            lcSumText = lcSumText + mfClasses[i][1] + ', '
        lcSumText = lcSumText + ' and ' + str(mfClasses[-1][1]) + '.'

	lcSumText = lcSumText + ' Green space is defined as '

    for i in range(0, len(gsClasses)-1):
        lcSumText = lcSumText + gsClasses[i][1] + ', '
    lcSumText = lcSumText + ' and ' + str(gsClasses[-1][1]) + '.'

    if 80 in lcClasses:
		lcSumText = lcSumText + ' Agriculture is defined as '
		if 82 in lcClasses:
			lcSumText = lcSumText + 'Agriculture and Orchards.'
		else:
			lcSumText = lcSumText + 'Agriculture alone.'

    if 91 in lcClasses:
		lcSumText = lcSumText + 'Wetlands are defined as Woody Wetlands and Emergent Wetlands.'

    """ Create the text for the LCSum Processing Step """
    missLC = 'In this community'
    missClasses = []

    for value in allClasses:
		if value not in laClasses:
			missClasses.append(value)
    missClasses.remove([10, 'Water'])

    if len(missClasses) == 0:
		missLC = missLC + ' all classes were evaluated.'
    elif len(missClasses) == 1:
		missLC = missLC + ', ' + str(missClasses[0][1]) + ' were not evaluated.'
    else:
        for val in range(0, len(missClasses)-1):
            missLC = missLC + ', ' + str(missClasses[val][1])
        missLC = missLC + ', and ' + str(missClasses[-1][1]) + ' were not evaluated.'

    """-------- Population Statement ------------------------------------------------"""
    """ Identify any blocks missing population"""
    arcpy.MakeFeatureLayer_management(freqDir + '/BG', 'BG_lyr')
    arcpy.MakeFeatureLayer_management(inDir + '/Input.gdb/Blks_OFF', 'Blks_Off_lyr')
    arcpy.SelectLayerByLocation_management('Blks_Off_lyr', 'WITHIN', 'BG_lyr', '', 'NEW_SELECTION')
    offBlks = arcpy.GetCount_management('Blks_Off_lyr').getOutput(0)

    """ If blocks are missing people, count the people by the reason they are missing"""
    if int(offBlks) <> 0:
        arcpy.Statistics_analysis('Blks_Off_lyr', freqDir + '/Pop_Off', [['POP10', 'SUM']], 'REASON')
        cursor = arcpy.SearchCursor(freqDir + '/Pop_Off')
        reasons = []
        for row in cursor:
            reason = row.getValue("Reason")
            popoff = row.getValue("SUM_POP10")
            reasons.append([reason, popoff])
        arcpy.SelectLayerByAttribute_management('Blks_Off_lyr', 'CLEAR_SELECTION')
        arcpy.SelectLayerByLocation_management('BG_lyr', 'CONTAINS', 'Blks_Off_lyr', '', 'NEW_SELECTION')
        bgOFF = arcpy.GetCount_management('Blks_Off_lyr').getOutput(0)
        arcpy.SelectLayerByAttribute_management('BG_lyr', 'CLEAR_SELECTION')

        """ Write the statement for the metadata"""
##        popOffLang = 'Because of this, the dasymetric population for ' + str(bgOFF) +  ' ' + str(cityName) + ' block groups are missing a total of '
##        for reason in reasons:
##            popOffLang = popOffLang + str(reason[1]) + ' people due to ' + str(reason[0]) + ' and '
##        popOffLang = popOffLang[0:-5] + '.'
##    else:
##        arcpy.SelectLayerByAttribute_management('Blks_Off_lyr', 'CLEAR_SELECTION')
##        popOffLang = 'In ' + cityName + ', however these issues were not apparent.'
        """ change as per Laura Jackson, 12/1/2017 """
        popOffLang = 'Because of this, the modeled dasymetric population for ' + str(bgOFF) +  ' ' + str(cityName) + ' block groups are missing a total of '
        for reason in reasons:
            popOffLang = popOffLang + str(reason[1]) + ' people as compared to the Census data due to ' + str(reason[0]) + ' and '
        popOffLang = popOffLang[0:-5] + '.'
    else:
        arcpy.SelectLayerByAttribute_management('Blks_Off_lyr', 'CLEAR_SELECTION')
        popOffLang = 'In ' + cityName + ', however these issues were not apparent.'

    #------------- READ IN LOGS THAT ARE USED FREQUENTLY ----------------------------
    loglist = sorted(f for f in os.listdir(logDir) if f.startswith(str(city) + '_Reuse'))
    logfile = loglist[-1]
    reuseLog = open(logDir + '/' + logfile, 'r')
    reuseLines = reuseLog.readlines()

    #============== LOOP THROUGH PROCESSES TO BE UPDATED ==============================
    for process, metrics in runPandM:
        print process
		#-------------- LOOP THROUGH THE INDIVIDUAL METRICS IN EACH PROCESS --------------
        for metric in metrics:

            #-------------- READ IN THE METRIC LOG ----------------------------------------
            if metric == 'BG':
                loglist = sorted(f for f in os.listdir(logDir) if f.startswith(str(city) + '_' + str(metric) + '__'))
            else:
                loglist = sorted(f for f in os.listdir(logDir) if f.startswith(str(city) + '_' + str(metric)))
            logfile = loglist[-1]
            log = open(logDir + '/' + logfile, 'r')
            lines = log.readlines()

            #-------------- OPEN & COPY THE TEMPLATE AND LOG FILES -------------------------
            finalXML = str(metaDir) + '/' + str(city) + '_' + str(metric) + '.xml'
            shutil.copyfile(metaTemplate + '/' + 'Temp_' + str(metric) + '.xml', finalXML)
            metaTree = ET.parse(finalXML)
            metaRoot = metaTree.getroot()

            #-------------- UPDATE PLACE KEYWORKDS -----------------------------------------
            for child in metaTree.iterfind('idinfo/keywords/place/placekey[1]'):
				child.text = str(cityName) + ', ' + str(stateAbbrev)
            for child in metaTree.iterfind('idinfo/keywords/place/placekey[2]'):
				child.text = str(stateName)

            #-------------- UPDATE TITLE ---------------------------------------------------
            for child in metaTree.iterfind('idinfo/citation/citeinfo/title'):
                longTitle = child.text
                titlePieces = longTitle.split(' - ')
                child.text = "EnviroAtlas - " + str(cityName) + ', ' + str(stateAbbrev) + " - " + str(titlePieces[2])

            #-------------- UPDATE BOUNDING BOX --------------------------------------------
            """ If the output is a non-standard raster, find the bounding box """
            if metric in ['ParkDist', 'PctTreeBuff250', 'PctTreeBuff300']:
				try:
					desc = arcpy.Describe(str(finalDir) + '/' + str(city) + '_' + metric)
				except:
					desc = arcpy.Describe('G:/OtherFolks/Harvard/' + str(city) + '_' + metric + '.tif')

				if 'UTM' in str(desc.spatialReference.name) == True:
					prjNumb = desc.spatialReference.name[-3] + desc.spatialReference.name[-2]

					SW = CoorConv.utmToLatLng(float(prjNumb), float("%.2f" % desc.extent.XMin), float("%.2f" % desc.extent.YMin), True)
					NE = CoorConv.utmToLatLng(float(prjNumb), float("%.2f" % desc.extent.XMax), float("%.2f" % desc.extent.YMax), True)
					southBound = str(round(SW[0], 5))
					westBound = str(round(SW[1], 5))
					northBound = str(round(NE[0], 5))
					eastBound = str(round(NE[1], 5))

				else:
					print 'Data is not in UTM. Cannot update bounding box(es).'
					southBound = 'NA'
					westBound = 'NA'
					northBound = 'NA'
					eastBound = 'NA'

            """ Update the Bouding Box """
            for child in metaTree.iterfind('idinfo/spdom/bounding/westbc'):
				child.text = str(westBound)
            for child in metaTree.iterfind('idinfo/spdom/bounding/eastbc'):
				child.text = str(eastBound)
            for child in metaTree.iterfind('idinfo/spdom/bounding/northbc'):
				child.text = str(northBound)
            for child in metaTree.iterfind('idinfo/spdom/bounding/southbc'):
				child.text = str(southBound)

            #-------------- UPDATE METADATA DATES ------------------------------------------
            today = time.strftime('%Y%m%d')
            for child in metaTree.iterfind('metainfo/metd'):
				child.text = str(today)

            frdate = int(today) + 40000
            for child in metaTree.iterfind('metainfo/metfrd'):
				child.text = str(frdate)

            #-------------- UPDATE ENTITY LABEL --------------------------------------------
            for child in metaTree.iterfind('eainfo/detailed/enttyp/enttypl'):
				child.text = str(city) + '_' + str(metric)

            #-------------- UPDATE PROCESSING STEPS, ABSTRACT, AND OVERVIEW ----------------
            replacements = [['GSE', gsEquation], ['GSBE', gsbEquation], ['GS', gsText], ['MFE', mfEquation], ['MFIE', mfIEquation], ['MF', mfText], ['RFE', rfEquation], ['RBRF', rfrbEquation], ['RF', rfText], ['GUID', guidEquation], ['VGE', vgEquation], ['RBVG', vgrbEquation], ['VG', vgText], ['RBLA', larbEquation], ['LCSum', lcSumText], ['MissLC', missLC], ['CitySt', cityName + ', ' + stateAbbrev], ['STATE', stateName], ['MISSPOP', popOffLang]]

            """-------- UPDATE LAND COVER TEXT IN THE ABSTRACT ------------------------------"""
            for child in metaTree.iterfind('idinfo/descript/abstract'):
				abstractText = child.text

            if 'REPLACE' in abstractText:
				for id, outText in replacements:
						if 'REPLACE-' + str(id) in abstractText:
							abstractText = abstractText.replace('REPLACE-' + str(id), str(outText))
				for child in metaTree.iterfind('idinfo/descript/abstract'):
					child.text = abstractText

            """-------- UPDATE MISSING POPULATION TEXT IN THE OVERVIEW ----------------------"""
            for child in metaTree.iterfind('eainfo/overview/eaover'):
				overviewText = child.text

            if 'REPLACE' in overviewText:
				for id, outText in replacements:
						if 'REPLACE-' + str(id) in overviewText:
							overviewText = overviewText.replace('REPLACE-' + str(id), str(outText))
				for child in metaTree.iterfind('eainfo/overview/eaover'):
					child.text = overviewText

            """-------- UPDATE LAND COVER TEXT IN THE PROCESSING STEPS ----------------------"""
            """ Find Each Processing Step Description and Date """
            for i in range(1, len(lines)+1):
                line = lines[i-1].split('--')
                desc = line[0]
                date = line[1]

                """ Correct Step Description using city-specific values """
                if 'REPLACE' in desc:
					for id, outText in replacements:
						if 'REPLACE-' + str(id) in desc:
							desc = desc.replace('REPLACE-' + str(id), str(outText))

                """ Correct Step Date using city-specific values """
                if date[0].isalpha() == True:
                    for line in reuseLines:
						if date in line:
							pieces = line.split('--')
							date = pieces[1]

                """ Add the metadata fields for the processing step """
                lineage = metaRoot.find('dataqual/lineage')
                procstep = ET.SubElement(lineage, 'procstep')
                ET.SubElement(procstep, 'procdate')
                ET.SubElement(procstep, 'procdesc')

                """ Insert the Step Description and Date in the metadata """
                for child in metaTree.iterfind('dataqual/lineage/procstep['+ str(i) + ']/procdate'):
					child.text = str(date)
                for child in metaTree.iterfind('dataqual/lineage/procstep['+ str(i) + ']/procdesc'):
					child.text = str(desc)

            """ Update the Publication Date """
            for child in metaTree.iterfind('idinfo/citation/citeinfo/pubdate'):
				child.text = str(date)

            #-------------- UPDATE MIN/MAX VALUES ------------------------------------------
            """ Get the Data Type for the Metric """
            fc = finalDir + '/' + city + '_' + str(metric)
            desc = arcpy.Describe(fc)

            """ If the Metric is a Table, Update the Min/Max Values """
            if desc.dataType == 'Table':

                """ Get a List of Layers, excluding BGRP """
                layers = [f.name for f in arcpy.ListFields(fc)]
                layers.remove('OBJECTID')
                try:
					layers.remove('BGRP')
                except:
					pass
                try:
					layers.remove('bgrp')
                except:
					pass

                """ Identify the location of each layer in the XML """
                lyrLoc = []
                i = 1
                for child in metaTree.iterfind('eainfo/detailed/attr/attrlabl'):
                    label = child.text
                    lyrLoc.append([i, label])
                    i = i + 1



                """ Find the Min/Max for Each Layer """
                for layer in layers:

                    """ Identify the Null Label for the Metric, if applicable """
                    nullLabel = 'No People Living in Block Group'
                    if process == 'RB':
                        nullLabel = 'No Buffer Area'
                    if metric == 'EduLowGS':
                        if layer == 'Day_Low':
                            nullLabel = 'No Day Cares'
                        if layer == 'K12_Low':
                            nullLabel = 'No Schools'

                    """ Find Layer in the XML """
                    for i, lyrName in lyrLoc:
                        if layer == lyrName:
							metaLoc = i
                    attr = metaRoot.find('eainfo/detailed/attr[' + str(metaLoc) + ']')

                    """ Get the Layer Values """
                    valueList = []
                    cursor = arcpy.SearchCursor(str(finalDir) + '/' + str(city) + '_' + str(metric))
                    for row in cursor:
						value = row.getValue(str(layer))
						valueList.append(value)
                    valueList = sorted(valueList)

                    """ If there are NULLS in the Data """
                    nulls = [-888888, -99999, -99998, -99997]
                    nullInData = False
                    for null in nulls:
						if null in valueList:
							nullInData = True
							break

                    if nullInData == True:
                        position = 1
                        """ Address -888888 Values """
                        if -888888 in valueList:
                            """ Add the XML Pieces for the Value """
                            attrdomv = ET.SubElement(attr, 'attrdomv')
                            edom = ET.SubElement(attrdomv, 'edom')
                            ET.SubElement(edom, 'edomv')
                            ET.SubElement(edom, 'edomvd')
                            ET.SubElement(edom, 'edomvds')

                            """ Add the Data to the new XML Pieces """
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomv'):
                                child.text = str(-888888)
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvd'):
                                child.text = 'This layer was not calculated in the community. The record is here as a place holder'
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvds'):
                                child.text = 'US EPA'
                            position = position + 1

                        else:
                            """ Address -99999 Values """
                            if -99999 in valueList:
    							""" Add the XML Pieces for the Value """
    							attrdomv = ET.SubElement(attr, 'attrdomv')
    							edom = ET.SubElement(attrdomv, 'edom')
    							ET.SubElement(edom, 'edomv')
    							ET.SubElement(edom, 'edomvd')
    							ET.SubElement(edom, 'edomvds')

    							""" Null Labels """

    							""" Add the Data to the new XML Pieces """
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomv'):
    								child.text = str(-99999)
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvd'):
    								child.text = str(nullLabel)
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvds'):
    								child.text = 'US EPA'
    							position = position + 1

                            """ Address -99998 Values """
                            if -99998 in valueList:
    							""" Add the XML Pieces for the Value """
    							attrdomv = ET.SubElement(attr, 'attrdomv')
    							edom = ET.SubElement(attrdomv, 'edom')
    							ET.SubElement(edom, 'edomv')
    							ET.SubElement(edom, 'edomvd')
    							ET.SubElement(edom, 'edomvds')

    							""" Add the Data to the new XML Pieces """
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomv'):
    								child.text = str(-99998)
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvd'):
    								child.text = 'Because the EnviroAtlas 1-m Land Cover does not extend to the full study area for this analysis, the data for this Census Block Group could not be calculated.'
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvds'):
    								child.text = 'US EPA'
    							position = position + 1
							
							""" Address -99997 Values """
                            if -99997 in valueList:
    							""" Add the XML Pieces for the Value """
    							attrdomv = ET.SubElement(attr, 'attrdomv')
    							edom = ET.SubElement(attrdomv, 'edom')
    							ET.SubElement(edom, 'edomv')
    							ET.SubElement(edom, 'edomvd')
    							ET.SubElement(edom, 'edomvds')

    							""" Add the Data to the new XML Pieces """
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomv'):
    								child.text = str(-99997)
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvd'):
    								child.text = 'Because the FEMA Floodplain coverage does not extend to the full study area for this analysis, the data for this Census Block Group could not be calculated.'
    							for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvds'):
    								child.text = 'US EPA'
    							position = position + 1								

                            """ Address Actual Min/Max Values """
                            attrdomv = ET.SubElement(attr, 'attrdomv')
                            edom = ET.SubElement(attrdomv, 'edom')
                            ET.SubElement(edom, 'edomv')
                            ET.SubElement(edom, 'edomvd')
                            ET.SubElement(edom, 'edomvds')

                            """ Get the Min and Max Values """
                            max = valueList[-1]

                            notNulls = []
                            for value in valueList:
    							if value > -10:
    								notNulls.append(value)
                            notNulls = sorted(notNulls)
                            min = notNulls[0]

                            """ Get the appropriate number of decimals """
                            dec = 0
                            if 'Pct' in layer:
    							dec = 2
                            elif 'pct' in layer:
    							dec = 2
                            elif '13pc' in layer:
    							dec = 2
                            elif layer[-1] == 'P':
    							dec = 2

                            """ Get the label for the data """
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdef'):
                                mmLabel = child.text

                            """ Add the Data to the new XML Pieces """
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomv'):
                                if dec == 0:
                                    child.text = str(int(round(min, dec))) + ' - ' + str(int(round(max, dec)))
                                else:
                                    child.text = str(round(min, dec)) + ' - ' + str(round(max, dec))
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvd'):
    							child.text = str(mmLabel)
                            for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv[' + str(position) + ']/edom/edomvds'):
    							child.text = 'US EPA'

                    else:
                        """ If no Nulls, Add XML Pieces """
                        attrdomv = ET.SubElement(attr, 'attrdomv')
                        rdom = ET.SubElement(attrdomv, 'rdom')
                        ET.SubElement(rdom, 'rdommin')
                        ET.SubElement(rdom, 'rdommax')

                        """ Get the Min and Max """
                        max = valueList[-1]
                        min = valueList[0]

                        """ Get the appropriate number of decimals """
                        dec = 0
                        if 'Pct' in layer:
							dec = 2
                        elif 'pct' in layer:
							dec = 2
                        elif '13pc' in layer:
							dec = 2
                        elif layer[-1] == 'P':
							dec = 2

                        """ Add the Data to the new XML Pieces """
                        for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv/rdom/rdommin'):
                            if dec == 0:
                                child.text = str(int(round(float(min), dec)))
                            else:
								child.text = str(round(float(min), dec))

                        for child in metaTree.iterfind('eainfo/detailed/attr[' + str(metaLoc) + ']/attrdomv/rdom/rdommax'):
							if dec == 0:
								child.text = str(int(round(float(max), dec)))
							else:
								child.text = str(round(float(max), dec))

            elif desc.dataType == 'RasterDataset':
				""" Get the Min and Max """
				try:
					min = arcpy.GetRasterProperties_management(str(finalDir) + '/' + str(city) + '_' + metric, 'MINIMUM').getOutput(0)
					max = arcpy.GetRasterProperties_management(str(finalDir) + '/' + str(city) + '_' + metric, 'MAXIMUM').getOutput(0)
				except:
					min = arcpy.GetRasterProperties_management('G:/OtherFolks/Harvard/' + str(city) + '_' + metric + '.tif', 'MINIMUM').getOutput(0)
					max = arcpy.GetRasterProperties_management('G:/OtherFolks/Harvard/' + str(city) + '_' + metric + '.tif', 'MAXIMUM').getOutput(0)

				""" Add the Data to the new XML Pieces """
				for child in metaTree.iterfind('eainfo/detailed/attr/attrdomv[2]/edom/edomv'):
					child.text = str(min) + ' - ' + str(max)

            elif metric == 'IntDen':
                """ Get the Min and Max """
                intDenRast = splitDir + '/' + city + '_IntDen.tif'
                min = arcpy.GetRasterProperties_management(intDenRast, 'MINIMUM').getOutput(0)
                max = arcpy.GetRasterProperties_management(intDenRast, 'MAXIMUM').getOutput(0)

                """ Add the Data to the new XML Pieces """
                for child in metaTree.iterfind('eainfo/detailed/attr/attrdomv/rdom/rdommin'):
                    child.text = str(round(float(min), 4))
                for child in metaTree.iterfind('eainfo/detailed/attr/attrdomv/rdom/rdommax'):
                    child.text = str(round(float(max), 4))


                """ Write the Final XML for the Layer """
            ET.ElementTree(metaRoot).write(finalXML)

    print 'Add sentence to _BG Overview about specific BG inclusions/exclusions for the community'
    print 'Fix ANALYST-TIME processing dates for Park_Pop, Park_Prox, ParkDist, IntDen, PctStGS, PctStTC, NrRd_Pop, NrRd_PFor, PctTreeBuff250, and PctTreeBuff300.'
    print 'Fix first processing step in Park_Pop, Park_Prox, and ParkDist.'



