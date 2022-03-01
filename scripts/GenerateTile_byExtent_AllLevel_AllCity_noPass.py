
#returns ssl value and user token
def getToken(adminUser, pw):
        #'expiration': 21600 is the maximum value (21600 min =  15days)
        data = {'username': adminUser,
            'password': pw,
            'expiration': 21500,
            'referer' : 'https://www.arcgis.com',
            'f': 'json'}
        url  = 'https://www.arcgis.com/sharing/rest/generateToken'
        jres = requests.post(url, data=data, verify=False).json()
        #print (jres)
        return jres['token'],jres['ssl']


def GenerateTileForExtent(userName, token, tileURL, extent):
    #updateUrl = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/admin/services/ESTIMATED_WALKING_DISTANCE_TO_A_PARK_ENTRANCE__Mar_18/MapServer/updateTiles'
    updateUrl = tileURL.replace("rest/services", "rest/admin/services") + '/updateTiles'
    data = {"f":'pjson',
            "token":token,
            "extent":extent,
	    "levels":'4-16'
            }
    
    #submit requst
    #print(json.dumps(data))
    response = requests.post(updateUrl, data=data, verify=False).json()
    print(response)

    return response

def checkJobStatus(userName, token, tileURL, jobId):

    jobUrl = tileURL.replace("rest/services", "rest/admin/services") + '/jobs/'+ jobId + '?token=' + token    
    #print("jobUrl: " + jobUrl)
    response = requests.get(jobUrl) 
    return response

import requests, json, time

#Enter Username / Password / TargetItemID / SourceItemID / SourceServiceName
#user= 'ji.baohong_EPA' #raw_input('What is the ArcGIS Online Username?')
#pw = 'JIBaQXT(*5155'#raw_input('What is the ArcGIS Online Password?')

user= '' #raw_input('What is the ArcGIS Online Username?')
pw = ''#raw_input('What is the ArcGIS Online Password?')
extentFile = "commName_extent_2021.json"
logFile = "log.txt"

sleepTime = 30#inseconds;  240 sometimes lose JobID
#tileURL = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ESTIMATED_WALKING_DISTANCE_TO_A_PARK_ENTRANCE__Mar25/MapServer' # this is the first generated tile layer
tileURL = 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/ESTIMATED_PERCENT_OF_TREE_COVER_WITHIN_26M_OF_A_ROAD_EDGE/MapServer'

finished_City_list = ['BTX', 'TFL', 'ATX', 'BirAL', 'PAZ', 'LACA', 'MTN', 'DNC', 'FCA', 'VBWVA', 'SonCA', 'SLMO', 'WDC;BMD', 'PhiPA', 'PitPA', 'SLCUT', 'PNJ;NYNY', 'NHCT', 'DMIA', 'WIA']


#get account information
token= getToken(user, pw)
print ('token:' + token[0])
with open(logFile, "a") as log_file:
    log_file.write('\n' + 'token:' + token[0] + '\n')


with open(extentFile, "r") as read_file:
    print ('\n tileURL:' + tileURL)
    startTimeForTotal = round(time.time())
    with open(logFile, "a") as log_file:
        log_file.write('\n' + 'tileURL:' + tileURL + '\n')        
    with open(logFile, "a") as log_file:
        log_file.write('\n____________________________________________________________\n')     
    data = json.load(read_file)
    numCityPublished = 0
    for feature in data['features']: 
        #print(feature)
        xmin = 100000000
        xmax = -100000000
        ymin = 100000000
        ymax = -100000000
        coordinates = feature["geometry"]["coordinates"][0]
        for vertex in coordinates:
            if xmin > vertex[0]:
                xmin = vertex[0]
            if xmax < vertex[0]:
                xmax = vertex[0]                
            if ymin > vertex[1]:
                ymin = vertex[1]
            if ymax < vertex[1]:
                ymax = vertex[1]
                
##        centerX = (xmin+xmax)/2
##        centerY = (ymin+ymax)/2
##        diameter = (xmax-xmin)/360#divided by 20 is too large; by 240 should be good
##        xmin = centerX - diameter
##        xmax = centerX + diameter
##        ymin = centerY - diameter
##        ymax = centerY + diameter
        

        extent = '{"xmin":' + str(xmin) + ',"ymin":' + str(ymin) + ',"xmax":' + str(xmax) + ',"ymax":' + str(ymax) + ',"spatialReference":{"wkid":102100}}'
        #print (extent)
        
        if (feature["properties"]["Community"] not in finished_City_list):
            startTimeCurrentExtent = round(time.time())
            
            update = GenerateTileForExtent(user,token[0],tileURL, extent)

            print ("jobId:" + update["jobId"] + "  for area:" + feature["properties"]["Community"])
            with open(logFile, "a") as log_file:
                log_file.write('\n' + "jobId:" + update["jobId"] + "  for area:" + feature["properties"]["Community"] + '\n')
            
            bCompleteJob = False                        
            while (bCompleteJob == False):
                time.sleep(sleepTime)
                status = checkJobStatus(user,token[0],tileURL, update["jobId"])
                bCompleteJob = False
                for line in status.iter_lines():
                    statusResult = str(line).find('Job Status:')
                    if (statusResult!= -1):
                        if (str(line).find('DONE') != -1):
                                bCompleteJob = True
                if (bCompleteJob == True):
                        break

            if update['message']=='success':
                numCityPublished = numCityPublished + 1
                finished_City_list.append(feature["properties"]["Community"])
                print('The tiles have been successfully generated for area:' + feature["properties"]["Community"])
                with open(logFile, "a") as log_file:
                    log_file.write('\n' + 'The tiles have been successfully generated for area:' + feature["properties"]["Community"] + '\n')
                    log_file.write('\n' + 'total finished areas:' + str(finished_City_list) + '\n')

            else:
                print('The tiles failed to be generated for area:' + feature["properties"]["Community"])
                with open(logFile, "a") as log_file:
                    log_file.write('\n' + 'The tiles failed to be generated for area:' + feature["properties"]["Community"] + '\n')    
            endTimeCurrentExtent = round(time.time())
            timeSpentCurrentExtent = round((endTimeCurrentExtent - startTimeCurrentExtent)/60, 1)

            print('Time spent for city: '+ feature["properties"]["Community"] + " is: " + str(timeSpentCurrentExtent) + " minutes")
            with open(logFile, "a") as log_file:
                log_file.write('\n' + 'Time spent for city: '+ feature["properties"]["Community"] + " is: " + str(timeSpentCurrentExtent) + " minutes")  
            print('____________________________________________________________')
            with open(logFile, "a") as log_file:
                log_file.write('\n____________________________________________________________\n')               

    endTimeForTotal = round(time.time())
    timeSpentForTotal = round((endTimeForTotal - startTimeForTotal)/60, 1)
    print('\n' + 'Time spent for whole layer is: '+ str(timeSpentForTotal) + ' minutes')
    with open(logFile, "a") as log_file:
        log_file.write('\n' + 'Time spent for whole layer is: '+ str(timeSpentForTotal) + ' minutes')
        
    if (len(finished_City_list) == len(data['features'])):
        print('All cities have be finished')
        with open(logFile, "a") as log_file:
            log_file.write('\n' + 'All cities have be finished \n************************************************************')        

    else:
        print('Please check back with some cities!')
        with open(logFile, "a") as log_file:
            log_file.write('\n' + 'Please check back with some cities! \n*************************************************************')           


