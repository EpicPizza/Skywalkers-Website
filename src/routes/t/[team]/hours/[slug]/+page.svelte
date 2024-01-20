<script lang="ts">
  import { invalidate } from "$app/navigation";
  import Background from "$lib/Builders/Background.svelte";
  import Error from "$lib/Builders/Error.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import Page from "$lib/Builders/Page.svelte";
  import Tooltip from "$lib/Builders/Tooltip.svelte";
  import Member from "$lib/Components/Member.svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase";
  import type { Hours } from "$lib/Hours/hours.server.js";
  import { doc } from "firebase/firestore";
  import { getContext, onMount } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { superForm } from "sveltekit-superforms/client";
  import { LayerCake, Svg, Html } from "layercake";
  import colors, { current } from "tailwindcss/colors";
  import format from "date-and-time";
  import meridiem from "date-and-time/plugin/meridiem";
  import LineBrush from "$lib/LayerCake/Brush/Line.svelte";
  import Area from "$lib/LayerCake/Brush/Area.svelte";
  import AxisX from "$lib/LayerCake/Brush/AxisX.svelte";
  import AxisY from "$lib/LayerCake/Brush/AxisY.svelte";
  import Brush from "$lib/LayerCake/Brush/Brush.html.svelte";
  import Link from "$lib/Markdown/Renderers/Link.svelte";
  import type { createCurrentTeam } from "$lib/stores.js";
  import { page } from "$app/stores";

  const team = getContext("team") as Writable<string>;
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

  const xKey = "day";
  const yKey = "hours";

  let brushExtents = [0, 0];

  let brushedData: string | any[];
  $: {
    let brushedRawData = new Array<{ day: number; hours: number }>();

    let last = 0;

    for (let i = 0; i < data.hours.entries.length; i++) {
      let entry = data.hours.entries[i];

      last += entry.total;

      let date = new Date(entry.history[0].date);

      let day =
        date.valueOf() -
        date.getMilliseconds() -
        date.getSeconds() * 1000 -
        date.getMinutes() * 60 * 1000 -
        date.getHours() * 60 * 60 * 1000;

      if (i > 0) {
        let lastEntry = data.hours.entries[i - 1];

        let lastDate = new Date(lastEntry.history[0].date);

        let lastDay =
          lastDate.valueOf() -
          lastDate.getMilliseconds() -
          lastDate.getSeconds() * 1000 -
          lastDate.getMinutes() * 60 * 1000 -
          lastDate.getHours() * 60 * 60 * 1000;

        if (lastDay == day) {
          brushedRawData[brushedRawData.length - 1].hours = last;
        } else {
          brushedRawData.push({
            day: day,
            hours: last,
          });
        }
      } else {
        brushedRawData.push({
          day: day - 1000 * 60 * 60 * 24,
          hours: 0,
        });

        brushedRawData.push({
          day: day,
          hours: last,
        });
      }
    }

    brushedData = brushedRawData.slice(
      (brushExtents[0] || 0) * brushedRawData.length,
      (brushExtents[1] || 1) * brushedRawData.length,
    );
  }

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  const { form, enhance, delayed, allErrors, message, reset } = superForm(
    data.forms.add,
    { clearOnSubmit: "errors-and-message" },
  );

  $: {
    if ($message == "Success") {
      reset();
    }
  }

  let unsubscribe: Unsubscriber | undefined = undefined;

  onMount(() => {
    if ($client == undefined || $client.teams == undefined) return;
    unsubscribe = client
      .doc<
        Hours | undefined
      >(doc(client.getFirestore(), "teams", $team, "hours", data.id), structuredClone(data.hours))
      .subscribe(async (snapshotData) => {
        if (snapshotData == undefined) {
          invalidate("hours:" + $client?.uid);
        } else {
          data.hours = snapshotData as any;
        }
      });
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  const ticksFunction = (ticks: any[]) => {
    const filtered = ticks.filter((t: number) => t % 1 === 0);
    if (filtered.length > 7) {
      return filtered.filter((t: any, i: number) => i % 2 === 0);
    }
    return filtered;
  };

  function showTime(hours: (typeof data)["hours"]["entries"], index: number) {
    if (index == 0) {
      return true;
    }

    if (index > hours.length - 1) return false;

    const current = hours[index];
    const previous = hours[index - 1];
    const currentTime = new Date(current.history[0].date);
    const previousTime = new Date(previous.history[0].date);

    return (
      currentTime.getDate() != previousTime.getDate() ||
      currentTime.getMonth() != previousTime.getMonth() ||
      currentTime.getFullYear() != previousTime.getFullYear()
    );
  }
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Hours</title>
</svelte:head>

{#if $client != undefined}
  <Background>
    <Page size="24rem" expand>
      <h1 class="text-2xl font-bold text-center">{data.name}'s Hours</h1>
      <Line class="my-4 mt-2" />
      <div
        class="bg-accent-light mb-4 dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark px-8 py-4 w-fit rounded-full ml-auto mr-auto"
      >
        <p class="text-xl font-extrabold">
          Total: {data.hours.total} hour{data.hours.total == 1 ? "" : "s"}
        </p>
      </div>
      <div
        class="rounded-lg border-border-light dark:border-border-dark border-[1px] p-4 flex flex-col items-center gap-4 mb-6"
      >
        <div class="flex items-center gap-2">
          <Icon icon="add_circle" />
          <p>Add<span class="mx-0.5">/</span>Remove Hours</p>
        </div>
        <div class="w-full">
          <form method="POST" use:enhance>
            <textarea
              name="reason"
              placeholder="Add Reason"
              bind:value={$form.reason}
              on:input={() => {
                $form.reason = $form.reason.replace(/\n/g, "");
              }}
              class="p-2 rounded-md w-full h-16 mb-0 whitespace-pre-wrap"
            />
            <div class="flex justify-between">
              <div class="flex gap-1.5">
                <button
                  disabled={$form.hours <= -12}
                  class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around"
                  on:click|preventDefault={() => {
                    if ($form.hours < -11.75) {
                      $form.hours = -12;
                    } else if ($form.hours > 12) {
                      $form.hours = 12;
                    } else {
                      $form.hours -= 0.25;
                    }
                  }}><Icon scale="1.25rem" icon="remove" /></button
                >
                <input
                  name="hours"
                  bind:value={$form.hours}
                  class="p-1 px-2 w-[4.25rem] text-center font-bold rounded-md"
                />
                <button
                  disabled={$form.hours >= 12}
                  class="b-primary disabled:cursor-not-allowed w-9 h-9 flex items-center justify-around"
                  on:click|preventDefault={() => {
                    if ($form.hours > 11.75) {
                      $form.hours = 12;
                    } else if ($form.hours < -12) {
                      $form.hours = 12;
                    } else {
                      $form.hours += 0.25;
                    }
                  }}><Icon scale="1.25rem" icon="add" /></button
                >
              </div>
              <div class="flex gap-2 items-center">
                {#if $delayed}
                  <div
                    class="scale-75 flex items-center h-[2.125rem] overflow-hidden"
                  >
                    <Loading />
                  </div>
                {/if}
                <button class="b-primary">
                  {#if $form.hours < 0}
                    Remove
                  {:else}
                    Add
                  {/if}
                </button>
              </div>
            </div>
            <Error disallowMessage="Success" {allErrors} {message} />
          </form>
        </div>
      </div>
      <h2 class="text-lg mb-2 font-bold">History:</h2>
      <Line class="mb-8" />
      {#if data.hours.entries.length > 0}
        <div class="w-full h-40 mb-6 relative pl-6">
          <LayerCake
            padding={{ right: 10, bottom: 20, left: 25 }}
            x="day"
            y="hours"
            yDomain={[0, null]}
            data={brushedData}
          >
            <Svg>
              <AxisX ticks={ticksFunction} />
              <AxisY ticks={4} />
              <LineBrush stroke="#37b7c8" />
              <Area fill={"#37b7c8" + "22"} />
            </Svg>
          </LayerCake>
          <p class="text-sm font-bold text-center mt-1">Date</p>
          <p
            class="text-sm font-bold absolute left-0 top-1/2 -rotate-90 -translate-y-1/2 -translate-x-3"
          >
            Hours
          </p>
        </div>
      {:else}
        <div class="w-full -mb-6"></div>
      {/if}
      {#each [...data.hours.entries].reverse() as entry, i (entry.id)}
        {#if showTime([...data.hours.entries].reverse(), i)}
          <div class="flex items-center {i == 0 ? 'pt-4' : 'mt-9'} ">
            <Line></Line>
            <p class="opacity-60 whitespace-nowrap mx-4">
              {format.format(new Date(entry.history[0].date), "dddd, MMMM DD")}
            </p>
            <Line></Line>
          </div>
        {/if}
        <div
          class="flex items-center py-4 gap-4 w-full overflow-hidden {entry.total ==
          0
            ? 'opacity-50'
            : ''}"
        >
          <Icon
            scale="1.75rem"
            style="color: {entry.history[entry.latest].indicator.color}"
            icon={entry.history[entry.latest].indicator.icon}
          />
          <div class="grow w-full overflow-hidden flex gap-3 items-center">
            {#if entry.history[entry.latest].id != null}
              <Member
                silent
                id={entry.history[entry.latest].id ?? ""}
                let:member
              >
                {#await member}
                  <p hidden>Loading...</p>
                {:then member}
                  <Tooltip
                    text="{member.displayName}{member.pronouns == ''
                      ? ''
                      : ' (' + member.pronouns + ')'}"
                  >
                    <img
                      class="h-7 min-w-[1.75rem] w-7 rounded-full"
                      alt="{member.displayName}'s profile"
                      src={member.photoURL}
                    />
                  </Tooltip>
                {/await}
              </Member>
            {/if}
            <svelte:element
              this={entry.history[entry.latest].link ? "a" : "p"}
              href={entry.history[entry.latest].link}
              class="{entry.history[entry.latest].link
                ? 'text-blue-500 dark:text-blue-500 hover:underline'
                : ''} overflow-hidden overflow-ellipsis"
            >
              {entry.history[entry.latest].reason ?? "No Reason Given"}
            </svelte:element>
          </div>
          <span
            class="bg-black whitespace-nowrap dark:bg-white bg-opacity-10 ml-1 text-center dark:bg-opacity-10 p-1 px-2 rounded-lg"
            >{entry.total} hour{entry.total == 1 ? "" : "s"}</span
          >
        </div>
      {:else}
        <p
          class="mb-4 pt-4 text-center font-bold text-red-500 dark:text-red-500"
        >
          No History
        </p>
      {/each}
      <div class="-mb-4" />
    </Page>
  </Background>
{/if}
