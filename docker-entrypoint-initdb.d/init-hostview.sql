--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE activities (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    user_name character varying(260),
    pid integer,
    name character varying(260),
    description character varying(260),
    fullscreen smallint,
    idle smallint,
    logged_at timestamp without time zone,
    finished_at timestamp without time zone
);


ALTER TABLE public.activities OWNER TO hostview;

--
-- Name: activities_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE activities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.activities_id_seq OWNER TO hostview;

--
-- Name: activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE activities_id_seq OWNED BY activities.id;


--
-- Name: activity_io; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE activity_io (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    name character varying(260),
    description character varying(260),
    idle smallint,
    pid integer,
    logged_at timestamp without time zone,
    finished_at timestamp without time zone,
    io_activity integer
);


ALTER TABLE public.activity_io OWNER TO hostview;

--
-- Name: browser_activity; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE browser_activity (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    browser character varying(1024),
    location character varying(1024),
    logged_at timestamp without time zone
);


ALTER TABLE public.browser_activity OWNER TO hostview;

--
-- Name: browser_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE browser_activity_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.browser_activity_id_seq OWNER TO hostview;

--
-- Name: browser_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE browser_activity_id_seq OWNED BY browser_activity.id;


--
-- Name: connections; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE connections (
    id bigint NOT NULL,
    location_id bigint,
    session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    guid character varying(260),
    friendly_name character varying(260),
    description character varying(260),
    dns_suffix character varying(260),
    mac character varying(64),
    ips text[],
    gateways text[],
    dnses text[],
    t_speed bigint,
    r_speed bigint,
    wireless smallint,
    profile character varying(64),
    ssid character varying(64),
    bssid character varying(64),
    bssid_type character varying(20),
    phy_type character varying(20),
    phy_index integer,
    channel integer
);


ALTER TABLE public.connections OWNER TO hostview;

--
-- Name: connections_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE connections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.connections_id_seq OWNER TO hostview;

--
-- Name: connections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE connections_id_seq OWNED BY connections.id;


--
-- Name: device_info; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE device_info (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    manufacturer character varying(100),
    product character varying(100),
    operating_system character varying(100),
    cpu character varying(100),
    memory_installed bigint,
    hdd_capacity bigint,
    serial_number character varying(100),
    hostview_version character varying(32),
    settings_version character varying(100),
    timezone character varying(32),
    timezone_offset bigint,
    logged_at timestamp without time zone
);


ALTER TABLE public.device_info OWNER TO hostview;

--
-- Name: device_info_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE device_info_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.device_info_id_seq OWNER TO hostview;

--
-- Name: device_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE device_info_id_seq OWNED BY device_info.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE devices (
    id bigint NOT NULL,
    device_id character varying(260) UNIQUE,
    created_at timestamp without time zone DEFAULT now(),
    user_id bigint,
    secret_token character varying(100)
);


ALTER TABLE public.devices OWNER TO hostview;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO hostview;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE devices_id_seq OWNED BY devices.id;


--
-- Name: dns_logs; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE dns_logs (
    id bigint NOT NULL,
    connection_id bigint NOT NULL,
    type integer,
    ip character varying(260),
    host character varying(260),
    protocol integer,
    source_ip inet,
    destination_ip inet,
    source_port integer,
    destination_port integer,
    logged_at timestamp without time zone
);


ALTER TABLE public.dns_logs OWNER TO hostview;

--
-- Name: dns_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE dns_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.dns_logs_id_seq OWNER TO hostview;

