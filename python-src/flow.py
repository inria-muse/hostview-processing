#!/usr/bin/python

"""
    Author: 		Diego da Hora
    email: 			diego.da-hora@lip6.fr
    Date: 			23/06/2013

    Updated by: 	Julio Adriazola
    email: 			jcadriaz@uc.cl
    Date: 			15/02/2016
"""

import sqlalchemy, re, datetime, time
from sqlalchemy import Column, Integer, String, Float, BigInteger, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import INET

from DAO import DAO
from log import *


''' EXAMPLE FLOW OUTPUT

TCP connection 6211:
	host ris:      69.17.253.32:52223
	host rit:      0.0.0.0:9547
	complete conn: yes
	first packet:  1292023717.880717
	last packet:  1292024495.641582
	elapsed time:  777.760864
	total packets: 9342
	filename:      separate/35204ECB_7387-4F8B-B259-4EC1975723AC___Fri_Dec_10_20:40:13_2010aa
'''

CSV_ARRAY = ['pcap_id', 'flow_code', 'source_ip', 'source_port', 'destination_ip', 'destination_port', 'protocol', 'first_packet', 'last_packet', 'status', 'total_time', 'total_packets', 'idle_time_ab', 'idle_time_ba', 'bytes_ab', 'bytes_ba']
TABLE = 'pcap_flow'


