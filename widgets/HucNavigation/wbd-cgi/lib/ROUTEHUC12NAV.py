"""

	HUC12 Navigator class for use with Route table.
	
	this uses pure python (no numpy) and navigates using python dictionaries.

"""

import os
import sys
import logging
import csv
from collections import defaultdict,OrderedDict
from datetime import datetime as dt
import tzlocal
# from xmljson import BadgerFish
# import xml.etree.ElementTree
from json import dumps
try:
	import cPickle as pickle
except:
	import pickle
	
log = logging.getLogger(__name__)

class RouteHUC12Navigator(object):

	def __init__(self):
		'''
		Constructor
		'''
		self.args = None
		
		self.config = None

		self.overall_log_file = logging.DEBUG
		
		self.file_log_level = None

		self.console_log_level = logging.WARNING

		self.navigation_file = None

		self.navigation_file_key = 'huc12'
		
		self.navigation_attribute_list = [ 'name', 'area_sq_km', 'water_area_sq_km' ]
		
		self.navigation_attributes = defaultdict( dict )

		self.navigation_file_keys = {
				'upstream':   {'from': 'huc12',    'to': 'huc12_us'},
				'downstream': {'from': 'huc12_us', 'to': 'huc12'}
		}

		self.us_huc_route = defaultdict( dict )
		
		self.ds_huc_route = defaultdict( dict )
		
		self.attribute_file = None
		
		self.attribute_file_key = 'HUC_12'
		
		self.attribute_data = defaultdict( dict )
		
		self.attribute_data_keys = []
		
		self.metadata_file = None
		
		self.metadata = None
		
		self.metadata_list_file = None
		
		self.metadata_list = defaultdict( dict )
		
		self.direction = 'Upstream'
		
		self.navigation_results = None
		
		self.results_length = 0
		
		self.upstream_result_length = 0
		
	@property
	def config(self):
		return self.__config
	
	@config.setter
	def config(self, config):
		if not config == None:
			self.__config = config
			if config.has_option('PATHS', 'log_file'):
				self.overall_log_file = config.get('PATHS', 'log_file')
			if config.has_option('DEFAULTS', 'file_log_level'):
				self.file_log_level = self.config.get('DEFAULTS', 'file_log_level')

	@property
	def args(self):
		return self.__args
	
	@args.setter
	def args(self, args):
		if not args == None:
			self.__args = args
			if self.__args:
				if hasattr(self.__args, 'logger'):
					numeric_level = getattr(logging, self.__args.logger.upper(), None)
					if not isinstance(numeric_level, int):
						raise ValueError('Invalid log level: %s' % self.__args.logger)
					else:
						self.console_log_level = self.__args.logger.upper()

	@property
	def navigation_file(self):
		return self.__navigation_file

	@navigation_file.setter
	def navigation_file(self, navigation_file):
		
		"""
			read the route file into two arrays - one for upstream navigation, one for downstream
			we are navigating the actual HUC12 strings rather than a numerical representation of those strings.
		"""
		def read_pickle():
			
			if not len(self.navigation_file):
				raise ValueError('navigation_file must be set before calling this function')
			if not os.path.exists(self.navigation_file):
				raise IOError("Unable to find navigation file\n\t%s" % (self.navigation_file))
			
			log.debug('Reading navigation route pickle file:\n\t%s' % (self.navigation_file))
			
			startTime = dt.now()
			pkl_file = open(self.navigation_file, 'rb')

			[self.navigation_attributes, self.us_huc_route, self.ds_huc_route] = pickle.load(pkl_file)

			pkl_file.close()
			
			log.debug(" Read in %s seconds" % ((dt.now() - startTime).total_seconds()))
			
			return
		
		def read():
	
			if not len(self.navigation_file):
				raise ValueError('navigation_file must be set before calling this function')
			if not os.path.exists(self.navigation_file):
				raise IOError("Unable to find navigation file\n\t%s" % (self.navigation_file))
			
			startTime = dt.now()
			
			required_fields = []
			
			navigation_file_keys = self.navigation_file_keys
			
			for direction in navigation_file_keys.keys():
				for node in navigation_file_keys[direction]:
					if not navigation_file_keys[direction][node] in required_fields:
						required_fields.append(navigation_file_keys[direction][node])
						
			try:
				infile = open(self.navigation_file, 'r')
				reader = csv.DictReader(infile)
				source_columns = reader.fieldnames
				
				'''
					check the all required fields are found in CSV file fieldnames
				'''
				matching = [s for s in source_columns if any(xs in s for xs in required_fields)]
				required_set = set(required_fields)
				source_set = set(source_columns)
				unmatched = required_set.difference(source_set)
				if len(unmatched) > 0:
					raise KeyError("required column(s) '%s' not found in CSV file\n\t%s" % 
								(unmatched, self.navigation_file))

			except KeyError as err:
				raise
			except:
				ex = sys.exc_info()
				log.error('Exception 641: %s: %s' % (ex[0], ex[1]))

			row_count = 0
			
			log.debug('Reading navigation route file:\n\t%s' % (self.navigation_file))
			
			try:
				for row in reader:
					row_count += 1
	
					if not row[self.navigation_file_key] in self.navigation_attributes:
						self.navigation_attributes[row[self.navigation_file_key]] = defaultdict( dict )
						for attribute in self.navigation_attribute_list:
							self.navigation_attributes[row[self.navigation_file_key]][attribute] = row[attribute]
					'''
						build upstream navigator 
					'''
					self.us_huc_route[row[navigation_file_keys['upstream']['from']]][row[navigation_file_keys['upstream']['to']]] = row
					'''
						build downstream navigator 
					'''
					self.ds_huc_route[row[navigation_file_keys['downstream']['from']]][row[navigation_file_keys['downstream']['to']]] = row

			except KeyError as err:
				raise KeyError("required column '%s' not found in CSV file\n\t%s" % (err.message, self.navigation_file))
			except:
				raise ValueError("Unexpected error: %s", sys.exc_info())
	
			if not row_count > 0:
				raise ValueError("problem reading route file - no rows read using file\n\t%s" % (self.navigation_file))
			
			log.debug(" Read %s rows in %s seconds" % (row_count, (dt.now() - startTime).total_seconds()))
			
			return
		
		if navigation_file == None:
			pass
		else:
			if os.path.exists(str(navigation_file)):

				self.__navigation_file = str(navigation_file)
				if '.p' in navigation_file:
					read_pickle()
				else:
					read()
			else:
				raise IOError("Unable to find navigation file\n\t%s" % (navigation_file))
			

	@property
	def attribute_file(self):
		return self.__attribute_file

	@attribute_file.setter
	def attribute_file(self, attribute_file):
		
		"""
		
			read the attribute file into an array with 1 entry for each HUC12

		"""
		def read():

			if not len(self.attribute_file):
				log.warn('you must set the attribute_file (attribute file) before calling this function')
				exit()
			if not len(self.attribute_file_key):
				log.warn('you must set the attribute_key_field (the column to use to create the attribute table) before calling this function')
				exit()
			
			self.attribute_data = defaultdict( dict )
			
			startTime = dt.now()
			
			try:
				infile = open(self.attribute_file, 'r')  # CSV file
				reader = csv.DictReader(infile)

				'''
					check that the required field is found in CSV file fieldnames
				'''
				if not self.attribute_file_key in reader.fieldnames:
					raise KeyError("required column '%s' not found in CSV file\n\t%s" % 
								(self.attribute_file_key, self.attribute_file))
					
				self.attribute_keys = reader.fieldnames
			except KeyError as err:
				raise
			except:
				ex = sys.exc_info()
				log.error('Exception 641: %s: %s' % (ex[0], ex[1]))
				exit()
	
			row_count = 0
			
			log.debug('Reading attribute file:\n\t%s' % (self.attribute_file))
			
			try:
				for row in reader:
					row_count += 1

					'''
						build the attribute data
					'''
					"""
						JAB NOTE: HUC12s suck when your using CSV files and excel
						the leading zero gets cut off.  Because of that, I have to test
						here and make sure that the leading zero gets added back on
					"""
					if (self.attribute_file_key == 'HUC_12' or self.attribute_file_key == 'HUC12') \
						and len(row[self.attribute_file_key]) == 11:
						
						row[self.attribute_file_key] = '0' + row[self.attribute_file_key]
					"""
						JAB end of HUC12 fix
					"""
					self.attribute_data[row[self.attribute_file_key]] = row
			except:
				print ("Unexpected error:", sys.exc_info()[0])
				raise
			
			log.debug(" Read %s rows in %s seconds" % (row_count, (dt.now() - startTime).total_seconds()))
			
			return
		
		if attribute_file == None:
			pass
		else:
			if os.path.exists(str(attribute_file)):
				self.__attribute_file = str(attribute_file)
				read()
			else:
				raise IOError("Unable to find attribute file\n\t%s" % (attribute_file))


	def attribute_file_get_columns(self, attribute_file):
		
		"""
		
			open the attribute file and return the column names

		"""
		def read():

			fieldnames = []
			try:
				infile = open(attribute_file, 'r')
				reader = csv.DictReader(infile)
				fieldnames = reader.fieldnames
				infile.close()

			except KeyError as err:
				raise
			except IOError as err:
				raise
			except:
				ex = sys.exc_info()
				log.error('Exception 641: %s: %s' % (ex[0], ex[1]))
				exit()
			
			return fieldnames
		
		if attribute_file == None:
			pass
		else:
			if os.path.exists(str(attribute_file)):
				return read()
			else:
				raise IOError("Unable to find attribute file to get columns\n\t%s" % (attribute_file))
			

	@property
	def metadata_list_file(self):
		return self.__metadata_list_file

	@metadata_list_file.setter
	def metadata_list_file(self, metadata_list_file):
		
		"""
		
			read the metadata_list_file into an array with 1 entry for each HUC12

		"""
		def read():

			if not len(self.metadata_list_file):
				log.warn('you must set the metadata_list_file (metadata_list_file) before calling this function')
				exit()
			startTime = dt.now()
			log.debug('Reading metadata_list_file file:\n\t%s' % (self.metadata_list_file))
			try:
				infile = open(self.metadata_list_file, 'r')  # CSV file
				reader = csv.DictReader(infile)
			except:
				ex = sys.exc_info()
				self.logger.error('Exception 641: %s: %s' % (ex[0], ex[1]))
				exit()
	
			row_count = 0
			try:
				for row in reader:
					row_count += 1
					self.metadata_list[row['file_name']][row['label']] = row
	
			except:
				print ("Unexpected error:", sys.exc_info()[0])
				raise

			log.debug(" Read %s rows in %s seconds" % (row_count, (dt.now() - startTime).total_seconds()))
			
			return
		
		if metadata_list_file == None:
			pass
		else:
			if os.path.exists(str(metadata_list_file)):
				self.__metadata_list_file = str(metadata_list_file)
				read()
			else:
				raise IOError("Unable to find metadata_list_file file\n\t%s" % (metadata_list_file))


	"""
		perform the navigation.  'comid' is used instead of 'huc12' because we might want to change and use
		the internal ID for hucs used in NHD and there it is 'comid_to' and 'comid_from' or some variation
	"""
	def huc12_navigate(self, comid):
		
		if self.direction.upper() == 'Upstream'.upper():
			data_ref = self.us_huc_route
		else:
			data_ref = self.ds_huc_route
			
		nav_comids = defaultdict( dict )
		
		mycomids = { comid: 1}
		try:
			while 1 == 1:
				for tocomid in list(mycomids): # .keys():
					if data_ref[tocomid] != None:
						for fromcomid in data_ref[tocomid].keys():
							if fromcomid != 0:
								mycomids[fromcomid] = 1
								nav_comids[tocomid][fromcomid] = data_ref[tocomid][fromcomid]
								#log.debug("[tocomid][fromcomid]==[%s][%s]" % (str(tocomid),str(fromcomid)))
							else:
								mycomids[fromcomid] = 1
								nav_comids[tocomid][fromcomid] = data_ref[tocomid][fromcomid]
								#log.debug("[tocomid][fromcomid]==[" + str(tocomid) + "][" + "%09d" % fromcomid + "] fromcomid==0")
					del mycomids[tocomid]
	
				if len(mycomids) == 0:
					break

			self.results_length = len(nav_comids)
			
			self.upstream_result_length = self.results_length - 1
			
			self.navigation_results = nav_comids
			# log.debug(nav_comids)
			return nav_comids
		except:
			print ("Unexpected error:", sys.exc_info()[0])
			raise

	def huc12_upstream_area(self, comid):

		output_dict = OrderedDict()
		
		output_dict = {
				'huc12': { 'name': 'HUC12', 'value': comid },
				'huc12_name': { 'name': 'HUC12 Name', 'value': '--na--' },
				'area_sq_km': { 'name': 'HUC12 Area', 'format': '.2f', 'units': 'km2' } ,
				'water_area_sq_km': { 'name': 'HUC12 Water area', 'format': '.2f', 'units': 'km2' } ,
				'us_huc12_ids': {'name': 'List of upstream HUC12s', 'value': [] },
				'upstream_count_nu': { 'name': 'Upstream HUC12 Count', 'value': 0 } ,
				'us_area_sq_km': { 'name': 'Upstream HUC12 area', 'format': '.2f', 'units': 'km2', 'value': 0 } ,
				'us_water_area_sq_km': { 'name': 'Upstream HUC12 water area', 'format': '.2f', 'units': 'km2', 'value': 0 } ,
				'huc8': { 'name': 'HUC8', 'value': comid[:8] } ,
				'upstream_huc8_count_nu': { 'name': 'Upstream HUC8 Count', 'value': 0 } ,
			};
			
		'''
			this is where the navigation occurs
		'''
		self.huc12_navigate(comid)

		# compute the drainage area metrics from the attributes data
		area_sq_km = 0
		water_area_sq_km = 0
		us_area_sq_km = 0
		us_water_area_sq_km = 0
		name = ''
		
		output_dict['us_huc12_ids']['value'] = list(self.navigation_results) # .keys()
		output_dict['upstream_count_nu']['value'] = "{:,}".format(len(self.navigation_results) - 1)
		
		for us_huc_id in self.navigation_results.keys():
			if us_huc_id == comid:
				if len(self.navigation_attributes[comid]['name']):
					output_dict['huc12_name']['value'] = self.navigation_attributes[comid]['name']
				output_dict['area_sq_km']['value'] = "{0:,.2f}".format(float(self.navigation_attributes[comid]['area_sq_km']))
				output_dict['water_area_sq_km']['value'] = "{0:,.2f}".format(float(self.navigation_attributes[comid]['water_area_sq_km']))
			else:
				if not self.navigation_attributes[us_huc_id]['area_sq_km'] == '':
					us_area_sq_km += float(self.navigation_attributes[us_huc_id]['area_sq_km'])
				us_water_area_sq_km += float(self.navigation_attributes[us_huc_id]['water_area_sq_km'])
		
		if us_area_sq_km > 0:
			format_pattern = "{0:,.2f}"
			if us_area_sq_km > 1000:
				format_pattern = "{0:,.0f}"
			output_dict['us_area_sq_km']['value'] = format_pattern.format(float(us_area_sq_km))

		if us_water_area_sq_km > 0:
			format_pattern = "{0:,.2f}"
			if us_water_area_sq_km > 1000:
				format_pattern = "{0:,.0f}"
			output_dict['us_water_area_sq_km']['value'] = format_pattern.format(float(us_water_area_sq_km))
			
		return output_dict

	def huc12_downstream_area(self, comid):

		output_dict = OrderedDict()
		
		output_dict = {
				'huc12': { 'name': 'HUC12', 'value': comid },
				'huc12_name': { 'name': 'HUC12 Name', 'value': '--na--' },
				'area_sq_km': { 'name': 'HUC12 Area', 'format': '.2f', 'units': 'km2' } ,
				'water_area_sq_km': { 'name': 'HUC12 Water area', 'format': '.2f', 'units': 'km2' } ,
				'ds_huc12_ids': {'name': 'List of downstream HUC12s', 'value': [] },
				'downstream_count_nu': { 'name': 'Downstream HUC12 Count', 'value': 0 } ,
				'ds_area_sq_km': { 'name': 'Downstream HUC12 area', 'format': '.2f', 'units': 'km2', 'value': 0 } ,
				'ds_water_area_sq_km': { 'name': 'Downstream HUC12 water area', 'format': '.2f', 'units': 'km2', 'value': 0 } ,
				'huc8': { 'name': 'HUC8', 'value': comid[:8] } ,
				'downstream_huc8_count_nu': { 'name': 'Downstream HUC8 Count', 'value': 0 } ,
			};
			
		'''
			this is where the navigation occurs
		'''
		self.huc12_navigate(comid)

		# compute the drainage area metrics from the attributes data
		area_sq_km = 0
		water_area_sq_km = 0
		ds_area_sq_km = 0
		ds_water_area_sq_km = 0
		name = ''
		
		output_dict['ds_huc12_ids']['value'] = self.navigation_results.keys()
		output_dict['downstream_count_nu']['value'] = "{:,}".format(len(self.navigation_results) - 1)
		
		for us_huc_id in self.navigation_results.keys():
			if us_huc_id == comid:
				if len(self.navigation_attributes[comid]['name']):
					output_dict['huc12_name']['value'] = self.navigation_attributes[comid]['name']
				output_dict['area_sq_km']['value'] = "{0:,.2f}".format(float(self.navigation_attributes[comid]['area_sq_km']))
				output_dict['water_area_sq_km']['value'] = "{0:,.2f}".format(float(self.navigation_attributes[comid]['water_area_sq_km']))
			else:
				if not self.navigation_attributes[us_huc_id]['area_sq_km'] == '':
					ds_area_sq_km += float(self.navigation_attributes[us_huc_id]['area_sq_km'])
				ds_water_area_sq_km += float(self.navigation_attributes[us_huc_id]['water_area_sq_km'])
		
		if ds_area_sq_km > 0:
			format_pattern = "{0:,.2f}"
			if ds_area_sq_km > 1000:
				format_pattern = "{0:,.0f}"
			output_dict['ds_area_sq_km']['value'] = format_pattern.format(float(ds_area_sq_km))

		if ds_water_area_sq_km > 0:
			format_pattern = "{0:,.2f}"
			if ds_water_area_sq_km > 1000:
				format_pattern = "{0:,.0f}"
			output_dict['ds_water_area_sq_km']['value'] = format_pattern.format(float(ds_water_area_sq_km))
			
		return output_dict



	"""
		make logger.  this makes 2 different loggers - 
			one is in a log file, and 
			the other is what is displayed to the user in the console
	"""
	def create_logger(self):

		def posix2local(timestamp, tz=tzlocal.get_localzone()):
			"""Seconds since the epoch -> local time as an aware datetime object."""
			return dt.fromtimestamp(timestamp, tz)

		# these are used to tweak the format of the logs. they allow multi-line log messages that display well
		class MultiLineFormatter(logging.Formatter):
			
			def converter(self, timestamp):
				return posix2local(timestamp)
			def formatTime(self, record, datefmt=None):
				default_time_format = "%Y-%m-%d %H:%M:%S"
				default_msec_format = "%s.%3d"
				dt = self.converter(record.created)
				if datefmt:
					s = dt.strftime(datefmt)
				else:
					t = dt.strftime(default_time_format)
					s = default_msec_format % (t, record.msecs)
				return s
			def format(self, record):
				str = logging.Formatter.format(self, record)
				header, footer = str.split(record.message)
				str = str.replace('\n', '\n' + header)
				return str

		class MultiLineFormatter2(logging.Formatter):
			def format(self, record):
				str = logging.Formatter.format(self, record)
				header, footer = str.split(record.message)
				str = str.replace('\n', '\n' + ' '*len(header))
				return str

		
		# turn off this package's INFO and DEBUG logging
		logging.getLogger("requests").setLevel(logging.WARNING)

		logging.basicConfig(level=logging.DEBUG, filename=os.devnull, format='%(levelname)s: %(message)s')
		
		'''
			set up the logger for the package
		'''
		self.logger = logging.getLogger(__name__)
		
		# create a file handler for STDOUT
		stdout_handler = logging.StreamHandler(stream=sys.stdout)
		stdout_handler.setLevel(self.console_log_level)
		# create a logging format using a custom formatter
		stdout_formatter = MultiLineFormatter2('%(levelname)-5s: %(message)s')
		stdout_handler.setFormatter(stdout_formatter)
		# add the handlers to the logger
		self.logger.addHandler(stdout_handler)
		
		# create a file handler for the log file
		if not self.overall_log_file == None:
			log_file_handler = logging.FileHandler(self.overall_log_file)
			log_file_handler.setLevel(self.file_log_level or logging.DEBUG)
			log_file_formatter = MultiLineFormatter('%(asctime)s - %(levelname)-5s - %(message)s')
			log_file_handler.setFormatter(log_file_formatter)
			self.logger.addHandler(log_file_handler)
		
		return self.logger

	def bannerize(self, string_tx, width=80):
		str_len = int((width - len(string_tx))/2)
		return_string = '%s %s %s' % ('#' * str_len, string_tx, '#' * str_len)
		return_string = return_string + ('#' * (80 - len(return_string)))
		return return_string
	"""
		return a 'human readable' version of the size of a file system object
	"""
	def sizeof_fmt(self, num, suffix='B'):
		for unit in ['','K','M','G','Ti','Pi','Ei','Zi']:
			if abs(num) < 1024.0:
				return "%.f %s%s" % (num, unit, suffix)
			num /= 1024.0
		return "%.1f %s%s" % (num, 'Yi', suffix)

if __name__ == '__main__':
	print ("this is a library")
	exit()



