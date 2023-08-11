<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import type { Warning } from "$lib/stores";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";

    export let name: string;

    let warning = getContext('warning') as Writable<Warning | undefined>;

    let files: File[] = [];

    let draggingover = false;
    let filepicker: HTMLInputElement;
    let fileinput: HTMLInputElement;

    function checkType(type: string) {
        switch(type) {
            case 'image/apng':
            case 'image/avif':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/svg+xml':
            case 'image/webp':
            case 'application/pdf':
            case 'text/plain':
            case 'application/json':
            case 'text/csv':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.oasis.opendocument.presentation':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.oasis.opendocument.text':
            case 'text/csv':
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.oasis.opendocument.spreadsheet':
                return true;
            default:
                return false;
        }
    }

    function drophandler(event: DragEvent) {
        if(event.dataTransfer?.items) {
            [...event.dataTransfer.items].forEach((item, i) => {
                if(item.kind === 'file') {
                    const file = item.getAsFile();

                    if(file) {
                        if(checkType(file.type)) {
                            files.push(file);
                        } else {
                            warning.set({
                                message: "Invalid file format.",
                                color: 'red'
                            })
                        }
                    }
                }
            })
        } else if(event.dataTransfer?.files) {
            [...event.dataTransfer.files].forEach((file, i) => {
                if(checkType(file.type)) {
                    files.push(file);
                } else {
                    warning.set({
                        message: "Invalid file format.",
                        color: 'red'
                    })
                }
            })
        }

        files = files;

        const dataTransfer = new DataTransfer();
        for(let i = 0; i < files.length; i++) {
            dataTransfer.items.add(files[i]);
        }
        fileinput.files = dataTransfer.files;

        draggingover = false;
    }

    function selectHandler(event: Event) {
        if(event.target && 'files' in event.target) {
            [...event.target.files as File[]].forEach((file, i) => {
                if(checkType(file.type)) {
                    files.push(file);
                } else {
                    warning.set({
                        message: "Invalid file format.",
                        color: 'red'
                    })
                }
            })
        }

        files = files;

        const dataTransfer = new DataTransfer();
        for(let i = 0; i < files.length; i++) {
            dataTransfer.items.add(files[i]);
        }
        fileinput.files = dataTransfer.files;
    }

    function removeFile(index: number) {
        files.splice(index, 1);

        files = files;

        const dataTransfer = new DataTransfer();
        for(let i = 0; i < files.length; i++) {
            dataTransfer.items.add(files[i]);
        }
        fileinput.files = dataTransfer.files;
    }
</script>

<div on:drop|preventDefault={drophandler} on:dragover|preventDefault={() => {}} on:dragenter={() => { draggingover = true; }} on:dragleave={() => { draggingover = false; }} class="border-border-light dark:border-border-dark border-[1px] rounded-3xl p-4 min-h-[10rem] flex items-center justify-around transition-all bg-blue-500 {draggingover ? "outline-2 outline outline-blue-500 -outline-offset-1 bg-opacity-10" : "outline-4 outline outline-transparent -outline-offset-1 bg-opacity-0"}">
    <div class="flex flex-col items-center">
        <p class="text-xl opacity-75 mb-1">Drop Files Here</p>
        <button on:click|preventDefault={() => { filepicker.click(); }} class="opacity-75">Or Click Here to Select</button>
        <div class="mt-2 -mb-3 text-center">
            {#each files as file, i}
                <div class="inline-flex bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 p-2 px-3 rounded-lg w-fit items-center gap-2 mb-2 mr-2">
                    <p>{file.name}</p>
                    <button on:click|preventDefault={() => { removeFile(i); }} class="w-6 h-6 transition bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 hover:bg-opacity-20 hover:dark:bg-opacity-20 flex rounded-full justify-around items-center"><Icon scale=1.1rem icon=close></Icon></button>
                </div>
            {:else}
                <div class="h-2 w-2"></div>
            {/each}
        </div>
    </div>
</div>
<input on:change={selectHandler} hidden bind:this={filepicker} type=file multiple/> <!--Used to bring up file dialog.-->
<input {name} hidden type=file bind:this={fileinput} multiple/> <!--For sending to server.-->