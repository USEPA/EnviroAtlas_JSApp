#!/usr/bin/python
from BaseHTTPServer import BaseHTTPRequestHandler,HTTPServer
from socket import *
from pprint import pprint
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
import smtplib
import json
import cgi

print('Content-Type: text/html\n\n\n')
failedEaIDArray = []
AllFailedOutsideURLArray = []
AllFailedEaIDArray = []
htmlForEmail = ""
#get input parameter from HTTPS request
fs = cgi.FieldStorage()
for key in fs.keys():
    if key == "failedEALayers":
        print("paramfailedEaIDArray:" + fs[key].value + "\n")
        failedEaIDArray = fs[key].value.split(',')
    if key == "failedOutsideLayers":
        AllFailedOutsideURLArray = fs[key].value.split(",,,")
print("failedEaIDArray:" + str(len(failedEaIDArray))+ "\n")
if (len(failedEaIDArray)>0):
    AllFailedEaIDArray = [int(i) for i in failedEaIDArray]    
    htmlForEmail = "This is the list of failed layers in EnviroAtlas: <br />"
else:
    htmlForEmail = ""
print("AllFailedEaIDArray:" + str(len(AllFailedEaIDArray))+ "\n")
DataInLocalLayerWidget = r"D:\Public\Data\EnviroAtlas_Public\WebProduction\interactivemap\widgets\LocalLayer\config.json"
DataInBoundaryWidget = r"D:\Public\Data\EnviroAtlas_Public\WebProduction\interactivemap\widgets\BoundaryLayer\config.json"
DataInPBSWidget = r"D:\Public\Data\EnviroAtlas_Public\WebProduction\interactivemap\widgets\PeopleAndBuildSpaces\config.json"
EmailAddress = "Rosenbaum.Barbara@epa.gov"
EmailAddress = "Ji.Baohong@epa.gov"

def writeURLintoHTML(failedEaIDArray, InputData, html):
    data = json.load(open(InputData))
    #pprint(data["layers"]["layer"][0])
    for eachLayer in data["layers"]["layer"]:
        if (eachLayer["eaID"] in failedEaIDArray):
            if (eachLayer["type"] == "DYNAMIC"):
                html = html+ eachLayer["url"] + " <br />"
            else:
                html = html+ eachLayer["url"] + "/" + str(eachLayer["eaLyrNum"]) + " <br />"
    return html

def writeOutsideURLintoHTML(failedOutsideURLArray, html):
    for eachOutsideURL in failedOutsideURLArray:
        html = html+ eachOutsideURL + " <br />" 
    return html

htmlForEmail = writeURLintoHTML(AllFailedEaIDArray, DataInLocalLayerWidget, htmlForEmail)
htmlForEmail = writeURLintoHTML(AllFailedEaIDArray, DataInBoundaryWidget, htmlForEmail)
htmlForEmail = writeURLintoHTML(AllFailedEaIDArray, DataInPBSWidget, htmlForEmail)
if len(AllFailedOutsideURLArray):
    htmlForEmail = " <br />" + htmlForEmail + " <br />" + "This is the list of failed layers outside EnviroAtlas: <br />"
    htmlForEmail = writeOutsideURLintoHTML(AllFailedOutsideURLArray, htmlForEmail)

msg = MIMEMultipart('alternative')

msg['From'] = formataddr((str(Header('EnviroAtlas', 'utf-8')), EmailAddress))
msg['To'] = EmailAddress              


# Record the MIME types of text/html.
msg.attach(MIMEText(htmlForEmail, 'html'))

# Send the message via local SMTP server.
s = smtplib.SMTP('smtp.rtpnc.epa.gov')

# sendmail function takes 3 arguments: sender's address, recipient's address
# and message to send - here it is sent as one string.
s.sendmail(EmailAddress, EmailAddress, msg.as_string())
s.quit()
                


