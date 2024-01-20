<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import IconChooser from "$lib/Components/IconChooser.svelte";
  import PersonChooser from "$lib/Components/PersonChooser.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import Error from "$lib/Builders/Error.svelte";
  import RoleInput from "$lib/Components/RoleInput.svelte";
  import DatePicker from "$lib/Builders/DatePicker.svelte";
  import format from "date-and-time";
  import meridiem from "date-and-time/plugin/meridiem";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import type { createCurrentTeam } from "$lib/stores.js";
  import { page } from "$app/stores";

  let teamInfo = getContext("teamInfo") as Writable<
    Map<string, { name: string; website: string; icon: string }>
  >;
  let currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;

  $: info = $teamInfo.get(
    $page.params.team == undefined
      ? $currentTeam
        ? $currentTeam.team
        : "000000"
      : $page.params.team,
  );

  format.plugin(meridiem);

  export let data;

  const { form, enhance, delayed, allErrors, message, tainted } = superForm(
    data.form,
    {
      clearOnSubmit: "errors-and-message",
      delayMs: 500,
      dataType: "json",
      timeoutMs: 8000,
    },
  );

  let setStarts = false;
  let setEnds = false;

  $: {
    if (
      $tainted != undefined &&
      $tainted.starts == true &&
      setStarts == false
    ) {
      $tainted.starts = false;
      setStarts = true;
    }
  }

  $: {
    if ($tainted != undefined && $tainted.ends == true && setEnds == false) {
      $tainted.ends = false;
      setEnds = true;
    }
  }

  let open = false;
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Create Meeting</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-8 pt-[88px] flex justify-around">
  <div class="w-[36rem] lg:w-[44rem]">
    <div class="w-full flex justify-between">
      <button
        on:click={() => {
          history.back();
        }}
        class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg"
      >
        <Icon
          scale={0}
          class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]"
          icon="arrow_back"
        ></Icon>
        <p>Back</p>
      </button>
      <button
        on:click={() => {
          $tainted = undefined;

          history.back();
        }}
        class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg"
      >
        <Icon
          scale={0}
          class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]"
          icon="cancel"
        ></Icon>
        <p>Cancel</p>
      </button>
    </div>
    <Line class="mb-4"></Line>
    <h1 class="text-2xl lg:text-3xl pb-4">Create Meeting:</h1>
    <form method="POST" use:enhance>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Name:</p>
        <input
          name="name"
          bind:value={$form.name}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"
        />
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Location:</p>
        <input
          name="location"
          bind:value={$form.location}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 {$form.location ==
          'Google Meet Link Insert'
            ? 'italic text-opacity-80'
            : ''}"
        />
        <button
          class="-ml-[1.5rem] -translate-x-[0.3rem]"
          on:click={(e) => {
            e.preventDefault();
            $form.location = "Google Meet Link Insert";
            $form.virtual = true;
          }}
        >
          <Icon scale="1.25rem" icon="videocam"></Icon>
        </button>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <DatePicker
          bind:startTime={$form.starts}
          bind:endTime={$form.ends}
          bind:open
        />
        <p class="text-lg lg:text-xl">When:</p>
        <p
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"
        >
          {format.format($form.starts, "ddd, MMM DD")}: {format.format(
            $form.starts,
            "h:mm a",
          )} - {format.format($form.ends, "h:mm a")}
        </p>
        <button
          class="-ml-[1.5rem] -translate-x-[0.3rem]"
          on:click={(e) => {
            e.preventDefault();
            open = true;
          }}
        >
          <Icon scale="1.25rem" icon="schedule"></Icon>
        </button>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Thumbnail:</p>
        <IconChooser
          name="thumbnail"
          bind:value={$form.thumbnail}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"
        ></IconChooser>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Lead:</p>
        <PersonChooser
          name="lead"
          bind:value={$form.lead}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"
        ></PersonChooser>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Mentor:</p>
        <PersonChooser
          optional
          name="mentor"
          bind:value={$form.mentor}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"
        ></PersonChooser>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Synopsis:</p>
        <PersonChooser
          optional
          name="synopsis"
          bind:value={$form.synopsis}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 text-left"
        ></PersonChooser>
      </div>
      <div class="flex gap-1 mt-4 items-center min-w-[350px] max-w-[75%]">
        <p class="text-lg lg:text-xl">Group:</p>
        <RoleInput
          optional
          roles={data.roles}
          name="role"
          bind:value={$form.role}
          class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"
        />
      </div>
      <input
        hidden
        name="virtual"
        type="checkbox"
        bind:checked={$form.virtual}
      />
      <div class="flex gap-2 mt-6 items-center lg:gap-3">
        <button
          on:click|preventDefault={() => {
            $form.virtual = !$form.virtual;
          }}
          class="p-1 {$form.virtual
            ? 'border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500'
            : 'border-border-light dark:border-border-dark text-border-light dark:text-border-dark'} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon icon="check"></Icon>
        </button>
        <p class="text-lg">Create a Google Meet link.</p>
      </div>
      <Error {allErrors} {message}></Error>
      <div class="flex items-center mt-6 gap-4">
        <button
          class="b-primary lg:p-1 lg:px-2 lg:text-lg flex items-center gap-1"
        >
          <Icon scale="1.25rem" icon="save"></Icon>
          <p class="text-inherit">Save</p>
        </button>
        {#if $delayed}
          <Loading></Loading>
        {/if}
      </div>
    </form>
  </div>
</div>
