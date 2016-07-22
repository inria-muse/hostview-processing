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

# Is the pcap id needed? We can get it from the flow_id... But it's OK if we don't want to make a lot of joins
CSV_ARRAY = ['pcap_id','flow_id','direction','time','value']
TABLE = 'pcap_throughput'

class tsTPUT(DAO.Base):
    __tablename__ = TABLE

    tputid	    = Column('id',BigInteger, primary_key=True)
    pcap_id 	= Column(Integer, nullable=False)
    flow_id     = Column(Integer, nullable=False)
    direction   = Column(String, nullable=False)
    time        = Column(TIMESTAMP, nullable=False)     #WHAT IS THE CORRECT TYPE OF DATA FOR THIS GUY??
    value       = Column(Float, nullable=False)

    def __init__(self, pcap_id):
        self.pcap_id = pcap_id

    def __repr__(self):
        return "<tsTput('%s':%s at '%s' - '%s'\t'%s')>" % (self.pcap_id, self.direction, self.time, self.flow_id, self.value)

    @staticmethod
    def getTable():
        global Base
        return Base.metadata.tables[tsTPUT.__tablename__]

    @staticmethod
    def readFromTCPTrace(filename, pcap_id, findflow_id):
        startTime = time.time()
        objList = []

        log.info("process tput %s"%filename)
        f = open(filename)

        for line in f:
            line = line.strip().lower()
            #     1       2       3     4             5    6          7
            #BIN: adb2aac 0.0.0.0:49155 82.233.146.93:8760 1290719771 37
            #BIN: q2r 0.0.0.0:49163 208.43.202.5:80 1291925335 0
            m = re.search("bin:\s+([a-z0-9]+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+)\s+(\d{1,3}\.\d{1,3}\.\d{1,3}.\d{1,3}):(\d+)\s+(\d+)\s+(\d+)", line)
            
            if not m: continue
            obj                     = tsTPUT(pcap_id)
            flow_code               = m.group(1)

            # This can be added to the table but this information is in the flow object
            # obj.source_ip           = m.group(2)
            # obj.source_port         = m.group(3)
            # obj.destination_ip      = m.group(4)
            # obj.destination_port    = m.group(5)

            
            obj.time              = time.ctime(float(m.group(6)))                         #SEE RESULTS. MAYBE IS TIME, MAYBE IS TIMESTAMP
            # obj.time                = datetime.datetime.fromtimestamp(float(m.group(6)))
            obj.value               = m.group(7)
            
            (obj.flow_id, obj.direction) = findflow_id(pcap_id, flow_code)
            objList.append(obj)

        log.info("TPUT EXTRACTION OK (%.3fs)" % (time.time() - startTime))
        return objList

    @staticmethod
    def getDefinitionArray():
        return CSV_ARRAY

    @staticmethod
    def getTableName():
        return TABLE

DAO.updateMetaData()
