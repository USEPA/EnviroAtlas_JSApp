# -*- coding: utf-8 -*-
"""
Created on Mon Jan 22 08:18:02 2018

@author: JBaynes
"""

import os
import requests
import pandas
import numpy
import json
import locale
import shutil
import math

def read_REST_service_as_DF():
    #  We'll change this later to LEB dev server
    url = ('https://enviroatlas.epa.gov/arcgis/rest/services/Communities/'
           'Community_BGmetrics/MapServer/2/query')
    
    ## empty list to hold data from REST service
    rows = []
    
    # get objectid for all block groups
    params = {'where': "1=1",
              'returnIdsOnly': 'true',
              'f': 'pjson'}

    ids = requests.post(url, params)
    bg_ids = ids.json()['objectIds']
   
    # chunksize for reading features from REST Service
    chunksize = 1000
    
    # divide objectids into chunks (i.e., list of lists)
    # add/remove the list limit at the end added to speed up testing
    bg_ids = [bg_ids[i:i+chunksize] for i in range(0, len(bg_ids), chunksize)]
    
    # query server for each chunk and append to list (rows)
    for i, bgs in enumerate(bg_ids):
        params = {"where": ' OR '.join(["OBJECTID={0}".format(oid) for oid in bgs]),
                  "returnGeometry": "false",
                  "f": "pjson",
                  "outFields": "*"
          }
        
        features = requests.post(url, params)
        bgJSON = features.json()
    
        for j, feature in enumerate(bgJSON['features']):
            attributes = feature['attributes']
            rows.append(attributes)
    
    # convert to pandas DF
    bgDF=pandas.DataFrame.from_dict(rows)
    return bgDF


#bgDF = read_REST_service_as_DF()


# add comunity ID to list if you want to skip creating for any community
#########
#Change this to Use communites instead of omit
#########
omit_comm = ['ATX']
## always omit Woodbine
#
#
## add metrics to be skipped to list
omit_fields = ['Shape_Length_1', 'Shape_Area_1', 'Shape', 'STATEFP10',
                'COUNTYFP10', 'TRACTCE10', 'GEOID10', 'Community',
                'CommST', 'OBJECTID', 'bgrp', 'bgrp_12_13']
#

#
#
## get list of communites
communities = [c for c in bgDF.CommST.unique() if c not in omit_comm]
communities = [u'CombComm'] + communities

#

## read csv file with field attributes
filedir = os.path.dirname(os.path.realpath(__file__))
filepath = os.path.join(filedir, 'community_fields.txt')
metric_lines = [line.rstrip('\n').split(',') for line in open(filepath)]



