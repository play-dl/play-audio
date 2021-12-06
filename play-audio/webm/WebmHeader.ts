import { EBML, ElementsData, Segment } from "./WebmConstant";


export class WebmHeader {
    ebml : EBML
    segment : Segment
    audioTrack : number

    constructor(){
        this.ebml = {}
        this.segment = {}
        this.audioTrack = -1
    }

    parse (ebmlID : ElementsData, chunk : Buffer){
        
        switch (ebmlID.name) {
            case "ebml" :
                this.ebml = {}
                break;

            case "ebmlVersion":
                if(ebmlID.return) this.ebml.version = ebmlID.return(chunk) as number
                break;

            case "ebmlReadVersion":
                if(ebmlID.return) this.ebml.readVersion = ebmlID.return(chunk) as number
                break;

            case "ebmlMaxIDLength" :
                if(ebmlID.return) this.ebml.maxIDLength = ebmlID.return(chunk) as number
                break;

            case "ebmlMaxSizeLength" :
                if(ebmlID.return) this.ebml.maxSizeWidth = ebmlID.return(chunk) as number
                break;
            
            case "docType" :
                if(ebmlID.return) {
                    const doctype = ebmlID.return(chunk) as string
                    if (doctype !== 'webm') return new Error("This is not a Webm Stream. [ DocType !== webm ]")
                    else this.ebml.docType = doctype
                }
                break;
            
            case "docTypeVersion" :
                if(ebmlID.return) this.ebml.docTypeVersion = ebmlID.return(chunk) as number
                break;

            case "docTypeReadVersion" :
                if(ebmlID.return) this.ebml.docTypeReadVersion = ebmlID.return(chunk) as number
                break;

            case "segment" :
                this.segment = {}
                break

            case "seekHead" :
                this.segment.seekHead = []
                break

            case "seekPosition" :
                if(ebmlID.return)
                this.segment.seekHead!.push({ position : ebmlID.return(chunk) as number })
                break

            case "info" :
                this.segment.info = {}
                break
            
            case "duration" :
                if(ebmlID.return) this.segment.info!.duration = ebmlID.return(chunk) as number
                break

            case "muxingApp" :
                if(ebmlID.return) this.segment.info!.muxingApp = ebmlID.return(chunk) as string
                break

            case "writingApp" :
                if(ebmlID.return) this.segment.info!.writingApp = ebmlID.return(chunk) as string
                break

            case "cluster" :
                this.segment.cluster = {}
                break

            case "clusterTimecode" :
                if(ebmlID.return) this.segment.cluster!.time = ebmlID.return(chunk) as number
                break

            case "simpleBlock" :
                break;

            case "tracks" :
                this.segment.tracks = []
                break

            case "trackEntry" :
                this.segment.tracks!.push({})
                break

            case "trackNumber" :
                if(ebmlID.return)
                    this.segment.tracks![this.segment.tracks!.length - 1].trackNumber = ebmlID.return(chunk) as number
                break
            
            case "trackType" :
                if(ebmlID.return){
                    const type = ebmlID.return(chunk) as number
                    if(type === 2) this.audioTrack = this.segment.tracks!.length - 1
                    this.segment.tracks![this.segment.tracks!.length - 1].trackType = type
                }
                break

            case "codecID" :
                if(ebmlID.return){
                    const codec = ebmlID.return(chunk) as string
                    if(codec !== 'A_OPUS' && this.segment.tracks![this.segment.tracks!.length - 1].trackType === 2) 
                        return new Error("Audio Codec is not OPUS")
                    this.segment.tracks![this.segment.tracks!.length - 1].codecID = codec
                }
                break

            case "audio" :
                this.segment.tracks![this.segment.tracks!.length - 1].audio = {}
                break

            case "samplingFrequency" :
                if(ebmlID.return)
                    this.segment.tracks![this.segment.tracks!.length - 1].audio!.rate = ebmlID.return(chunk) as number
                break

            case "channels" :
                if(ebmlID.return)
                    this.segment.tracks![this.segment.tracks!.length - 1].audio!.channels = ebmlID.return(chunk) as number
                break

            case "bitDepth" :
                if(ebmlID.return)
                    this.segment.tracks![this.segment.tracks!.length - 1].audio!.bitDepth = ebmlID.return(chunk) as number
                break

            case "cues" :
                this.segment.cues = []
                break

            case "cuePoint" :
                this.segment.cues!.push({})
                break

            case "cueTime" :
                if(ebmlID.return)
                    this.segment.cues![this.segment.cues!.length - 1].time = ebmlID.return(chunk) as number
                break

            case "cueTrack" :
                if(ebmlID.return)
                    this.segment.cues![this.segment.cues!.length - 1].track = ebmlID.return(chunk) as number
                break
            
            case "cueClusterPosition" :
                if(ebmlID.return)
                    this.segment.cues![this.segment.cues!.length - 1].position = ebmlID.return(chunk) as number
                break
            
            default :
                break
        }

    }
}