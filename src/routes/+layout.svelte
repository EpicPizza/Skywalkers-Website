<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";
    import { verified, mode } from '$lib/stores';
    import Nav from '$lib/Nav/Nav.svelte'
    import { client } from "$lib/Firebase/firebase";
    import Warning from '$lib/Builders/Warning.svelte';

    export let data;

    mode.serverInit(data.mode);
    client.serverInit(data.preload);
    verified.serverInit(data.team);

    onMount(() => {
        mode.clientInit();
        client.clientInit();
        verified.clientInit(client);

        console.log("\n\n███████╗██╗  ██╗██╗   ██╗██╗    ██╗ █████╗ ██╗     ██╗  ██╗███████╗██████╗ ███████╗\n██╔════╝██║ ██╔╝╚██╗ ██╔╝██║    ██║██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗██╔════╝\n███████╗█████╔╝  ╚████╔╝ ██║ █╗ ██║███████║██║     █████╔╝ █████╗  ██████╔╝███████╗\n╚════██║██╔═██╗   ╚██╔╝  ██║███╗██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║\n███████║██║  ██╗   ██║   ╚███╔███╔╝██║  ██║███████╗██║  ██╗███████╗██║  ██║███████║\n╚══════╝╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝\n\n");
        console.warn("Do not enter or share anything here or your account could be compromised.");
    })
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@40,700,0,0" />
</svelte:head>

<div class="dark:bg-zinc-800">
  <Nav></Nav>
  <slot></slot>
</div>
<Warning></Warning>
