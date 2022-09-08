import arcpy, os, sys, time
import arcgisscripting
import zipfile
import csv
#from dbfpy import dbf
from arcpy import env
from arcpy import Raster
from arcpy.sa import *
from arcpy.analysis import *
from datetime import datetime
#from simpledbf import Dbf5
def dbf2csv(dbfpath, csvpath):
    ''' To convert .dbf file or any shapefile/featureclass to csv file
    Inputs: 
        dbfpath: full path to .dbf file [input] or featureclass
        csvpath: full path to .csv file [output]
    '''
    #import csv
    rows = arcpy.SearchCursor(dbfpath)
    #csvFile = csv.writer(open(csvpath, 'wb')) #output csv; 'wb' works for python 2.*
    csvFile = csv.writer(open(csvpath, 'w')) #output csv; 'wb' works for python 3.*
    fieldnames = [f.name for f in arcpy.ListFields(dbfpath)]
    allRows = []
    for row in rows:
        rowlist = []
        for field in fieldnames:
            rowlist.append(row.getValue(field))
        allRows.append(rowlist)
    csvFile.writerow(fieldnames)
    for row in allRows:
        csvFile.writerow(row)
    row = None
    rows = None
def zipws(path, zip, keep):
    arcpy.AddWarning("inside zipws:" )
    path = os.path.normpath(path)
    for (dirpath, dirnames, filenames) in os.walk(path):
        for file in filenames:
            if not file.endswith('.lock'):
                arcpy.AddMessage("Adding %s..." % os.path.join(path, dirpath, file))
                try:
                    if keep:
                        zip.write(os.path.join(dirpath, file), os.path.join(os.path.basename(path), os.path.join(dirpath, file)[len(path)+len(os.sep):]))
                    else:
                        zip.write(os.path.join(dirpath, file), os.path.join(dirpath[len(path):], file))
                except Exception as e:
                    arcpy.AddWarning("    Error adding %s: %s" % (file, e))
    return None
def computeRasterByYearRange(rasterList, startingYear, endingYear):
    previousAverageStart = 0
    for yearIndex in range(int(startingYear), int(endingYear) + 1, 1):
        if ((yearIndex % averageRange) != 0):
            currentRangeStart = int(yearIndex) - (int(yearIndex) % averageRange)
            if (currentRangeStart != previousAverageStart):
                pathCurrent = chooseDataPath(yearIndex)
                if seasonSelection != "Annual":
                    rasterList.append( os.path.join(pathCurrent, "T" + str(yearIndex) + "_" + seasonSelection + climateVariableSelection + rasterFormat) )
                else:
                    rasterList.append( os.path.join(pathCurrent, "T" + str(yearIndex) + "_" + climateVariableSelection + rasterFormat) )
        else:
            if ((yearIndex + averageRange)<=int(endingYear)):
                pathCurrent = chooseAverageDataPath(yearIndex)
                rasterList.append(os.path.join(pathCurrent, "T" + str(yearIndex) + "_" + str(yearIndex + averageRange - 1) + rasterFormat))
                previousAverageStart = yearIndex
            else:        
                pathCurrent = chooseDataPath(yearIndex)
                if seasonSelection != "Annual":
                    rasterList.append( os.path.join(pathCurrent, "T" + str(yearIndex) + "_" + seasonSelection + climateVariableSelection + rasterFormat) )
                else:
                    rasterList.append( os.path.join(pathCurrent, "T" + str(yearIndex) + "_" + climateVariableSelection + rasterFormat) )
           
