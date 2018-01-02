#!/usr/bin/env python
# ConvertEsriCachetoXYZ.python
# Renames tiles in an Esri exploded cache to the Web Tile Layer XYZ structure
# Torrin Hultgren 2017-11
import os, fnmatch, shutil, sys

#get the command line arguments and get some variables set up
inDIR = r'C:\temp\Ag_Erosion' #args.inDIR[0]
copyDIR = r'C:\temp\Ag_Erosion_xyz' #args.outDIR[0]
pattern = "*.png"

#move into the directory you want to copy
os.chdir(inDIR)

# Walk through directory and get the files listed
for path, subFolders, fileList in os.walk("."):
    newpath = os.path.join("..", copyDIR, path)
    for file in fileList:
        newfile = file
        if fnmatch.fnmatch(file, pattern): # Match search string
        # Format is always basepath\Level\Row\Column.png
            basePath = '\\'.join(path.split('\\')[:-2])
            L = path.split('\\')[-2]
            R = path.split('\\')[-1]
            C = file.split('.')[0]
            # Map Esri hex notation to integer notation
            Z = int(L.lstrip('L'))
            Y = int(R.lstrip('R'),16)
            X = int(C.lstrip('C'),16)
            #print(path, file, L, R, C, Z, Y, X, basePath)

            #make the directory structure to put the new tiles into
            newpath = os.path.join("..", copyDIR, basePath, str(Z), str(X))
            newfile = str(Y)+".png"
        if not os.path.exists(newpath):
            os.makedirs(newpath)

        # Copy the file over to the new path
        if not os.path.exists(os.path.join(newpath, newfile)):
            shutil.copyfile((os.path.join(path, file)), os.path.join(newpath, newfile))
