/*
 * Copyright (c) 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001,
 *               2002, 2003, 2004
 *	Ohio University.
 *
 * ---
 * 
 * Starting with the release of tcptrace version 6 in 2001, tcptrace
 * is licensed under the GNU General Public License (GPL).  We believe
 * that, among the available licenses, the GPL will do the best job of
 * allowing tcptrace to continue to be a valuable, freely-available
 * and well-maintained tool for the networking community.
 *
 * Previous versions of tcptrace were released under a license that
 * was much less restrictive with respect to how tcptrace could be
 * used in commercial products.  Because of this, I am willing to
 * consider alternate license arrangements as allowed in Section 10 of
 * the GNU GPL.  Before I would consider licensing tcptrace under an
 * alternate agreement with a particular individual or company,
 * however, I would have to be convinced that such an alternative
 * would be to the greater benefit of the networking community.
 * 
 * ---
 *
 * This file is part of Tcptrace.
 *
 * Tcptrace was originally written and continues to be maintained by
 * Shawn Ostermann with the help of a group of devoted students and
 * users (see the file 'THANKS').  The work on tcptrace has been made
 * possible over the years through the generous support of NASA GRC,
 * the National Science Foundation, and Sun Microsystems.
 *
 * Tcptrace is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Tcptrace is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tcptrace (in the file 'COPYING'); if not, write to the
 * Free Software Foundation, Inc., 59 Temple Place, Suite 330, Boston,
 * MA 02111-1307 USA
 * 
 * Author:	Shawn Ostermann
 * 		School of Electrical Engineering and Computer Science
 * 		Ohio University
 * 		Athens, OH
 *		ostermann@cs.ohiou.edu
 *		http://www.tcptrace.org
 */

#include "tcptrace.h"
static char const GCC_UNUSED copyright[] =
		"@(#)Copyright (c) 2004 -- Ohio University.\n";
static char const GCC_UNUSED rcsid[] =
		"@(#)$Header: /usr/local/cvs/tcptrace/thruput.c,v 5.5 2003/11/19 14:38:05 sdo Exp $";

struct  timeval  tvSubtract (

#    if PROTOTYPES
        struct  timeval  time1,
        struct  timeval  time2)
#    else
        time1, time2)

        struct  timeval  time1 ;
        struct  timeval  time2 ;
#    endif

{    /* Local variables. */
    struct  timeval  result ;



/* Subtract the second time from the first. */

    if ((time1.tv_sec < time2.tv_sec) ||
        ((time1.tv_sec == time2.tv_sec) &&
         (time1.tv_usec <= time2.tv_usec))) {		/* TIME1 <= TIME2? */
        result.tv_sec = result.tv_usec = 0 ;
    } else {						/* TIME1 > TIME2 */
        result.tv_sec = time1.tv_sec - time2.tv_sec ;
        if (time1.tv_usec < time2.tv_usec) {
            result.tv_usec = time1.tv_usec + 1000000L - time2.tv_usec ;
            result.tv_sec-- ;				/* Borrow a second. */
        } else {
            result.tv_usec = time1.tv_usec - time2.tv_usec ;
        }
    }

    return (result) ;

}
struct  timeval  tvAdd (

#    if PROTOTYPES
        struct  timeval  time1,
        struct  timeval  time2)
#    else
        time1, time2)

        struct  timeval  time1 ;
        struct  timeval  time2 ;
#    endif

{    /* Local variables. */
    struct  timeval  result ;



/* Add the two times together. */

    result.tv_sec = time1.tv_sec + time2.tv_sec ;
    result.tv_usec = time1.tv_usec + time2.tv_usec ;
    if (result.tv_usec >= 1000000L) {			/* Carry? */
        result.tv_sec++ ;  result.tv_usec = result.tv_usec - 1000000L ;
    }

    return (result) ;

}

int  tvCompare (

#    if PROTOTYPES
        struct  timeval  time1,
        struct  timeval  time2)
#    else
        time1, time2)

        struct  timeval  time1 ;
        struct  timeval  time2 ;
#    endif

