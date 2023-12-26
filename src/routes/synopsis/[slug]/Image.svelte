<script lang=ts>
    import Dialog from "$lib/Builders/Dialog.svelte";

    export let name: string;
    export let url: string;

    let open= false;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<img tabindex="0" on:keypress={(e) => { console.log(e.key == "Enter"); if(e.key == "Enter") { open = !open; } }} on:click={() => { open = !open; }} class="object-contain hover:cursor-pointer rounded-2xl mb-3 border-[1px] border-border-light dark:border-border-dark" alt={name} src={url}/>

<Dialog bind:isOpen={open} raw>
    <img class="object-contain absolute -translate-y-1/2 -translate-x-1/2 left-1/2 top-1/2 w-full h-fit max-w-[80vw] max-h-[80dvh]" alt={name} src={url}/>
</Dialog>