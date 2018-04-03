"""

	Watershed Boundary Dataset (WBD) rest service
	

"""

import os
import sys
import re
import csv
import logging
from collections import defaultdict,OrderedDict
from datetime import datetime as dt
import cgi
import cgitb

try:
	import cPickle as pickle
except:
	import pickle
	
from ROUTEHUC12NAV import RouteHUC12Navigator

class HUCTree(object):

	def __init__(self):
		'''
		Constructor
		'''
		self.args = None
		
		self.data_path = None
		
		self.huc_file = None

		self.huc_file_pickle = None

		self.navigation_file = None
		
		self.attribute_file = None

		self.huc_data = defaultdict( dict )

		self.huc12_data = defaultdict( dict )

	@property
	def huc_file(self):
		return self.__huc_file

	@huc_file.setter
	def huc_file(self, huc_file):
		
		"""
			read the route file into two arrays - one for upstream navigation, one for downstream
			we are navigating the actual HUC12 strings rather than a numerical representation of those strings.
		"""
		def read_pickle():
			
			if not len(huc_file_pickle):
				raise ValueError('huc_file_pickle must be set before calling this function')
			if not os.path.exists(huc_file_pickle):
				raise IOError("Unable to find huc_file_pickle\n\t%s" % (huc_file_pickle))
			
			# log.debug('Reading huc pickle file:\n\t%s' % (self.huc_file))
			
			startTime = dt.now()
			pkl_file = open(huc_file_pickle, 'rb')

			[self.huc_data] = pickle.load(pkl_file)

			pkl_file.close()
			
			# log.debug(" Read in %s seconds" % ((dt.now() - startTime).total_seconds()))
			
			return
		
		def read():
	
			if not len(self.huc_file):
				raise ValueError('huc_file must be set before calling this function')
			if not os.path.exists(self.huc_file):
				raise IOError("Unable to find HUC file\n\t%s" % (self.huc_file))
			
			startTime = dt.now()

			try:
				infile = open(self.huc_file, 'r')
				reader = csv.DictReader(infile)
			except:
				cgitb.handler()
				sys.exit()
	
			row_count = 0
			try:
				for row in reader:
					row_count += 1
					code = row['Code']
					code_string = str(code)
					
					# zero-pad the HUC codes
					if len(code_string) % 2 != 0:
						code_string = '0' + code_string
					
					# remove the states off the names - except for cataloging units
					if len(code_string) < 8:
						name = row['Name']
						a = re.match('(^.+)\s\(', row['Name'])
						if a and a.group(1):
							row['Name'] = a.group(1)
							
					self.huc_data[row['Category']][code_string] = row

				'''
					create the pickle file for next time a user requests the file
				'''
				pickle_huc_file = self.huc_file.replace('.csv', '.p')
				try:
					pickle.dump([self.huc_data], open(pickle_huc_file, 'wb'), pickle.HIGHEST_PROTOCOL)
				finally:
					pass
	
			except:
				cgitb.handler()
				sys.exit()
		
			return row_count
		
		if huc_file == None:
			pass
		else:
			huc_file_pickle = huc_file.replace('.csv', '.p')
			if os.path.exists(str(huc_file_pickle)):
				read_pickle()
			elif os.path.exists(str(huc_file)):
				self.__huc_file = str(huc_file)
				read()
			else:
				raise IOError("Unable to find HUC file\n\t%s" % (huc_file))
			
	def navigate(self, code, direction="Upstream"):
		
		navigator = RouteHUC12Navigator()
		
		navigator.overall_log_file = None
		
		log = navigator.create_logger()
		
		navigator.navigation_file = self.navigation_file

		navigator.direction = direction
		
		# zero-pad the HUC codes
		if len(code) % 2 != 0:
			code = '0' + code
			
		huc_id = code
		
		if navigator.direction.upper() == 'Upstream'.upper():
 			data = navigator.huc12_upstream_area(huc_id)
		else:
			data = navigator.huc12_downstream_area(huc_id)
			
		data['huc12_ids'] = list(navigator.navigation_results) # .keys()
		data['results_length'] = navigator.results_length

		return data

	def region(self):
		return self.hucbrowser('Region', None)

	def subregion(self,code):
		return self.hucbrowser('Subregion', code)

	def basin(self,code):
		return self.hucbrowser('Basin', code)

	def subbasin(self,code):
		return self.hucbrowser('Subbasin', code)

	'''
		this is used for Region, Subregion, Basin, and Subbasin
		this just pulls the data from a datafile, no navigation
	'''
	def hucbrowser(self, depth, value):
		data = OrderedDict()
		data['children'] = []
		substring_length = 2
		if depth == 'Region':
			substring_length = 2
			data['name'] = 'United States'
		elif depth == 'Subregion':
			substring_length = 2
		elif depth == 'Basin':
			substring_length = 4
		elif depth == 'Subbasin':
			substring_length = 6
			
		for code in sorted(self.huc_data[depth]):
			if depth == 'Region' or code[:substring_length] == value:
				child_data = {
								'name': '%s %s' % (code, self.huc_data[depth][code]['Name']),
								'code': code, 
							}
				data['children'].append(child_data)
		return data

	'''
		this is used in the d3 navigator
	'''
	def subwatershed(self,value):
		navigator = RouteHUC12Navigator()

		navigator.overall_log_file = 'log/nav.log'
		log = navigator.create_logger()
		
		navigator.navigation_file = self.navigation_file
				
		data = OrderedDict()
		data['children'] = []

		for code in sorted(navigator.navigation_attributes.keys()):
			if code[:8] == value:
				child_data = {'name': '%s %s' % (code, navigator.navigation_attributes[code]['name']),
							  'code': code,
							  'hucdepth': 'maximum',
							  'area': navigator.navigation_attributes[code]['area_sq_km'],
							  'upstream_area': navigator.navigation_attributes[code]['us_area_sq_km'],
							  'debug': navigator.navigation_attributes[code],
							  }
				data['children'].append(child_data)
		return data
	
	def get_attribute_value(self, attribute, huc_id, us_huc12_ids):
		
		custom_atribute_list = [ attribute, ]
		
		output_dict = OrderedDict([('huc12', huc_id), ('area_sq_km',  0), 
						('upstream_count_nu', 0), ('us_area_sq_km', 0) ])
		for att in custom_atribute_list:
			output_dict[att] = 0
			output_dict[att + '_upstream_count_nu'] = 0
			output_dict[att + '_us'] = 0
			output_dict[att + '_us_area_sq_km'] = 0
		
		
		navigator = RouteHUC12Navigator()
		navigator.navigation_file = self.navigation_file
		"""
			this is where the navigation happens
		"""
		navigator.huc12_navigate(huc_id)
		
		navigator.overall_log_file = 'log/nav.log'
		log = navigator.create_logger()
		

		attribute_data = OrderedDict([
			('name', attribute),
			('units', 'ft. above mean sea level'),
			('format', '.2f'),
			('root_value', ''),
			('us_value', ''),
			('us_count_nu', 0),
			('us_area_sq_km', ''),
		])
		attribute_data_file_basename = None
		if attribute == 'SLOPEMEAN' or attribute == 'ELEVMEAN':
			attribute_data['units'] = 'ft. per mile'
			attribute_data_file_basename = 'elev_slope.csv'
		elif attribute == 'STREAMDENSITY':
			attribute_data_file_basename = 'impaired_waters.csv'
			attribute_data['units'] = 'km./area km. sq'
		elif attribute == 'PAGT' or attribute == 'N_INDEX' or attribute == 'PFOR':
			attribute_data_file_basename = 'land_cover.csv'
			attribute_data['units'] = 'percent'
		elif attribute == 'dwd_gal_per_day':
			attribute_data_file_basename = 'domestic_water_demand.csv'
			attribute_data['units'] = 'gal/day'
		
		
		'''
			check to make sure the attribute_data_file got set
		'''
		if attribute_data_file_basename == None:
			attribute_data['error'] = "unable to use attribute %s to find attribute file" % (attribute)
			log.warn(attribute_data['error'])
			return attribute_data
		
		attribute_data_file = os.path.join(self.data_path, attribute_data_file_basename)
		'''
			check that the file actually exists
		'''
		if not os.path.exists(attribute_data_file):
			attribute_data['error'] = "unable to find attribute file %s" % (attribute_data_file)
			log.warn(attribute_data['error'])
			return attribute_data
		
		'''
			check to make sure the attribute is actually in the data file
			(there is a mismatch between the metadata and the actual data files for a handful of variables)
		'''
		if not attribute in navigator.attribute_file_get_columns(attribute_data_file):
			attribute_data['error'] = "unable to find %s in attribute file %s" % (attribute, attribute_data_file)
			log.warn(attribute_data['error'])
			return attribute_data
		
		'''
			this sets the value and causes it to read the file too
		'''
		navigator.attribute_file = attribute_data_file
		
		area_sq_km = 0
		us_area_sq_km = 0
		
		attribute_area_sq_km = 0
		us_area_sq_km = 0
		
		for us_huc_id in us_huc12_ids:
			if us_huc_id == huc_id:
				area_sq_km = navigator.navigation_attributes[huc_id]['area_sq_km']
			else:
				attribute_data['us_count_nu'] += 1
				if not navigator.navigation_attributes[us_huc_id]['area_sq_km'] == '':
					us_area_sq_km += float(navigator.navigation_attributes[us_huc_id]['area_sq_km'])
				
				for att in custom_atribute_list:
					if not navigator.attribute_data.has_key(us_huc_id):
						pass
						# log.warn("no huc %s in attribute data for %s" % (us_huc_id, att))
					else:
						output_dict[att + '_upstream_count_nu'] += 1
						
						'''
							jab - this is the area weighted 'value'
						'''
						output_dict[att + '_us_area_sq_km'] += (float(navigator.navigation_attributes[us_huc_id]['area_sq_km']) * float(navigator.attribute_data[us_huc_id][att]))
						'''
							this is just a total - without regard to area
						'''
						output_dict[att + '_us'] += (float(navigator.attribute_data[us_huc_id][att]))
						
		if area_sq_km == '':
			output_dict['area_sq_km'] = -9898
			if not huc_id in no_attributes:
				no_attributes.append(huc_id)
		elif area_sq_km > 0:
			output_dict['area_sq_km'] = "{0:.5f}".format(float(area_sq_km))
			for att in custom_atribute_list:
				if att == 'dwd_gal_per_day':
					attribute_data['root_value'] = "{:d}".format(int(navigator.attribute_data[huc_id][att]))
				else:
					attribute_data['root_value'] = "{0:.2f}".format(float(navigator.attribute_data[huc_id][att]))
			
		if us_area_sq_km > 0:
			attribute_data['us_area_sq_km'] = "{0:.5f}".format(float(us_area_sq_km))
			for att in custom_atribute_list:
				if att == 'dwd_gal_per_day':
					attribute_data['us_value'] = "{:d}".format(int(output_dict[att + '_us']))
				else:
					attribute_data['us_value'] = "{0:.2f}".format((output_dict[att + '_us_area_sq_km'] / us_area_sq_km ))
				attribute_data['us_area_sq_km'] = "{0:.5f}".format(float(output_dict[att + '_us_area_sq_km']) / float(attribute_data['us_value']))
	
	
		return attribute_data
	
if __name__ == '__main__':
	print ("this is a library")
	exit()



