<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import Tooltip from "$lib/Builders/Tooltip.svelte";
  import { deleteDoc, doc } from "firebase/firestore";
  import Condition from "./Condition.svelte";
  import LastChecked from "./LastChecked.svelte";
  import Use from "./Use.svelte";
  import type { Battery } from "./batteries";
  import { getContext } from "svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase";
  import History from "./History.svelte";
  import type { Writable } from "svelte/store";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let team = getContext("team") as Writable<string>;

  export let battery: Battery;
  export let toPrint: string[];

  function deleteBattery(code: string) {
    const database = client.getFirestore();

    const ref = doc(database, "teams", $team ?? "000000", "batteries", code);

    deleteDoc(ref);
  }
</script>

<button
  on:click={() => {
    if (!toPrint.includes(battery.code)) {
      toPrint.push(battery.code);
    } else {
      toPrint.splice(toPrint.indexOf(battery.code), 1);
    }
    toPrint = toPrint;
  }}
  class="w-full p-4 border-[1px] rounded-lg border-border-light dark:border-border-dark mb-4 shadow-md"
>
  <History {battery} let:open>
    <div class="flex gap-4 flex-col sm:flex-row">
      <div class="w-full flex flex-col justify-between">
        <h2 class="text-2xl font-bold text-left">
          <span class="mr-0.5">#</span>{battery.code}
        </h2>
        <button
          on:click|stopPropagation={open}
          class="hidden sm:flex items-center gap-1 mb-1 w-fit"
        >
          <Icon icon="history"></Icon>
          History
        </button>
      </div>
      <div class="w-full flex flex-col gap-2 sm:gap-0.5 -mb-2">
        <Condition {battery}></Condition>
        <LastChecked {battery}></LastChecked>
        <Use {battery}></Use>
      </div>
      <div class="flex flex-row sm:flex-col gap-2 w-full sm:w-fit">
        <Tooltip text="Download Label" class="w-full sm:w-8">
          <button
            on:click|stopPropagation={() => {
              if (!toPrint.includes(battery.code)) {
                toPrint.push(battery.code);
              } else {
                toPrint.splice(toPrint.indexOf(battery.code), 1);
              }
              toPrint = toPrint;
            }}
            class="h-8 w-full sm:w-8 {toPrint.includes(battery.code)
              ? 'bg-primary-500 text-black hover:opacity-90'
              : 'bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 hover:bg-opacity-20 dark:hover:bg-opacity-20'} rounded-lg sm:rounded-full transition flex items-center justify-around"
            ><Icon scale="1.25rem" icon="download"></Icon></button
          >
        </Tooltip>
        <Tooltip text="Delete" class="w-full sm:w-8">
          <button
            on:click|stopPropagation={() => {
              deleteBattery(battery.code);
            }}
            class="h-8 w-full sm:w-8 bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 hover:bg-red-500 dark:hover:bg-red-500 hover:bg-opacity-25 dark:hover:bg-opacity-25 rounded-lg sm:rounded-full transition flex items-center justify-around hover:text-red-500"
            ><Icon scale="1.25rem" icon="delete"></Icon></button
          >
        </Tooltip>
      </div>
      <button
        on:click|stopPropagation={open}
        class="flex sm:hidden items-center gap-1 w-fit"
      >
        <Icon icon="history"></Icon>
        History
      </button>
    </div>
  </History>
</button>
