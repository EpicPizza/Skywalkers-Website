<script lang=ts>
    import { page } from "$app/stores";
    import Line from "$lib/Builders/Line.svelte";
    import Footer from "$lib/Nav/Footer.svelte";
</script>

<svelte:head>
    <title>Skywalkers | Help</title>
</svelte:head>


<div class="flex justify-around p-8 pt-12 min-h-[calc(100dvh-4rem)]">
    <div class="max-w-[42rem]">
        <h1 class="font-bold text-4xl tracking-wide">
            {#if $page.data.kicked}
                So you have been kicked...
            {:else}
                If you get kicked...
            {/if}
        </h1>
        <p class="opacity-75 mt-2">Last updated 8/8/2023</p>
        <Line class="my-4 mb-6"></Line>

        <h2 class="font-bold opacity-80 text-lg mb-3">What happens now:</h2>
        <p class="leading-7">You are essentially deleted from the team. Your hours are reset. You do not have any access to any of the team resources/pages now. You get redirected to the verify page as if you were a new user. Your profile data has been seperated, and if someone unkicks you, your profile data returns. However if you join the team with a new code, your profile data gets reset. Roles are also included with the profile data, although the person unkicking you can always edit your profile/roles before returning you to the team.</p>

        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Kicked indicator on the top right screen next to profile picture." src="/kicked.png"/>

        <h2 class="font-bold opacity-80 text-lg mb-3 mt-10">The rest of the team:</h2>
        <p class="leading-7">The kicked member appears as <span class="font-bold underline">User Not Found</span> to the rest of the team. Any resources they created will not be deleted, although hours do get reset. When a member unkicks the kicked member, the roles they return with cannot have a higher permission than then the person unkicking. They will have to either remove the higher level permissions or let another person unkick them. They may also have to remove roles if they do not have the permission to manage roles.</p>

        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Options before unkicking person. Shows warning that since they can't manage roles, the person they are unkicking can't have any roles." src="/kicked_process.png"/>

        <h2 class="font-bold opacity-80 text-lg mb-3 mt-10">What about the data?</h2>
        <p class="leading-7 mb-4">Any unidentifiable resources will remain untouched, as they never included any profile data (it always gets fetched along with the main resource). Any profile/role data gets moved to seperate limited access part of the database. The orginal user object in the database gets deleted. If the kicked member requests to have their account deleted, the moved profile/role data will get deleted. The moved profile/role data also gets deleted when the kicked member joins with a new code. Hours will be reset and stay reset even if the person is unkicked from the team. When someone is kicked, their hours are stored in history before they are reset, although as of now, it is infeasible to recover them. Deleting the account deletes this history.</p>
    </div>
</div>

<Footer></Footer>