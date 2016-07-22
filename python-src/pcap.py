#!/usr/bin/python
"""
    Author: 		Julio Adriazola
    email: 			jcadriaz@uc.cl
    Date: 			17/02/2016

    The model definition was added to interact with the tcptrace script
    written by Diego Dahora, but no insertion will be made on this table.
"""

import sqlalchemy, re, datetime, time
from sqlalchemy import Column, Integer, String, Float, BigInteger, TIMESTAMP
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import INET

from DAO import DAO
from log import *

class Pcap(DAO.Base):
    __tablename__ = 'pcap'
    id = Column(Integer, primary_key=True)
    connection_id = Column(Integer, nullable=False)
    folder = Column(String)
    basename = Column(String)
    status = Column(String)
    error_info = Column(String)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    def __init__(self, connection_id, status, error_info):
    	self.connection_id	= connection_id
    	self.status 		= status
    	self.error_info 	= error_info

    def __repr__(self):
    	return "pcap(%s,%s,%s,%s)" % (self.basename, self.connection_id, self.status, self.error_info)
