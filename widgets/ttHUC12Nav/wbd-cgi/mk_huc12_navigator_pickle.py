# -*- coding: utf-8 -*-
"""

	Created on 2017-05-10
	
	@author: Jimmy Bisese

	Dumps the content of 3 data structures into a 'pickle' file (*.p') that can 
	be used by other python scripts to speed up initiation
	
	1. navigator.navigation_attributes
	2. navigator.us_huc_route
	3. navigator.ds_huc_route
	
	Console output example:
INFO : Start Time 2017-09-19 08:39:29.614
DEBUG: Reading navigation route file:
       	C:\Data_and_Tools\enviroatlas\working\data\conus_huc12_route.csv
DEBUG:  Read 122974 rows in 2.403 seconds
INFO : Creating new Pickled route file
       	C:\Data_and_Tools\enviroatlas\working\data\navigator_us_huc_route.p
DEBUG: Total Run Time: 0:00:05.401

"""
import os
import sys
from datetime import datetime as dt
# import ConfigParser
import configparser
import argparse
import csv
try:
	import cPickle as pickle
except:
	import pickle

lib_path = os.path.abspath(os.path.join('lib'))
config_file = os.path.join(lib_path, 'enviroatlas.config')

if not os.path.exists(lib_path):
	raise IOError('Unable to find library folder. %s' % (lib_path))

sys.path.append(lib_path)

from ROUTEHUC12NAV import RouteHUC12Navigator

if not os.path.exists(config_file):
	raise IOError('Unable to find configuration file.\n\t%s' % (config_file))

try:
	config = configparser.SafeConfigParser()
	with open(config_file) as f:
		config.readfp(f)
except:
	ex = sys.exc_info()
	raise IOError('Unable to read configuration file.\n\t%s' % (ex[1]))

'''
	this is the file created.  It is python pickle format, which is (optionally) packed binary
'''
output_path = os.path.join(config.get('PATHS', 'huc12_navigator_pickle_path'))

if not os.path.exists(os.path.dirname(output_path)):
	os.makedirs(os.path.dirname(output_path))


overwrite_warning_tx = ''
if os.path.exists(output_path):
	overwrite_warning_tx = "\n########## WARNING: this file already exists and will be overwritten ##########\n"

"""
 process all command line arguments
"""
parser = argparse.ArgumentParser(prog='PROG', formatter_class=argparse.RawTextHelpFormatter, description="""

This python script uses the routing file and writes the navigator.navigation_attributes, navigator.us_huc_route
dictionaries into a file.  this file can then be loaded quickly

Output pickle file is
\t%s%s
""" % (output_path, overwrite_warning_tx))
parser.add_argument("-l", "--logger", nargs='?', choices=config.get('DEFAULTS', 'log_level_choices').split(','), \
						default=config.get('DEFAULTS', 'console_log_level'), \
						help='set the debugging message level. default is ' + config.get('DEFAULTS', 'console_log_level'))

def main():

	startTime = dt.now()
	
	"""
		create the Navigator
	"""
	navigator = RouteHUC12Navigator()

	navigator.config = config

	navigator.args = parser.parse_args()
	
	log = navigator.create_logger()
	
	log.info("Start Time %s" % (str(startTime)[:-3]))
	
	'''
		this is like magic - set and read the routing file 
			(huc12,comid,comid_us,huc12_us,huc12_ds,distance_km,traveltime_hrs),
		and create the navigation dictionaries 
			navigator.us_huc_route and navigator.ds_huc_route
	'''
	navigator.navigation_attributes_path = config.get('PATHS', 'huc12_attribute_path')
	
# 	for key in navigator.navigation_attributes.keys():
# 		log.debug(navigator.navigation_attributes[key]['terminal_outlet_type_code'])
# 		break
	
	navigator.navigation_file = os.path.join(config.get('PATHS', 'huc12_route_path'))

# 	for key in sorted(navigator.us_huc_route.keys()):
# 		log.debug(key)
# 		for result_key in navigator.us_huc_route[key]:
# 			log.debug("%s ==> %s" % (result_key, navigator.us_huc_route[key][result_key]))

# 	for key in sorted(navigator.ds_huc_route.keys()):
# 		log.debug(key)
# 		for result_key in sorted(navigator.ds_huc_route[key]):
# 			log.debug("%s ==> %s" % (result_key, navigator.ds_huc_route[key][result_key]))
# 		break
	
	log.info("Creating new Pickled route file\n\t%s" % (output_path))
	try:
		pickle.dump([navigator.navigation_attributes, navigator.us_huc_route, navigator.ds_huc_route], open(output_path, 'wb'), pickle.HIGHEST_PROTOCOL)
	finally:
		pass

	log.debug("Total Run Time: %s" % (str(dt.now()- startTime)[:-3]))


if __name__ == '__main__':

	main()