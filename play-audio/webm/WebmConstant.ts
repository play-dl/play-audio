
export enum DataType { master, string, uint, binary, float }

export const DataReturn = {
    string : (buf : Buffer) => buf.toString('utf-8'),
    uint : (buf : Buffer) => parseInt(buf.toString('hex'), 16),
    float : (buf : Buffer) => parseFloat(buf.toString('utf-8')),
}

export type DataReturnType = (buf : Buffer) => string | number

export interface EBML {
    version? : number
    readVersion? : number
    maxIDLength? : number
    maxSizeWidth? : number
    docType? : string
    docTypeVersion? : number
    docTypeReadVersion? : number
}

export interface Seek {
    position? : number
}

export type SeekHead = Seek[]

export interface Info {
    duration? : number
    muxingApp? : string
    writingApp? : string
}

export type Tracks = TracksEntry[]

export interface TracksEntry {
    trackNumber? : number
    trackType? : number
    codecID? : string
    audio? : Audio
}

export interface Audio {
    rate? : number
    channels? : number
    bitDepth? : number
}

export interface CuePoint {
    time? : number
    track? : number
    position? : number
}

export type Cues = CuePoint[]

export interface Cluster { time? : number }

export interface Segment {
    seekHead? : SeekHead
    info? : Info
    tracks? : Tracks
    cues? : Cues
    cluster? : Cluster
}

export interface ElementsData {
    name : string
    type : DataType
    return?: DataReturnType
}

export type ElementsDataType = { [key : string] : ElementsData }


export const WebmElements: ElementsDataType = {
    "1a45dfa3" : {name : "ebml", type : DataType.master},
    "4286" : {name : "ebmlVersion", type : DataType.uint, return : DataReturn.uint},
    "42f7" : {name : "ebmlReadVersion", type : DataType.uint, return : DataReturn.uint},
    "42f2" : {name : "ebmlMaxIDLength", type : DataType.uint, return : DataReturn.uint},
    "42f3" : {name : "ebmlMaxSizeLength", type : DataType.uint, return : DataReturn.uint},
    "4282" : {name : "docType", type : DataType.string, return : DataReturn.string},
    "4287" : {name : "docTypeVersion", type : DataType.uint, return : DataReturn.uint},
    "4285" : {name : "docTypeReadVersion", type : DataType.uint, return : DataReturn.uint},
    "18538067" : {name : "segment", type : DataType.master},
    "114d9b74" : {name : "seekHead", type : DataType.master},
    "4dbb" : {name : "seek", type : DataType.master},
    "53ab" : {name: 'seekId', type: DataType.binary},
    "53ac" : {name: 'seekPosition', type: DataType.uint, return : DataReturn.uint},
    "1549a966" : {name : "info", type : DataType.master},
    "4489" : {name : "duration", type : DataType.float, return : DataReturn.float},
    "4d80" : {name : "muxingApp", type : DataType.string, return : DataReturn.string},
    "5741" : {name : "writingApp", type : DataType.string, return : DataReturn.string},
    "1f43b675" : {name : "cluster", type : DataType.master},
    "e7" : {name : "clusterTimecode", type : DataType.uint, return : DataReturn.uint},
    "a3" : {name : "simpleBlock", type : DataType.binary},
    "1654ae6b" : {name : "tracks", type : DataType.master},
    "ae" : {name : "trackEntry", type : DataType.master},
    "d7" : {name : "trackNumber", type: DataType.uint, return: DataReturn.uint},
    "83" : {name: 'trackType', type : DataType.uint, return : DataReturn.uint},
    "86" : {name : "codecID", type : DataType.string, return : DataReturn.string},
    "e1" : {name : "audio", type : DataType.master},
    "b5" : {name : "samplingFrequency", type : DataType.float, return : DataReturn.float},
    "9f" : {name : "channels", type : DataType.uint, return : DataReturn.uint},
    "6264" : {name : "bitDepth", type : DataType.uint, return : DataReturn.uint},
    "1c53bb6b" : {name : "cues", type : DataType.master},
    "bb" : {name : "cuePoint", type : DataType.master},
    "b3" : {name : "cueTime", type : DataType.uint , return : DataReturn.uint},
    "b7" : {name : "cueTrackPositions", type : DataType.master},
    "f7" : {name : "cueTrack", type : DataType.uint, return : DataReturn.uint},
    "f1" : {name : "cueClusterPosition", type : DataType.uint, return : DataReturn.uint},
}