<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import "../app.css";
    import { mode, navmenu } from '$lib/stores';
    import Nav from '$lib/Nav/Nav.svelte'
    import Menu from "$lib/Nav/Menu.svelte";
    import { client } from "$lib/Firebase/firebase";
    import Warning from '$lib/Builders/Warning.svelte';

    export let data;

    mode.serverInit(data.mode);
    client.serverInit(data.preload);

    onMount(() => {
        mode.clientInit();
        client.clientInit();

        console.log("\n\n███████╗██╗  ██╗██╗   ██╗██╗    ██╗ █████╗ ██╗     ██╗  ██╗███████╗██████╗ ███████╗\n██╔════╝██║ ██╔╝╚██╗ ██╔╝██║    ██║██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗██╔════╝\n███████╗█████╔╝  ╚████╔╝ ██║ █╗ ██║███████║██║     █████╔╝ █████╗  ██████╔╝███████╗\n╚════██║██╔═██╗   ╚██╔╝  ██║███╗██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║\n███████║██║  ██╗   ██║   ╚███╔███╔╝██║  ██║███████╗██║  ██╗███████╗██║  ██║███████║\n╚══════╝╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝\n\n");
    })
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@40,700,0,0" />
</svelte:head>

<div class="{$mode}">
  <div class="dark:bg-zinc-800">
    <Nav></Nav>
    <slot></slot>
  </div>
  <Warning></Warning>
  <!--<Profile></Profile>-->
</div>
