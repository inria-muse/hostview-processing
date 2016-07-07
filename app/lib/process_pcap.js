/**
 * process_pcap.js
 *
 * Process a pcap file. In this app we just check if we have received a complete
 * file (last + all parts if any), merge and move to the pcap processing folder.
 *
 * The pcap processing is done by a separate python app.
 */
module.exports.process = function(file, db, callback) {
    callback(new Error('Not implemented'))    
}