lyrsW8s = []
## get list of metrics
metrics = [m for m in bgDF.columns.values if m not in omit_fields]
#
## some logic like this.  might make sense to iterate metrics then communities?
communities = ['PAZ']
for community in communities:
    if community == 'CombComm':
        commDF = bgDF
    else:
        commDF = bgDF.loc[bgDF.CommST == community]


    
    
    #    roundErrors = []
    #
    #    """ Loop through the fields """
    for metric_line in metric_lines[94:95]:
        metric, breakNumber, noDatametric, decmax, nulllabel  = metric_line
        breakNumber = int(breakNumber)
        noDatametric = int(noDatametric)
        decmax = int(decmax)
    
        
        nullTypes = []
        valueList = numpy.array(commDF[metric])
    
    
        # handle null values
        for nullValue in [-888888, -99999, -99998, -99997]:
            if nullValue in valueList:
                nullTypes.append(nullValue)
                # remove null values from array
                valueList = valueList[valueList != nullValue] 
                if nullValue == -888888:
                    lyrsW8s = lyrsW8s + [[community, metric]]
                
    
    
        """ If there is no data for the field, skip processing """
        if -888888 in nullTypes and community != 'CombComm':
    
            """ Copy the JSON for the Combined Community for that field """
    ##                ccName = str(jsonFld) + '/CombComm/CombComm_' + str(metric) + '.json'
    ##                singleName = str(jsonDir) + '/' + str(city) + '_' + str(metric) + '.json'
    ##                shutil.copyfile(ccName, singleName)
    ##
            """ Add the City + Field to a replication list """
    ##                replicateList = open(natFld + '/JSON_Replication.txt', 'a')
    ##                replicateList.write(str(city) + '--' + str(metric) + '--' + time.strftime('%Y%m%d_%H-%M') + '\n')
    ##                replicateList.close()
    
        elif len(valueList) == 0 and nullTypes: ##If the whole community has data calculated but it is all null (e.g. Floodplains in BTX)
    
            """ Copy the JSON for the Combined Community for that field """
    ##                ccName = str(jsonFld) + '/CombComm/CombComm_' + str(metric) + '.json'
    ##                singleName = str(jsonDir) + '/' + str(city) + '_' + str(metric) + '.json'
    ##                shutil.copyfile(ccName, singleName)
    
            """ Add the City + Field to a replication list """
    ##                replicateList = open(natFld + '/JSON_Replication.txt', 'a')
    ##                replicateList.write(str(city) + '--' + str(metric) + '--' + time.strftime('%Y%m%d_%H-%M') + '\n')
    ##                replicateList.close()
    
    
    
    
        else:
            labels = []
            breaks = []
            metric_min = numpy.min(valueList)
            metric_min = numpy.round(metric_min, decmax)
        
        
            break_min = metric_min
            break_max = metric_min
            breaks = []
            for bn in range(breakNumber):
                if len(valueList):
                    # last iteration round up the max
                    if bn == len(range(breakNumber))-1:
                        # round up maximum metric value
                        percentile = numpy.max(valueList)
                        percentile = (math.ceil(percentile * 10**decmax) / 
                                      (1.0 * 10**decmax))
    #                    p_high += (1.0 / 10**decmax)
                        
                        
                    else:
                        # else round down (this takes care of the first value)
                        percentile = numpy.percentile(valueList, (100 / breakNumber) * (bn + 1))
                        percentile = math.floor(percentile * 10**decmax) / (1.0 * 10**decmax)
                    
                    break_max = percentile
                    # check for heavily left-skewed data
                    if percentile == break_min:
                        if decmax == 0:
                            labels.append('{0:,}'.format(int(break_min)))
                        else:
                            labels.append('{0:,}'.format(break_min))               
    
                        valueList = valueList[valueList > break_min]
    
                    else:
                     
                        if decmax == 0:
                            labels.append('{0:,} - {1:,}'.format(int(break_min), int(break_max)))
                        else:
                            labels.append('{0:,} - {1:,}'.format(break_min, break_max))       
                
                    # add 1 at last decimal place for new minimum on next break
                    break_min = break_max + (1.0 / 10**decmax)
                        
                    breaks.append(percentile)
                
    
            colors = []
            actualBreaks = len(breaks)
    #
            """ Format Labes for -99997 """
            if -99997 in nullTypes:
                labels = ['No FEMA Coverage'] + labels
                breaks = [-99997] + breaks
                colors = [[156, 156, 156, 255]] + colors
    
            """ Format Labes for -99998 """
            if -99998 in nullTypes:
                labels = ['Block Group Beyond Analysis Extent'] + labels
                breaks = [-99998] + breaks
                colors = [[156, 156, 156, 255]] + colors
    
            """ Format Labes for -99999 """
            if -99999 in nullTypes:
                labels = [nulllabel] + labels
                breaks = [-99999] + breaks
                colors = [[204, 204, 204, 255]]  + colors
    
            """ Format Labels for -888888 """
            if noDatametric:
                labels = ['No Data for Community'] + labels
                breaks = [-888888] + breaks
                colors = [[255, 255, 255, 255]]  + colors
    
    
            """-------- Create a Dictionary to dump to a JSON file ----------"""
            """ Create the dicitonary for demographic layers """
            if metric in demofields:
                backgroundFillSymbol = {"color": [0,0,0,0], "style": "esriSFSSolid", "type": "esriSFS", "outline": {"color": [0,0,0,0], "width": 0.4, "style": "esriSLSSolid", "type": "esriSLS"}}
    #            if noDatametric:
                size = [4, 4, 7, 10, 13]
    #            else:
    #                size = [4, 7, 10, 13]
                minBreak = math.floor(breaks[0])
                data = {"backgroundFillSymbol": backgroundFillSymbol, "classificationMethod": "esriClassifyQuantile", "minValue": float(metric_min), "field": metric, "type": "classBreaks"}
                classBreakInfos = []
                for i in range(0, len(labels)):
                    if i == 0 and metric in noDatametrics:
                        symbol = {"style": "esriSMSCircle", "angle": 0, "outline": {"color": [0, 0, 0, 255], "width": 1}, "color": [225, 225, 225, 255], "yoffset": 0, "type":"esriSMS", "xoffset": 0}
                    else:
                        symbol = {"style": "esriSMSCircle", "angle": 0, "outline": {"color": [0, 0, 0, 255], "width": 1}, "color": [230, 152, 0, 255], "yoffset": 0, "type":"esriSMS", "xoffset": 0}
                    symbol["size"] = size[i]
                    if i < len(labels) - 1:
                        classBreak = {"classMaxValue": breaks[i], "symbol": symbol, "desciption": "", "label": labels[i]}
                        classBreakInfos.append(classBreak)
                    else:
                        maxBreak = breaks[i]
                        classBreak = {"classMaxValue": breaks[i], "symbol": symbol, "description": "", "label": labels[i]}
                        classBreakInfos.append(classBreak)
                data["classBreakInfos"] = classBreakInfos
    #
            else:
                """ Create the dicitonary for non-demographic layers """
                """ Establish the color scheme """
                colors_5 = [[255, 255, 128, 255], [113, 235, 47, 255], [61, 184, 104, 255], [33, 110, 158, 255], [12, 16, 120, 255]]
                colors_4 = [[255, 255, 128, 255], [56, 224, 9, 255], [26, 147, 171, 255], [12, 16, 120, 255]]
                colors_3 = [[255, 255, 128, 255], [61, 154, 104, 255], [12, 16, 120, 255]]
                colors_2 = [[255, 255, 128, 255], [12, 16, 120, 255]]
    
                colorBase = {'5': colors_5, '4': colors_4, '3': colors_3, '2': colors_2}
    
                colors = colors + colorBase[str(actualBreaks)]
    
                """ Write the dicitonary"""
                minBreak = math.floor(breaks[0])
                data = {"field": metric, "minValue": minBreak, "type": "classBreaks"}
                outline = {"color": [110, 110, 110, 255], "width": 1, "style": "esriSLSSolid", "type":"esriSLS"}
                classBreakInfos = []
                for i in range(0, len(labels)):
                    if i < len(labels) - 1:
                        symbol = {"color": colors[i], "style": "esriSFSSolid", "type": "esriSFS", "outline": outline}
                        classBreak = {"classMaxValue": breaks[i], "symbol": symbol, "description": "", "label": labels[i]}
                        classBreakInfos.append(classBreak)
                    else:
                        maxBreak = breaks[i]
                        symbol = {"color": colors[i], "style": "esriSFSSolid", "type": "esriSFS", "outline": outline}
                        classBreak = {"classMaxValue": maxBreak, "symbol": symbol, "description": "", "label": labels[i]}
                        classBreakInfos.append(classBreak)
                data["classBreakInfos"] = classBreakInfos
                data["classificationMethod"] = "esriClassifyQuantile"
    #
            print metric, labels
    #    print json.dumps(data)
    #    print '\n'
    #        """-------- Write the JSON file -----------------------------"""
    #     Need to update the output location and how to write out JSON
    #    jsonDir = r'C:\Users\jbaynes\Desktop\json'
    #    city = 'CombComm'
    #    finalName = str(jsonDir) + '/' + str(city) + '_' + str(metric) + '.json'
    #    with open(finalName, 'w') as singleJSON:
    #        json.dump(data, singleJSON)
    #    singleJSON.close()
    ##
    #        """ Does the JSON need to be edited for python rounding issues """
    #        numbs = []
    #        testLabels = []
    #        for label in labels:
    #            if '-' in label:
    #                testLabels.append(label)
    #        vals = []
    #        for label in testLabels:
    #            pieces = label.split(' - ')
    #            for piece in pieces:
    #                vals.append(piece)
    #        error = False
    #        for i in range(0, len(numbs)-1):
    #            if numbs[i] == numbs[i+1]:
    #                error = True
    #
    #        if error == True:
    #            roundErrors.append([city, metric])
    #
    #""" List the metrics with rounding errors """
    #print 'metrics with rounding errors: ' + str(roundErrors)
    
    """ For CombComm, copy JSON to cities missing certain metrics """
    # need to fix this as well
    #    if city == 'CombComm':
    #        replicateList = open(natFld + '/JSON_Replication.txt', 'r')
    #        os.makedirs(str(jsonFld) + '/CC_Replication')
    #        replicateFolder = str(jsonFld) + '/CC_Replication'
    #        rlLines = replicateList.readlines()
    #        for line in rlLines:
    #            pieces = line.split('--')
    #            ccJSON = str(jsonDir) + '/' + str(city) + '_' + str(pieces[1]) + '.json'
    #            copyJSON = str(jsonFld) + '/CC_Replication/' + str(pieces[0]) + '_' + str(pieces[1]) + '.json'
    #            shutil.copyfile(ccJSON, copyJSON)
    #
    #        replicateList.close()
    #
    #        """ Also replicate all of CombComm for Woodbine """
    #        os.makedirs(str(jsonFld) + '/WIA')
    #        wiaDir = str(jsonFld) + '/WIA'
    #        ccList = [f for f in os.listdir(jsonDir)]
    #        for file in ccList:
    #            wiaFile = file.replace('CombComm', 'WIA')
    #            shutil.copyfile(jsonDir + '/' + file, wiaDir + '/' + wiaFile)
    
    #            except:
    #                    print 'Something went wrong with ' + str(metric)


 
    
    
    
    
    
    
    
    
    
    
    
#    min_is_a_class = 0
#    
#    # Get first quantile
#    p = numpy.percentile(valueList, 100 / breakNumber)
#    if p == metric_min:
#        min_is_a_class = 1
#        ## create a min class
#        
##        # reduce number of bins by 1
##        breakNumber -= 1
##        valueList = valueList[valueList > metric_min]
#    
#    if min_is_a_class:
#        percentiles[0] = numpy.min(valueList)
#        valueList = valueList[valueList > metric_min]
#        breakNumber -= 1
#        for bn in range(breakNumber):
#            p_low = numpy.percentile(valueList, 100 / breakNumber * bn)
#            p_high = numpy.percentile(valueList, 100 / breakNumber * (bn+1))
#            percentiles[bn+1] = (p_low, p_high)
#            
##            p = numpy.percentile(valueList, 100 / breakNumber * bn)
##            percentiles[bn+1] = p
##        percentiles[breakNumber] = numpy.max(valueList)
#        
#    else:
#        for bn in range(breakNumber):
#            p_low = numpy.percentile(valueList, 100 / breakNumber * bn)
#            p_high = numpy.percentile(valueList, 100 / breakNumber * (bn + 1))
#            percentiles[bn] = (p_low, p_high)
#        
#        







