#!/usr/bin/python
"""
    Author: Anna-Kaisa Pietilainen <anna-kaisa.pietilainen@inria.fr>
    Date: 22/07/2016

    Author: Julio Adriazola
    email: 	jcadriaz@gmail.com
    Date: 	25/02/2016

	TCPTrace process by:
	    Author: Diego da Hora
	    email: diego.da-hora@lip6.fr
	    Date: 23/06/2013
"""

import time, os, re, sys, subprocess, shutil, datetime

from log 		import * 
from DAO 		import DAO
from flow 		import Flow
from tsTPUT 	import tsTPUT
from tsEVENT 	import tsEVENT
from tsRTT		import tsRTT
from pcap 		import Pcap

class App(object):
	"""
		Once the flows are created, it's necessary to obtain the id of each 
		(pcap_id,flow_code) object. So, the flowCache is a dictionary of the type:
		{
			(pcap_id,'a2b'): completeFlowObjectAsociatedToA2B
			(pcap_id,'c2d'): completeFlowObjectAsociatedToC2D
			(pcap_id,'e2f'): completeFlowObjectAsociatedToE2F
			(pcap_id,'g2h'): completeFlowObjectAsociatedToG2H
			...
		}
		The complete flow object includes the id that is obtained after 
		the insertion to the database.
	"""
	flowCache = {}

	@staticmethod
	def loadflowCache(pcap_id):
		App.flowCache = {}
		rs = DAO().select_by(Flow, pcap_id=pcap_id, all=True)
		for r in rs:
			key = (r.pcap_id, r.flow_code)
			App.flowCache[key]  = r
		log.info("loadflowCache %d entries"%len(App.flowCache.keys()))

	@staticmethod
	def findFlowId(pcap_id, flow_code):
		# A to B (in the flow direction)
		abkey = (pcap_id, App.getDirectFlowCode(flow_code))	
		# B to A (in the reverse direction)
		bakey = (pcap_id, App.getReverseFlowCode(flow_code))
		
		if abkey in App.flowCache:
			return (App.flowCache[abkey].flowid, 'ab')
		elif bakey in App.flowCache:
			return (App.flowCache[bakey].flowid, 'ba')
		else:
			log.warn("Flow '%s,%s' not found" % (pcap_id,flow_code))
			return (None, None)

	@staticmethod
	def getReverseFlowCode(flowcode):
		m = re.search("([a-z]+)2([a-z]+)", flowcode)
		if m: return m.group(2) + "2" + m.group(1)
		return None

	@staticmethod
	def getDirectFlowCode(flowcode):
		return flowcode

	@staticmethod
	def massPersist(filename, tableName, columns, objList):
		startTime = time.time()
		DAO().dbCopy(os.path.splitext(filename)[0] + ".csv", tableName, columns, objList)
		log.info("%s INSERTION OK (%.3fs)" % (tableName.upper(),time.time() - startTime))

	@staticmethod
	def extractFlows(tcptraceout, filename, pcap_id):
		App.massPersist(filename, 
			Flow.getTableName(), 
			Flow.getDefinitionArray(), 
			Flow.readFromTCPTrace(tcptraceout,pcap_id))

	@staticmethod
	def extractThroughput(filename, pcap_id):
		App.massPersist(filename, 
			tsTPUT.getTableName(), 
			tsTPUT.getDefinitionArray(), 
			tsTPUT.readFromTCPTrace(filename, pcap_id, App.findFlowId))

	@staticmethod
	def extractEvent(filename, pcap_id):
		App.massPersist(filename, 
			tsEVENT.getTableName(), 
			tsEVENT.getDefinitionArray(), 
			tsEVENT.readFromTCPTrace(filename, pcap_id, App.findFlowId))

	@staticmethod
	def extractRTT(filename, pcap_id):
		App.massPersist(filename, 
			tsRTT.getTableName(), 
			tsRTT.getDefinitionArray(), 
			tsRTT.readFromTCPTrace(filename, pcap_id, App.findFlowId))

	@staticmethod
	def CallTCPTrace(pcapfile, outdir):
		startTime = time.time()
		args = [
			"/usr/bin/tcptrace",
			"-nlj", 
			'--output_dir='+outdir,
			'--output_prefix=ts',
			pcapfile
		]
		log.info(' '.join(args))

		process = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=open(os.devnull, 'w'))
		(out,err) = process.communicate()

		log.info("TCPTRACE %s[%d] (took %.3fs)" % (('ok' if (process.returncode==0) else 'failed'), process.returncode, (time.time() - startTime)))
		if (process.returncode!=0):
			log.error(err)
			return (None, err)
		return (out,err)

	@staticmethod
	def process(pcapfile):
		"""
		Processing entry point.
		"""
		App.flowCache = {}
		pcapfile = os.path.abspath(pcapfile)
		outdir = "%s/%s" % (os.path.dirname(pcapfile),os.path.basename(pcapfile).split('_')[0]) 
		if not os.path.exists(outdir): 
			os.mkdir(outdir)

		pcap = None

		startTime = time.time()

		try:

			fsize = os.path.getsize(pcapfile) / (1024.0*1024.0)
			log.info("process pcap %s%s%s, size %s%.4fMB" %(BLUE, os.path.basename(pcapfile),NULL, RED, fsize))

			pcap = DAO().select_by(Pcap, basename = os.path.basename(pcapfile))
			log.info(pcap)

			DAO().update_by(Pcap, { 
				'status': 'processing', 
				'error_info' : None,
				'updated_at': datetime.datetime.now()
			}, id = pcap.id)
			pcap.status = 'processing'
			pcap.error_info = None

			(tcptraceout, tcptraceerr) = App.CallTCPTrace(pcapfile, outdir)
			if (tcptraceout==None):
				pcap.error_info = tcptraceerr
				raise Exception(tcptraceerr)

			App.extractFlows(tcptraceout, os.path.join(outdir,"flow.dat"), pcap.id)
			App.loadflowCache(pcap.id)

			if (os.environ.get('INSERT_TPUT', 'true')=='true'):
				App.extractThroughput(os.path.join(outdir,"ts_tput.dat"), pcap.id)
			if (os.environ.get('INSERT_EVENTS', 'false')=='true'):
				App.extractEvent(os.path.join(outdir,"ts_tsg.dat"), pcap.id)
			if (os.environ.get('INSERT_RTT', 'true')=='true'):
				App.extractRTT(os.path.join(outdir,"ts_rtt.dat"), pcap.id)

			DAO().update_by(Pcap, { 
				'status': 'success', 
				'error_info' : None,
				'updated_at': datetime.datetime.now()
			}, id = pcap.id)
			pcap.status = 'success'
			pcap.error_info = None

			log.info("processing %s done, %s (took %.3fs)" % (pcapfile, pcap.status, (time.time() - startTime)))

		except:
			# remove temporary output folder + contents
			if (os.path.exists(outdir)): 
				shutil.rmtree(outdir) 

			if pcap != None:
				pcap.status = 'failed' if pcap.status == 'processing' else pcap.status

				log.error('processing %s error, status=%s (took %.3fs)' % (pcapfile, pcap.status, (time.time() - startTime)))
				if (pcap.error_info!=None):
					log.error(pcap.error_info)
				log.error(sys.exc_info())

				DAO().update_by(Pcap, {
					'status': pcap.status, 
					'error_info': pcap.error_info, 
					'updated_at': datetime.datetime.now() 
				}, id = pcap.id)

			else:
				log.warn("pcapfile %s not found (took %.3fs)" % (pcapfile, (time.time() - startTime)))

			return 1

		# remove temporary output folder + contents
		if (os.path.exists(outdir)): 
			shutil.rmtree(outdir) 
		return 0

if __name__ == "__main__":
	"""
	The main entry for pcap processing. Usage:

		python main.py <pcapfile>

	You should also configure the following environment variable:

		PROCESS_DB		postgresql://user:password@hostname/database
		INSERT_TPUT     true(default)|false - insert TCP throughput timeseries
		INSERT_RTT 	    true(default)|false - insert TCP RTT timeseries
		INSERT_EVENTS   true|false(default) - insert TCP EVENTS
	"""
	if (len(sys.argv)<=1 or not os.path.isfile(sys.argv[1])):
		log.error('Usage: python %s <pcapfile>' % sys.argv[0])
		sys.exit(1)
	sys.exit(App.process(sys.argv[1]))