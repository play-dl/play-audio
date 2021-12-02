import { EBML, ElementsData, Segment } from "./WebmConstant";


export class WebmHeader {
    ebml : EBML
    segment : Segment
    headfound : boolean

    constructor(){
        this.ebml = {}
        this.segment = {}
        this.headfound = false
    }

    parse (ebmlID : ElementsData, chunk : Buffer){
        if(!this.headfound){
            if(!ebmlID) return new Error("Didn't Found EBML Tag at start of stream.")
            else if(ebmlID.name === "ebml") this.headfound = true
            else new Error("Wrong EBML ID at start of stream.")
            return;
        }

        switch (ebmlID.name) {
            case "ebmlVersion":
                if(ebmlID.return) {
                    this.ebml.version = ebmlID.return(chunk) as number
                    break;
                }
                else return false

            case "ebmlReadVersion":
                if(ebmlID.return) {
                   this.ebml.readVersion = ebmlID.return(chunk) as number
                   break;
                }
                else return false

            case "ebmlMaxIDLength" :
                if(ebmlID.return) {
                    this.ebml.maxIDLength = ebmlID.return(chunk) as number
                    break;
                }
                else return false

            case "ebmlMaxSizeLength" :
                if(ebmlID.return) {
                    this.ebml.maxSizeWidth = ebmlID.return(chunk) as number
                    break;
                }
                else return false
            
            case "docType" :
                if(ebmlID.return) {
                    const doctype = ebmlID.return(chunk) as string
                    if (doctype !== 'webm') return new Error("DocType is not equal to Webm")
                    else this.ebml.docType = doctype
                    break;
                }
                else return false
            
            case "" :
        }
    }
}