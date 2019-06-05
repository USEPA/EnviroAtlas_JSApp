#-----------------------------------------------------------------------------
# Name:     LCBinary.py
#
# Author:   Ali Mackey
#
# Created:  12/12/2013
# Updated:  04/27/2017
#
# Purpose:  This script develops Impervious, Water, Forest, Green Space and
#           Vegetated Land Cover Binaries for use in various analyses.
#
# Input:    The location of the input data is defined in the Comm_Module.py
#           script and is used as an argument in the LCBin function.
#           The data needed to process this scripts is:
#               1. Land Cover (community)
#-----------------------------------------------------------------------------

def LCBin(city, inDir, workFld):
    import traceback, time, arcpy, os
    from arcpy import env
    arcpy.CheckOutExtension('Spatial')

    #-------- DIRECTORY SETUP ------------------------------------------------
    """ Report File Directory """
    reportfileDir = str(workFld) + '/Logs'
    """ Frequent Directory """
    freqDir = str(workFld) + '/' + city +'_Freq.gdb'
    workGDB = freqDir
    """ Final Geodatabase """
    finalDir = str(workFld) + '/' + city + '_Final.gdb'

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
        try:
            loglist = sorted (f for f in os.listdir(reportfileDir) if f.startswith(str(city) + '_Reuse'))
            tmpName = loglist[-1]
        except:
            tmpName = city + '_Reuse_' + time.strftime('%Y%m%d_%H-%M') + '.txt'
        reportfileName = reportfileDir + '/' + tmpName

        try:
			ReuseRF = open(reportfileName, 'a')
        except:
            ReuseRF = open(reportfileName, 'w')
            print 'Creating Reuse Log'

        """ Write out first line of report file """
        print 'LC Binary Start Time: ' + time.asctime()

        #-------- PROCESSING LAYERS ----------------------------------------------
        """ Set Environments """
        arcpy.env.extent = freqDir + '/LC'
        arcpy.env.snapRaster = freqDir + '/LC'

        """-------- Reclassify LC into Binary Impervious ----------------------------- """
        outReclass2 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,1], [21,1],[22,1],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
        outReclass2.save('ImpIO')
        del outReclass2
        ReuseRF.write("ImpIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

        """-------- Reclassify LC into Binary Water ----------------------------- """
        outReclass3 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,0],[21,0],[22,0],[30,0],[40,0],[52,0],[70,0],[80,0],[82,0],[91,0],[92,0]]))
        outReclass3.save('WaterIO')
        del outReclass3
        ReuseRF.write("WaterIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

        """-------- Reclassify LC into Binary Modified Forest (Incl. Orchards) ----- """
        outReclass4 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,0],[70,0],[80,0],[82,1],[91,1],[92,0]]))
        outReclass4.save('MForestIO')
        del outReclass4
        ReuseRF.write("MForestIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

        """-------- Reclassify LC into Binary Riparian Forest (Excl. Orchards) ----- """
        outReclass5 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,0],[70,0],[80,0],[82,0],[91,1],[92,0]]))
        outReclass5.save('RipForIO')
        del outReclass5
        ReuseRF.write("RipForIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

        """-------- Reclassify LC into Binary Green Space (Incl. Ag + Orchards) ----- """
        outReclass6 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
        outReclass6.save('GreenIO')
        del outReclass6
        ReuseRF.write("GreenIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

        """-------- Reclassify LC into Binary Vegetation (Excl. Ag + Orchards) ----- """
        outReclass7 = arcpy.sa.Reclassify('LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,0],[20,0],[21,0],[22,0],[30,0],[40,1],[52,1],[70,1],[80,0],[82,0],[91,1],[92,1]]))
        outReclass7.save('VegeIO')
        del outReclass7
        ReuseRF.write("VegeIO--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')

##        """-------- Reclassify LC into Binary Green Space with Water (Incl. Ag + Orchards) ----- """
##        outReclass = arcpy.sa.Reclassify('/LC', 'Value', arcpy.sa.RemapValue([[0,0],[10,1],[20,0],[21,0],[22,0],[30,0],[40,1],[52,1],[70,1],[80,1],[82,1],[91,1],[92,1]]))
##        outReclass.save(str(freqDir) + '/GBSIO')
##        ReuseRF.write("GBSIO--" + time.strftime('%Y%m%d--%H%M%S') + '--\n')

        print 'LC Binary End Time: ' + time.asctime() + '\n'
        ReuseRF.write("LC Binary Finish Time--" + time.strftime("%Y%m%d--%H:%M:%S") +  '\n')
        #-------- COMPELETE LOGFILES ---------------------------------------------
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
        ReuseRF.write("\nSomething went wrong.\n\n")
        ReuseRF.write("Pyton Traceback Message below:")
        ReuseRF.write(traceback.format_exc())
        ReuseRF.write("\nArcMap Error Messages below:")
        ReuseRF.write(arcpy.GetMessages(2))
        ReuseRF.write("\nArcMap Warning Messages below:")
        ReuseRF.write(arcpy.GetMessages(1))

        ReuseRF.write( "\n\nEnded at " + time.asctime() + '\n')
        ReuseRF.write("\n---End of Log File---\n")

        if ReuseRF:
            ReuseRF.close()
