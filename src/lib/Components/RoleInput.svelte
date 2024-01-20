<script lang="ts">
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import type { Role } from "$lib/Roles/role";

  export let roles: Role[];
  export let name: string;
  export let value: string | undefined;
  export let optional = false;

  let style: string;
  export { style as class };

  let open: boolean = false;
  let selected: Role | undefined;
  let display: Role | undefined;

  function handleClick() {
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].id == value) {
        selected = roles[i];
      }
    }

    open = !open;
  }

  for (let i = 0; i < roles.length; i++) {
    if (roles[i].id == value) {
      display = roles[i];
    }
  }
</script>

<input hidden autocomplete="off" type="text" bind:value {name} />
<p class={style}>
  {#if display == undefined}
    Choose a Role
  {:else}
    {display.name}
  {/if}
</p>
<button
  class="-ml-[1.5rem] -translate-x-[0.375rem]"
  on:click|preventDefault={handleClick}
>
  <Icon scale="1.25rem" icon="group"></Icon>
</button>

<Dialog isOpen={open} width="24rem">
  <svelte:fragment slot="title">
    <h1 class="text-2xl">Add Role(s)</h1>
    <Line class="mt-4"></Line>
  </svelte:fragment>

  <div
    slot="content"
    class="py-2 h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible"
  >
    {#if optional}
      {#key selected}
        <button
          on:click={() => {
            selected = undefined;
          }}
          class="mt-2 flex items-center p-2 bg-black dark:bg-white {selected ==
          undefined
            ? 'bg-opacity-10'
            : 'bg-opacity-0'} {selected == undefined
            ? 'dark:bg-opacity-10'
            : 'dark:bg-opacity-0'} w-full transition rounded-lg mb-1"
        >
          Leave Blank
        </button>
      {/key}
    {/if}
    {#each roles as role (role)}
      {#if role.name != "everyone"}
        <button
          on:click={() => {
            if (selected == undefined || selected.id != role.id) {
              selected = role;
            } else {
              selected = undefined;
            }
          }}
          class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white {selected !=
            undefined && selected.id == role.id
            ? 'bg-opacity-10 dark:bg-opacity-10'
            : 'bg-opacity-0 dark:bg-opacity-0'}"
        >
          <div
            style="background-color: {role.color};"
            class="w-6 h-6 mr-2 rounded-full"
          ></div>
          <p>{role.name}</p>
        </button>
      {/if}
    {/each}
  </div>

  <Line class="mb-4"></Line>

  <div class="flex justify-between">
    <div>
      {#if selected != undefined}
        <div
          class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10"
        >
          <div
            style="background-color: {selected.color};"
            class="w-4 h-4 mr-2 rounded-full"
          ></div>
          <p class="text-sm">{selected.name}</p>
        </div>
      {:else}
        <div
          class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10"
        >
          <p class="text-sm">No Role Selected</p>
        </div>
      {/if}
    </div>
    <div>
      <button
        class="b-default mr-1"
        on:click|preventDefault={() => {
          open = !open;
          selected = display;
        }}>Cancel</button
      >
      <button
        on:click={() => {
          if (selected != undefined) {
            value = selected.id;
            display = selected;
            open = !open;
          } else {
            value = "";
            display = undefined;
            open = !open;
          }
        }}
        class="b-green disabled:opacity-50 disabled:cursor-not-allowed"
        >Choose</button
      >
    </div>
  </div>
</Dialog>
