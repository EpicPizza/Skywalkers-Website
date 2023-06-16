<script context=module lang=ts>
    let cachedIcons: Map<string | number, string[]> = new Map();
</script>

<script lang=ts>
    import Dialog from '$lib/Builders/Dialog.svelte';
    import Loading from '$lib/Builders/Loading.svelte';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import Icon from '$lib/Builders/Icon.svelte';
    import Line from '$lib/Builders/Line.svelte';
    import { browser } from '$app/environment';

    let icons: string[] = [];

    onMount(async () => {
        icons = await getIcons(0);
    })

    let range = 0;
    let searching = "";
    let loading = -1;
    let searchresult = false;
    let container: HTMLElement;
    let loader: boolean = false;
    let selected: string = "";
    let style: string = "";

    export let value: string;
    export let name: string;
    export { style as class }
    

    async function filter(search: string) {
        if(search == "") {
            let recievedIcons = await getIcons(0);

            range = 0;
            loading = -1;

            icons = recievedIcons;

            searchresult =false;

            let cancle = setInterval(() => {
                if(container && scroll()) {
                    clearInterval(cancle);
                    console.log("CHECKING");
                }
            }, 100);
        } else {
            searchresult = true;

            icons = await searchIcons(search);
        }
    }

    var scroll = () => {
        if(container.scrollTop + container.clientHeight > container.scrollHeight - 5 && searchresult == false) {
            loader = true;
            load();
            return false;
        } else {
            loader = false;
            return true;
        }
    }

    async function load() {
        if(loading == -1 && range != -1) {
            loading = range + 1;

            let recievedIcons = await getIcons(loading);

            icons = icons.concat(recievedIcons);

            console.log("Icons", icons);

            if(recievedIcons.length < 100) {
                range = -1;
            } else {
                range += 1;
            }

            loading = -1;

            loader = false;
        } 
    }

    let open: boolean = false;

    $: history(open);

    function history(open: boolean) { 
        hoverElements = new Array();
    }

    var hoverElements: boolean[] = new Array();

    function handleClick() {
        open = !open;
        console.log("clicked"); 
        let cancle = setInterval(() => {
            if(container && scroll()) {
                clearInterval(cancle);
                console.log("CHECKING");
            }
        }, 100);
    }

    async function getIcons(page: number): Promise<string[]> {
        let cache = cachedIcons.get(page);
        console.log(cache);
        if(cache == undefined) {
            const result = await fetch("/api/icons", {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    range: page
                }),
            });

            let recievedIcons = (await result.json()).icons;

            cachedIcons.set(page, recievedIcons);

            return recievedIcons;
        } else {
            return cache;
        }
    }

    async function searchIcons(query: string) {
        let cache = cachedIcons.get(query);
        if(cache == undefined) {
            const result = await fetch("/api/icons", {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    search: true,
                    query: query
                }),
            });

            let recievedIcons = (await result.json()).icons;

            cachedIcons.set(query, recievedIcons);

            return recievedIcons;
        } else {
            return cache;
        }
    }
</script>

<input type='text' bind:value name={name} class={style}/>
<button class="-ml-[1.5rem] -translate-x-[0.25rem]" on:click={(e) => { e.preventDefault(); handleClick(); }}>
    <Icon scale=1.25rem icon=menu_open></Icon>
</button>

<Dialog bind:isOpen={open}>
    <h1 class="text-2xl" slot=title>Choose an Icon</h1>

    <div slot=description class="flex mt-4 mb-4">
        <input class="w-full h-[2.125rem] p-2 rounded-md bg-zinc-200 dark:bg-zinc-700" placeholder="Search" bind:value={searching} on:keypress={(event) => { if(event.key == "Enter") { filter(searching); }}}/>
        <button class="px-2 h-[2.125rem] ml-2 bg-blue-500 text-white dark:text-white rounded-md hover:opacity-95 transition" on:click={() => { filter(""); searching = "";}} id="iconsearchbutton">Clear</button>
    </div>

    <div slot=content bind:this={container} on:scroll={scroll} class="h-[calc(100dvh-17rem)] /* <<< skull emoji */ overflow-scroll overflow-y-visible pb-2">
        <div class="sticky top-0">
            <Line></Line>
        </div>
        {#each icons as icon, i (icon)}
            <div class="inline-block mr-2 mt-2">
                <button on:click={() => {selected = icon;}} on:mouseenter={() => {hoverElements[i] = true;}} on:mouseleave={() => {hoverElements[i] = false;}} on:focusin={() => {hoverElements[i] = true; if(i > icons.length - 5) { load(); loader = true; }}} on:focusout={() => {hoverElements[i] = false;}} class="p-2 bg-black dark:bg-white {selected == icon ? 'bg-opacity-20' : 'bg-opacity-5'} {selected == icon ? 'dark:bg-opacity-20' : 'dark:bg-opacity-5'} hover:bg-opacity-20 dark:hover:bg-opacity-20 rounded-sm transition">
                    <Icon scale=2rem icon={icon}/>
                </button>
                {#if hoverElements[i] === true}
                    <div  class="-bottom-2 absolute left-1/2 -translate-x-1/2 -translate-y-3 whitespace-nowrap lex items-center justify-around bg-black p-1 rounded-md text-sm text-white">
                        {icon}
                    </div>
                {/if}
            </div>
        {:else}
            <p class="text-center mt-4">
                Nothing Found
            </p>
        {/each}
        {#if (loader && range != -1)}
            <div transition:fly="{{ y: 20 }}" id="loading" class="h-12 w-12 absolute bottom-16 bg-backgroud-light dark:bg-backgroud-dark border-[1px] border-border-light dark:border-border-dark rounded-md left-1/2 -translate-x-1/2 flex items-center justify-around"><Loading></Loading></div>
        {/if}
    </div>

    <Line></Line>

    <div class="w-full flex flex-row-reverse mt-4">
        <button on:click={() => {value = "icon:" + selected; console.log(value); open = false}} class="b-green ml-2">
            Select
        </button>
        <button on:click={() => {open = false;}} class="b-default">
            Cancel
        </button>
    </div>
</Dialog>