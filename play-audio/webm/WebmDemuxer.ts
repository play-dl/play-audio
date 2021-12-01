import { Duplex, DuplexOptions } from "stream";
import { readVint } from "./tools";
import { EBML, elements, Segment } from "./WebmConstant";

interface Metadata {
    ebml : EBML,
    segment : Segment
}

export class WebmDemuxer extends Duplex {
    remaining? : Buffer
    chunk? : Buffer
    cursor : number
    metadata? : Partial<Metadata>
    headfound : boolean

    constructor(options : DuplexOptions){
        super(options)
        this.cursor = 0
        this.metadata = {}
        this.headfound = false
    }

    get vint_length(): number{
        if (this.chunk) return (8 - Math.floor(Math.log2(this.chunk[this.cursor])))
        else return -1
    }

    get vint_value(): { length : number, value : number } {
        if (!this.chunk) return { length : -1, value : -1 }
        const length = this.vint_length
        if(this.chunk.length < this.cursor + length) return { length : -1, value : -1 }
        let value = this.chunk[this.cursor] & ((1 << (8 - length)) - 1)
        for (let i = this.cursor + 1; i < this.cursor + length; i++) value = (value << 8) + this.chunk[i];
        return { length, value }
    }

    cleanup(){
        this.cursor = 0
        this.chunk = undefined
        this.remaining = undefined
    }

    _read() {}

    _write(chunk: Buffer, _: BufferEncoding, done: (error?: Error | null) => void): void{
        if (this.remaining) {
            this.chunk = Buffer.concat([this.remaining, chunk])
            this.remaining = undefined
        }
        else this.chunk = chunk
        
        
    }

    private readTag(){
        if (!this.chunk) return new Error("Chunk is missing")
        while(this.chunk.length <= this.cursor ){
            const idLength = this.vint_length
            if(idLength === -1) return new Error("Chunk is missing")
            if(this.chunk.length <= this.cursor) break;
            const ebmlID = this.parseEbmlID(this.chunk.slice(this.cursor, this.cursor + idLength).toString('hex'))
            if(!this.headfound){
                if(!ebmlID) return new Error("Didn't Found EBML Tag at start of stream.")
                else if(ebmlID.name === "ebml") this.headfound = true
                else new Error("Wrong EBML ID at start of stream.")
            }
            this.cursor += idLength
            const { length : sizeData, value : DataLength } = this.vint_value
            if( sizeData === -1 || DataLength === -1 ) {

            }
        }

        this.remaining = this.chunk.slice(0, this.cursor)
    }

    private parseEbmlID(ebmlID : string){
        if(Object.keys(elements).includes(ebmlID)) return elements[ebmlID]
        else return false
    }

    _destroy(error : Error | null, callback : (error : Error | null) => void) : void {
        this.cleanup()
        callback(error);
    }

    _final(callback: (error?: Error | null) => void): void {
        this.cleanup();
        callback();
    }
}

   