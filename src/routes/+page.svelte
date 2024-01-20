<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { page } from "$app/stores";
  import { invalidateAll } from "$app/navigation";
  import Footer from "$lib/Nav/Footer.svelte";
  import Link from "$lib/Builders/Link.svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase.js";

  export let data;

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  onMount(() => {
    if (data.unverifiedTeam != null) {
      invalidateAll();
    }
  });

  let beta = $page.url.searchParams.get("beta") == "true";
</script>

<svelte:head>
  <title>Skywalkers | Home</title>
</svelte:head>

{#if beta}
  <div
    class="w-full sm:max-h-[100dvh] sm:overflow-hidden border-b border-gray-300 dark:border-gray-700"
  >
    <div
      class="min-h-[calc(130vw)] relative sm:min-h-[calc(85vw)] sm:max-h-[calc(101vw)] md:max-h-[calc(80vw)] lg:min-h-[calc(53vw)] lg:max-h-[calc(70vw)] h-[calc(100dvh)] pt-[4.5rem] bg-gradient-to-tr from-accent-50 to-accent-100 dark:from-accent-900 dark:to-accent-950 w-full bg-white dark:bg-black overflow-x-auto flex justify-around items-center"
    >
      <div class="flex flex-col items-center">
        <h1
          class="font-bold text-[25px] lg:text-[30px] xl:text-[40px] bg-clip-text text-transparent box-decoration-clone bg-gradient-to-tr dark:from-accent-300 dark:to-accent-400 from-accent-700 to-accent-800"
        >
          A New Way to Manage Meetings
        </h1>
        <img
          class="sm:w-[80%] lg:w-[55%] -mb-[3dvh] sm:-mb-[5dvh] mt-2"
          src="/hero.png"
        />
      </div>
      <div class="absolute left-4 top-[88px] flex items-center">
        <img
          class="w-8 h-8 rounded-md border border-gray-700"
          src="/favicon.webp"
        />
        <p class="text-lg ml-2 text-gray-700 dark:text-gray-300">
          Skywalkers Meetings
        </p>
      </div>
      <div class="absolute right-4 flex sm:hidden bottom-4 items-center">
        <p class="mr-3 text-gray-700 dark:text-gray-300">Already in a team?</p>
        <a href="/team/choose" class="b-primary"
          >{$client == undefined ? "Sign In" : "Continue"}</a
        >
      </div>
      <div class="absolute right-4 hidden sm:flex top-[88px] items-center">
        <p class="mr-3 text-gray-700 dark:text-gray-300">Already in a team?</p>
        <a href="/team/choose" class="b-primary"
          >{$client == undefined ? "Sign In" : "Continue"}</a
        >
      </div>
    </div>
  </div>
  <div class="dark:bg-zinc-900 bg-zinc-100 w-full p-8">
    <div
      class="flex flex-col sm:flex-row items-center w-full md:w-[90%] lg:w-[75%] xl:w-[65%] ml-auto mr-auto mb-4"
    >
      <div class="w-full p-4">
        <h1
          class="mb-4 font-bold text-[22px] lg:text-[28px] xl:text-[32px] bg-clip-text text-transparent box-decoration-clone bg-gradient-to-tr dark:from-accent-300 dark:to-accent-400 from-accent-700 to-accent-800"
        >
          Designed for Ease of Use
        </h1>
        <p class="lg:text-lg xl:text-xl">
          From automatic Google calendar invite to keeping meetings organized;
          we help you do what you do best.
        </p>
      </div>
      <div class="w-full p-4">
        <img class="w-full" src="/meeting_page.png" />
      </div>
    </div>
    <div
      class="flex flex-col sm:flex-row items-center w-full md:w-[90%] lg:w-[75%] xl:w-[65%] ml-auto mr-auto"
    >
      <div class="w-full p-4">
        <h1
          class="mb-4 font-bold text-[22px] lg:text-[28px] xl:text-[33px] bg-clip-text text-transparent box-decoration-clone bg-gradient-to-tr dark:from-accent-300 dark:to-accent-400 from-accent-700 to-accent-800"
        >
          One Place to Rule it All
        </h1>
        <p class="lg:text-lg xl:text-xl">
          We offer integrations with discord, notion, google calendar, and more
          coming soon.
        </p>
      </div>
      <div class="w-full p-4">
        <img class="w-full" src="/discord_integration.png" />
      </div>
    </div>
  </div>

  <div
    class="bg-backgroud-light dark:bg-backgroud-dark p-4 w-full md:w-[90%] lg:w-[75%] xl:w-[65%] ml-auto mr-auto grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] lg:text-lg gap-x-4 gap-y-4 px-8 items-center py-8"
  >
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Automatic/Manual Hour Counting
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Comprehensive Permission System
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Meeting Syncing with Discord, Notion, and Google Calendar
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Meeting Confirmations
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Keep Track of Progress with Synopses
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Create Meetings from Availabilities with Schedulers
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Keep Track of Battery Inventory and Health
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      See Synopses in Discord and Notion
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Mobile Optimized
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Always See Today's Meetings on Top
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center justify-around"
    >
      Duplicate and Delete Multiple Meetings at Once
    </div>
    <div
      class="border-border-light dark:border-border-dark rounded-lg border p-4 bg-zinc-100 dark:bg-zinc-900 shadow-md dark:shadow-lg text-center h-full flex items-center"
    >
      Hold Responsibilities with Meeting Leads, Mentors, Synopses
    </div>
  </div>

  <div class="bg-zinc-100 dark:bg-zinc-900 p-8 py-8 pb-20 pt-14">
    <h1
      class="mb-4 font-bold text-[32px] lg:text-[38px] xl:text-[43px] bg-clip-text text-transparent box-decoration-clone bg-gradient-to-tr dark:from-accent-300 dark:to-accent-400 from-accent-700 to-accent-800 text-center"
    >
      Ready?
    </h1>

    <div
      class="border rounded-xl border-border-light dark:border-border-dark p-6 md:w-[90%] lg:w-[75%] xl:w-[65%] ml-auto mr-auto text-center px-8 sm:px-24"
    >
      <p class="lg:text-lg xl:text-xl">
        Our team onboarding process is currently still manual. You can request
        access by emailing <Link href="mailto:frc.skywalker@gmail.com"
          >frc.skywalker@gmail.com</Link
        >.
      </p>
    </div>
  </div>
{:else}
  <div
    class="w-full min-h-[calc(100dvh+1px)] overflow-hidden border-b border-gray-300 dark:border-gray-700 from-accent-50 to-accent-100 dark:from-accent-900 dark:to-accent-950 bg-gradient-to-tr"
  >
    <div class="absolute left-4 top-[88px] flex items-center">
      <img
        class="w-8 h-8 rounded-md border border-gray-700"
        src="/favicon.webp"
      />
      <p class="text-lg ml-2 text-gray-700 dark:text-gray-300">
        Skywalkers Meetings
      </p>
    </div>
    <div class="absolute right-4 flex sm:hidden bottom-4 items-center">
      <p class="mr-3 text-gray-700 dark:text-gray-300">Already in a team?</p>
      <a href="/team/choose" class="b-primary"
        >{$client == undefined ? "Sign In" : "Continue"}</a
      >
    </div>
    <div class="absolute right-4 hidden sm:flex top-[88px] items-center">
      <p class="mr-3 text-gray-700 dark:text-gray-300">Already in a team?</p>
      <a href="/team/choose" class="b-primary"
        >{$client == undefined ? "Sign In" : "Continue"}</a
      >
    </div>
    <p
      class="bg-clip-text text-transparent box-decoration-clone bg-gradient-to-tr dark:from-accent-300 dark:to-accent-400 from-accent-700 to-accent-800 text-xl font-bold w-full text-center absolute top-[calc(50%+36px)] -translate-y-1/2"
    >
      More Coming Soon
    </p>
  </div>
{/if}

<Footer></Footer>
