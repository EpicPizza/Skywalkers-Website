<script lang="ts">
    import { getContext, onMount, setContext } from "svelte";
    import "../app.css";
    import { createMode, createVerified } from '$lib/stores';
    import Nav from '$lib/Nav/Nav.svelte'
    import { firebaseClient } from "$lib/Firebase/firebase";
    import Warning from '$lib/Builders/Warning.svelte';
    import { writable } from "svelte/store";
    import type { _ } from "$env/static/private";

    export let data;

    let mode = createMode();
    let client = firebaseClient();
    let verified = createVerified();

    let onScroll = writable(false);
    let loading = writable<boolean>();
    let bottom = writable<boolean>();

    mode.serverInit(data.mode);
    client.serverInit(data.preload);
    verified.serverInit(data.team);

    setContext('mode', mode);
    setContext('client', client);
    setContext('verified', verified);

    setContext('navmenu', writable(false));
    setContext('scroll', writable(true));
    setContext('navmode', writable<boolean>());
    setContext('localLoading', writable<boolean>());
    setContext('loading', loading);
    setContext('dialogOpen', writable<boolean>());
    setContext('previous', writable<string | undefined>());
    setContext('onScroll', onScroll);
    setContext('warning', writable<Warning | undefined>(undefined));
    setContext('bottom', bottom);

    onMount(() => {
        mode.clientInit();
        client.clientInit(loading);
        verified.clientInit(client);

        addEventListener("scroll", () => {
          onScroll.update(update => !update);

          let at = window.innerHeight + Math.round(window.scrollY);
          let height = document.body.offsetHeight;

          if(at > height - 10 && at < height + 10) {
            if($bottom == false || $bottom == undefined) {
              $bottom = true;
            }
          } else {
            if($bottom == true || $bottom == undefined) {
              $bottom = false;
            }
          }
        }, true)

        console.log("\n\n███████╗██╗  ██╗██╗   ██╗██╗    ██╗ █████╗ ██╗     ██╗  ██╗███████╗██████╗ ███████╗\n██╔════╝██║ ██╔╝╚██╗ ██╔╝██║    ██║██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗██╔════╝\n███████╗█████╔╝  ╚████╔╝ ██║ █╗ ██║███████║██║     █████╔╝ █████╗  ██████╔╝███████╗\n╚════██║██╔═██╗   ╚██╔╝  ██║███╗██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║\n███████║██║  ██╗   ██║   ╚███╔███╔╝██║  ██║███████╗██║  ██╗███████╗██║  ██║███████║\n╚══════╝╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝\n\n");
        console.warn("Do not enter or share anything here or your account could be compromised.");
    })
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@40,700,0,0" />
</svelte:head>

<div class="bg-backgroud-light dark:bg-backgroud-dark">
  <Nav></Nav>
  <slot></slot>
</div>
<Warning></Warning>
