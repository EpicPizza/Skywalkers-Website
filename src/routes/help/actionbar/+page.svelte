<script lang=ts>
    import Line from "$lib/Builders/Line.svelte";
    import Footer from "$lib/Nav/Footer.svelte";
</script>

<svelte:head>
    <title>Skywalkers | Help</title>
</svelte:head>


<div class="flex justify-around p-8 pt-12 min-h-[calc(100dvh-4rem)]">
    <div class="max-w-[42rem]">
        <h1 class="font-bold text-4xl tracking-wide">The Meeting Action Bar</h1>
        <p class="opacity-75 mt-2">Published 8/30/2023</p>
        <Line class="my-4 mb-6"></Line>

        <h2 class="font-bold opacity-80 text-lg mb-3">What is the action bar?</h2>
        <p class="leading-7">The action bar is a tool for doing actions on multiple meetings at once. All options include Delete, Duplicate, Sign Up, and Leave. The reset button deselects all the meetings and returns you to the default mode. Options may be hidden if you don't have permission to do certain actions.</p>

        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Action bar shown on meeting listing page." src="/ActionBar.png"/>

        <h2 class="font-bold opacity-80 text-lg mb-3 mt-10">How to use the action bar:</h2>
        <p class="leading-7">You can use the action bar by going into the meeting options menu and clicking select (this option may be hidden if your permissions don't allow you do anything in the action bar). While you are using the action bar, clicking on meetings will select or deselect them instead of going to the meeting page in the normal mode. If you still like to go the meeting page while using the action bar, there is a "Go to Page" option in the meeting options menu (your selected meetings will not be saved). You can also click reset to deselect all the meetings and go back to the normal mode.</p>

        <!-- svelte-ignore a11y-img-redundant-alt -->
        <img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Meeting options menu." src="/MeetingOptions.png"/>

        <h2 class="font-bold opacity-80 text-lg mb-3 mt-10">What do the actions do?</h2>
        <p class="leading-7">Here are the actions you can do with the action bar:</p>

        <ol class="mt-3 list-disc ml-5">
            <li>
                <span>Delete: </span>
                Deletes all the selected meetings, hidden if you don't have permission to delete meetings.
            </li>
            <li>
                <span>Duplicate: </span>
                Duplicates all the select meetings, gives you the option to change meeting timings. Hidden if you don't have permission to create meetings.
            </li>
            <li>
                <span>Sign Up: </span>
                Signs you up for all selected meetings, hidden if you don't have permission to remove your sign ups.
            </li>
            <li>
                <span>Leave: </span>
                Removes your signups from all selected meetings, hidden if you don't have permission to remove your sign ups.
            </li>
        </ol>
    </div>
</div>

<Footer/>

<style lang=postcss>
    li {
        @apply mb-3
    }

    span {
        @apply font-bold
    }
</style>