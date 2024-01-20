<script lang="ts">
  import Background from "$lib/Builders/Background.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import Page from "$lib/Builders/Page.svelte";
  import Footer from "$lib/Nav/Footer.svelte";

  export let form;

  let pressed = false;
</script>

<svelte:head>
  <title>Delete Account</title>
</svelte:head>

<Background>
  <Page expand={!pressed} size="24rem">
    <form
      on:submit={() => {
        setTimeout(() => {
          pressed = true;
        }, 500);
      }}
      method="POST"
    >
      {#if form && form.success == true}
        <h1 class="text-2xl font-bold">Delete Account:</h1>
        <Line class="my-4"></Line>
        <p>Your account has been deleted.</p>
        <div class="mt-8 flex justify-between items-center">
          <a href="/" class="b-primary flex items-center gap-1 w-fit"
            ><Icon scale="1.25rem" icon="arrow_back"></Icon>Back Home</a
          >
        </div>
      {:else if pressed}
        <Loading></Loading>
      {:else}
        <h1 class="text-2xl font-bold">Delete Account:</h1>
        <Line class="my-4"></Line>
        <p class="mb-2">What gets deleted:</p>
        <ul class="list-disc my-1">
          <li class="my-1 ml-5">Your Account</li>
          <li class="my-1 ml-5">Your Profile Data</li>
          <li class="my-1 ml-5">Any Linked Data (Hours)</li>
        </ul>
        <p class="mt-6">What gets left:</p>
        <ul class="list-disc my-1 mb-6">
          <li class="my-1 ml-5">Anything you made not linked to you.</li>
        </ul>
        <div
          class="bg-yellow-500 bg-opacity-20 dark:bg-opacity-10 dark:text-yellow-500 text-yellow-900 flex rounded-lg p-4 my-3 gap-3"
        >
          <Icon scale="2rem" icon="warning"></Icon>
          <p>
            If you like to delete some personal data in unlinked data. Please
            email us with the link to the problem and we will help you remove
            it. Some examples of unlinked data are meetings, synopses, and
            roles.
          </p>
        </div>
        <div
          class="bg-red-500 bg-opacity-20 dark:bg-opacity-10 dark:text-red-500 text-red-900 flex rounded-lg p-4 mt-3 gap-3"
        >
          <Icon scale="2rem" icon="error"></Icon>
          <p>
            Once you delete your account. Everything that gets deleted cannot be
            recovered after one month, since our backups will only be kept for a
            month maximum.
          </p>
        </div>
        <div class="mt-8 flex justify-between items-center">
          <a href="/account" class="b-primary flex items-center gap-1 w-fit"
            ><Icon scale="1.25rem" icon="arrow_back"></Icon>Back</a
          >
          <button class="b-red flex items-center gap-1 w-fit"
            ><Icon scale="1.25rem" icon="delete"></Icon>Delete</button
          >
        </div>
      {/if}
    </form>
  </Page>
</Background>
