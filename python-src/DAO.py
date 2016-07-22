#!/usr/bin/python

from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError

import sys, sqlalchemy, datetime, os
from log import *

"""
    Author: Diego da Hora
    email: diego.da-hora@lip6.fr
    Date: 01/06/2013

    Author: Anna-Kaisa Pietilainen <anna-kaisa.pietilainen@inria.fr>
    Date: 22/07/2016
"""

class DAO(object):
	_instance = None

	db = os.environ.get('PROCESS_DB')
	engine = sqlalchemy.create_engine(db)
	Base = declarative_base()
	
	def __new__(self, *args, **kwargs):
		if not self._instance:
			self._instance = super(DAO, self).__new__(self, *args, **kwargs)
			log("Connected to " + DAO.db);
		return self._instance

	def __init__(self):
		self.DBSession = sessionmaker(bind=DAO.engine)
	
	@staticmethod
	def updateMetaData():
		DAO.Base.metadata.create_all(DAO.engine)

	def create(self, entity):
		try:
			session = self.DBSession()
			session.add(entity)
			session.commit()
			session.refresh(entity)
		except SQLAlchemyError as err:
			log.error( "Create Error found: \n%s" % err )
			return
		finally:
			session.close()
		
	def merge(self, entity):
		try:
			session = self.DBSession()
			session.merge(entity)
			session.commit()
		except SQLAlchemyError as err:
			log.error("Couldn't merge - trying to add: %s" % err)	
			try:
				session.rollback()
				session.add(entity)
				session.commit()
				session.refresh(entity)
			except SQLAlchemyError as err:
				log.error( "Merge and Create Error found: \n%s" % err )
		finally:
			session.close()
	
	def refresh(self, entity):
		try:
			session = self.DBSession()
			session.add(entity)
			session.refresh(entity)
		except SQLAlchemyError as err:
			log.error( "Refresh Error found: \n%s" % err )
		finally:
			session.close()
	
	def createAll(self, listOfEntities):
		try:
			session = self.DBSession()
			for entity in listOfEntities:
				session.add(entity)
			
			session.commit()
		except SQLAlchemyError as err:
			log.error( "Create all Error found: \n%s" % err )
		finally:
			session.close()
			
	def dbCopy(self, tmpFile, table, columns, listOfEntities):
		try:
			session = self.DBSession()
			
			#Creating the query
			query = "COPY %s (%s" % (table, columns[0])
			for c in columns[1:]:
				query += ", %s" % c
			query += ") FROM '%s' " % tmpFile
			query += " WITH (FORMAT csv);"
			
			#Creating the file
			f = open(tmpFile, 'w')
			for obj in listOfEntities:
				f.write("%s" % getattr(obj, columns[0]))
				
				for c in columns[1:]:
					if getattr(obj, c) != None:
						f.write(",%s" % getattr(obj, c))
					else:
						f.write(",")
				f.write("\n")
			f.close()
			
			r = session.execute(query)
			session.commit()
			return r
		except SQLAlchemyError as err:
			log.error( "DB COPY FAILED: \n%s" % err )
			log.info("QUERY:\t%s" % query)
			sys.exit(1)
		finally:
			session.close()

	def dbCopyFile(self, tmpFile, table, columns):
		try:
			session = self.DBSession()
			
			#Creating the query
			query = "COPY %s (%s" % (table, columns[0])
			for c in columns[1:]:
				query += ", %s" % c
			query += ") FROM '%s' " % tmpFile
			query += " WITH (FORMAT csv);"
			
			r = session.execute(query)
			session.commit()
			return r
		except SQLAlchemyError as err:
			log.error( "DB COPY FAILED: \n%s" % err )
			log.info("QUERY:\t%s" % query)
			sys.exit(1)
		finally:
			session.close()
	'''
		Delete all entries which matches a general query (using sql expressions)
		Returns the number of deleted entries
	'''
	def delete(self, table, *criteria):
		try:
			session = self.DBSession()
			r = session.query(table).filter(*criteria).delete()
			session.commit()
			return r
		except SQLAlchemyError as err:
			log.error( "Delete All Error found: %s<'%s','%s'>\n%s%s" % (MAGENTA,table, criteria, NULL, err) )
			return 0
		finally:
			session.close()
	
	'''
		Delete all entries which matches a particular field
		Returns the number of deleted entries
	'''
	def delete_by(self, table, **criteria):
		try:
			log.info("DELETE from %s where %s" % (table, criteria))
			session = self.DBSession()
			r = session.query(table).filter_by(**criteria).delete()
			session.commit()
			return r
		except SQLAlchemyError as err:
			log.error( "Delete_By All Error found: %s<'%s','%s'>\n%s%s" % (MAGENTA,table, criteria, NULL, err) )
			return 0
		finally:
			session.close()
	
	
	def update_by(self, table, values, **criteria):
		try:
			session = self.DBSession()
			r = session.query(table).filter_by(**criteria).with_lockmode('update').update(values)
			session.commit()
			return r
		except SQLAlchemyError as err:
			log.error( "Update_ByError found: %s<'%s','%s'> \n%s%s" % (MAGENTA,table, criteria, NULL, err) )
			return 0
		finally:
			session.close()
	
	def select_by(self, table, **criteria):
		limit = False
		rall  = False
		if 'limit' in criteria: 
			limit = criteria['limit']
			criteria.pop("limit", None)
		
		if 'all' in criteria: 
			rall = criteria['all']
			criteria.pop("all", None)

		if 'order' in criteria:
			order = criteria['order']
			criteria.pop("order", None)

		try:
			session = self.DBSession()
			query = session.query(table).filter_by(**criteria)
			
			if limit: query = query.limit(limit)
			
			if rall:r = query.all()
			else:	r = query.first()
				
			session.expunge_all()
			return r
		except SQLAlchemyError as err:
			log.error( "Select_By Error found: %s<'%s','%s'> Limit = %s, All = %s\n%s%s" % (MAGENTA,table, criteria, limit, rall, NULL, err) )
			return None
		finally:
			session.close()

	def select(self, table, *criteria, **options):
		limit = False
		rall  = False
		if 'limit' in options: 
			limit = options['limit']
		
		if 'all' in options: 
			rall = options['all']

		try:
			session = self.DBSession()
			query = session.query(table).filter(*criteria)
			
			if limit: query = query.limit(limit)
			
			if rall:r = query.all()
			else:	r = query.first()
			
			session.expunge_all()
			return r
		except SQLAlchemyError as err:
			log.error( "Select One Error found: %s<'%s','%s'> Limit = %s, All = %s\n%s%s" % (MAGENTA,table, criteria, limit, rall,  NULL, err) )
			return None
		finally:
			session.close()
			
	def execute(self, query, count=False):
		try:
			conn = DAO.engine.connect()
			rs = conn.execute(query)
			if count:
				if rs:
					return rs.rowcount if (rs.rowcount==None) else 0
				else:
					return 0
			else:
				return rs
		except SQLAlchemyError as err:
			log.error( "Problem executing sql: %s<'%s'> \n%s%s" % (MAGENTA, query, NULL, err) )
			return None
		finally:
			conn.close()

			
	def evaluate(self, query, miss=''):
		try:
			conn = DAO.engine.connect()
			rs = conn.execute(query).fetchone()

			if rs and rs[0]:
				return rs[0]
			else:
				return miss
		except SQLAlchemyError as err:
			log.error( "Problem executing sql: %s<'%s'> \n%s%s" % (MAGENTA, query, NULL, err) )
			return None
		finally:
			conn.close()

