import { IncomingMessage } from 'node:http';
import { RequestOptions, request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { createGunzip } from 'node:zlib';
import os from 'node:os';
import fs from 'fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import process from 'node:process';


let FFMPEG_COMMAND: string | undefined = undefined

interface FFmpegDownloadOptions {
    path?: string;
    debug?: boolean;
    force?: boolean;
}

interface FFmpegOptions {
    input?: string | Readable;
    args?: string[];
}

export async function ffmpeg(options: FFmpegOptions = {}) {
    const platform = os.platform()
    let args = options.args || [];
    args.unshift('-i', typeof options.input === 'string' ? options.input : '-');
    
    if (!FFMPEG_COMMAND)
    throw new Error(
        'You forgot to initialize FFMPEG. Try using await initializeFFmpeg() before using this function.'
        );
    let command = FFMPEG_COMMAND
    if (FFMPEG_COMMAND === 'npx') args.unshift(`ffmpeg${platform === "win32" ? ".exe" : ''}`);

    args.push('pipe:1');
    const ffmpegprocess = spawn(command, args, { shell: true, windowsHide: true });
    if (options.input instanceof Readable) options.input.pipe(ffmpegprocess.stdin)
    return ffmpegprocess.stdout;
}

export async function ffmpeg_download(options: FFmpegDownloadOptions = {}) {
    if (!options.path) options.path = './node_modules/.bin/';
    if (fs.existsSync(options.path)) fs.mkdirSync(options.path, { recursive: true });

    const arch = os.arch();
    const platform = os.platform();

    const real_path = resolve(options.path, `ffmpeg${platform === "win32" ? ".exe" : ''}`);
    if (fs.existsSync(real_path) && !options.force) {
        process.stdout.write(`You already have ffmpeg installed at ${real_path}\n`);
        return;
    }
    let response = await https_getter('https://github.com/play-dl/play-audio/releases/latest');
    const release_id = response.headers.location?.split('tag/')[1];

    response = await https_getter(
        `https://github.com/play-dl/play-audio/releases/download/${release_id}/ffmpeg-${platform}-${arch}.${
            platform === 'win32' ? 'exe.gz' : 'gz'
        }`
    );
    if (response.statusCode! > 400) {
        process.stdout.write(
            `We don't currently support your platform and architecture. \nIf you want support for ffmpeg static build, create a issue at play-audio repository with following logs.\nPlatform : ${platform}\nArch : ${arch}\n`
        );
        return;
    } else if (response.statusCode! > 300) response = await https_getter(response.headers.location!);
    const write = fs.createWriteStream(real_path);
    response.pipe(createGunzip()).pipe(write);
    if (options.debug === true) {
        const length: number = parseInt(response.headers['content-length']!) - 1;
        let bytes: number = 0;
        response.on('data', (x: Buffer) => {
            bytes += x.length;
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`FFmpeg Download status : ${((bytes / length) * 100).toFixed(0)} %`);
        });
    }
    write.once('finish', () => {
        fs.chmodSync(real_path, '755');
        process.stdout.write('\n');
    });
}

interface RequestOpts extends RequestOptions {
    body?: string;
    method?: 'GET' | 'POST' | 'HEAD';
    cookies?: boolean;
    cookieJar?: { [key: string]: string };
}

function https_getter(req_url: string, options: RequestOpts = {}): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
        const s = new URL(req_url);
        options.method ??= 'GET';
        const req_options: RequestOptions = {
            host: s.hostname,
            path: s.pathname + s.search,
            headers: options.headers ?? {},
            method: options.method
        };

        const req = httpsRequest(req_options, resolve);
        req.on('error', (err) => {
            reject(err);
        });
        if (options.method === 'POST') req.write(options.body);
        req.end();
    });
}


export async function initializeFFmpeg(preference?: "npx" | "global" | "local"): Promise<boolean> {
    const platform = os.platform();
    let command = `ffmpeg${platform === "win32" ? ".exe" : ''}`, args: string[] = []
    switch(preference){
        case "npx":
            args = [command]
            command = 'npx'
            break

        case "local":
            const paths = [resolve(`./node_modules/.bin/${command}`), resolve(`../node_modules/.bin/${command}`)]
            if(fs.existsSync(paths[0])) command = paths[0]
            else if(fs.existsSync(paths[1])) command = paths[1]
            else return false
            break

        case undefined:
            const result = await initializeFFmpeg("local")
            if(result === false) return initializeFFmpeg("global")
            else return true 
    }
    args.push('-h')
    const ffmpegprocess = spawn(command, args, { shell : true, windowsHide: true })
    return new Promise((res) => {
        ffmpegprocess.once('close', (code) => {
            if(code === 0) {
                FFMPEG_COMMAND = command
                res(true)
            }
            else res(false)
        })
    })
}