#!/usr/bin/python

"""
    Author:         Diego da Hora
    email:          diego.da-hora@lip6.fr
    Date:           23/06/2013

    Updated by:     Julio Adriazola
    email:          jcadriaz@uc.cl
    Date:           15/02/2016
"""

import sqlalchemy, re, datetime, time
from sqlalchemy import Column, Integer, String, Float, BigInteger, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import INET

from DAO import DAO
from log import *


CSV_ARRAY = ['pcap_id','flow_id','direction','time','rtt','seq']
TABLE = 'pcap_rtt'

class tsRTT(DAO.Base):
    __tablename__ = TABLE

    rttid	    = Column('id',BigInteger, primary_key=True)
    pcap_id     = Column(Integer, nullable=False)
    flow_id     = Column(Integer, nullable=False)
    direction   = Column(String, nullable=False)
    time        = Column(TIMESTAMP, nullable=False)
    rtt         = Column(Float, nullable=False)
    seq         = Column(BigInteger)

    def __init__(self, pcap_id):
    	self.pcap_id   = pcap_id
        self.direction = 'ab'

    def __repr__(self):
        return "<tsRTT('%s', %s at '%s' - '%s'\t'%s - %s')>" % (self.pcap_id, self.direction, self.time, self.flow_id, self.seq, self.rtt)

    @staticmethod
    def getTable():
        global Base
        return Base.metadata.tables[tsRTT.__tablename__]

    @staticmethod
    # This function can trigger an out of memory error. In that case, it's necessary 
    # to write partial results to a file and then execute the DAO().dbCopyFile command for that file
    # (This was done in the traceAnalyzer.analyseEVENTmetric and traceAnalyzed.analyseRTTmetric old functions) 
    def readFromTCPTrace(filename, pcap_id, findflow_id):
        startTime = time.time()
        objList = []
        f = open(filename)
        
        for line in f:
            line = line.lower().strip()
            
            #1       2            3  4       5     6         7                 8
            #bbb2bba 67.212.74.82:80 0.0.0.0:49174 708053869 1292109306.486750 0.075000 

            m = re.search("([a-z0-9]+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+)\s+(\d+)\s+(\d+.\d+)\s+(\d+.\d+)", line)
            if not m: continue
            
            obj     = tsRTT(pcap_id)
            flow_code    = m.group(1)

            # This can be added to the table but this information is in the flow object
            # obj.source_ip           = m.group(2)
            # obj.source_port         = m.group(3)
            # obj.destination_ip      = m.group(4)
            # obj.destination_port    = m.group(5)

            obj.seq     = m.group(6)
            obj.time    = datetime.datetime.fromtimestamp(float(m.group(7)))
            obj.rtt     = float(m.group(8))
            
            (obj.flow_id, obj.direction) = findflow_id(pcap_id, flow_code)

            #Skiping undesirable samples
            #if obj.rtt < 0.05: continue

            #Skipping 'download' rtt
            if m.group(4) == "0.0.0.0": continue 

            if obj.flow_id: objList.append(obj)

        log.info("RTT EXTRACTION OK (%.3fs)" % (time.time() - startTime))
        return objList

    @staticmethod
    def getDefinitionArray():
        return CSV_ARRAY

    @staticmethod
    def getTableName():
        return TABLE

DAO.updateMetaData()
