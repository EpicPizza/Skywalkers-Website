<script lang="ts">
  import Combobox from "$lib/Builders/Combobox.svelte";
  import DatePicker from "$lib/Builders/DatePicker.svelte";
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import dnt from "date-and-time";
  import meridiem from "date-and-time/plugin/meridiem";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { AddBattery } from "./batteries";
  import { superForm } from "sveltekit-superforms/client";
  import Loading from "$lib/Builders/Loading.svelte";
  import Error from "$lib/Builders/Error.svelte";
  import { onMount } from "svelte";

  dnt.plugin(meridiem);

  export let open = false;
  export let addForm: SuperValidated<typeof AddBattery>;

  let dateopen = false;

  let conditionList = [
    {
      id: "Good",
      disabled: false,
      detail: {
        name: "Good",
      },
    },
    {
      id: "Fair",
      disabled: false,
      detail: {
        name: "Fair",
      },
    },
    {
      id: "Bad",
      disabled: false,
      detail: {
        name: "Bad",
      },
    },
    {
      id: "Unknown",
      disabled: false,
      detail: {
        name: "Unknown",
      },
    },
  ];

  let useList = [
    {
      id: "Competition",
      disabled: false,
      detail: {
        name: "Competition",
      },
    },
    {
      id: "Practice",
      disabled: false,
      detail: {
        name: "Practice",
      },
    },
    {
      id: "Testing",
      disabled: false,
      detail: {
        name: "Testing",
      },
    },
    {
      id: "Decommissioned",
      disabled: false,
      detail: {
        name: "Decommissioned",
      },
    },
    {
      id: "Unknown",
      disabled: false,
      detail: {
        name: "Unknown",
      },
    },
  ];

  let set = false;

  const { form, reset, enhance, delayed, allErrors, message, tainted } =
    superForm(addForm, { dataType: "json" });

  $: {
    if ($tainted != undefined && $tainted.lastchecked == true && set == false) {
      $tainted.lastchecked = false;
      set = true;
    }
  }

  $: {
    if (open == true) {
      reset({
        data: {
          lastchecked: new Date(),
        },
      });
    }
  }

  $: {
    if (open == false) {
      $tainted = undefined;
    }
  }

  onMount(() => {
    const unsubscribe = message.subscribe((value) => {
      console.log(value);

      if (value == "Battery Added") {
        open = false;
      }
    });

    return () => {
      unsubscribe();
    };
  });
</script>

<Dialog bind:isOpen={open} width="26rem">
  <h1 class="text-2xl">Add Battery Entry</h1>
  <Line class="my-4"></Line>
  <form method="POST" use:enhance>
    <Combobox
      bind:value={$form.condition}
      list={conditionList}
      labelString="Condition:"
      placeholder=""
      className="flex gap-1 mt-4 items-center w-full"
      labelClass="text-lg lg:text-xl"
      inputClass="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"
      let:detail
      let:selected
    >
      {detail.name}
    </Combobox>
    <div class="flex gap-1 mt-4 items-center w-full">
      <DatePicker
        bind:startTime={$form.lastchecked}
        endTime={new Date()}
        hideTimes
        bind:open={dateopen}
      />
      <p class="text-lg lg:text-xl whitespace-nowrap">Last Checked:</p>
      <p
        class="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700 pr-6"
      >
        {dnt.format($form.lastchecked ?? new Date(), "ddd, MMM DD")}
      </p>
      <button
        class="-ml-[1.5rem] -translate-x-[0.3rem]"
        on:click={(e) => {
          e.preventDefault();
          dateopen = true;
        }}
      >
        <Icon scale="1.25rem" icon="schedule"></Icon>
      </button>
    </div>
    <Combobox
      bind:value={$form.use}
      list={useList}
      labelString="Use:"
      placeholder=""
      className="flex gap-1 mt-4 items-center w-full"
      labelClass="text-lg lg:text-xl"
      inputClass="lg:p-1 lg:pl-2 lg:text-lg w-full rounded-md p-1 bg-zinc-200 dark:bg-zinc-700"
      let:detail
      let:selected
    >
      {detail.name}
    </Combobox>
    <Error {message} disallowMessage="Battery Added" {allErrors}></Error>
    <Line class="my-4"></Line>
    <div class="flex flex-row-reverse gap-2">
      <button class="b-green">Add</button>
      <button
        class="b-default"
        on:click|preventDefault={() => {
          open = !open;
        }}>Cancel</button
      >
      {#if $delayed}
        <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
          <Loading></Loading>
        </div>
      {/if}
    </div>
  </form>
</Dialog>
