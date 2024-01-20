<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import Member from "$lib/Components/Member.svelte";
    import type { FirestoreUser } from "$lib/Firebase/firebase.js";
    import type { createCurrentTeam } from "$lib/stores.js";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { page } from '$app/stores';

    export let data;

    const team = getContext('team') as Writable<string>;
    let teamInfo = getContext('teamInfo') as Writable<Map<string, { name: string, website: string, icon: string }>>
    let currentTeam = getContext('currentTeam') as ReturnType<typeof createCurrentTeam>;

    $: info = $teamInfo.get($page.params.team == undefined ? ($currentTeam ? $currentTeam.team : "000000") : $page.params.team);

    function getRole(user: FirestoreUser) {
        for(let i = 0; i < user.teams.length; i++) {
            if(user.teams[i].team == $team) {
                return user.teams[i].role;
            }
        }

        return "Unknown";
    }
</script>

<svelte:head>
    <title>{info?.name ?? "Skywalkers"} | Hours</title>
</svelte:head>

<Background>
    <Page size=24rem expand>
        <h1 class="text-2xl font-bold">Team Hours</h1>
        <Line class="my-4 mt-2"></Line>
        <div class="flex flex-col gap-2">
            {#each data.hours as hours}
                <Member id={hours.member} let:member>
                    {#await member then member}
                        {@const role = getRole(member)}
                        {#if role == 'student'}
                            <a href="/t/{$team}/hours/{member.id}" class="p-4 pr-6 w-full transition bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center rounded-lg gap-4">
                                <img class="w-12 h-12 rounded-full" alt="{member.displayName}'s profile" src={member.photoURL}/>
                                <div class="flex flex-col gap-0.5 grow">
                                    <h3>{member.displayName}{member.pronouns == "" ? "" : " (" + member.pronouns + ")"}</h3>
                                    <h4 class="opacity-50">Hours: {hours.total}</h4>
                                </div>
                                <Icon icon=open_in_new></Icon>
                            </a>
                        {/if}
                    {/await}
                </Member>
            {/each}
        </div>
    </Page>
</Background>