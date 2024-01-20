<script lang="ts">
  import Background from "$lib/Builders/Background.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Page from "$lib/Builders/Page.svelte";
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>Skywalkers | Help</title>
</svelte:head>

<Background>
  <Page>
    <h1 class="text-2xl font-bold">Help Articles</h1>
    <Line class="my-4 mt-2"></Line>
    <a
      href="/help/verification"
      class="flex p-8 py-4 mb-3 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer"
    >
      <Icon icon="verified" rounded scale="2.5rem"></Icon>
      <div class="ml-4">
        <h2 class="mb-1 text-xl">The Verification Process</h2>
        <h3 class="opacity-75">
          Learn how the verification process works and how to manage it or get
          verified.
        </h3>
      </div>
    </a>
    <a
      href="/help/kicked"
      class="flex p-8 py-4 mb-3 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer"
    >
      <Icon icon="warning" rounded scale="2.5rem"></Icon>
      <div class="ml-4">
        <h2 class="mb-1 text-xl">
          {#if $page.data.kicked}
            So you have been kicked...
          {:else}
            If you get kicked...
          {/if}
        </h2>
        <h3 class="opacity-75">
          See what happens when you kick a person or get kicked, and what gets
          deleted.
        </h3>
      </div>
    </a>
    <a
      href="/help/actionbar"
      class="flex p-8 py-4 gap-4 items-center rounded-lg bg-black dark:bg-white bg-opacity-5 dark:bg-opacity-5 hover:bg-opacity-10 dark:hover:bg-opacity-10 transition cursor-pointer"
    >
      <Icon icon="event" rounded scale="2.5rem"></Icon>
      <div class="ml-4">
        <h2 class="mb-1 text-xl">The Meeting Action Bar</h2>
        <h3 class="opacity-75">
          Learn what it is and how to use the meeting action bar.
        </h3>
      </div>
    </a>
  </Page>
</Background>
