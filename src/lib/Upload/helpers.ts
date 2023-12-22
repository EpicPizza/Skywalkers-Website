import { isImage } from '$lib/Meetings/meetings';
//@ts-ignore
import HugeUploader from 'huge-uploader';
import { extension, lookup } from 'mime-types';
import { cubicIn, cubicInOut } from 'svelte/easing';
import { tweened, type Tweened } from 'svelte/motion';
//no types :(
import { get, writable } from 'svelte/store';

interface Upload {
    name: string,
    size: number,
    progress: Tweened<number>,
    type: {
        ext: string,
        mime: string, 
        image: boolean,
    },
    error: false | {
        message: string,
        type: 'allow-refresh' | 'disallow'
    },
    finished: boolean,
    uploading: boolean,
    id: string,
    uploader: any,
    file: File,
}

//const { subscribe, set, update } = writable<Upload>({ name: file.name, size: file.size, type: {... type, image: attachmentHelpers.isImage(type.mime) }, error: false, progress: 0, finished: false, uploading: false, id: undefined });

export function uploader() {
    const { subscribe, set, update } = writable<Upload[]>([])

    async function upload(file: File) {
        const ext = extension(file.type);

        const progress = tweened(0, {
            duration: 500,
            easing: cubicInOut,
        })

        let type = { mime: file.type, ext: ext ? ext : 'txt', image: isImage(file.type) };

        if(file.size > 200000000) {
            return "File exceeds 100 MB upload limit.";
        }

        if(file.name.length > 100) {
            return "File name exceeds 100 character limit.";
        }


        if(get({ subscribe }).length > 10) {
            return "Exceeded 10 file limit.";
        }

        const upload = new HugeUploader({
            endpoint: "/upload",
            file: file,
            chunkSize: 5,
            headers: {
                "uploader-file-name": file.name,
            }
        });

        let id = upload.headers["uploader-file-id"] as string;

        upload.on('error', (error: { detail: any; }) => {
            console.log(error);

            update((n) => {
                for(let i = 0; i < n.length; i++) {
                    if(n[i].id == id) {
                        n[i].error = {
                            message: "Upload Failed",
                            type: 'allow-refresh'
                        };
                    }
                }

                return n;
            })
        });

        upload.on('progress', (progress: { detail: any; }) => {
            update((n) => {
                for(let i = 0; i < n.length; i++) {
                    if(n[i].id == id) {
                        n[i].progress.set(parseInt(progress.detail) / 100);
                    }
                }

                return n;
            })

            if(progress.detail == "100") {
                setTimeout(() => {
                    update((n) => {
                        for(let i = 0; i < n.length; i++) {
                            if(n[i].id == id) {
                                n[i].finished = true;
                            }
                        }
        
                        return n;
                    })
                }, 500)
            }
        });

        update((n) => {
            if(type == undefined) return n;

            n.push({ 
                name: file.name,
                size: file.size, 
                type: {... type, image: isImage(type.mime) }, 
                error: false, 
                progress: progress, 
                finished: false, 
                uploading: true, 
                id: id, 
                uploader: upload,
                file: file,
            });

            return n;
        })
    }

    function pause(id: string) {
        update((n) => {
            for(let i = 0; i < n.length; i++) {
                if(n[i].id == id) {
                    n[i].uploading = n[i].uploading ? false : true;
                    n[i].uploader.togglePause();
                }
            }

            return n;
        })
    }

    function abort(id: string) {
        update((n) => {
            for(let i = 0; i < n.length; i++) {
                if(n[i].id == id) {
                    if(n[i].uploading) {
                        n[i].uploader.togglePause();
                    }

                    n[i].uploading = false;
                }
            }

            return n;
        })
    }

    function remove(id: string) {
        update((n) => {
            for(let i = 0; i < n.length; i++) {
                if(n[i].id == id) {
                    n.splice(i, 1);

                    return n;
                }
            }

            return n;
        })
    }

    return {
        subscribe,
        pause: pause,
        abort: abort,
        upload: upload,
        remove: remove,
    }
}