class Flow(DAO.Base):
	__tablename__ 	= TABLE
	flowid			= Column('id',Integer, primary_key=True)
	pcap_id					= Column(Integer, nullable=False)
	flow_code				= Column(String, nullable=False)
	source_ip				= Column(INET, nullable=False)
	source_port				= Column(Integer, nullable=False)
	destination_ip			= Column(INET, nullable=False)
	destination_port		= Column(Integer, nullable=False)
	protocol				= Column(String(1), nullable=False)
	first_packet 			= Column(TIMESTAMP)
	last_packet 			= Column(TIMESTAMP)
	status					= Column(String)
	total_time				= Column(Float)
	total_packets			= Column(Integer)
	idle_time_ab			= Column(Float)
	idle_time_ba			= Column(Float)
	bytes_ab				= Column(BigInteger)
	bytes_ba				= Column(BigInteger)

	# NOT NEEDED ANYMORE
	# gt_application_name		= Column(String) 				#GT?????
	# ia_application_name 	= Column(String)					#IA?????
	# dns_destionation_name	= Column(String)
	# #appid					= Column(Integer)
	# #ianaappid				= Column(Integer)
	# behavior				= Column(String)
	# base_latency			= Column(Float)
	# sub_domain				= Column(String)
	# domain					= Column(String)
	# suffix					= Column(String)
	# c_type					= Column(ARRAY(String)) 		#C?????

	def __init__(self, pcap_id, flow_code=None, source_ip=None, source_port=None, destination_ip=None, destination_port=None, protocol='T'):
		self.pcap_id					= pcap_id
		self.flow_code					= flow_code
		self.source_ip					= source_ip
		self.source_port				= source_port
		self.destination_ip				= destination_ip
		self.destination_port			= destination_port
		self.protocol					= protocol
		self.first_packet 				= None
		self.last_packet 				= None
		self.status						= None
		self.total_time					= None
		self.total_packets				= None
		self.idle_time_ab				= None
		self.idle_time_ba				= None
		self.bytes_ab					= None
		self.bytes_ba					= None

		
	def __repr__(self):
		return "Flow('%s','%s','%s'.\t%s:%s -> %s:%s - %s\tfrom '%s' to '%s')" % (self.flowid, self.pcap_id, self.flow_code, self.source_ip, self.source_port, self.destination_ip, self.destination_port, self.protocol, self.first_packet, self.last_packet)

	def save(self):
		DAO().create(self)
	
	def getFlowHash(self, reverse=False):
		if reverse: return (str(self.destination_port), str(self.source_ip), str(self.source_port) )
		else: return (str(self.source_port), str(self.destination_ip), str(self.destination_port) )

	def getBytesSize(self):
		bytes = 0
		if self.bytes_ab: bytes+= self.bytes_ab
		if self.bytes_ba: bytes+= self.bytes_ba
		return bytes

	def compareProtocol(self, protocol):
		protocol = protocol.lower().strip()
		if self.protocol == None: 
			return False
		elif   self.protocol == 'T':
			return (protocol == 't') or (protocol == 'tcp')
		elif   self.protocol == 'U':
			return (protocol == 'u') or (protocol == 'udp')
		elif   self.protocol == 'I':
			return (protocol == 'i') or (protocol == 'icmp')
		else:
			return  protocol == self.protocol.lower()

	def getProtocol(self):
		protocol = self.protocol.lower().strip()

		if 	   protocol == 't' or protocol == 'tcp':
			return 'tcp';
		elif   protocol == 'u' or protocol == 'udp':
			return 'udp'
		elif   protocol == 'i' or protocol == 'icmp':
			return 'icmp'
		else:
			return ''

	@staticmethod
	def getDefinitionArray():
		return CSV_ARRAY

	@staticmethod
	def getTableName():
		return TABLE

	@staticmethod
	def readFromTCPTrace(tcptraceOutput,pcap_id):
		startTime = time.time()
		objList = []
		obj = None
		readSrc = False
		hostLetter = ""

		for line in tcptraceOutput.rstrip().split('\n'):
			line = line.lower().strip()
			
			#TCP connection 6211:
			m = re.search("^\s*tcp connection\s+(\d+):",line)
			if m:
				obj = Flow(pcap_id)		#New object detected
				obj.bytes_ab = -1
				obj.bytes_ba = -1
				objList.append(obj)
				readSrc = False
				
			#host ris:      69.17.253.32:52223
			# TODO: Do we want downloads too? Only uploads are registered for now.
			m = re.search("^\s*host\s(\w+):\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+)",line)
			if m: 
				if not readSrc:
					hostLetter					= m.group(1)
					obj.source_ip				= m.group(2)
					obj.source_port				= m.group(3)
					readSrc = True
				else:
					obj.flow_code  				= hostLetter + "2" + m.group(1)
					obj.destination_ip			= m.group(2)
					obj.destination_port		= m.group(3)
			else:
				m = re.search("^\s*host\s(\w+):\s+([a-f0-9:]*[a-f0-9]*):(\d+)",line)
				if m:
					log.info("FOUND IPV6: %s%s - %s - %s" % (BLUE,m.group(1),m.group(2),m.group(3)))
					if not readSrc:
						hostLetter				= m.group(1)
						obj.source_ip			= m.group(2)
						obj.source_port			= m.group(3)
						readSrc 				= True
					else:
						obj.flow_code  			= hostLetter + "2" + m.group(1)
						obj.destination_ip		= m.group(2)
						obj.destination_port	= m.group(3)


			#complete conn: yes
			m = re.search("^\s*complete conn:\s+(.*)",line)
			if m: 
				obj.status	= re.sub(":","",re.sub("\t"," ",m.group(1))).strip()	#Replacing \t and :
			
			#first packet:  1292023717.880717
			m = re.search("^\s*first packet:\s+(\d+.\d+)", line)
			if m:	
				obj.first_packet = datetime.datetime.fromtimestamp(float(m.group(1)))

			#last packet:  1292024495.641582
			m = re.search("^\s*last packet:\s+(\d+.\d+)", line)
			if m:	
				obj.last_packet  = datetime.datetime.fromtimestamp(float(m.group(1)))
				
			#elapsed time:  0.536392
			m = re.search("^\s*elapsed time:\s+(\d+.\d+)", line)
			if m:	obj.total_time	= float(m.group(1))
			  
			#idletime max:      36528410.3 ms        idletime max:      36528410.2 ms   
			m = re.search("^\s*idletime max:\s+(\d+.\d+)\s+ms\s+idletime max:\s+(\d+.\d+)\s+ms", line)
			if m:	
				obj.idle_time_ab	= float(m.group(1))/1000.0
				obj.idle_time_ba	= float(m.group(2))/1000.0
		
			# if obj.srcip == 
			m = re.search("^\s*unique bytes sent:\s+(\d+)\s+unique bytes sent:\s+(\d+)", line)
			if m:	
				obj.bytes_ab	= int(m.group(1))
				obj.bytes_ba	= int(m.group(2))

			#total packets: 9342
			m = re.search("^\s*total packets:\s+(\d+)",line)
			if m: obj.total_packets = m.group(1)

		#Validation
		log.info("FLOWS EXTRACTION OK (%.3fs)" % (time.time() - startTime))
		return objList


DAO.updateMetaData()
#Base.metadata.reflect
#print Base.metadata.tables['trace'].insert()
