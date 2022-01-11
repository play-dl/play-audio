export function writeVint(value: number): Buffer | Error {
    if (value < 0 || value > 2 ** 53) {
        return new Error(`Unrepresentable value: ${value}`);
    }

    let length = 1;
    for (length = 1; length <= 8; length++) {
        if (value < 2 ** (7 * length) - 1) {
            break;
        }
    }

    const buffer = Buffer.alloc(length);
    for (let i = 1; i <= length; i++) {
        const b = value & 0xff;
        buffer[length - i] = b;
        value -= b;
        value /= 2 ** 8;
    }
    buffer[0] |= 1 << (8 - length);

    return buffer;
}
