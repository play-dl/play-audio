import { Duplex, DuplexOptions } from "stream";
import { DataType, WebmElements } from "./WebmConstant";
import { WebmHeader } from "./WebmHeader";



export class WebmDemuxer extends Duplex {
    remaining? : Buffer
    chunk? : Buffer
    cursor : number
    header : WebmHeader
    headfound : boolean
    private data_size : number
    private data_length : number

    constructor(options : DuplexOptions){
        super(options)
        this.cursor = 0
        this.header = new WebmHeader()
        this.headfound = false
        this.data_length = 0
        this.data_size = 0
    }

    private get vint_length(): number{
        let i = 0;
		for (; i < 8; i++){
			if ((1 << (7 - i)) & this.chunk![this.cursor])
				break;
		}
		return ++i;
    }

    private get vint_value(): boolean {
        if (!this.chunk) return false
        const length = this.vint_length
        if(this.chunk.length < this.cursor + length) return false
        let value = this.chunk[this.cursor] & ((1 << (8 - length)) - 1)
        for (let i = this.cursor + 1; i < this.cursor + length; i++) value = (value << 8) + this.chunk[i];
        this.data_size = length
        this.data_length = value
        return true
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
        const tag = this.readTag()
        
        if( tag instanceof Error) done(tag)
        else done()
    }

    private readTag(){
        if (!this.chunk) return new Error("Chunk is missing")
        
        while(this.chunk.length > this.cursor ){
            const oldCursor = this.cursor
            const id = this.vint_length
            if(this.chunk.length < this.cursor + id) break;

            const ebmlID = this.parseEbmlID(this.chunk.slice(this.cursor, this.cursor + id).toString('hex'))
            this.cursor += id
            const vint = this.vint_value

            if(!vint) {
                this.cursor = oldCursor
                break;
            }
            if(!ebmlID){
                this.cursor += this.data_size + this.data_length
                continue;
            }
            
            if(!this.headfound){
                if(ebmlID.name === "ebml") this.headfound = true
                else return new Error("Failed to find EBML ID at start of stream.")
            }

            const data = this.chunk.slice(this.cursor + this.data_size, this.cursor + this.data_size + this.data_length)
            const parse = this.header.parse(ebmlID, data)
            if(parse instanceof Error) return parse

            if(ebmlID.type === DataType.master) {
                this.cursor += this.data_size
                continue;
            }

            if(this.chunk.length < this.cursor + this.data_size + this.data_length) {
                this.cursor = oldCursor;
                break;
            }
            else this.cursor += this.data_size + this.data_length

            if(ebmlID.name === 'simpleBlock'){
                const track = this.header.segment.tracks![this.header.audioTrack]
                if(!track || track.trackType !== 2) return new Error("No audio Track in this webm file.")
                if((data[0] & 0xf) === track.trackNumber) this.push(data.slice(4))
            }
        }
        this.remaining = this.chunk.slice(this.cursor)
        this.cursor = 0
    }

    private parseEbmlID(ebmlID : string){
        if(Object.keys(WebmElements).includes(ebmlID)) return WebmElements[ebmlID]
        else return false
    }

    _destroy(error : Error | null, callback : (error : Error | null) => void) : void {
        this.cleanup()
        callback(error);
    }

    _final(callback: (error?: Error | null) => void): void {
        this.cleanup();
        this.push(null)
        callback();
    }
}