def chooseDataPath(year):
    if (float(year) <= float(endOfHistoricYear)):
        return os.path.join(s3Path, climateDataFolder + "\\" + "Hist\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
    else:
        return os.path.join(s3Path, climateDataFolder + "\\" + futureClimateScenario + "\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
def chooseAverageDataPath(year):
    if (float(year) <= float(endOfHistoricYear)):
        return os.path.join(s3Path, climateAverageDataFolder + "\\" + "Hist\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
    else:
        return os.path.join(s3Path, climateAverageDataFolder + "\\" + futureClimateScenario + "\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
        
    
# Define global variables
#
gp = arcgisscripting.create(10.2)
s3Path = "D:/Public/Data/projects/s3bucket/enviroatlas-vdc-stage-s3bucket.acs"
climateDataFolder = "ClimateData_2015_crf"
#climateData = r"D:\Public\Data\projects\s3bucket\temp\EnviroAtlas\ClimateData_2015_crf"
climateAverageDataFolder = "ClimateData_2015_crf/Average_ECAT"
#climateAverageData = r"D:\Public\Data\projects\s3bucket\temp\EnviroAtlas\ClimateData_2015_crf\Average_ECAT"
rasterFormat = ".crf"
#scratchWS  = arcpy.env.scratchWorkspace
scratchWS  = r"D:\Public\Data\projects\EnviroAtlas_Public\scripts\ECAT_script\Scratch\scratch.gdb"
arcpy.env.scratchWorkspace = scratchWS
desc = arcpy.Describe(scratchWS)
scratchPath = desc.path
arcpy.AddWarning("scratchWS: " + scratchWS)
precision = 0.1
#tempFileInt = os.path.join(scratchWS, "resultInt") 
tempFile = scratchWS + "\\resultFloat"
tempFutureAverageRas = scratchWS + "\\FutureAverage"
tempHistAverageRas = scratchWS + "\\HistAverage"
tempFileInt = scratchWS + "\\resultInt" # this is the integer raster result obtained from tempFile / precision
arcpy.AddWarning("scratchWS:" + scratchWS)
arcpy.AddWarning("scratchPath:" + scratchPath)
arcpy.AddWarning("tempFile:" + tempFile)
arcpy.AddWarning("tempFileInt:" + tempFileInt)
ZipFolderName = "ZipShapefileFolder"
shpFileName = "comparison.shp"
ZipFileName  = os.path.join(scratchWS, "resultShp.zip")
endOfHistoricYear = 2005
histRasterList = [];
futureRasterList = [];
gp.LogHistory = True
futureClimateScenario = arcpy.GetParameterAsText(0) #eg: RCP60
startingYearBaseline = arcpy.GetParameterAsText(1)
endingYearBaseline = arcpy.GetParameterAsText(2)
startingYearFuture = arcpy.GetParameterAsText(3)
endingYearFuture = arcpy.GetParameterAsText(4)		
climateVariableSelection = arcpy.GetParameterAsText(5) #eg: TempMax , PET,  Precip
seasonSelection = arcpy.GetParameterAsText(6)   #ed: Fall , Annual
averageRange = 5
arcpy.env.overwriteOutput = True
def main():
    try:
        if arcpy.CheckExtension("Spatial") == "Available":
            arcpy.CheckOutExtension("Spatial")
        else:
            raise LicenseError
   
        startTimeForECAT = round(time.time())
        
        if ((int(startingYearBaseline)<=endOfHistoricYear) and (endOfHistoricYear<int(endingYearBaseline))):
            computeRasterByYearRange(histRasterList, startingYearBaseline, endOfHistoricYear)
            computeRasterByYearRange(histRasterList, endOfHistoricYear + 1, endingYearBaseline)            
        else:
            computeRasterByYearRange(histRasterList, startingYearBaseline, endingYearBaseline)
        #histAverage = histAverage/(int(endingYearBaseline) + 1 - int(startingYearBaseline))
##################################################################################################
        
        if ((int(startingYearFuture)<=endOfHistoricYear) and (endOfHistoricYear<int(endingYearFuture))):
            computeRasterByYearRange(futureRasterList, startingYearFuture, endOfHistoricYear)
            computeRasterByYearRange(futureRasterList, endOfHistoricYear + 1, endingYearFuture)            
        else:
            computeRasterByYearRange(futureRasterList, startingYearFuture, endingYearFuture)
        #futureAverage = futureAverage/(int(endingYearFuture) + 1 - int(startingYearFuture))
            
        arcpy.AddWarning("histRasterList : ")
        for indexYear in range(0, len(histRasterList), 1):
            arcpy.AddWarning(histRasterList[indexYear] )
        arcpy.AddWarning("futureRasterList : ")
        for indexYear in range(0, len(futureRasterList), 1):
            arcpy.AddWarning(futureRasterList[indexYear] )        
        histAverage = CellStatistics(histRasterList, "SUM", "DATA")
        arcpy.AddWarning("After CellStatistics for hist" )      
        futureAverage = CellStatistics(futureRasterList, "SUM", "DATA")
    
        #outRas = (futureAverage - histAverage) / 100.0
        outRas = ((futureAverage/(int(endingYearFuture) + 1 - int(startingYearFuture))) - (histAverage/(int(endingYearBaseline) + 1 - int(startingYearBaseline)))) / 100.0
        FutureAverageRas = futureAverage/(int(endingYearFuture) + 1 - int(startingYearFuture))
        HistAverageRas = histAverage/(int(endingYearBaseline) + 1 - int(startingYearBaseline))
        ##FutureAverageRas.save(tempFutureAverageRas)
        ##HistAverageRas.save(tempHistAverageRas)
        arcpy.AddWarning("after making subtraction" )
        if outRas is not None:
            arcpy.AddWarning("tempFile will be saved as:" + tempFile)
            
##            outRas_1digit.save(tempFileInt)
            outRas.save(tempFile)
            arcpy.AddWarning("tempFile is already saved")
            arcpy.SetParameterAsText(7, tempFile) 
        else:
            arcpy.AddWarning("Failed to make raster tempFile")
            
        endTimeForECAT = round(time.time())        
        timeSpentForCOG = round((endTimeForECAT - startTimeForECAT)/60, 1)
        arcpy.AddWarning('Time spent for ECAT startingYearBaseline: ' + startingYearBaseline + "; endingYearBaseline:" + endingYearBaseline + "; startingYearFuture: " + startingYearFuture + "; endingYearFuture: " + endingYearFuture + ' is: '+ str(timeSpentForCOG) + ' minutes')
        print('\n' + 'Time spent for ECAT startingYearBaseline: ' + startingYearBaseline + "; endingYearBaseline:" + endingYearBaseline + "; startingYearFuture: " + startingYearFuture + "; endingYearFuture: " + endingYearFuture + ' is: '+ str(timeSpentForCOG) + ' minutes')
    except IOError as e:
        arcpy.AddWarning("IOError, errno: " + e.errno + "IOError, strerror: " +  e.strerror  )        
    except ValueError as e:
        arcpy.AddWarning("ValueError: " + e)
    except:
        arcpy.AddWarning("other error")
        arcpy.AddWarning("Error: {0}".format(sys.exc_info()[0]))
        
    #Perform Zonal Statistics
    outTable = scratchWS +"\\ZonalSta_by5YearAverage"
    out_feature_class = r"D:\Public\Data\projects\EnviroAtlas_Public\Other\HUCQuery\HUC12Raster\HUC12Raster"
                          
    try:
        arcpy.AddWarning("out_feature_class: " + out_feature_class)
        arcpy.AddWarning("tempFile: " + tempFile)
        arcpy.AddWarning("outTable: " + outTable)
        
        outZSaT = ZonalStatisticsAsTable(out_feature_class, "HUC_12", tempFile, outTable, "DATA", "MEAN")
        arcpy.AddWarning("Implemented ZonalStatisticsAsTable ")
    except Exception as e:
        arcpy.AddWarning("error ZonalStatisticsAsTable " + e.message)
    finally:
        arcpy.CheckInExtension("Spatial")
    #csv_fn = scratchWS + "\\HUC12Statistic.csv"
    csv_fn = scratchPath + "\\HUC12Statistic.csv"
    dbf2csv(outTable, csv_fn)
    try:
        arcpy.SetParameter(8, csv_fn)
    except Exception as e:
        arcpy.AddWarning("error set out paramter for csv file:" + e.message)
        
if __name__ == '__main__':
    main()
