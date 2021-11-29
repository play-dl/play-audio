import { Duplex, DuplexOptions } from "stream";

const OGG_PAGE_HEADER_SIZE = 26;
const OGG_VERSION = 0;

const OGGS_HEADER = Buffer.from('OggS');
const OPUS_HEAD = Buffer.from('OpusHead');
const OPUS_TAGS = Buffer.from('OpusTags');

interface OggHeader {
    pageSegments : number
    sizes: number[]
    totalSize: number
}

type ParseResult = Error | Buffer | false

export class OggDemuxer extends Duplex {
    private remaining? : Buffer
    private opus_head? : Buffer
    private ogg_head? : OggHeader

    constructor(options?: DuplexOptions ){
        super(options)
    }

    public _read(){}

    public _write(chunk: Buffer, encoding: BufferEncoding, done: (error?: Error) => void) {
        if(this.remaining) {
            chunk = Buffer.concat([this.remaining, chunk])
            this.remaining = undefined
        }

        while (true){
            const result = this.readOggPage(chunk)
            if (result){
                if(result instanceof Error) done(result)
                else chunk = result;
            } 
            else break;
        }

        this.remaining = chunk
        done()
    }

    private readOggPage(chunk : Buffer): ParseResult{
        if(!this.ogg_head) {
            const result_head = this.readOggHead(chunk)
            if (!result_head) return false
            if (result_head instanceof Error) return result_head
            return this.readOggData(result_head)
        }
        else return this.readOggData(chunk)
    }

    private readOggData( chunk : Buffer) : ParseResult {
        if(!this.ogg_head) return false
        if (chunk.length < this.ogg_head.sizes[0] ) return false;

        const size = this.ogg_head.sizes.shift() as number
        const segment = chunk.slice(0, size);

        if (this.opus_head) {
            if (segment.compare(OPUS_TAGS, 0, 8, 0, 8) === 0) this.emit('tags', segment);
			else this.push(segment);
        }
        else if (segment.compare(OPUS_HEAD, 0, 8, 0, 8) === 0) {
            this.emit('head', segment);
            this.opus_head = segment;
        }
        else return new Error("Unknown Segment Found")

        if (this.ogg_head.sizes.length !== 0) return this.readOggData(chunk.slice(size))
        else {
            this.ogg_head = undefined
            return this.readOggPage(chunk)
        }
    }

    private readOggHead(chunk : Buffer) : ParseResult {
        if (chunk.length < OGG_PAGE_HEADER_SIZE) return false
        if (chunk.compare(OGGS_HEADER, 0, 4, 0, 4) !== 0) return new Error("Capture Pattern is not OggS")
        if (chunk.readUInt8(4) !== OGG_VERSION) return new Error(`OGG version is not equal to 0.`)

        if (chunk.length < 27) return false
        const pageSegments = chunk.readUInt8(26)
        if (chunk.length < 27 + pageSegments) return false
        const table = chunk.slice(27, 27 + pageSegments)

        const sizes : number[] = []
        let totalSize = 0

        for(let i = 0; i < pageSegments; i++){
            let size = 0;
            size = table.readUInt8(i);
            totalSize += size
            sizes.push(size)
        }
        if (sizes[sizes.length - 1] > 255) return new Error("Last Lancing Table Value is not less than 255")
        this.ogg_head = {
            sizes : sizes,
            totalSize : totalSize,
            pageSegments : pageSegments
        }
        return chunk.slice( 27 + pageSegments )
    }

    public _destroy(err: Error | null, callback: (error: Error | null) => void): void {
		this._cleanup();
		callback(err);
	}

	public _final(callback: (error?: Error) => void): void {
		this._cleanup();
		callback();
	}

	public _cleanup() {
		this.remaining = undefined;
		this.opus_head = undefined;
		this.ogg_head = undefined;
	}
}