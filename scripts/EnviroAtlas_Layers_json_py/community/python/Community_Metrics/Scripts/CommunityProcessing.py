#-----------------------------------------------------------------------------
# Name:     CommunityProcessing.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  05/03/2014
#
# Purpose:  Runs each of the processing scripts for the EnviroAtlas Community
#           Component. Can run the processing scripts all together or
#           individually, as needed. Can run multiple cities.
#
# Inputs:   See Community OneNote for Directions
#
#-----------------------------------------------------------------------------

"""-------- COMMUNITY INFORMATION -------------------------------------------"""
# Add the abbreviation and name for the community you want to process
# Abbreviation ust match saved input data -- Example: CleOH for Cleveland, OH
# Name is the name of the city as you want to designate it -- Example: Cleveland

for city, cityName in [['SonCA', 'Sonoma County'], ['PhiPA', 'Philadelphia']]:

    """-------- SELECT PROCESSES TO RUN -----------------------------------------"""
    # For all: processesToRun = 'All'
    # For a few: processesToRun = ['Process', 'Process', ...]
    # Full List for Reference: ['Freq', 'LCBinary', 'LCSum', 'School', 'GreenP', 'ImpP', 'Parks', 'NrRd', 'WVW', 'WVT', 'RB', 'GUIDOS_Prep', 'GUIDOS', 'GSTCnWR', 'IntDen', 'Floodplains', 'NrRdRsch', 'Metadata']

    processesToRun = ['Parks']

    """-------- SELECT METADATA TO PROCESS --------------------------------------"""
    # For all: metaProc = 'All'
    # For a few: metaProc = ['Process', 'Process', ...]
    # To match the running processes: metaProc = processesToRun

    metaProc = ['Floodplains']

    """ If you want to skip a process or two """
    # For one: metaSkips = ['Process']
    # For a few: metaSkips = ['Process', 'Process', ...]
    metaSkips = []

    """-------- SET COMPUTER DIRECTORIES ----------------------------------------"""
    # If working on computer: D2626XLJACKS031, leave as is.
    # Base is the folder where you want the script to operate.
    # inDir is where the input data is located.

    if city == 'CIL':
        base = 'F:/GIS/Cities'
    elif city[0] < 'N':
        base = 'E:/GIS/Cities'
    else:
        base = 'N:/GIS/Cities'

    inDir = 'E:/GIS/Input'

    """ Create the working directory in the base directory """
    import traceback, time, arcpy, os, sys
    try:
        os.makedirs(str(base) + '/' + str(city))
        workFld = (str(base) + '/' + str(city))
    except:
        workFld = str(base) + '/' + str(city)

    """-------- RUN SELECTED PROCESSES ------------------------------------------"""
    if processesToRun == 'All':
        processesToRun = ['Freq', 'LCBinary', 'LCSum','School', 'GreenP', 'ImpP', 'Parks', 'NrRd', 'WVW', 'WVT', 'RB', 'GUIDOS_Prep', 'GUIDOS', 'GSTCnWR', 'IntDen', 'Floodplains', 'NrRdRsch', 'Metadata']

    """ Make Sure the Processes Listed are Real """
    for process in processesToRun:
        if process not in ['Freq', 'LCBinary', 'LCSum','School', 'GreenP', 'ImpP', 'Parks', 'NrRd', 'WVW', 'WVT', 'RB', 'GUIDOS_Prep', 'GUIDOS', 'GSTCnWR', 'IntDen', 'Floodplains', 'NrRdRsch', 'Metadata']:
            print 'One of the processes you listed is not acutally a process. Please correct and rerun.'
            exit()


    if 'Freq' in processesToRun:
        import Frequent_V2
        Frequent_V2.freq(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Freq.gdb')

    if 'GUIDOS_Prep' in processesToRun:
        import GUIDOS_Prep
        GUIDOS_Prep.Guidos_Prep(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'LCBinary' in processesToRun:
        import LCBinary
        LCBinary.LCBin(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Freq.gdb')

    if 'LCSum' in processesToRun:
        import LCSum
        LCSum.LCSum(city, inDir, workFld)

    if 'School' in processesToRun:
        import Schools
        Schools.Schools(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_EduPts.gdb')

    if 'Parks' in processesToRun:
        import Parks
        Parks.ParksP(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Parks.gdb')

    if 'NrRd' in processesToRun:
        import NrRd
        NrRd.NrRd(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_NrRd.gdb')

    if 'RB' in processesToRun:
        import RB_v2
        RB_v2.RB(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_RB.gdb')

    if 'WVW' in processesToRun:
        import WaterViews
        WaterViews.WVW(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_WaterWV.gdb')
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'WVT' in processesToRun:
        import TreeViews
        TreeViews.WVT(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_TreeWV.gdb')
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'GreenP' in processesToRun:
        import GreenProx
        GreenProx.GreenP(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_GreenProx.gdb')
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'ImpP' in processesToRun:
        import ImpProx
        ImpProx.ImpP(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_ImpProx.gdb')
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'GSTCnWR' in processesToRun:
        import GSTCnWR
        GSTCnWR.GSTCnWR(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_GSTCnWR.gdb')
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_Split')

    if 'IntDen' in processesToRun:
        import IntDen
        IntDen.IntDen(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_IntDen.gdb')

    if 'Floodplains' in processesToRun:
        #import Floodplains
        #Floodplains.Floodplain(city, inDir, workFld)
        import FloodplainPrep, Floodplain
        FloodplainPrep.PrepFloodplain(city, inDir, workFld)
        Floodplain.Floodplain(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(str(workFld) + '/' + city + '_Floodplain.gdb')

    if 'NrRdRsch' in processesToRun:
        import NrRdRsch
        NrRdRsch.NrRdRsch(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_NrRdRsch.gdb')

    if 'GUIDOS' in processesToRun:
        import GUIDOS
        GUIDOS.Guidos_Post(city, inDir, workFld)
        arcpy.BuildPyramidsandStatistics_management(workFld + '/' + city + '_GUIDOS.gdb')

    if 'Metadata' in processesToRun:
        try:
            metaProc.remove('Metadata')
        except:
            pass
        import Meta_All
        Meta_All.metadata(city, inDir, workFld, cityName, metaProc, metaSkips)
