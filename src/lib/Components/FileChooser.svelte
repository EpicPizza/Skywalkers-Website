<script lang=ts>
    import Add from "$lib/Batteries/Add.svelte";
import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import { uploader } from "$lib/Upload/helpers";
    import type { Warning } from "$lib/stores";
    import { error } from "@sveltejs/kit";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Progress from "./Progress.svelte";
    import { slide } from "svelte/transition";
    import { flip } from "svelte/animate";
    import {filesize} from "filesize";

    export let files: string[] = [];
    export let old: { name: string, description: string, remove: boolean, image: string }[] = [];

    let warning = getContext('warning') as Writable<Warning | undefined>;

    let draggingover = false;
    let filepicker: HTMLInputElement;

    const uploads = uploader();

    function drophandler(event: DragEvent) {
        if(event.dataTransfer?.items) {
            [...event.dataTransfer.items].forEach((item, i) => {
                if(item.kind === 'file') {
                    const file = item.getAsFile();

                    if(file) {
                        uploadFile(file);
                    }
                }
            })
        } else if(event.dataTransfer?.files) {
            [...event.dataTransfer.files].forEach((file, i) => {
                uploadFile(file);
            })
        }
    }

    function selectHandler(event: Event) {
        if(event.target && 'files' in event.target) {
            [...event.target.files as File[]].forEach((file, i) => {
                uploadFile(file);
            })
        }
    }

    async function uploadFile(file: File) {
        draggingover = false;

        const upload = await uploads.upload(file);

        if(upload) {
            warning.set({
                color: 'red',
                message: upload,
            })
        }
    } 
    
    $: {
        let ids = [] as string[];
        
        for(let i = 0; i < $uploads.length; i++) {
            if($uploads[i].finished) {
                ids.push($uploads[i].id);
            }
        }

        files = ids;
    }   
</script>

<div on:drop|preventDefault={drophandler} on:dragover|preventDefault={() => {}} on:dragenter={() => { draggingover = true; }} on:dragleave={() => { draggingover = false; }} class="border-border-light dark:border-border-dark border-[1px] rounded-xl p-4 transition-all bg-blue-500 {draggingover ? "outline-2 outline outline-blue-500 -outline-offset-1 bg-opacity-10" : "outline-4 outline outline-transparent -outline-offset-1 bg-opacity-0"}">
    <div class="flex flex-col items-center py-4">
        <p class="text-xl opacity-75 mb-1">Drop Files Here</p>
        <button on:click|preventDefault={() => { filepicker.click(); }} class="opacity-75">or upload a file</button>
    </div>
    {#if !($uploads.length == 0 && old.length == 0)}
        <Line class="mb-2 mt-4"></Line>
    {/if}
    <div class="flex flex-col gap-3 {!($uploads.length == 0 && old.length == 0) ? "mb-1 mt-4" : ""}">
        {#if old.length != 0}
            {#each old as attachment}
                <div class="flex items-center {attachment.remove ? "opacity-50" : "opacity-100"}">
                    <Icon scale=1.5rem class="mx-2 mr-3" icon={attachment.image == 'true' ? 'image' : 'draft'}></Icon>
                    <div class="w-[calc(100%-2.75rem)]">
                        <div class="flex items-center justify-between">
                            <p class="max-w-[80%] whitespace-nowrap overflow-hidden overflow-ellipsis">{attachment.name}</p>
                            <div class="flex items-center gap-1">
                                <button on:click|preventDefault={() => { attachment.remove = !attachment.remove }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                    {#if attachment.remove}
                                        <Icon scale=0.9rem icon=add></Icon>
                                    {:else}
                                        <Icon scale=0.9rem icon=delete></Icon>
                                    {/if}
                                </button>
                            </div>
                        </div>
                        <p class="text-xs opacity-75">{attachment.description}</p>
                    </div>
                </div>
            {/each}
        {/if}
        {#each $uploads as upload (upload.id)}
            <div animate:flip class="flex items-center">
                <Icon scale=1.5rem class="mx-2 mr-3" icon={upload.type.image ? 'image' : 'draft'}></Icon>
                <div class="w-[calc(100%-2.75rem)]">
                    <div class="flex items-center justify-between">
                        <p class="max-w-[80%] whitespace-nowrap overflow-hidden overflow-ellipsis">{upload.name}</p>
                        <div class="flex items-center gap-1">
                            {#if upload.error}
                                {#if upload.error.type == 'allow-refresh'}
                                    <button on:click={() => { uploads.abort(upload.id); uploads.upload(upload.file); uploads.remove(upload.id); }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                        <Icon scale=0.9rem icon=refresh></Icon>
                                    </button>
                                {:else}
                                    <button on:click={() => { uploads.remove(upload.id); }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                        <Icon scale=0.9rem icon=close></Icon>
                                    </button>
                                {/if}
                            {:else if !upload.finished}
                                {#if upload.uploading}
                                    <button on:click={() => { uploads.pause(upload.id); }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                        <Icon scale=0.9rem icon=pause></Icon>
                                    </button>
                                {:else}
                                    <button on:click={() => { uploads.pause(upload.id); }}  class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                        <Icon scale=0.9rem icon=play_arrow></Icon>
                                    </button>
                                {/if}
                                <button on:click={() => { uploads.abort(upload.id); uploads.remove(upload.id); }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                    <Icon scale=0.9rem icon=close></Icon>
                                </button>
                            {:else}
                                <button on:click={() => { uploads.remove(upload.id); }} class="w-6 h-6 bg-black dark:bg-white rounded-full transition-all bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center justify-around">
                                    <Icon scale=0.9rem icon=delete></Icon>
                                </button>
                            {/if}
                        </div>
                    </div>
                    {#if upload.finished}
                        <p class="text-xs opacity-75">{upload.type.ext} - {filesize(upload.size, {standard: "jedec"})}</p>
                    {:else if upload.error}
                        <p class="text-xs text-red-500">{upload.error.message}</p>
                    {:else}
                        <Progress progress={upload.progress}></Progress>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>
<input on:change={selectHandler} hidden bind:this={filepicker} type=file multiple/> <!--Used to bring up file dialog.-->