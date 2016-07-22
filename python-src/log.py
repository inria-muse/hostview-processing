#!/usr/bin/python

"""
    Author: Julio Adriazola
    email: jcadriaz@gmail.com
    Date: 11/01/2016
"""
BLACK="\033[1;30m"
RED="\033[0;31m"
GREEN="\033[0;32m"
BROWN="\033[1;33m"
BLUE='\033[1;34m'	
MAGENTA="\033[1;35m"
CYAN="\033[1;36m"		
WHITE="\033[1;37m"
NULL="\033[0m"
DEFAULT = NULL


# Function for logging. Can execute:
# log
# log.debug //Same as log
# log.error
# log.info
# log.warn

class log:
	def __init__(self,s):
		log.debug(s)

	@staticmethod
	def debug(s):
		log.__print(BLUE + "debug: ", s)

	@staticmethod
	def error(s):
		log.__print(RED + "error: ", s)

	@staticmethod
	def info(s):
		log.__print(GREEN + "info: ", s)

	@staticmethod
	def warn(s):
		log.__print(BROWN + "warn: ", s)

	@staticmethod
	def __print(begin,s):
		if(isinstance(s,list)):
			print begin + NULL + ''.join(s) + NULL
		else:
			print begin + NULL + str(s) + NULL

		# Write that to a file with timestamp