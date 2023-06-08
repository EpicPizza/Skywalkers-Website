<script lang=ts>
    import Icon from "$lib/Builders/Icon.svelte";
    import { navmenu } from "$lib/stores";
    import { onDestroy } from "svelte";
    import { mount_component } from "svelte/internal";
    import { onMount } from "svelte";
    import Profile from "./Profile.svelte";
    import { Menu } from "@rgossiaux/svelte-headlessui";

    onDestroy(() => {
        $navmenu = false;
    })

    let main: HTMLAnchorElement;

    onMount(() => {
        main.addEventListener("click", () => {
            $navmenu = false;
        })
    })
</script>

<div class="h-full w-full relative z-10">
    <div class="absolute flex flex-col justify-around h-full">
        <button class="w-10 h-10 flex items-center justify-around" on:click={() => {navmenu.update((n) => { return !n })}}>
            <Icon icon="menu" scale="1.75rem"/>
        </button>
    </div>
    
    <div class="flex flex-row justify-around w-full">
        <a bind:this={main} href="/" class="flex justify-around absolute h-full flex-col">
            <img alt="logo" src="/favicon.webp" class="max-h-[3rem] max-w-[3rem] rounded-lg">
        </a>
    </div>
    
    <div  class="min-w-[5rem] flex float-right h-full flex-col justify-around">
        <div class="flex flex-row-reverse">
            <Profile/>
        </div>
    </div>
</div>