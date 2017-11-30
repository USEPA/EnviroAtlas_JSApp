#!/usr/bin/env python
# ConvertEsriCachetoXYZ.python
# Renames tiles in an Esri exploded cache to the Web Tile Layer XYZ structure
# Torrin Hultgren 2017-11
import os, fnmatch, shutil, sys, argparse

#get the command line arguments and get some variables set up
##parser = argparse.ArgumentParser(description='Convert a Esri Exploded cache directory structure to a XYZ structure')
##parser.add_argument('inDIR', type=str, nargs=1, help='The directory containing the Esri Cache files')
##parser.add_argument('outDIR', type=str, nargs=1, help='The output directory for the XYZ files')
##args = parser.parse_args()
inDIR = r'C:\temp\Ag_Erosion' #args.inDIR[0]
copyDIR = r'C:\temp\Ag_Erosion_xyz' #args.outDIR[0]
pattern = '*png' #only looking for png images and will skip the rest later on
fileList = []

#check to see if output directory exists, die if it does
if os.path.exists(copyDIR):
    sys.exit("ERROR: The output directory already exists!") #exit the script if the output already exists

#move into the directory you want to copy
os.chdir(inDIR)

# Walk through directory and get the files listed
for path, subFolders, fileList in os.walk("."):
    for file in fileList:
        basePath = '\\'.join(path.split('\\')[:-2])
        L = path.split('\\')[-2]
        R = path.split('\\')[-1]
        C = file.split('.')[0]
        #r_off, c_off = [int(x, 16) for x in root.lstrip('R').split('C')]
    #z = int(os.path.split(os.path.dirname(path))[1].lstrip('L'))
        Z = L.lstrip('L')
        Y = int(R.lstrip('R'),16)
        X = int(C.lstrip('C'),16)
        print(path, file, L, R, C, Z, Y, X, basePath)

    #make the directory structure to put the new tiles into
        newpath = os.path.join("..", copyDIR, basePath, str(Z), str(X))
        if not os.path.exists(newpath):
            os.makedirs(newpath)
##
##    for fileName in fList: #loop through all the files
##        if fnmatch.fnmatch(fileName, pattern): # Match search string
##            if rVal.find("/") > -1:
##                 zxParts = rVal.split("/")
##            else:
##                 zxParts = rVal.split("\\")
##            yParts = fileName.split(".")
##            newY = str(2**int(zxParts[1])-int(yParts[0])-1) + ".png"
##            shutil.copyfile((os.path.join(rVal, fileName)), (os.path.join(newpath, newY)))
##        else:
##            print "skipping file:" + fileName