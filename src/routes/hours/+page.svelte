<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Page from "$lib/Builders/Page.svelte";

    export let data;
</script>

<svelte:head>
    <title>Skywalkers | Hours</title>
</svelte:head>

<Background>
    <Page size=24rem expand>
        <h1 class="text-2xl font-bold">Hours</h1>
        <Line class="my-4 mt-2"></Line>
        <div class="flex flex-col gap-2">
            {#each data.hours as hours}
                <a href="/hours/{hours.member.id}" class="p-4 pr-6 w-full transition bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 flex items-center rounded-lg gap-4">
                    <img class="w-12 h-12 rounded-full" alt="{hours.member.displayName}'s profile" src={hours.member.photoURL}/>
                    <div class="flex flex-col gap-0.5 grow">
                        <h3>{hours.member.displayName}{hours.member.pronouns == "" ? "" : " (" + hours.member.pronouns + ")"}</h3>
                        <h4 class="opacity-50">Hours: {hours.total}</h4>
                    </div>
                    <Icon icon=open_in_new></Icon>
                </a>
            {/each}
        </div>
    </Page>
</Background>