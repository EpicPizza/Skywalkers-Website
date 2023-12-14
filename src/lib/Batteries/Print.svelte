<script lang=ts>
    //@ts-ignore
    import html2pdf from 'html2pdf.js';
    import { PUBLIC_DOMAIN } from "$env/static/public";
    import { fly } from 'svelte/transition';
    import { cubicInOut } from 'svelte/easing';

    export let toPrint: string[];

    function printPDF() {
        html2pdf().from(page).save("skywalkers_battery_labels.pdf");
        console.log("saved");

        toPrint = [];
    }

    let page: HTMLElement;
</script>

{#if toPrint.length != 0}
    <div transition:fly={{ easing: cubicInOut, y: 100 }} class="sticky bottom-0 w-full pointer-events-none p-5 pt-0 mt-6">
        <div class="p-3 w-full flex items-center justify-between rounded-lg pointer-events-auto bg-zinc-100 dark:bg-zinc-900 border-border-light dark:border-border-dark border-[1px] shadow-shadow-light dark:shadow-shadow-dark shadow-lg">
            <p class="ml-1 ">Download Battery Labels</p>
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <button class="b-secondary w-full" on:click={() => {
                    toPrint = [];
                }}>Cancel</button>
                <button on:click={printPDF} class="b-primary sm:ml-2 flex justify-around w-full">
                    Download
                </button>
            </div>
        </div>
    </div>
{/if}

<div class="hidden">
    <div bind:this={page} class="m-3">
        {#each toPrint as code, i}
            <div class="border-black border-[5px] inline-block rounded-xl h-32 w-[22rem] relative m-[14px] {i % 14 == 0 ? "mt-[30px]" : ""}">
                <img alt="qrcode" class="h-[calc(100%-0.5rem)] m-1 float-left" src="{PUBLIC_DOMAIN}/batteries/code/{code}">
                <img alt="logo" src="/favicon.webp" class="absolute rounded-full w-12 h-12 left-[17.5%] border-[3px] border-white top-1/2 -translate-x-1/2 -translate-y-1/2">
                <p class="text-xl text-black">Skywalkers 8404</p>
                <p class="text-3xl -mt-0.5 font-bold text-black">Battery <span class="ml-0.5">#</span>{code}</p>
                <p class="mt-2 text-lg text-black">Battery Inventory System</p>
            </div>
        {/each}
    </div>
</div>

