<script lang="ts">
    import { onMount, setContext } from "svelte";
    import "../app.css";
    import { createCurrentTeam, createMode, createPermissions, createVerified, devMode } from '$lib/stores';
    import Nav from '$lib/Nav/Nav.svelte'
    import { firebaseClient } from "$lib/Firebase/firebase";
    import Warning from '$lib/Builders/Warning.svelte';
    import { derived, writable } from "svelte/store";
    import { page } from '$app/stores';
    export let data;

    let mode = createMode();
    let client = firebaseClient();
    let permissions = createPermissions();
    let currentTeam = createCurrentTeam();
    let onScroll = writable(false);
    let loading = writable<boolean>();
    let bottom = writable<boolean>();
    let teamInfo = writable(data.teamInfo);
    let global = writable<boolean>(!$page.url.pathname.includes("/t/"));
    let team = writable<string>(data.team ?? "000000");

    let verified = derived([team, client], ([$team, $client], set) => {
      if($client != undefined && $client.teams != undefined) {
        if('team' in $client && ($client.team as string[]).includes($team)) {
          set(true);
        } else {
          set(false);
        }
      } else {
        set(false);
      }
    })

    $: $team = getTeam($page.data.team, $page.url.pathname);
    $: $teamInfo = data.teamInfo;
    $: $global = !$page.url.pathname.includes("/t/");

    function getTeam(cache: string | null, current: string | null) {
      if(current && current.startsWith("/t/")) {
        current = current.substring(3, 9);
      } else {
        current = null;
      }

      return current ?? cache ?? "000000";
    }

    let dev = devMode();

    mode.serverInit(data.mode);
    client.serverInit(data.preload);
    permissions.serverInit(data.preload, data.team ?? "000000");
    currentTeam.serverInit(data.preload, data.team ?? "000000");


    setContext('mode', mode);
    setContext('client', client);
    setContext('verified', verified);
    setContext('dev', dev);
    setContext('permissions', permissions);
    setContext('currentTeam', currentTeam);

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
    setContext('clicked', writable(false));
    setContext('sidebar', writable(false));
    setContext('team', team);
    setContext('teamInfo', teamInfo);
    setContext('global', global);
    setContext('leaving', writable(false));

    $: iconInfo = $teamInfo.get($page.data.unverifiedTeam ?? $team ?? "000000")?.icon ?? "/favicon.webp";

    onMount(() => {
        mode.clientInit(); 
        client.clientInit(loading);
        permissions.clientInit(client, team);
        currentTeam.clientInit(client, team);

        const update = () => {
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
        }

        addEventListener("scroll", () => {
          onScroll.update(update => !update);

          update();
        }, true)

        console.log("\n\n███████╗██╗  ██╗██╗   ██╗██╗    ██╗ █████╗ ██╗     ██╗  ██╗███████╗██████╗ ███████╗\n██╔════╝██║ ██╔╝╚██╗ ██╔╝██║    ██║██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗██╔════╝\n███████╗█████╔╝  ╚████╔╝ ██║ █╗ ██║███████║██║     █████╔╝ █████╗  ██████╔╝███████╗\n╚════██║██╔═██╗   ╚██╔╝  ██║███╗██║██╔══██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗╚════██║\n███████║██║  ██╗   ██║   ╚███╔███╔╝██║  ██║███████╗██║  ██╗███████╗██║  ██║███████║\n╚══════╝╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝\n\n");
        console.warn("%cDo not enter or share anything here or your account could be compromised.", "font-size: 1.5rem;");
    });
</script>

<svelte:head>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@40,700,0,0" />
  <link rel="icon" href={$global ? "/favicon.webp" : iconInfo} />
</svelte:head>

<div class="bg-backgroud-light dark:bg-backgroud-dark">
  <Nav></Nav>
  <slot></slot>
</div>
<Warning></Warning>

<style>
  :global(:is(.dark) .pattern) {
      background-image:  linear-gradient(30deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(150deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(30deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(150deg, #18181b 12%, transparent 12.5%, transparent 87%, #18181b 87.5%, #18181b), linear-gradient(60deg, #18181b77 25%, transparent 25.5%, transparent 75%, #18181b77 75%, #18181b77), linear-gradient(60deg, #18181b77 25%, transparent 25.5%, transparent 75%, #18181b77 75%, #18181b77);
      background-size: 20px 35px;
      background-position: 0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px;
  }

  :global(:is(.light) .pattern) {
      background-image:  linear-gradient(30deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(150deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(30deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(150deg, #f1f5f9 12%, transparent 12.5%, transparent 87%, #f1f5f9 87.5%, #f1f5f9), linear-gradient(60deg, #f1f5f977 25%, transparent 25.5%, transparent 75%, #f1f5f977 75%, #f1f5f977), linear-gradient(60deg, #f1f5f977 25%, transparent 25.5%, transparent 75%, #f1f5f977 75%, #f1f5f977);
      background-size: 20px 35px;
      background-position: 0 0, 0 0, 10px 18px, 10px 18px, 0 0, 10px 18px;
  }
</style>