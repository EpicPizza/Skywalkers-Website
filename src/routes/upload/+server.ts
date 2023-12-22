import { addChunk } from "$lib/Upload/helpers.server.js";
import { error, json, text } from "@sveltejs/kit";
import { z } from "zod";
import { Readable, Writable } from 'node:stream';

export async function POST({ request }) {
    console.log(process.memoryUsage().heapUsed);

    const chunks = z.coerce.number().parse(request.headers.get('uploader-chunks-total'));
    const chunkNumber = z.coerce.number().parse(request.headers.get('uploader-chunk-number'));
    const name = z.coerce.string().parse(request.headers.get('uploader-file-name'));
    const id = z.coerce.number().parse(request.headers.get('uploader-file-id')).toString();

    const chunk = request.body;

    if(!chunk) throw error(400);

    const readable = Readable.fromWeb(chunk as any);

    try {
        await addChunk({ chunks: chunks, id: id, name: name },  { number: chunkNumber, content: readable });
    } catch(e: any) {
        if('type' in e && e.type == "display") {
            console.log(e);

            throw error(400, e.message);
        } else {
            console.log(e);

            throw error(400);
        }
    }

    console.log(process.memoryUsage().heapUsed);

    if(chunks == chunkNumber - 1) {
        return new Response(id, { status: 200 });
    } else {
        return new Response(undefined, { status: 204 });
    }
}