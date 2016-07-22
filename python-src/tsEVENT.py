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

CSV_ARRAY = ['pcap_id','flow_id','direction','time','type','seq']
TABLE = 'pcap_events'

## VALUES FOR type ##
#OOO	Out of order
#RET	Retransmited
#PRB	Probes
#RSY	Retransmited SYN
#SYN	SYN (synchronization)
#RFI	Retransmited FIN
#FIN	FIN (finalization)
#RSI	Reset IN
#RSO	Reset OUT
#DAK	Double ACK
#TDA	Triple Double ACK
class tsEVENT(DAO.Base):
	__tablename__ = TABLE

	eventid	  	= Column('id',BigInteger, primary_key=True)
	pcap_id 	= Column(Integer, nullable=False)
	direction 	= Column(String, nullable=False)
	flow_id	  	= Column(Integer, nullable=False)
	time 	  	= Column(TIMESTAMP, nullable=False)
	type	  	= Column(String(3), nullable=False)
	seq		 	= Column(BigInteger)								#What is this?

	def __init__(self, pcap_id):
		self.pcap_id = pcap_id

	def __repr__(self):
		return "<tsEvent('%s'%s at '%s' - '%s'\t'%s seq(%s)')>" % (self.pcap_id, self.direction, self.time, self.flow_id, self.type, self.seq)
    
	def setType(self, t):
		t = t.lower()
		if   re.search("ooo", t):					self.type = "OOO"
		elif re.search("r$", t):					self.type = "RET"
		elif re.search("p", t):						self.type = "PRB"
		elif re.search("r syn", t):					self.type = "RSY"
		elif re.search("^syn", t):					self.type = "SYN"
		elif re.search("r fin", t):					self.type = "RFI"
		elif re.search("^fin", t):					self.type = "FIN"
		elif re.search("rst_in", t):				self.type = "RSI"
		elif re.search("rst_out", t):				self.type = "RSO"
		elif re.search("^double ack", t):			self.type = "DAK"
		elif re.search("triple double ack", t):		self.type = "TDA"
		else: self.type = ""

	@staticmethod
	def getTable():
		global Base
		return Base.metadata.tables[tsEVENT.__tablename__]

	@staticmethod
	# This function can trigger an out of memory error. In that case, it's necessary 
	# to write partial results to a file and then execute the DAO().dbCopyFile command for that file
	# (This was done in the traceAnalyzer.analyseEVENTmetric and traceAnalyzed.analyseRTTmetric old functions) 
	def readFromTCPTrace(filename, pcap_id, findflow_id):
		startTime = time.time()
		objList = []
		f = open(filename)
		
		for line in f:
			line = line.strip().lower()
			#1       2              3  4       5     6                 7          8
			#adb2aac 195.50.164.210:80 0.0.0.0:55896 1290560444.537487 3948668423 OOO
			m = re.search("^([a-z0-9]+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+) (\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+) (\d+.\d+)\s+(\d+)\s+([a-z_ ]+)", line)
			
			if not m: continue
			obj			= tsEVENT(pcap_id)
			flow_code 	= m.group(1)

			# This can be added to the table but this information is in the flow object
			# obj.source_ip           = m.group(2)
			# obj.source_port         = m.group(3)
			# obj.destination_ip      = m.group(4)
			# obj.destination_port    = m.group(5)

			obj.time	= time.ctime(float(m.group(6)))
			obj.seq		= m.group(7)
			obj.setType(m.group(8).strip())
			
			if obj.type == "": continue		#No use storing instances without type :-)

			(obj.flow_id, obj.direction) = findflow_id(pcap_id, flow_code)
			objList.append(obj)

		log.info("EVENT EXTRACTION OK (%.3fs)" % (time.time() - startTime))
		return objList

	@staticmethod
	def getDefinitionArray():
	    return CSV_ARRAY

	@staticmethod
	def getTableName():
	    return TABLE

DAO.updateMetaData()
