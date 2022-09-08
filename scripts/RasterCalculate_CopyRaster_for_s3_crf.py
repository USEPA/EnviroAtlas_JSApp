import arcpy, os, sys
import arcgisscripting
#from dbfpy import dbf
from arcpy import env
from arcpy import Raster
from arcpy.analysis import *
import arcpy
def chooseDataPath(year):
    if (float(year) <= float(endOfHistoricYear)):
        return os.path.join(climateData, "Hist\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
    else:
        return os.path.join(climateData, futureClimateScenario + "\\" + climateVariableSelection + "\\" + seasonSelection + climateVariableSelection)
gp = arcgisscripting.create(10.2)
#climateData = r"D:\Public\Data\projects\ClimateData_2015"

climateDataSource = r"D:\Public\Data\projects\ClimateData_2015"
#climateDataDestination = "s3://enviroatlas-vdc-stage-s3bucket/ClimateData_2015"
climateDataDestination = r"D:\Public\Data\projects\s3bucket\temp\EnviroAtlas\ClimateData_2015_crf"

#climateAverageData = r"D:\Public\Data\projects\ClimateData_2015\Average_ECAT"
climateAverageDataSource = r"D:\Public\Data\projects\ClimateData_2015\Average_ECAT"
climateAverageDataDestination = r"D:\Public\Data\projects\s3bucket\temp\EnviroAtlas\ClimateData_2015_crf\Average_ECAT"

rasterFormat = "CRF"
rasterExtension = ".crf"

#### folder structure under ClimateData_2015                            Raster name
#### Average_ECAT    
####    Hist                                                            T1955_1959 to T2000_2004
####        PET; Precip; TempMax, Tempmin (climateVariable)
####            AnnualPET; FallPET; SpringPET; SummerPET; WinterPET (seasonVariable)
####    RCP26                                                           T2010_2014 to T2095_2099
####        PET; Precip; TempMax, Tempmin
#### Hist                                                               T1950_SummerPET -- T2005_SummerPET
####    PET; Precip; TempMax, Tempmin
#### RCP26  (futureClimateModel)                                                            T2008_SummerPET;  T2006_PET -- T2099_PET for Annual
####    PET; Precip; TempMax, Tempmin
#### RCP45
####    PET; Precip; TempMax, Tempmin
#### RCP60
####    PET; Precip; TempMax, Tempmin
#### RCP85
####    PET; Precip; TempMax, Tempmin

## histor data D:\Public\Data\projects\ClimateData_2015\Hist\PET\SummerPET.gdb\T1950_SummerPET
## future data: D:\Public\Data\projects\ClimateData_2015\RCP85\PET\SummerPET.gdb\T2008_SummerPET

## Spring; Winter; Fall; Annual
## TempMin; TempMax ; PET,  Precip
## RCP26; RCP45; RCP60 RCP85

## Average: D:\Public\Data\projects\ClimateData_2015\Average_ECAT\Hist\PET\AnnualPET.gdb\T1955_1959  to T2000_2004
## Average RCP26: D:\Public\Data\projects\ClimateData_2015\Average_ECAT\RCP26\PET\FallPET.gdb\T2010_2014 to T2095_2099   we only have RCP26



####arcpy.CopyRaster_management(r"D:\Public\Data\projects\ClimateData_2015\Average_ECAT\RCP26\PET\FallPET.gdb\T2010_2014",r"D:\Public\Data\projects\s3bucket\temp\EnviroAtlas\ClimateData_2015\test4.cog","","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
            
seasonVariable = ["Fall", "Spring", "Summer", "Winter"]
climateVariable = ["PET", "Precip", "TempMax", "Tempmin"]
futureClimateModel = ["RCP26", "RCP45", "RCP60", "RCP85"]
yearFuture = []


#####for x in range(2, 6):
           #### x will be 2,3, 4,5

#### copy for future models:
print("start to copy future data: \n")
for eachFutureClimateModel in futureClimateModel:  # "RCP26"
    print("future data: RCP26, RCP45, RCP60, RCP85; current : " + eachFutureClimateModel + "\n")
    for eachClimateVariable in climateVariable:  # "TempMax"
        for eachYear in range(2006, 2100):
            fromRasterAnnual = os.path.join(climateDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable  + ".gdb" + "\\T"+ str(eachYear) + "_" + eachClimateVariable)
            toRasterAnnual = os.path.join(climateDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable + "\\T"+ str(eachYear) + "_" + eachClimateVariable + rasterExtension)
            ####print("fromRasterAnnual: " + fromRasterAnnual)
            ####print("toRasterAnnual: " + toRasterAnnual)
            arcpy.CopyRaster_management(fromRasterAnnual, toRasterAnnual, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
            for eachSeasonVariable in seasonVariable:  #  "Fall"
                fromRasterSeasonal = os.path.join(climateDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable  + ".gdb" + "\\T"+ str(eachYear) + "_" + eachSeasonVariable + eachClimateVariable)
                toRasterSeasonal = os.path.join(climateDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable + "\\T"+ str(eachYear) + "_" + eachSeasonVariable + eachClimateVariable + rasterExtension)
                arcpy.CopyRaster_management(fromRasterSeasonal, toRasterSeasonal, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")

#### copy for historic data:
print("Future data are finished. Start to copy historic data: \n")
eachFutureClimateModel = "Hist"  ## Replace "Model" with "Hist"
for eachClimateVariable in climateVariable:  # "TempMax"
    for eachYear in range(1950, 2006):
        fromRasterAnnual = os.path.join(climateDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable  + ".gdb" + "\\T"+ str(eachYear) + "_" + eachClimateVariable)
        toRasterAnnual = os.path.join(climateDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable + "\\T"+ str(eachYear) + "_" + eachClimateVariable + rasterExtension)
        arcpy.CopyRaster_management(fromRasterAnnual, toRasterAnnual, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
        for eachSeasonVariable in seasonVariable:  #  "Fall"
            fromRasterSeasonal = os.path.join(climateDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable  + ".gdb" + "\\T"+ str(eachYear) + "_" + eachSeasonVariable + eachClimateVariable)
            toRasterSeasonal = os.path.join(climateDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable + "\\T"+ str(eachYear) + "_" + eachSeasonVariable + eachClimateVariable + rasterExtension)
            arcpy.CopyRaster_management(fromRasterSeasonal, toRasterSeasonal, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
           





#### copy for average future models:
print("Future and historic data are finished. Start to copy average data: \n")
AverageHist = ["T1950_1954", "T1955_1959", "T1960_1964", "T1965_1969", "T1970_1974", "T1975_1979", "T1980_1984", "T1985_1989", "T1990_1994", "T1995_1999", "T2000_2004"]
AverageFuture = ["T2010_2014", "T2015_2019",  "T2020_2024", "T2025_2029", "T2030_2034", "T2035_2039", "T2040_2044", "T2045_2049", "T2050_2054", "T2055_2059", "T2060_2064", "T2065_2069", "T2070_2074", "T2075_2079", "T2080_2084", "T2085_2089", "T2090_2094", "T2095_2099"] 

####eachFutureClimateModel = "RCP26"
for eachFutureClimateModel in futureClimateModel:  # "RCP26"
    for eachClimateVariable in climateVariable:  # "TempMax"
        for eachYearRange in AverageFuture:
            fromRasterAnnual = os.path.join(climateAverageDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable  + ".gdb" + "\\"+ eachYearRange)
            toRasterAnnual = os.path.join(climateAverageDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable + "\\"+ eachYearRange + rasterExtension)
            arcpy.CopyRaster_management(fromRasterAnnual, toRasterAnnual, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
            for eachSeasonVariable in seasonVariable:  #  "Fall"
                fromRasterSeasonal = os.path.join(climateAverageDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable  + ".gdb" + "\\"+ eachYearRange)
                toRasterSeasonal = os.path.join(climateAverageDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable + "\\"+ eachYearRange + rasterExtension)
                arcpy.CopyRaster_management(fromRasterSeasonal, toRasterSeasonal, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")

#### copy for average hist data:
eachFutureClimateModel = "Hist"
for eachClimateVariable in climateVariable:  # "TempMax"
    for eachYearRange in AverageHist:
        fromRasterAnnual = os.path.join(climateAverageDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable  + ".gdb" + "\\"+ eachYearRange)
        toRasterAnnual = os.path.join(climateAverageDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + "Annual" + eachClimateVariable + "\\"+ eachYearRange + rasterExtension)
        arcpy.CopyRaster_management(fromRasterAnnual, toRasterAnnual, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
        for eachSeasonVariable in seasonVariable:  #  "Fall"
            fromRasterSeasonal = os.path.join(climateAverageDataSource, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable  + ".gdb" + "\\"+ eachYearRange)
            toRasterSeasonal = os.path.join(climateAverageDataDestination, eachFutureClimateModel + "\\" + eachClimateVariable + "\\" + eachSeasonVariable + eachClimateVariable + "\\"+ eachYearRange + rasterExtension)
            arcpy.CopyRaster_management(fromRasterSeasonal, toRasterSeasonal, "","","0","NONE","NONE","","NONE","NONE", rasterFormat, "NONE", "", "")
