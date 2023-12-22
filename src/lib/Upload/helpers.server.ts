import { firebaseAdmin } from "$lib/Firebase/firebase.server";
import { fileTypeFromStream, fileTypeStream, type FileTypeResult } from "file-type";
import { Readable, Transform, Duplex, PassThrough, pipeline } from 'stream';
import CombinedStream from 'combined-stream';
import { extension, lookup } from "mime-types";

interface NewQueue {
    id: string,
    chunks: number,
    name: string,
}

export interface Queue extends NewQueue {
    progress: number,
    type: null | FileTypeResult,
    location: string,
    finished: false,
    timestamp: Date,
}

interface Chunk {
    number: number,
    content: Readable,
}

export async function newQuene(queue: NewQueue) {
    const db = firebaseAdmin.getFirestore();

    const location = crypto.randomUUID();

    const ref = db.collection('uploads').doc(queue.id);

    await ref.set({
        id: queue.id,
        chunks: queue.chunks,
        progress: -1,
        type: null,
        location: location,
        finished: false,
        timestamp: new Date(),
        name: queue.name,
    } satisfies Queue);

    return {
        ...queue,
        progress: -1,
        type: null,
        location: location,
        finished: false,
        timestamp: new Date(),
    } satisfies Queue;
}

export async function finish(queue: Queue) {
    const bucket = firebaseAdmin.getBucket();

    const files = Array<string>();

    for(let i = 0; i < queue.chunks; i++) {
        files.push(`uploads/${queue.location}/${i}`);
    }

    const streams = Array<Readable>();

    for(let i = 0; i < files.length; i++) {
        let [metadata] = (await bucket.file(files[i]).getMetadata());

        let size = metadata.size;

        streams.push(bucket.file(files[i]).createReadStream({ start: 146, end: size - 47  }));
    }

    const combinedStream = CombinedStream.create();

    for(let i = 0; i < streams.length; i++) {
        combinedStream.append(streams[i]);
    }

    const file = `uploads/${queue.location}/complete`

    const typeStream = await fileTypeStream(combinedStream.pipe(new PassThrough()));

    const stream = bucket.file(file).createWriteStream();

    typeStream.pipe(stream);

    await new Promise((resolve) => {
        stream.on('finish', () => {
            resolve(true);
            console.log("resolved");
        }); 
    });

    let type = typeStream.fileType as { ext: string, mime: string } | undefined;

    if(type == undefined) {
        const mime = lookup(queue.name);
        const ext = extension(mime == false ? "text/plain" : mime);

        if(mime != false) {
            type = {
                ext: ext == false ? "txt" : ext,
                mime: mime,
            }
        } else {
            type = {
                ext: "txt",
                mime: "text/plain",
            }
        }
    }

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('uploads').doc(queue.id);

    await ref.update({
        finished: true,
        type: type,
        name: queue.name.length > type.ext.length + 1 ? queue.name.substring(0, queue.name.length - type.ext.length - 1) : queue.name,
    })
}

export async function getQueue(marker: NewQueue) {
    if(marker.name.length > 100) throw { message: "File name too long.", type: "display" };

    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('uploads').doc(marker.id);

    const data = (await ref.get()).data();

    if(data == undefined) {
        return await newQuene(marker);
    }

    return data as Queue;
}

export async function getQueueById(id: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('uploads').doc(id);

    const data = (await ref.get()).data();

    if(data == undefined) {
        return false;
    }

    return data as Queue;
}

export async function addChunk(marker: NewQueue, chunk: Chunk) {
    const queue = await getQueue(marker);
    
    if(queue.chunks > 41) {
        throw { message: "Too many chunks, indicates an above limit file size.", type: "display" };
    }

    if(chunk.number > queue.chunks - 1) {
        throw { message: "Queue mismatch. Try uploading again.", type: "display" };
    }

    const bucket = firebaseAdmin.getBucket();

    const file = `uploads/${queue.location}/${chunk.number}`;

    try {
        const stream = bucket.file(file).createWriteStream();

        const limit = new PassThrough();

        chunk.content.pipe(limit).pipe(stream);

        let count = 0;
        
        await new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(0);

                console.log(count);
            }); 

            limit.on('data', (data: Uint8Array) => {
                count += data.length;
    
                if(count > 5000192) {
                    stream.destroy();
                    limit.destroy();

                    reject(Error("File too big."));
                }
            })
        }); 
    } catch(e) {
        console.log(e);

        throw { message: "Upload failed.", type: "display" }
    }
 
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('uploads').doc(queue.id);

    await ref.update({
        progress: chunk.number,
    });

    if(chunk.number == queue.chunks - 1) {
        await finish(queue);
    }
}

/*

const type = await fileTypeFromBlob(attachments[i] as File);

console.log(type);

if(!type || !attachmentHelpers.checkType(type.mime)) {
    if(type != undefined) {
        return message(form, "Invalid attachment file type.");
    } else {
        const mime = lookup((attachments[i] as File).name);

        if(!mime) {
            return message(form, "Invalid attachment file type.");
        }

        console.log(extension(mime));

        if(attachmentHelpers.checkType(mime) && attachmentHelpers.isSecure(mime)) {
            files.push({file: attachments[i] as File, ext: extension(mime) ? extension(mime) as string : "text/plain", mime: mime})
        } else {
            return message(form, "Invalid attachment file type.");
        }
    }
} else {
    files.push({file: attachments[i] as File, ext: type.ext, mime: type.mime});
}

*/