--
-- Name: dns_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE dns_logs_id_seq OWNED BY dns_logs.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE files (
    id bigint NOT NULL,
    device_id bigint,
    folder character varying(260),
    basename character varying(260),
    status character varying(100),
    error_info character varying(260),
    hostview_version character varying(260),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.files OWNER TO hostview;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE files_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.files_id_seq OWNER TO hostview;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE files_id_seq OWNED BY files.id;


--
-- Name: http_logs; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE http_logs (
    id bigint NOT NULL,
    connection_id bigint NOT NULL,
    http_verb character varying(64),
    http_verb_param character varying(2000),
    http_status_code character varying(64),
    http_host character varying(2000),
    referer character varying(2000),
    content_type character varying(2000),
    content_length character varying(2000),
    protocol integer,
    source_ip inet,
    destination_ip inet,
    source_port integer,
    destination_port integer,
    logged_at timestamp without time zone
);


ALTER TABLE public.http_logs OWNER TO hostview;

--
-- Name: http_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE http_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.http_logs_id_seq OWNER TO hostview;

--
-- Name: http_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE http_logs_id_seq OWNED BY http_logs.id;


--
-- Name: io; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE io (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    device integer,
    pid integer,
    name character varying(260),
    logged_at timestamp without time zone
);


ALTER TABLE public.io OWNER TO hostview;

--
-- Name: io_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE io_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.io_id_seq OWNER TO hostview;

--
-- Name: io_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE io_id_seq OWNED BY io.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE locations (
    id bigint NOT NULL,
    public_ip character varying(100),
    reverse_dns character varying(100),
    asn_number character varying(100),
    asn_name character varying(100),
    country_code character varying(100),
    city character varying(100),
    latitude character varying(100),
    longitude character varying(100)
);


ALTER TABLE public.locations OWNER TO hostview;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.locations_id_seq OWNER TO hostview;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE locations_id_seq OWNED BY locations.id;


--
-- Name: netlabels; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE netlabels (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    guid character varying(260),
    gateway text,
    label character varying(260),
    logged_at timestamp without time zone
);


ALTER TABLE public.netlabels OWNER TO hostview;

--
-- Name: netlabels_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE netlabels_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.netlabels_id_seq OWNER TO hostview;

--
-- Name: netlabels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE netlabels_id_seq OWNED BY netlabels.id;


--
-- Name: pcap; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap (
    id bigint NOT NULL,
    connection_id bigint NOT NULL,
    status character varying(100),
    error_info character varying(260),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pcap OWNER TO hostview;

--
-- Name: pcap_events; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap_events (
    id bigint NOT NULL,
    pcap_id bigint NOT NULL,
    flow_id bigint,
    direction text,
    "time" timestamp without time zone,
    type character varying(6),
    seq bigint
);


ALTER TABLE public.pcap_events OWNER TO hostview;

--
-- Name: pcap_events_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE pcap_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pcap_events_id_seq OWNER TO hostview;

--
-- Name: pcap_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE pcap_events_id_seq OWNED BY pcap_events.id;


--
-- Name: pcap_file; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap_file (
    pcap_id bigint NOT NULL,
    file_id bigint NOT NULL,
    file_order integer NOT NULL
);


ALTER TABLE public.pcap_file OWNER TO hostview;

--
-- Name: pcap_flow; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap_flow (
    id bigint NOT NULL,
    pcap_id bigint NOT NULL,
    flow_code text,
    source_ip inet,
    source_port integer,
    destination_ip inet,
    destination_port integer,
    protocol character varying(2),
    first_packet timestamp without time zone,
    last_packet timestamp without time zone,
    status text,
    total_time double precision,
    total_packets integer,
    idle_time_ab double precision,
    idle_time_ba double precision,
    bytes_ab bigint,
    bytes_ba bigint
);


ALTER TABLE public.pcap_flow OWNER TO hostview;

--
-- Name: pcap_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE pcap_flow_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pcap_flow_id_seq OWNER TO hostview;

--
-- Name: pcap_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE pcap_flow_id_seq OWNED BY pcap_flow.id;


--
-- Name: pcap_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE pcap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pcap_id_seq OWNER TO hostview;

--
-- Name: pcap_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE pcap_id_seq OWNED BY pcap.id;


--
-- Name: pcap_rtt; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap_rtt (
    id bigint NOT NULL,
    pcap_id bigint NOT NULL,
    flow_id bigint,
    direction text,
    "time" timestamp without time zone,
    rtt double precision,
    seq bigint
);


ALTER TABLE public.pcap_rtt OWNER TO hostview;

--
-- Name: pcap_rtt_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE pcap_rtt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pcap_rtt_id_seq OWNER TO hostview;

--
-- Name: pcap_rtt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE pcap_rtt_id_seq OWNED BY pcap_rtt.id;


--
-- Name: pcap_throughput; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE pcap_throughput (
    id bigint NOT NULL,
    pcap_id bigint NOT NULL,
    flow_id bigint,
    direction text,
    "time" timestamp without time zone,
    value double precision
);


ALTER TABLE public.pcap_throughput OWNER TO hostview;

--
-- Name: pcap_throughput_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE pcap_throughput_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pcap_throughput_id_seq OWNER TO hostview;

--
-- Name: pcap_throughput_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE pcap_throughput_id_seq OWNED BY pcap_throughput.id;


--
-- Name: ports; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE ports (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    pid integer,
    name character varying(260),
    protocol integer,
    source_ip inet,
    destination_ip inet,
    source_port integer,
    destination_port integer,
    state integer,
    logged_at timestamp without time zone
);


ALTER TABLE public.ports OWNER TO hostview;

--
-- Name: ports_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE ports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ports_id_seq OWNER TO hostview;

--
-- Name: ports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE ports_id_seq OWNED BY ports.id;


--
-- Name: power_states; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE power_states (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    event character varying(100),
    value integer,
    logged_at timestamp without time zone
);


ALTER TABLE public.power_states OWNER TO hostview;

--
-- Name: power_states_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE power_states_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.power_states_id_seq OWNER TO hostview;

--
-- Name: power_states_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE power_states_id_seq OWNED BY power_states.id;


--
-- Name: processes; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE processes (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    pid integer,
    name character varying(260),
    memory integer,
    cpu double precision,
    logged_at timestamp without time zone
);


ALTER TABLE public.processes OWNER TO hostview;

--
-- Name: processes_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE processes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.processes_id_seq OWNER TO hostview;

--
-- Name: processes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE processes_id_seq OWNED BY processes.id;


--
-- Name: processes_running; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE processes_running (
    device_id bigint NOT NULL,
    session_id bigint NOT NULL,
    process_name character varying(260),
    process_running integer,
    session_running integer,
    started_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.processes_running OWNER TO hostview;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE sessions (
    id bigint NOT NULL,
    file_id bigint,
    device_id bigint,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    start_event character varying(260),
    stop_event character varying(260)
);


ALTER TABLE public.sessions OWNER TO hostview;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO hostview;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE sessions_id_seq OWNED BY sessions.id;


--
-- Name: survey_problem_tags; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE survey_problem_tags (
    id bigint NOT NULL,
    survey_id bigint NOT NULL,
    process_name character varying(260),
    process_desc character varying(260),
    tags text[]
);


ALTER TABLE public.survey_problem_tags OWNER TO hostview;

--
-- Name: survey_problem_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE survey_problem_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.survey_problem_tags_id_seq OWNER TO hostview;

--
-- Name: survey_problem_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE survey_problem_tags_id_seq OWNED BY survey_problem_tags.id;


--
-- Name: survey_activity_tags; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE survey_activity_tags (
    id bigint NOT NULL,
    survey_id bigint NOT NULL,
    process_name character varying(260),
    process_desc character varying(260),
    tags text[]
);


ALTER TABLE public.survey_activity_tags OWNER TO hostview;

--
-- Name: survey_activity_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE survey_activity_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.survey_activity_tags_id_seq OWNER TO hostview;

--
-- Name: survey_activity_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE survey_activity_tags_id_seq OWNED BY survey_activity_tags.id;


--
-- Name: surveys; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE surveys (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    ondemand smallint,
    qoe_score smallint,
    duration integer,
    started_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.surveys OWNER TO hostview;

--
-- Name: surveys_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE surveys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.surveys_id_seq OWNER TO hostview;

--
-- Name: surveys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE surveys_id_seq OWNED BY surveys.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(260) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO hostview;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO hostview;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: video_buffered_play_time_sample; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_buffered_play_time_sample (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    logged_at timestamp without time zone,
    current_video_playtime double precision,
    buffered_minus_current double precision
);


ALTER TABLE public.video_buffered_play_time_sample OWNER TO hostview;

--
-- Name: TABLE video_buffered_play_time_sample; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_buffered_play_time_sample IS 'A sample of the current video playtime and the current amount of video in the buffer.';


--
-- Name: COLUMN video_buffered_play_time_sample.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffered_play_time_sample.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_buffered_play_time_sample.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffered_play_time_sample.video_session_id IS 'Foreign key to the video_session during which this buffered_play_time_sample took place.';


--
-- Name: COLUMN video_buffered_play_time_sample.logged_at; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffered_play_time_sample.logged_at IS 'Named "t" in the JSON. The timestamp when this sample was measured.';


--
-- Name: COLUMN video_buffered_play_time_sample.current_video_playtime; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffered_play_time_sample.current_video_playtime IS 'Named "cvpt" in the JSON. Current video playtime, in sec. It is a sample of videoElement.currentTime property.';


--
-- Name: COLUMN video_buffered_play_time_sample.buffered_minus_current; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffered_play_time_sample.buffered_minus_current IS 'Named "bmc" in the JSON. The duration of video the player could play before stalling, if the connection was lost now. Units: sec. Calculated as buffered_video_play_time -current_video_play_time.';


--
-- Name: video_buffered_play_time_sample_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_buffered_play_time_sample_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_buffered_play_time_sample_id_seq OWNER TO hostview;

--
-- Name: video_buffered_play_time_sample_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_buffered_play_time_sample_id_seq OWNED BY video_buffered_play_time_sample.id;


--
-- Name: video_buffering_event; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_buffering_event (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    type integer,
    ended_by_abort smallint
);


ALTER TABLE public.video_buffering_event OWNER TO hostview;

--
-- Name: TABLE video_buffering_event; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_buffering_event IS 'Models periods of video playback freezing, for buffering.';


--
-- Name: COLUMN video_buffering_event.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffering_event.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_buffering_event.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffering_event.video_session_id IS 'Foreign key to the video_session during which this buffering event happened.';


--
-- Name: COLUMN video_buffering_event.type; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffering_event.type IS 'Encoding: {0:"plain", 1:"startup", 2:"seek"}. A "startup" buffering_event models the time interval between the selection of a video and the video playback start. A "seek" buffering_event models the time interval between the selection of a specific time point of the video and the video playback start. A "plain"-type buffering_event models an automatic playback freezing for buffering (due to bad network conditions).';


--
-- Name: COLUMN video_buffering_event.ended_by_abort; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_buffering_event.ended_by_abort IS 'Indicates if this buffering_event ended together with its video_session, because the user aborted the video. Value encoding: {0:"the buffering_event ended because the video resumed playing", 1:"the buffering event ended because the user aborted the video"}.';


--
-- Name: video_buffering_event_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_buffering_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_buffering_event_id_seq OWNER TO hostview;

--
-- Name: video_buffering_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_buffering_event_id_seq OWNED BY video_buffering_event.id;


--
-- Name: video_off_screen_event; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_off_screen_event (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone
);


ALTER TABLE public.video_off_screen_event OWNER TO hostview;

--
-- Name: TABLE video_off_screen_event; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_off_screen_event IS 'Models periods during which the video playback is going off-screen (i.e., the user activates a different browser tab or minimizes the browser window.';


--
-- Name: COLUMN video_off_screen_event.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_off_screen_event.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_off_screen_event.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_off_screen_event.video_session_id IS 'Foreign key to the video_session during which this off-screen event happened.';


--
-- Name: video_off_screen_event_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_off_screen_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_off_screen_event_id_seq OWNER TO hostview;

--
-- Name: video_off_screen_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_off_screen_event_id_seq OWNED BY video_off_screen_event.id;


--
-- Name: video_pause_event; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_pause_event (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    type integer
);


ALTER TABLE public.video_pause_event OWNER TO hostview;

--
-- Name: TABLE video_pause_event; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_pause_event IS 'Models periods during which the video playback is being paused by the user.';


--
-- Name: COLUMN video_pause_event.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_pause_event.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_pause_event.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_pause_event.video_session_id IS 'Foreign key to the video_session during which this pause event happened.';


--
-- Name: COLUMN video_pause_event.type; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_pause_event.type IS 'Value enocoding: {0:"The user explicitly paused the video playback", 1:"The playback was paused because the user was using the progress bar"}. A "type=2" pause_event tuple is referenced by a seek_event tuple.';


--
-- Name: video_pause_event_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_pause_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_pause_event_id_seq OWNER TO hostview;

--
-- Name: video_pause_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_pause_event_id_seq OWNED BY video_pause_event.id;


--
-- Name: video_playback_quality_sample; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_playback_quality_sample (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    logged_at timestamp without time zone,
    totalvideoframes bigint,
    droppedvideoframes bigint,
    corruptedvideoframes bigint,
    totalframedelay bigint,
    mozparsedframes bigint,
    mozdecodedframes bigint,
    mozpresentedframes bigint,
    mozpaintedframes bigint,
    mozframedelay double precision
);


ALTER TABLE public.video_playback_quality_sample OWNER TO hostview;

--
-- Name: TABLE video_playback_quality_sample; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_playback_quality_sample IS 'A sample of the playback quality (in terms of video frames/sec, dropped, corrupted frames, etc). Rows of this table contain samples of HTML5 video (see https://developer.mozilla.org/en/docs/Web/API/HTMLVideoElement) and VideoPlaybackQuality (See https://developer.mozilla.org/en-US/docs/Web/API/VideoPlaybackQuality) properties.';


--
-- Name: COLUMN video_playback_quality_sample.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_playback_quality_sample.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.video_session_id IS 'Foreign key to the video_session during which this video_playback_quality_sample took place.';


--
-- Name: COLUMN video_playback_quality_sample.logged_at; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.logged_at IS 'Named "t" in the JSON. The timestamp when this sample was measured.';


--
-- Name: COLUMN video_playback_quality_sample.totalvideoframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.totalvideoframes IS 'Named "tvf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.droppedvideoframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.droppedvideoframes IS 'Named "dvf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.corruptedvideoframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.corruptedvideoframes IS 'Named "cvf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.totalframedelay; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.totalframedelay IS 'Named "tfd" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.mozparsedframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.mozparsedframes IS 'Named "mprsf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.mozdecodedframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.mozdecodedframes IS 'Named "mdf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.mozpresentedframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.mozpresentedframes IS 'Named "mpf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.mozpaintedframes; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.mozpaintedframes IS 'Named "mpntf" in the JSON.';


--
-- Name: COLUMN video_playback_quality_sample.mozframedelay; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_playback_quality_sample.mozframedelay IS 'Named "mfd" in the JSON.';


--
-- Name: video_playback_quality_sample_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_playback_quality_sample_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_playback_quality_sample_id_seq OWNER TO hostview;

--
-- Name: video_playback_quality_sample_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_playback_quality_sample_id_seq OWNED BY video_playback_quality_sample.id;


--
-- Name: video_player_size; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_player_size (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    width integer,
    height integer,
    is_full_screen smallint
);


ALTER TABLE public.video_player_size OWNER TO hostview;

--
-- Name: TABLE video_player_size; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_player_size IS 'Models player size change events during a video session.';


--
-- Name: COLUMN video_player_size.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_player_size.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_player_size.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_player_size.video_session_id IS 'Foreign key to the video_session during which this player_size took place.';


--
-- Name: COLUMN video_player_size.width; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_player_size.width IS 'Width of the video element, in CSS pixels.';


--
-- Name: COLUMN video_player_size.height; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_player_size.height IS 'Height of the video element, in CSS pixels.';


--
-- Name: COLUMN video_player_size.is_full_screen; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_player_size.is_full_screen IS 'Value encoding: {0:"The player is not in full-screen mode", 1:"The player is in full-screen mode."}';


--
-- Name: video_player_size_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_player_size_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_player_size_id_seq OWNER TO hostview;

--
-- Name: video_player_size_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_player_size_id_seq OWNED BY video_player_size.id;


--
-- Name: video_resolution; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_resolution (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    res_x integer,
    res_y integer
);


ALTER TABLE public.video_resolution OWNER TO hostview;

--
-- Name: TABLE video_resolution; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_resolution IS 'Models resolution change events during a video session.';


--
-- Name: COLUMN video_resolution.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_resolution.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_resolution.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_resolution.video_session_id IS 'Foreign key to the video_session during which this video_resolution took place.';


--
-- Name: COLUMN video_resolution.res_x; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_resolution.res_x IS 'Resolution of the video in the x-axis dimension, in pixels.';


--
-- Name: COLUMN video_resolution.res_y; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_resolution.res_y IS 'IResolution of the video in the y-axis dimension, in pixels.';


--
-- Name: video_resolution_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_resolution_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_resolution_id_seq OWNER TO hostview;

--
-- Name: video_resolution_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_resolution_id_seq OWNED BY video_resolution.id;


--
-- Name: video_seek_event; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_seek_event (
    id bigint NOT NULL,
    video_session_id bigint NOT NULL,
    buffering_event_id bigint,
    pause_event_id bigint,
    logged_at timestamp without time zone,
    to_video_time double precision
);


ALTER TABLE public.video_seek_event OWNER TO hostview;

--
-- Name: TABLE video_seek_event; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_seek_event IS 'Models events of user navigating to a specific timepoint of playback through the seekbar.';


--
-- Name: COLUMN video_seek_event.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_seek_event.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_seek_event.video_session_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_seek_event.video_session_id IS 'Foreign key to the video_session during which this seek event happened.';


--
-- Name: COLUMN video_seek_event.buffering_event_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_seek_event.buffering_event_id IS 'The seek-type buffering_event related to this seek_event.';


--
-- Name: COLUMN video_seek_event.pause_event_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_seek_event.pause_event_id IS 'The seek-type pause_event related to this seek_event.';


--
-- Name: COLUMN video_seek_event.to_video_time; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_seek_event.to_video_time IS 'The time position of the content where the user moved to, expressed in sec from the begining of the video.';


--
-- Name: video_seek_event_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_seek_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_seek_event_id_seq OWNER TO hostview;

--
-- Name: video_seek_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_seek_event_id_seq OWNED BY video_seek_event.id;


--
-- Name: video_session; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE video_session (
    id bigint NOT NULL,
    file_id bigint,
    session_id bigint NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    service_type integer,
    window_location text,
    current_src text,
    duration double precision,
    title text,
    end_reason integer,
    qoe_score integer
);


ALTER TABLE public.video_session OWNER TO hostview;

--
-- Name: TABLE video_session; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON TABLE video_session IS 'Models a streaming video (e.g., YouTube) playback session.';


--
-- Name: COLUMN video_session.id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.id IS 'Integer auto-increment primary key.';


--
-- Name: COLUMN video_session.file_id; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.file_id IS 'Foreign key to a file tuple. The file tuple provides a foreign key to a device tuple';


--
-- Name: COLUMN video_session.service_type; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.service_type IS 'Encoding: 0:"VOD", 1:"LiveTV", 2:"TSTV", 3:"TVOD".';


--
-- Name: COLUMN video_session.window_location; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.window_location IS 'URL of the web page containing the video.';


--
-- Name: COLUMN video_session.current_src; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.current_src IS 'URL of the video resource.';


--
-- Name: COLUMN video_session.duration; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.duration IS 'The total duration of the video resource. It is _not_ the duration of the video session.';


--
-- Name: COLUMN video_session.title; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.title IS 'Title of the video, parsed from the web page containing it.';


--
-- Name: COLUMN video_session.end_reason; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.end_reason IS 'Indicates how this session was ended. Value encoding: {0:"ended--The video resource sucessfully completed its playback.", 1:"abort--The user aborted the video playback, by refreshing the page or navigating to another page before the video playback was completed.", 2:"error--An error (e.g., network error, video resource not found) caused an abrupt termination of the video playback", 3:"stalled--not used", 4:"suspend--not used"}.';


--
-- Name: COLUMN video_session.qoe_score; Type: COMMENT; Schema: public; Owner: hostview
--

COMMENT ON COLUMN video_session.qoe_score IS 'Integer in {1,2,3,4,5}. Not used. In a future version of the software, a GUI may request users to explicitly provide a QoE score for their video sessions.';


--
-- Name: video_session_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE video_session_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.video_session_id_seq OWNER TO hostview;

--
-- Name: video_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE video_session_id_seq OWNED BY video_session.id;


--
-- Name: wifi_stats; Type: TABLE; Schema: public; Owner: hostview; Tablespace: 
--

CREATE TABLE wifi_stats (
    id bigint NOT NULL,
    session_id bigint NOT NULL,
    guid character varying(260),
    t_speed bigint,
    r_speed bigint,
    signal integer,
    rssi integer,
    state integer,
    logged_at timestamp without time zone
);


ALTER TABLE public.wifi_stats OWNER TO hostview;

--
-- Name: wifi_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: hostview
--

CREATE SEQUENCE wifi_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.wifi_stats_id_seq OWNER TO hostview;

--
-- Name: wifi_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hostview
--

ALTER SEQUENCE wifi_stats_id_seq OWNED BY wifi_stats.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY activities ALTER COLUMN id SET DEFAULT nextval('activities_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY browser_activity ALTER COLUMN id SET DEFAULT nextval('browser_activity_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY connections ALTER COLUMN id SET DEFAULT nextval('connections_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY device_info ALTER COLUMN id SET DEFAULT nextval('device_info_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY devices ALTER COLUMN id SET DEFAULT nextval('devices_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY dns_logs ALTER COLUMN id SET DEFAULT nextval('dns_logs_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY files ALTER COLUMN id SET DEFAULT nextval('files_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY http_logs ALTER COLUMN id SET DEFAULT nextval('http_logs_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY io ALTER COLUMN id SET DEFAULT nextval('io_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY locations ALTER COLUMN id SET DEFAULT nextval('locations_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY netlabels ALTER COLUMN id SET DEFAULT nextval('netlabels_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap ALTER COLUMN id SET DEFAULT nextval('pcap_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_events ALTER COLUMN id SET DEFAULT nextval('pcap_events_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_flow ALTER COLUMN id SET DEFAULT nextval('pcap_flow_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_rtt ALTER COLUMN id SET DEFAULT nextval('pcap_rtt_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_throughput ALTER COLUMN id SET DEFAULT nextval('pcap_throughput_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY ports ALTER COLUMN id SET DEFAULT nextval('ports_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY power_states ALTER COLUMN id SET DEFAULT nextval('power_states_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY processes ALTER COLUMN id SET DEFAULT nextval('processes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY sessions ALTER COLUMN id SET DEFAULT nextval('sessions_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY survey_problem_tags ALTER COLUMN id SET DEFAULT nextval('survey_problem_tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY survey_activity_tags ALTER COLUMN id SET DEFAULT nextval('survey_activity_tags_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY surveys ALTER COLUMN id SET DEFAULT nextval('surveys_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_buffered_play_time_sample ALTER COLUMN id SET DEFAULT nextval('video_buffered_play_time_sample_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_buffering_event ALTER COLUMN id SET DEFAULT nextval('video_buffering_event_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_off_screen_event ALTER COLUMN id SET DEFAULT nextval('video_off_screen_event_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_pause_event ALTER COLUMN id SET DEFAULT nextval('video_pause_event_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_playback_quality_sample ALTER COLUMN id SET DEFAULT nextval('video_playback_quality_sample_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_player_size ALTER COLUMN id SET DEFAULT nextval('video_player_size_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_resolution ALTER COLUMN id SET DEFAULT nextval('video_resolution_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_seek_event ALTER COLUMN id SET DEFAULT nextval('video_seek_event_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_session ALTER COLUMN id SET DEFAULT nextval('video_session_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY wifi_stats ALTER COLUMN id SET DEFAULT nextval('wifi_stats_id_seq'::regclass);


--
-- Name: activities_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: browser_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY browser_activity
    ADD CONSTRAINT browser_activity_pkey PRIMARY KEY (id);


--
-- Name: connections_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: device_info_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY device_info
    ADD CONSTRAINT device_info_pkey PRIMARY KEY (id);


--
-- Name: devices_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: dns_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY dns_logs
    ADD CONSTRAINT dns_logs_pkey PRIMARY KEY (id);


--
-- Name: files_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: http_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY http_logs
    ADD CONSTRAINT http_logs_pkey PRIMARY KEY (id);


--
-- Name: io_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY io
    ADD CONSTRAINT io_pkey PRIMARY KEY (id);


--
-- Name: locations_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: netlabels_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY netlabels
    ADD CONSTRAINT netlabels_pkey PRIMARY KEY (id);


--
-- Name: pcap_events_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap_events
    ADD CONSTRAINT pcap_events_pkey PRIMARY KEY (id);


--
-- Name: pcap_file_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap_file
    ADD CONSTRAINT pcap_file_pkey PRIMARY KEY (pcap_id, file_id);


--
-- Name: pcap_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap_flow
    ADD CONSTRAINT pcap_flow_pkey PRIMARY KEY (id);


--
-- Name: pcap_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap
    ADD CONSTRAINT pcap_pkey PRIMARY KEY (id);


--
-- Name: pcap_rtt_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap_rtt
    ADD CONSTRAINT pcap_rtt_pkey PRIMARY KEY (id);


--
-- Name: pcap_throughput_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY pcap_throughput
    ADD CONSTRAINT pcap_throughput_pkey PRIMARY KEY (id);


--
-- Name: ports_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY ports
    ADD CONSTRAINT ports_pkey PRIMARY KEY (id);


--
-- Name: power_states_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY power_states
    ADD CONSTRAINT power_states_pkey PRIMARY KEY (id);


--
-- Name: processes_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


--
-- Name: sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: survey_problem_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY survey_problem_tags
    ADD CONSTRAINT survey_problem_tags_pkey PRIMARY KEY (id);


--
-- Name: survey_activity_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY survey_activity_tags
    ADD CONSTRAINT survey_activity_tags_pkey PRIMARY KEY (id);


--
-- Name: surveys_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY surveys
    ADD CONSTRAINT surveys_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: video_buffered_play_time_sample_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_buffered_play_time_sample
    ADD CONSTRAINT video_buffered_play_time_sample_pkey PRIMARY KEY (id);


--
-- Name: video_buffering_event_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_buffering_event
    ADD CONSTRAINT video_buffering_event_pkey PRIMARY KEY (id);


--
-- Name: video_off_screen_event_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_off_screen_event
    ADD CONSTRAINT video_off_screen_event_pkey PRIMARY KEY (id);


--
-- Name: video_pause_event_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_pause_event
    ADD CONSTRAINT video_pause_event_pkey PRIMARY KEY (id);


--
-- Name: video_playback_quality_sample_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_playback_quality_sample
    ADD CONSTRAINT video_playback_quality_sample_pkey PRIMARY KEY (id);


--
-- Name: video_player_size_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_player_size
    ADD CONSTRAINT video_player_size_pkey PRIMARY KEY (id);


--
-- Name: video_resolution_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_resolution
    ADD CONSTRAINT video_resolution_pkey PRIMARY KEY (id);


--
-- Name: video_seek_event_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_seek_event
    ADD CONSTRAINT video_seek_event_pkey PRIMARY KEY (id);


--
-- Name: video_session_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY video_session
    ADD CONSTRAINT video_session_pkey PRIMARY KEY (id);


--
-- Name: wifi_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: hostview; Tablespace: 
--

ALTER TABLE ONLY wifi_stats
    ADD CONSTRAINT wifi_stats_pkey PRIMARY KEY (id);


--
-- Name: activities_finished_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_finished_at_idx ON activities USING btree (finished_at);


--
-- Name: activities_idle_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_idle_idx ON activities USING btree (idle);


--
-- Name: activities_logged_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_logged_at_idx ON activities USING btree (logged_at);


--
-- Name: activities_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_name_idx ON activities USING btree (name);


--
-- Name: activities_pid_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_pid_idx ON activities USING btree (pid);


--
-- Name: activities_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activities_session_id_idx ON activities USING btree (session_id);


--
-- Name: activity_io_finished_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_finished_at_idx ON activity_io USING btree (finished_at);


--
-- Name: activity_io_idle_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_idle_idx ON activity_io USING btree (idle);


--
-- Name: activity_io_logged_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_logged_at_idx ON activity_io USING btree (logged_at);


--
-- Name: activity_io_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_name_idx ON activity_io USING btree (name);


--
-- Name: activity_io_pid_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_pid_idx ON activity_io USING btree (pid);


--
-- Name: activity_io_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX activity_io_session_id_idx ON activity_io USING btree (session_id);


--
-- Name: devices_device_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX devices_device_id_idx ON devices USING btree (device_id);


--
-- Name: devices_user_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX devices_user_id_idx ON devices USING btree (user_id);


--
-- Name: files_basename_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX files_basename_idx ON files USING btree (basename);


--
-- Name: files_device_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX files_device_id_idx ON files USING btree (device_id);


--
-- Name: files_status_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX files_status_idx ON files USING btree (status);


--
-- Name: io_logged_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX io_logged_at_idx ON io USING btree (logged_at);


--
-- Name: io_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX io_name_idx ON io USING btree (name);


--
-- Name: io_pid_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX io_pid_idx ON io USING btree (pid);


--
-- Name: io_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX io_session_id_idx ON io USING btree (session_id);


--
-- Name: pcap_connection_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_connection_id_idx ON pcap USING btree (connection_id);


--
-- Name: pcap_events_flow_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_events_flow_id_idx ON pcap_events USING btree (flow_id);


--
-- Name: pcap_events_pcap_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_events_pcap_id_idx ON pcap_events USING btree (pcap_id);


--
-- Name: pcap_events_time_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_events_time_idx ON pcap_events USING btree ("time");


--
-- Name: pcap_file_pcap_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_file_pcap_id_idx ON pcap_file USING btree (pcap_id);


--
-- Name: pcap_flow_first_packet_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_flow_first_packet_idx ON pcap_flow USING btree (first_packet);


--
-- Name: pcap_flow_flow_code_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_flow_flow_code_idx ON pcap_flow USING btree (flow_code);


--
-- Name: pcap_flow_last_packet_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_flow_last_packet_idx ON pcap_flow USING btree (last_packet);


--
-- Name: pcap_flow_pcap_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_flow_pcap_id_idx ON pcap_flow USING btree (pcap_id);


--
-- Name: pcap_rtt_flow_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_rtt_flow_id_idx ON pcap_rtt USING btree (flow_id);


--
-- Name: pcap_rtt_pcap_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_rtt_pcap_id_idx ON pcap_rtt USING btree (pcap_id);


--
-- Name: pcap_rtt_time_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_rtt_time_idx ON pcap_rtt USING btree ("time");


--
-- Name: pcap_status_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_status_idx ON pcap USING btree (status);


--
-- Name: pcap_throughput_flow_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_throughput_flow_id_idx ON pcap_throughput USING btree (flow_id);


--
-- Name: pcap_throughput_pcap_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_throughput_pcap_id_idx ON pcap_throughput USING btree (pcap_id);


--
-- Name: pcap_throughput_time_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX pcap_throughput_time_idx ON pcap_throughput USING btree ("time");


--
-- Name: ports_logged_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX ports_logged_at_idx ON ports USING btree (logged_at);


--
-- Name: ports_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX ports_name_idx ON ports USING btree (name);


--
-- Name: ports_pid_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX ports_pid_idx ON ports USING btree (pid);


--
-- Name: ports_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX ports_session_id_idx ON ports USING btree (session_id);


--
-- Name: processes_logged_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_logged_at_idx ON io USING btree (logged_at);


--
-- Name: processes_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_name_idx ON io USING btree (name);


--
-- Name: processes_pid_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_pid_idx ON io USING btree (pid);


--
-- Name: processes_running_device_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_running_device_id_idx ON processes_running USING btree (device_id);


--
-- Name: processes_running_ended_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_running_ended_at_idx ON processes_running USING btree (ended_at);


--
-- Name: processes_running_process_name_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_running_process_name_idx ON processes_running USING btree (process_name);


--
-- Name: processes_running_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_running_session_id_idx ON processes_running USING btree (session_id);


--
-- Name: processes_running_started_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_running_started_at_idx ON processes_running USING btree (started_at);


--
-- Name: processes_session_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX processes_session_id_idx ON io USING btree (session_id);


--
-- Name: sessions_device_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX sessions_device_id_idx ON sessions USING btree (device_id);


--
-- Name: sessions_ended_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX sessions_ended_at_idx ON sessions USING btree (ended_at);


--
-- Name: sessions_file_id_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX sessions_file_id_idx ON sessions USING btree (file_id);


--
-- Name: sessions_started_at_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX sessions_started_at_idx ON sessions USING btree (started_at);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: hostview; Tablespace: 
--

CREATE INDEX users_username_idx ON users USING btree (username);


--
-- Name: activities_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY activities
    ADD CONSTRAINT activities_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: activity_io_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY activity_io
    ADD CONSTRAINT activity_io_id_fkey FOREIGN KEY (id) REFERENCES activities(id) ON DELETE CASCADE;


--
-- Name: activity_io_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY activity_io
    ADD CONSTRAINT activity_io_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: browser_activity_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY browser_activity
    ADD CONSTRAINT browser_activity_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: connections_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY connections
    ADD CONSTRAINT connections_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id);


--
-- Name: connections_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY connections
    ADD CONSTRAINT connections_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: device_info_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY device_info
    ADD CONSTRAINT device_info_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY devices
    ADD CONSTRAINT devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: dns_logs_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY dns_logs
    ADD CONSTRAINT dns_logs_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE;


--
-- Name: files_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY files
    ADD CONSTRAINT files_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id);


--
-- Name: http_logs_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY http_logs
    ADD CONSTRAINT http_logs_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE;


--
-- Name: io_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY io
    ADD CONSTRAINT io_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: netlabels_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY netlabels
    ADD CONSTRAINT netlabels_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: pcap_connection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap
    ADD CONSTRAINT pcap_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE;


--
-- Name: pcap_events_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_events
    ADD CONSTRAINT pcap_events_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES pcap_flow(id);


--
-- Name: pcap_events_pcap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_events
    ADD CONSTRAINT pcap_events_pcap_id_fkey FOREIGN KEY (pcap_id) REFERENCES pcap(id) ON DELETE CASCADE;


--
-- Name: pcap_file_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_file
    ADD CONSTRAINT pcap_file_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id);


--
-- Name: pcap_file_pcap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_file
    ADD CONSTRAINT pcap_file_pcap_id_fkey FOREIGN KEY (pcap_id) REFERENCES pcap(id) ON DELETE CASCADE;


--
-- Name: pcap_flow_pcap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_flow
    ADD CONSTRAINT pcap_flow_pcap_id_fkey FOREIGN KEY (pcap_id) REFERENCES pcap(id) ON DELETE CASCADE;


--
-- Name: pcap_rtt_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_rtt
    ADD CONSTRAINT pcap_rtt_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES pcap_flow(id);


--
-- Name: pcap_rtt_pcap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_rtt
    ADD CONSTRAINT pcap_rtt_pcap_id_fkey FOREIGN KEY (pcap_id) REFERENCES pcap(id) ON DELETE CASCADE;


--
-- Name: pcap_throughput_flow_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_throughput
    ADD CONSTRAINT pcap_throughput_flow_id_fkey FOREIGN KEY (flow_id) REFERENCES pcap_flow(id);


--
-- Name: pcap_throughput_pcap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY pcap_throughput
    ADD CONSTRAINT pcap_throughput_pcap_id_fkey FOREIGN KEY (pcap_id) REFERENCES pcap(id) ON DELETE CASCADE;


--
-- Name: ports_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY ports
    ADD CONSTRAINT ports_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: power_states_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY power_states
    ADD CONSTRAINT power_states_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: processes_running_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY processes_running
    ADD CONSTRAINT processes_running_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;


--
-- Name: processes_running_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY processes_running
    ADD CONSTRAINT processes_running_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: processes_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY processes
    ADD CONSTRAINT processes_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: sessions_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY sessions
    ADD CONSTRAINT sessions_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices(id);


--
-- Name: sessions_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY sessions
    ADD CONSTRAINT sessions_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id);


--
-- Name: survey_problem_tags_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY survey_problem_tags
    ADD CONSTRAINT survey_problem_tags_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE;


--
-- Name: survey_purpose_tags_survey_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY survey_purpose_tags
    ADD CONSTRAINT survey_purpose_tags_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE;


--
-- Name: surveys_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY surveys
    ADD CONSTRAINT surveys_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id);


--
-- Name: surveys_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY surveys
    ADD CONSTRAINT surveys_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: video_buffered_play_time_sample_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_buffered_play_time_sample
    ADD CONSTRAINT video_buffered_play_time_sample_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_buffering_event_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_buffering_event
    ADD CONSTRAINT video_buffering_event_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_off_screen_event_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_off_screen_event
    ADD CONSTRAINT video_off_screen_event_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_pause_event_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_pause_event
    ADD CONSTRAINT video_pause_event_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_playback_quality_sample_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_playback_quality_sample
    ADD CONSTRAINT video_playback_quality_sample_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_player_size_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_player_size
    ADD CONSTRAINT video_player_size_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_resolution_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_resolution
    ADD CONSTRAINT video_resolution_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_seek_event_buffering_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_seek_event
    ADD CONSTRAINT video_seek_event_buffering_event_id_fkey FOREIGN KEY (buffering_event_id) REFERENCES video_buffering_event(id);


--
-- Name: video_seek_event_pause_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_seek_event
    ADD CONSTRAINT video_seek_event_pause_event_id_fkey FOREIGN KEY (pause_event_id) REFERENCES video_pause_event(id);


--
-- Name: video_seek_event_video_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_seek_event
    ADD CONSTRAINT video_seek_event_video_session_id_fkey FOREIGN KEY (video_session_id) REFERENCES video_session(id) ON DELETE CASCADE;


--
-- Name: video_session_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_session
    ADD CONSTRAINT video_session_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id);


--
-- Name: video_session_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY video_session
    ADD CONSTRAINT video_session_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: wifi_stats_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hostview
--

ALTER TABLE ONLY wifi_stats
    ADD CONSTRAINT wifi_stats_session_id_fkey FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

