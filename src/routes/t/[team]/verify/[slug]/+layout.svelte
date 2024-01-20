<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { createCurrentTeam } from "$lib/stores";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { page } from "$app/stores";

    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Verify</title>
</svelte:head>

<slot></slot>