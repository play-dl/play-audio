import { Duplex, DuplexOptions } from "stream";
import { readVint } from "./tools";
import { DataType, EBML, elements, ElementsData, Segment } from "./WebmConstant";
import { WebmHeader } from "./WebmHeader";

interface Metadata {
    ebml? : EBML,
    segment? : Segment
}

export class WebmDemuxer extends Duplex {
    remaining? : Buffer
    chunk? : Buffer
    cursor : number
    header : WebmHeader

    constructor(options : DuplexOptions){
        super(options)
        this.cursor = 0
        this.header = new WebmHeader()
    }

    get vint_length(): number{
        if (this.chunk) return (8 - Math.floor(Math.log2(this.chunk[this.cursor])))
        else return -1
    }

    get vint_value(): { length : number, value : number } {
        if (!this.chunk) return { length : -1, value : -1 }
        const length = this.vint_length
        if(this.chunk.length < this.cursor + length) return { length, value : -1 }
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
        while(this.chunk.length < this.cursor ){
            const oldCursor = this.cursor
            const idLength = this.vint_length

            if(this.chunk.length < this.cursor + idLength) break;

            const ebmlID = this.parseEbmlID(this.chunk.slice(this.cursor, this.cursor + idLength).toString('hex'))

            this.cursor += idLength
            const { length : sizeData, value : dataLength } = this.vint_value
            if( dataLength === -1 ) {
                this.cursor = oldCursor
                break;
            }
            this.cursor += sizeData
            const data = this.chunk.slice(this.cursor, this.cursor + dataLength)
            if(!ebmlID) {
                this.cursor += dataLength;
                continue;
            }
            this.header.parse(ebmlID, data)
            if(ebmlID.type !== DataType.master) this.cursor += dataLength
            
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

   