{

    if (time1.tv_sec < time2.tv_sec)
        return (-1) ;				/* Less than. */
    else if (time1.tv_sec > time2.tv_sec)
        return (1) ;				/* Greater than. */
    else if (time1.tv_usec < time2.tv_usec)
        return (-1) ;				/* Less than. */
    else if (time1.tv_usec > time2.tv_usec)
        return (1) ;				/* Greater than. */
    else
        return (0) ;				/* Equal. */

}

void
DoThru(
		tcb *ptcb,
		int nbytes)
{
	double etime;
	u_long etime_secs;
	u_long etime_usecs;
	double thruput;
	char *myname, *hisname;
	char *name_from, *name_to;

	if (ptcb == &ptcb->ptp->a2b) {
		name_from = ptcb->ptp->a_endpoint;
		name_to = ptcb->ptp->b_endpoint;
	} else {
		name_from = ptcb->ptp->b_endpoint;
		name_to = ptcb->ptp->a_endpoint;
	}

	/* if no data, then nothing to do */
	//Oana - if not commented, it does not calculate statistics till the end of the flow
	//if (nbytes == 0)
	//	return;

	/* init, if not already done */
	if (ZERO_TIME(&ptcb->thru_firsttime)) {
		char title[210];

		ptcb->thru_firsttime = current_time;
		ptcb->thru_lasttime = current_time;
		ptcb->thru_pkts = 1;
		ptcb->thru_bytes = nbytes;

		//Oana--
		ptcb->thru_bin_firsttime = current_time.tv_sec;
		//ptcb->thru_bin_lasttime = current_time;
		ptcb->thru_bin_pkts = 1;
		ptcb->thru_bin_bytes = nbytes;

		ptcb->thru_stat_firsttime = current_time;
		//ptcb->thru_stat_lasttime = current_time;
		ptcb->thru_stat_pkts = 1;
		ptcb->thru_stat_bytes = nbytes;
		ptcb->thru_stat_count = 0;
		fprintf (stderr, "BIN STAT: first packet %s %s %lu.%.6lu %d bin test end \n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);

		//---

		//fprintf (mytputfile, "current packet %s %s %lu %d\n", name_from, name_to, current_time.tv_sec,(int) nbytes);
		//Oana--- comment the output in many files
		if (!timeseries) {
			/* bug fix from Michele Clark - UNC */
			if (&ptcb->ptp->a2b == ptcb) {
				myname = ptcb->ptp->a_endpoint;
				hisname = ptcb->ptp->b_endpoint;
			} else {
				myname = ptcb->ptp->b_endpoint;
				hisname = ptcb->ptp->a_endpoint;
			}


			/* create the plotter file */
			snprintf(title,sizeof(title),"%s_==>_%s (throughput)",
					myname, hisname);
			ptcb->thru_plotter = new_plotter(ptcb,NULL,title,
					"time","thruput (bytes/sec)",
					THROUGHPUT_FILE_EXTENSION);
			if (graph_time_zero) {
				/* set graph zero points */
				plotter_nothing(ptcb->thru_plotter, current_time);
			}


			/* create lines for average and instantaneous values */

			ptcb->thru_avg_line =
					new_line(ptcb->thru_plotter, "avg. tput", "blue");
			ptcb->thru_inst_line =
					new_line(ptcb->thru_plotter, "inst. tput", "red");


		}
		return;
	}

	/* see if we should output the stats yet */

	//Oana--- compute the throughout per bin (one second)
	//TODO - add here a parameter to customize bins
	//fprintf (mytputfile, "current packet %s %s %lu %d\n", name_from, name_to, current_time.tv_sec,(int) nbytes);
	if (current_time.tv_sec >= ptcb->thru_bin_firsttime+1) {
		//print statistics for the previous bin
	    	char flowid[50];
		snprintf(flowid,sizeof(flowid),"%s2%s", ptcb->host_letter, ptcb->ptwin->host_letter);

		fprintf (mytputfile, "BIN: %s %s %s %lu %lu\n", flowid, name_from, name_to, ptcb->thru_bin_firsttime, ptcb->thru_bin_bytes);
		fprintf (stderr, "BIN: %s %s %lu %lu\n", name_from, name_to, ptcb->thru_bin_firsttime, ptcb->thru_bin_bytes);

		//update statistics for the new bin
		ptcb->thru_bin_firsttime = current_time.tv_sec;
		ptcb->thru_bin_pkts = 1;
		ptcb->thru_bin_bytes = nbytes;
		fprintf (stderr, "BIN: asd %s %s %lu.%.6lu %lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, ptcb->thru_bin_firsttime);
		fprintf (stderr, "BIN: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);

	}
	else {
		++ptcb->thru_bin_pkts;
		ptcb->thru_bin_bytes += nbytes;
		fprintf (stderr, "BIN: asd %s %s %lu.%.6lu %lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, ptcb->thru_bin_firsttime);
		fprintf (stderr, "BIN: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
		fprintf (stderr, "BIN: current statistics %s %s %ld.%.6ld %ld  \n",  name_from, name_to,(long) current_time.tv_sec,(long)current_time.tv_usec, (long) ptcb->thru_bin_bytes);
	}

	struct timeval sec;
	sec.tv_sec=1;
	sec.tv_usec=0;

	fprintf (stderr, "STATDEBUG: %s %s %ld.%.6ld %ld.%.6ld %d\n", name_from, name_to, (long)current_time.tv_sec, (long) current_time.tv_usec, (long) tvAdd(ptcb->thru_stat_firsttime,sec).tv_sec,  (long)tvAdd(ptcb->thru_stat_firsttime,sec).tv_usec,tvCompare(current_time,tvAdd(ptcb->thru_stat_firsttime,sec)));


	if (tvCompare(current_time,tvAdd(ptcb->thru_stat_firsttime,sec)) != -1) {

		//fprintf (stderr, "STAT: %ld.%.6ld %ld.%.6ld\n",current_time.tv_sec,current_time.tv_usec, tvAdd(ptcb->thru_stat_firsttime,1.0).tv_sec, tvAdd(ptcb->thru_stat_firsttime,1.0).tv_usec);
		// print the statistics from the last bin
		//fprintf (stderr, "STAT: %s %s %lu.%.6lu %lu\n", name_from, name_to, (long) ptcb->thru_stat_firsttime.tv_sec, (long) ptcb->thru_stat_firsttime.tv_usec, ptcb->thru_stat_bytes);

		if ((ptcb->thru_stat_min == 0) || (ptcb->thru_stat_min > ptcb->thru_stat_bytes))
			ptcb->thru_stat_min = ptcb->thru_stat_bytes;

		if (ptcb->thru_stat_max < ptcb->thru_stat_bytes)
			ptcb->thru_stat_max = ptcb->thru_stat_bytes;

		ptcb->thru_stat_sum += ptcb->thru_stat_bytes;
		ptcb->thru_stat_sum2 += ptcb->thru_stat_bytes * ptcb->thru_stat_bytes;

		struct  timeval difference;
		difference=tvSubtract(current_time,ptcb->thru_stat_firsttime);
		if (difference.tv_sec < 2)
		{
			++ptcb->thru_stat_count;
			ptcb->thru_stat_firsttime = tvAdd(ptcb->thru_stat_firsttime,sec);
		}
		else
		{
			ptcb->thru_stat_min = 1;
			ptcb->thru_stat_count += (long) difference.tv_sec;
			struct  timeval dif;
			dif.tv_sec=difference.tv_sec;
			dif.tv_usec=0;
			ptcb->thru_stat_firsttime = tvAdd(ptcb->thru_stat_firsttime,dif);
			fprintf(stderr,"STAT: diff %s %s %ld.%.6ld\n",  name_from, name_to, (long) difference.tv_sec, (long) difference.tv_usec);
		}

		fprintf (stderr, "STAT OUT: %s %s %ld.%.6ld %ld %ld %ld %ld %ld %d\n",  name_from, name_to,  (long) ptcb->thru_stat_firsttime.tv_sec, (long) ptcb->thru_stat_firsttime.tv_usec, (long) ptcb->thru_stat_bytes, (long) ptcb->thru_stat_min, (long) ptcb->thru_stat_max, (long) ptcb->thru_stat_sum, (long) ptcb->thru_stat_sum2, (int) ptcb->thru_stat_count );

		// the current bin will start at this second
		// the microseconds are the same so we can count from the beginning of the connenction
		//ptcb->thru_stat_firsttime = tvAdd(ptcb->thru_stat_firsttime,1);
		//ptcb->thru_stat_firsttime.tv_sec = current_time.tv_sec;


		ptcb->thru_stat_pkts = 1;
		ptcb->thru_stat_bytes = nbytes;
		fprintf (stderr, "STAT: asd %s %s %lu.%.6lu %lu.%.6lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, (long)ptcb->thru_stat_firsttime.tv_sec, (long)ptcb->thru_stat_firsttime.tv_usec);
		fprintf (stderr, "STAT: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);

	}
	else {
		++ptcb->thru_stat_pkts;
		ptcb->thru_stat_bytes += nbytes;
		fprintf (stderr, "STAT: asd %s %s %lu.%.6lu %lu.%.6lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, (long)ptcb->thru_stat_firsttime.tv_sec, (long)ptcb->thru_stat_firsttime.tv_usec);
		fprintf (stderr, "STAT: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
		//fprintf (stderr, "STAT: current statistics %s %s %ld.%.6ld %ld %ld %ld %ld %ld %d\n",  name_from, name_to,(long) current_time.tv_sec,(long)current_time.tv_usec, (long) ptcb->thru_stat_bytes, (long) ptcb->thru_stat_min, (long) ptcb->thru_stat_max, (long) ptcb->thru_stat_sum, (long) ptcb->thru_stat_sum2, (int) ptcb->thru_stat_count );
	}

	//---

	if (ptcb->thru_pkts+1 >= thru_interval) {

		/* compute stats for this interval */
		etime = elapsed(ptcb->thru_firsttime,current_time);

		//Oana---
		//etime_secs = etime / 1000000.0;
		//etime_usecs = 1000000 * (etime/1000000.0 - (double)etime_secs);
		//fprintf(stdout,"etime %lf %lu %.6lu\n",etime, etime_secs, etime_usecs);
		//---

		if (etime == 0.0)
			etime = 1000;	/* ick, what if "no time" has passed?? */
		thruput = (double) ptcb->thru_bytes / ((double) etime / 1000000.0);

		/* instantaneous plot */

		//Oana--- comment the output in many files
		if (!timeseries) {
			extend_line(ptcb->thru_inst_line,
					current_time, (int) thruput);
		} else {
			fprintf (mytputfile, "%s %s %lu.%.6lu %d red\n", name_from, name_to,
					(long)current_time.tv_sec, (long)current_time.tv_usec,
					(int) thruput);
		}

		/* compute stats for connection lifetime */
		etime = elapsed(ptcb->ptp->first_time,current_time);
		if (etime == 0.0)
			etime = 1000;	/* ick, what if "no time" has passed?? */
		thruput = (double) ptcb->data_bytes / ((double) etime / 1000000.0);

		/* long-term average */
		//Oana--- comment the output in many files
		if (!timeseries){
			extend_line(ptcb->thru_avg_line,
					current_time, (int) thruput);
		} else {
			fprintf (mytputfile, "%s %s %lu.%.6lu %d blue\n", name_from, name_to,
					(long)current_time.tv_sec, (long)current_time.tv_usec,
					(int) thruput);
			ptcb->thru_debug= thruput;
		}
		/* reset stats for this interval */
		ptcb->thru_firsttime = current_time;
		ptcb->thru_pkts = 0;
		ptcb->thru_bytes = 0;
	}

	/* immediate value in yellow ticks */
	if (plot_tput_instant) {
		etime = elapsed(ptcb->thru_lasttime,current_time);
		if (etime == 0.0)
			etime = 1000;	/* ick, what if "no time" has passed?? */
		thruput = (double) nbytes / ((double) etime / 1000000.0);

		//Oana--- comment the output in many files
		if (!timeseries) {
			plotter_temp_color(ptcb->thru_plotter,"yellow");
			plotter_dot(ptcb->thru_plotter,
					current_time, (int) thruput);
		} else {
			fprintf (mytputfile, "%s %s %lu.%.6lu %d %d yellow\n", name_from, name_to,
					(long)current_time.tv_sec, (long)current_time.tv_usec,
					(int) thruput, (int)nbytes);
		}
	}

	/* add in the latest packet */
			ptcb->thru_lasttime = current_time;
			++ptcb->thru_pkts;
			ptcb->thru_bytes += nbytes;

}



//void
//DoUDPThru(
//		ucb *pup,
//		int nbytes)
//{
//	double etime;
//	u_long etime_secs;
//	u_long etime_usecs;
//	double thruput;
//	char *myname, *hisname;
//	char *name_from, *name_to;
//
////	if (dir == A2B) {
////		thisdir  = &pup_save->a2b;
////		otherdir = &pup_save->b2a;
////	    } else {
////		thisdir  = &pup_save->b2a;
////		otherdir = &pup_save->a2b;
////	    }
//
////	    if (thisdir == &thisdir->ptp->a2b) {
////	    	name_from = thisdir->ptp->a_endpoint;
////	    	name_to = thisdir->ptp->b_endpoint;
////	    } else {
////	    	name_from = thisdir->ptp->b_endpoint;
////	    	name_to = thisdir->ptp->a_endpoint;
////	    }
//
//
////	if (pup == &pup->a2b) {
////		name_from = &pup->a2b;
////		name_to = &pup->b2a;
////	} else {
////		name_from = &pup->b2a;
////		name_to = &pup->a2b;
////	}
//
//	/* if no data, then nothing to do */
//	//Oana - if not commented, it does not calculate statistics till the end of the flow
//	//if (nbytes == 0)
//	//	return;
//
//	/* init, if not already done */
//	if (ZERO_TIME(&pup->thru_firsttime)) {
//		char title[210];
//
//		pup->thru_firsttime = current_time;
//		pup->thru_lasttime = current_time;
//		pup->thru_pkts = 1;
//		pup->thru_bytes = nbytes;
//
//		//Oana--
//		pup->thru_bin_firsttime = current_time.tv_sec;
//		//pup->thru_bin_lasttime = current_time;
//		pup->thru_bin_pkts = 1;
//		pup->thru_bin_bytes = nbytes;
//
//		pup->thru_stat_firsttime = current_time;
//		//pup->thru_stat_lasttime = current_time;
//		pup->thru_stat_pkts = 1;
//		pup->thru_stat_bytes = nbytes;
//		pup->thru_stat_count = 0;
//		fprintf (stderr, "BIN STAT: first packet %s %s %lu.%.6lu %d bin test end \n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
//
//		//---
//
//		//fprintf (mytputfile, "current packet %s %s %lu %d\n", name_from, name_to, current_time.tv_sec,(int) nbytes);
//		//Oana--- comment the output in many files
//
//		return;
//	}
//
//	/* see if we should output the stats yet */
//
//	//Oana--- compute the throughout per bin (one second)
//	//TODO - add here a parameter to customize bins
//	//fprintf (mytputfile, "current packet %s %s %lu %d\n", name_from, name_to, current_time.tv_sec,(int) nbytes);
//	if (current_time.tv_sec >= pup->thru_bin_firsttime+1) {
//		//print statistics for the previous bin
//		fprintf (mytputfile, "BIN: %s %s %lu %lu\n", name_from, pup, pup->thru_bin_firsttime, pup->thru_bin_bytes);
//		fprintf (stderr, "BIN: %s %s %lu %lu\n", name_from, name_to, pup->thru_bin_firsttime, pup->thru_bin_bytes);
//
//		//update statistics for the new bin
//		pup->thru_bin_firsttime = current_time.tv_sec;
//		pup->thru_bin_pkts = 1;
//		pup->thru_bin_bytes = nbytes;
//		fprintf (stderr, "BIN: asd %s %s %lu.%.6lu %lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, pup->thru_bin_firsttime);
//		fprintf (stderr, "BIN: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
//
//	}
//	else {
//		++pup->thru_bin_pkts;
//		pup->thru_bin_bytes += nbytes;
//		fprintf (stderr, "BIN: asd %s %s %lu.%.6lu %lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, pup->thru_bin_firsttime);
//		fprintf (stderr, "BIN: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
//		fprintf (stderr, "BIN: current statistics %s %s %ld.%.6ld %ld  \n",  name_from, name_to,(long) current_time.tv_sec,(long)current_time.tv_usec, (long) pup->thru_bin_bytes);
//	}
//
//	struct timeval sec;
//	sec.tv_sec=1;
//	sec.tv_usec=0;
//
//	fprintf (stderr, "STATDEBUG: %s %s %ld.%.6ld %ld.%.6ld %d\n", name_from, name_to, (long)current_time.tv_sec, (long) current_time.tv_usec, (long) tvAdd(pup->thru_stat_firsttime,sec).tv_sec,  (long)tvAdd(pup->thru_stat_firsttime,sec).tv_usec,tvCompare(current_time,tvAdd(pup->thru_stat_firsttime,sec)));
//
//
//	if (tvCompare(current_time,tvAdd(pup->thru_stat_firsttime,sec)) != -1) {
//
//		//fprintf (stderr, "STAT: %ld.%.6ld %ld.%.6ld\n",current_time.tv_sec,current_time.tv_usec, tvAdd(pup->thru_stat_firsttime,1.0).tv_sec, tvAdd(pup->thru_stat_firsttime,1.0).tv_usec);
//		// print the statistics from the last bin
//		//fprintf (stderr, "STAT: %s %s %lu.%.6lu %lu\n", name_from, name_to, (long) pup->thru_stat_firsttime.tv_sec, (long) pup->thru_stat_firsttime.tv_usec, pup->thru_stat_bytes);
//
//		if ((pup->thru_stat_min == 0) || (pup->thru_stat_min > pup->thru_stat_bytes))
//			pup->thru_stat_min = pup->thru_stat_bytes;
//
//		if (pup->thru_stat_max < pup->thru_stat_bytes)
//			pup->thru_stat_max = pup->thru_stat_bytes;
//
//		pup->thru_stat_sum += pup->thru_stat_bytes;
//		pup->thru_stat_sum2 += pup->thru_stat_bytes * pup->thru_stat_bytes;
//
//		struct  timeval difference;
//		difference=tvSubtract(current_time,pup->thru_stat_firsttime);
//		if (difference.tv_sec < 2)
//		{
//			++pup->thru_stat_count;
//			pup->thru_stat_firsttime = tvAdd(pup->thru_stat_firsttime,sec);
//		}
//		else
//		{
//			pup->thru_stat_min = 1;
//			pup->thru_stat_count += (long) difference.tv_sec;
//			struct  timeval dif;
//			dif.tv_sec=difference.tv_sec;
//			dif.tv_usec=0;
//			pup->thru_stat_firsttime = tvAdd(pup->thru_stat_firsttime,dif);
//			fprintf(stderr,"STAT: diff %s %s %ld.%.6ld\n",  name_from, name_to, (long) difference.tv_sec, (long) difference.tv_usec);
//		}
//
//		fprintf (stderr, "STAT OUT: %s %s %ld.%.6ld %ld %ld %ld %ld %ld %d\n",  name_from, name_to,  (long) pup->thru_stat_firsttime.tv_sec, (long) pup->thru_stat_firsttime.tv_usec, (long) pup->thru_stat_bytes, (long) pup->thru_stat_min, (long) pup->thru_stat_max, (long) pup->thru_stat_sum, (long) pup->thru_stat_sum2, (int) pup->thru_stat_count );
//
//		// the current bin will start at this second
//		// the microseconds are the same so we can count from the beginning of the connenction
//		//pup->thru_stat_firsttime = tvAdd(pup->thru_stat_firsttime,1);
//		//pup->thru_stat_firsttime.tv_sec = current_time.tv_sec;
//
//
//		pup->thru_stat_pkts = 1;
//		pup->thru_stat_bytes = nbytes;
//		fprintf (stderr, "STAT: asd %s %s %lu.%.6lu %lu.%.6lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, (long)pup->thru_stat_firsttime.tv_sec, (long)pup->thru_stat_firsttime.tv_usec);
//		fprintf (stderr, "STAT: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
//
//	}
//	else {
//		++pup->thru_stat_pkts;
//		pup->thru_stat_bytes += nbytes;
//		fprintf (stderr, "STAT: asd %s %s %lu.%.6lu %lu.%.6lu\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec, (long)pup->thru_stat_firsttime.tv_sec, (long)pup->thru_stat_firsttime.tv_usec);
//		fprintf (stderr, "STAT: current packet %s %s %lu.%.6lu %d\n", name_from, name_to, (long)current_time.tv_sec,(long)current_time.tv_usec,(int) nbytes);
//		//fprintf (stderr, "STAT: current statistics %s %s %ld.%.6ld %ld %ld %ld %ld %ld %d\n",  name_from, name_to,(long) current_time.tv_sec,(long)current_time.tv_usec, (long) pup->thru_stat_bytes, (long) pup->thru_stat_min, (long) pup->thru_stat_max, (long) pup->thru_stat_sum, (long) pup->thru_stat_sum2, (int) pup->thru_stat_count );
//	}
//
//	//---
//
//	if (pup->thru_pkts+1 >= thru_interval) {
//
//		/* compute stats for this interval */
//		etime = elapsed(pup->thru_firsttime,current_time);
//
//		//Oana---
//		//etime_secs = etime / 1000000.0;
//		//etime_usecs = 1000000 * (etime/1000000.0 - (double)etime_secs);
//		//fprintf(stdout,"etime %lf %lu %.6lu\n",etime, etime_secs, etime_usecs);
//		//---
//
//		if (etime == 0.0)
//			etime = 1000;	/* ick, what if "no time" has passed?? */
//		thruput = (double) pup->thru_bytes / ((double) etime / 1000000.0);
//
//		/* instantaneous plot */
//
//		//Oana--- comment the output in many files
//
//			fprintf (mytputfile, "%s %s %lu.%.6lu %d red\n", name_from, name_to,
//					(long)current_time.tv_sec, (long)current_time.tv_usec,
//					(int) thruput);
//
//
//		/* compute stats for connection lifetime */
//		etime = elapsed(pup->first_time,current_time);
//		if (etime == 0.0)
//			etime = 1000;	/* ick, what if "no time" has passed?? */
//		thruput = (double) pup->data_bytes / ((double) etime / 1000000.0);
//
//		/* long-term average */
//		//Oana--- comment the output in many files
//
//			fprintf (mytputfile, "%s %s %lu.%.6lu %d blue\n", name_from, name_to,
//					(long)current_time.tv_sec, (long)current_time.tv_usec,
//					(int) thruput);
//			pup->thru_debug= thruput;
//
//		/* reset stats for this interval */
//		pup->thru_firsttime = current_time;
//		pup->thru_pkts = 0;
//		pup->thru_bytes = 0;
//	}
//
//	/* immediate value in yellow ticks */
//	if (plot_tput_instant) {
//		etime = elapsed(pup->thru_lasttime,current_time);
//		if (etime == 0.0)
//			etime = 1000;	/* ick, what if "no time" has passed?? */
//		thruput = (double) nbytes / ((double) etime / 1000000.0);
//
//		//Oana--- comment the output in many files
//
//			fprintf (mytputfile, "%s %s %lu.%.6lu %d %d yellow\n", name_from, name_to,
//					(long)current_time.tv_sec, (long)current_time.tv_usec,
//					(int) thruput, (int)nbytes);
//
//	}
//
//	/* add in the latest packet */
//			pup->thru_lasttime = current_time;
//			++pup->thru_pkts;
//			pup->thru_bytes += nbytes;
//
//}
