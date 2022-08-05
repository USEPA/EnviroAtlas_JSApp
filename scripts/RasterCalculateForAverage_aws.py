import arcpy, os, sys
import arcgisscripting
import zipfile
import csv
#from dbfpy import dbf
from arcpy import env
from arcpy import Raster
from arcpy.sa import *
from arcpy.analysis import *

### Define global variables
###
##gp = arcgisscripting.create(10.2)

climateData = r"D:\Public\Data\projects\ClimateData_2015"

#averageResultFolder = r"C:\Users\bji\Documents\Test_ECAT"
averageResultFolder = r"D:\Public\Data\projects\ClimateData_2015\Average_ECAT"


scenarioList = ["Hist", "RCP26", "RCP45", "RCP60", "RCP85"]
climateVariableList = ["PET", "Precip", "TempMax",  "TempMin"]
seasonList = ["Annual", "Fall", "Spring", "Summer", "Winter"]
##scenarioList = ["Hist"]
##climateVariableList = ["TempMax"]
##seasonList = ["Fall"]
averageRange = 5


def main():
    try:
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise LicenseError

        #pathHist = os.path.join(climateData, "Hist\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection + ".gdb")
        #pathFuture = os.path.join(climateData, futureClimateScenario + "\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection + ".gdb")
        for scenario in scenarioList:
            print("calculating : " + scenario)
            scenarioFolder = os.path.join(averageResultFolder, scenario)
            if not os.path.exists(scenarioFolder):
                os.makedirs(scenarioFolder)
                for climateVariable in climateVariableList:
                    climateVariableFolder = os.path.join(scenarioFolder, climateVariable)
                    if not os.path.exists(climateVariableFolder):
                        os.makedirs(climateVariableFolder)
                        for season in seasonList:                    
                            arcpy.CreateFileGDB_management(climateVariableFolder, season + climateVariable)
                            sourceDataBase = os.path.join(climateData, scenario+ "\\" + climateVariable + "\\" + season + climateVariable + ".gdb")
                            env.workspace = sourceDataBase
                            rasterList = arcpy.ListRasters("*")
                            yearList = []
                            #yearList.append(2)
                            for raster in rasterList:
                                if climateVariable in raster: 
                                    yearList.append(int(raster[1:5]));                                
                            print("min, max: " + sourceDataBase + ": ")
                            print(str(min(yearList)) + ", " + str(max(yearList)))
                            if (int(min(yearList)) % averageRange) != 0:
                                startingYearBaseline = int(min(yearList)) + averageRange - (int(min(yearList)) % averageRange)
                            else:
                                startingYearBaseline = int(min(yearList))
                            endingYearBaseline = startingYearBaseline + averageRange  - 1
                            print("startingYearBaseline , endingYearBaseline:" + str(startingYearBaseline) + ", " + str(endingYearBaseline))
                            print("max(yearList):" + str(max(yearList)))
                            while (endingYearBaseline  <= max(yearList)):
                                if season != "Annual":
                                    resultAverage = Raster(os.path.join(sourceDataBase, "T" + str(startingYearBaseline) + "_" + season + climateVariable))
                                else:
                                    resultAverage = Raster(os.path.join(sourceDataBase, "T" + str(startingYearBaseline) + "_" + climateVariable))
                                for yearHist in range(int(startingYearBaseline) + 1, int(endingYearBaseline) + 1):
                                    if season != "Annual":
                                        resultAverage = resultAverage + Raster(os.path.join(sourceDataBase, "T" + str(yearHist) + "_" + season + climateVariable))
                                    else:
                                        resultAverage = resultAverage + Raster(os.path.join(sourceDataBase, "T" + str(yearHist) + "_" + climateVariable))
                                        
                                ##resultAverage = resultAverage/(int(endingYearBaseline) + 1 - int(startingYearBaseline)) ## the result should be the sum, rather than average

                                print("result data: " + os.path.join(climateVariableFolder + "\\" + season + climateVariable + ".gdb", "T" + str(startingYearBaseline) + "_" + str(endingYearBaseline)))
                                if resultAverage is not None:
                                    resultAverage.save(os.path.join(climateVariableFolder + "\\" + season + climateVariable + ".gdb", "T" + str(startingYearBaseline) + "_" + str(endingYearBaseline)))
                                startingYearBaseline = startingYearBaseline + averageRange
                                endingYearBaseline = startingYearBaseline + averageRange  - 1
                              
                            

    except IOError as e:
        arcpy.AddWarning("IOError, errno: " + e.errno + "IOError, strerror: " +  e.strerror  )        
    except ValueError as e:
        arcpy.AddWarning("ValueError: " + e)
    except:
        arcpy.AddWarning("other error")
        arcpy.AddWarning("Error: {0}".format(sys.exc_info()[0]))

        
if __name__ == '__main__':
    main()
