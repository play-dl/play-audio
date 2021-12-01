

interface VintReturn{
    length : number
    value : number
}

export function readVint (buffer : Buffer, start : number) : VintReturn | false | Error{
    const length = 8 - Math.floor(Math.log2(buffer[start]))
    if (length > buffer.length) return false;

    if (start + length > buffer.length) return false;
    let value = buffer[start] & ((1 << (8 - length)) - 1);
    for (let i = start + 1; i < start + length; i++) value = (value << 8) + buffer[i];
    return { length , value }
}

// function readVint (buffer , start ) {
//     const length = 8 - Math.floor(Math.log2(buffer[start]))
//     if (length > buffer.length) return false;

//     if (start + length > buffer.length) return false;
//     let value = buffer[start] & ((1 << (8 - length)) - 1);
//     for (let i = start + 1; i < start + length; i++) value = (value << 8) + buffer[i];
//     return { length , value }
// }

// function showStream(chunk) {
//     let offset = 0
//     const result1 = readVint(chunk, offset)
//     offset += result1.length
//     console.log(`Offset : ${offset}`)
//     const result_size = readVint(chunk, offset)
//     console.log(`Size : ${result_size.length}  ||  ${result_size.value}`)
//     offset += result_size.length
// }


export function writeVint(value : number) : Buffer | Error {
    if (value < 0 || value > 2 ** 53) {
        return new Error(`Unrepresentable value: ${value}`);
    }

    let length = 1;
    for (length = 1; length <= 8; length ++) {
        if (value < 2 ** (7 * length) - 1) {
            break;
        }
    }

    const buffer = Buffer.alloc(length);
    for (let i = 1; i <= length; i ++) {
        const b = value & 0xff;
        buffer[length - i] = b;
        value -= b;
        value /= 2 ** 8;
    }
    buffer[0] |= 1 << (8 - length);

    return buffer;
}