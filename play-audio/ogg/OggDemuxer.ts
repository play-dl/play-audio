import { Duplex, DuplexOptions } from 'stream';

const OGG_PAGE_HEADER_SIZE = 26;
const OGG_VERSION = 0;

const OGGS_HEADER = Buffer.from('OggS');
const OPUS_HEAD = Buffer.from('OpusHead');
const OPUS_TAGS = Buffer.from('OpusTags');

interface OggHeader {
    pageSegments: number;
    sizes: number[];
    totalSize: number;
}

type ParseResult = Error | Buffer | false;

export class OggDemuxer extends Duplex {
    private remaining?: Buffer;
    private opus_head?: Buffer;
    private ogg_head?: OggHeader;

    constructor(options?: DuplexOptions) {
        super(options);
    }

    public _read() {}

    public _write(chunk: Buffer, _: BufferEncoding, done: (error?: Error) => void) {
        if (this.remaining) {
            chunk = Buffer.concat([this.remaining, chunk]);
            this.remaining = undefined;
        }

        while (true) {
            const result = this.readOggPage(chunk);
            if (result) {
                if (result instanceof Error) done(result);
                else chunk = result;
            } else break;
        }

        this.remaining = chunk;
        this.ogg_head = undefined;
        done();
    }

    private readOggPage(chunk: Buffer): ParseResult {
        if (!this.ogg_head) {
            const result_head = this.readOggHead(chunk);
            if (!result_head) return false;
            if (result_head instanceof Error) return result_head;
            return this.readOggData(result_head);
        } else return this.readOggData(chunk);
    }

    private readOggData(chunk: Buffer): ParseResult {
        if (!this.ogg_head) return false;
        if (chunk.length < this.ogg_head.totalSize) return false;

        let start = 0;
        for (const size of this.ogg_head.sizes) {
            const segment = chunk.slice(start, start + size);
            if (this.opus_head) {
                if (size >= 8 && segment.compare(OPUS_TAGS, 0, 8, 0, 8) === 0) this.emit('tags', segment);
                else this.push(segment);
            } else if (segment.compare(OPUS_HEAD, 0, 8, 0, 8) === 0) {
                this.emit('head', segment);
                this.opus_head = segment;
            } else return new Error('Unknown Segment Found');
            start += size;
        }
        this.ogg_head = undefined;
        return chunk.slice(start);
    }

    private readOggHead(chunk: Buffer): ParseResult {
        if (chunk.length < OGG_PAGE_HEADER_SIZE) return false;
        if (chunk.compare(OGGS_HEADER, 0, 4, 0, 4) !== 0) return new Error('Capture Pattern is not OggS');
        if (chunk.readUInt8(4) !== OGG_VERSION) return new Error(`OGG version is not equal to 0.`);

        if (chunk.length < 27) return false;
        const pageSegments = chunk.readUInt8(26);
        if (chunk.length < 27 + pageSegments) return false;
        const table = chunk.slice(27, 27 + pageSegments);

        const sizes: number[] = [];
        let totalSize = 0;

        for (let i = 0; i < pageSegments; ) {
            let size = 0;
            let x = 255;
            while (x === 255) {
                if (i >= table.length) return false;
                x = table.readUInt8(i);
                i++;
                size += x;
            }
            sizes.push(size);
            totalSize += size;
        }
        this.ogg_head = {
            sizes: sizes,
            totalSize: totalSize,
            pageSegments: pageSegments
        };
        return chunk.slice(27 + pageSegments);
    }

    public _destroy(err: Error | null, callback: (error: Error | null) => void): void {
        this._cleanup();
        callback(err);
    }

    public _final(callback: (error?: Error) => void): void {
        this._cleanup();
        this.push(null);
        callback();
    }

    public _cleanup() {
        this.remaining = undefined;
        this.opus_head = undefined;
        this.ogg_head = undefined;
    }
}
