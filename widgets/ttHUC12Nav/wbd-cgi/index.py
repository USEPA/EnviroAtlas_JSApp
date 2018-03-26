#!C:/software/Bitnami/djangostack-1.11.1-1/python/python.exe

"""

	return json data for the navigation 
	
	Note: allowing the python interpreter for the folder needs to be set in httpd.conf.  For example:
	
WSGIPythonHome "C:/software/Bitnami/djangostack-1.11.1-1/python"

<Directory C:/software/Bitnami/djangostack-1.11.1-1/apache2/htdocs/wbd-cgi>
	Options +ExecCGI
	AddHandler cgi-script .py
	DirectoryIndex index.py
</Directory>

Testing on the command line
bash> curl localhost:81/wbd-cgi/index.py -d 'code=11030003' -d 'direction=upstream'

"""
import os.path
import sys
import json
from collections import OrderedDict
import cgi
import cgitb
cgitb.enable()

root_path = os.path.split(os.path.abspath(__file__))[0]

lib_path = os.path.join(root_path, 'lib')

sys.path.append(lib_path)

from HUCTree import HUCTree

gateway = HUCTree()

def main():
	
	gateway.data_path = os.path.join(root_path, 'data')
	
	gateway.huc_file = os.path.join(gateway.data_path, 'huc_hydrologic_unit_codes.csv')
	
	gateway.navigation_file = os.path.join(gateway.data_path, 'navigator_huc12.p')

	arguments = cgi.FieldStorage()
	
	# this is used for testing on the command line
	if not 'GATEWAY_INTERFACE' in os.environ:
		for name, value in {
			"attribute" : "ELEVMEAN",
			"navigation_direction": "downstream",
			"code" : "130100020705",
			}.items():
			arguments.list.append(cgi.MiniFieldStorage(name, value))
	
	
	
	data = OrderedDict()
	
	if 'code' in arguments:
		'''
			'code' can be anything from a Region (2-digits) to a Subwatershed (12-digit)
			If it is lower than a subwatershed it returns data for the next level.  
			If it is a subwatershed, it returns summary data for upstream (default) or downstream navigation
			The terms are defined in https://nhd.usgs.gov/wbd_facts.html
			
			Watershed Definitions
			Name			Level	Digit	Number of HUCs
			Region			1		2		21
			Subregion		2		4		222
			Basin			3		6		352
			Subbasin		4		8		2,149
			Watershed		5		10		22,000
			Subwatershed	6		12		160,000
	
			
		'''
		huc_code = arguments.getvalue('code')
		
		if len(huc_code) == 2:
			data = gateway.subregion(huc_code)
		elif len(huc_code) == 4:
			data = gateway.basin(huc_code)
		elif len(huc_code) == 6:
			data = gateway.subbasin(huc_code)
		elif len(huc_code) == 8:
			data = gateway.subwatershed(huc_code)
		elif len(huc_code) == 12:

			# attributes are not calculated for 'downstream' navigation
			if 'navigation_direction' in arguments and arguments.getvalue('navigation_direction').upper() == 'Downstream'.upper():
				data = gateway.navigate(huc_code, 'downstream')
			elif 'attribute' in arguments:
				attribute = arguments.getvalue('attribute')
				data = gateway.navigate(huc_code, 'upstream')
				if attribute != 'NONE':
					data['attribute_results'] = gateway.get_attribute_value(attribute, data['huc12']['value'], data['us_huc12_ids']['value'])
			else:
				data = gateway.navigate(huc_code, 'upstream')
		else:
			data = {'not': 'yet done'}
	
	# elif arguments.has_key('upstream'):
	# 	huc_code = arguments.getvalue('upstream')
	# 	data = gateway.navigate(huc_code, 'upstream')
	else:
		data = gateway.region()
	
	print('Content-Type: application/json')
	print('')
	print (json.dumps(data, default=lambda x: None))



if __name__ == '__main__':
	
	main()