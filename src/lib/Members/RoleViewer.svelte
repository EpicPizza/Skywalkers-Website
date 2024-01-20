<script lang="ts">
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
  import type { Role } from "$lib/Roles/role";
  import type { createCurrentTeam, createPermissions } from "$lib/stores";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  export let member: SecondaryUser;
  export let roles: Role[];

  let open = false;
  let selected: string[] = [];

  let loading = false;
  let deleting = "";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  const team = getContext("team") as Writable<string>;
  const permissions = getContext("permissions") as ReturnType<
    typeof createPermissions
  >;
  const currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;

  $: memberRoles = ((user: SecondaryUser) => {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].roles;
      }
    }

    return [];
  })(member);

  $: memberPermissions = ((user: SecondaryUser) => {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].permissions;
      }
    }

    return [];
  })(member);

  $: memberLevel = ((user: SecondaryUser) => {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].level;
      }
    }

    return 0;
  })(member);

  async function deleteRole(id: string) {
    let self = crypto.randomUUID() as string;

    deleting = self;

    await fetch("/t/" + $team + "/api/roles/remove", {
      method: "POST",
      body: JSON.stringify({
        uid: member.id,
        role: id,
      }),
    });

    if (deleting === self) {
      deleting = "";
    }
  }

  function hasRole(memberRoles: Role[], id: string) {
    for (let i = 0; i < memberRoles.length; i++) {
      if (memberRoles[i].id === id) {
        return true;
      }
    }

    return false;
  }

  async function addRole(id: string[]) {
    if (loading) return;

    loading = true;

    let promises = new Array<Promise<Response>>();

    for (let i = 0; i < id.length; i++) {
      promises.push(
        fetch("/t/" + $team + "/api/roles/add", {
          method: "POST",
          body: JSON.stringify({
            uid: [member.id],
            role: id[i],
          }),
        }),
      );
    }

    await Promise.allSettled(promises);

    loading = false;
  }
</script>

<div class="flex mt-6 gap-6 sm:gap-8 flex-col sm:flex-row">
  <div class="w-full flex-col flex">
    <div
      class="p-4 pb-14 w-full h-full border-[1px] border-border-light dark:border-border-dark rounded-xl relative"
    >
      <p class="mb-2">Roles:</p>

      {#if loading || deleting != ""}
        <div class="absolute top-4 right-4">
          <div
            class="scale-75 flex items-center w-[2.125rem] h-[2.125rem] overflow-hidden"
          >
            <Loading></Loading>
          </div>
        </div>
      {/if}

      {#each memberRoles as role}
        <a
          href="/settings/roles/{role.id}"
          class="bg-black inline-flex dark:bg-white bg-opacity-10 dark:bg-opacity-10 p-2 px-3 rounded-lg w-fit items-center gap-2 mb-2 mr-2"
        >
          <div
            style="background-color: {role.color};"
            class="w-4 h-4 rounded-full"
          ></div>
          {role.name}
          {#if $permissions.includes("MANAGE_ROLES") && $currentTeam && $currentTeam.level != undefined && role.level < $currentTeam.level}
            <button
              on:click|preventDefault={() => {
                deleteRole(role.id);
              }}
              class="w-6 h-6 transition bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 hover:bg-opacity-20 hover:dark:bg-opacity-20 flex rounded-full justify-around items-center"
              ><Icon scale="1.1rem" icon="close"></Icon></button
            >
          {/if}
        </a>
      {:else}
        <span class="opacity-75">
          {member.displayName} has no roles.
        </span>
      {/each}

      {#if $permissions != undefined && $permissions.includes("MANAGE_ROLES")}
        <button
          on:click={() => {
            open = !open;
          }}
          class="b-default absolute bottom-4 right-4 mt-10 block float-right"
          >Add Role</button
        >
      {/if}
    </div>
    <div
      class="p-4 w-full mt-6 sm:mt-8 border-[1px] border-border-light dark:border-border-dark rounded-xl"
    >
      Permission Level: <span
        class="bg-black inline-flex dark:bg-white bg-opacity-10 ml-1 dark:bg-opacity-10 p-0.5 px-3 rounded-lg"
        >{memberLevel}</span
      >
    </div>
  </div>
  <div
    class="p-4 w-full border-[1px] border-border-light dark:border-border-dark rounded-xl"
  >
    <p class="mb-2">Permissions:</p>

    {#each memberPermissions as permission}
      <div
        class="bg-black inline-block dark:bg-white bg-opacity-10 dark:bg-opacity-10 p-2 px-3 text-xs rounded-lg w-fit mb-2 mr-2"
      >
        {permission.replaceAll("_", " ")}
      </div>
    {:else}
      <span class="opacity-75">
        {member.displayName} has no permissions.
      </span>
    {/each}
  </div>
</div>

<Dialog isOpen={open} width="24rem">
  <svelte:fragment slot="title">
    <h1 class="text-2xl">Add Role(s)</h1>
    <Line class="mt-4"></Line>
  </svelte:fragment>

  <div
    slot="content"
    class="py-2 h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible"
  >
    {#each roles as role (role)}
      {#if role.name != "everyone" && !hasRole(memberRoles, role.id) && $currentTeam && $currentTeam.level != undefined && role.level < $currentTeam.level}
        <button
          on:click={() => {
            if (!selected.includes(role.id)) {
              selected.push(role.id);
              selected = selected;
            } else {
              selected.splice(selected.indexOf(role.id), 1);
              selected = selected;
            }
          }}
          class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white {selected !=
            undefined && selected.includes(role.id)
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
    <div
      class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10"
    >
      <span class="text-sm"
        >{selected.length} role{selected.length != 1 ? "s" : ""} selected</span
      >
    </div>
    <div>
      <button
        class="b-default mr-1"
        on:click|preventDefault={() => {
          open = !open;
          selected = [];
        }}>Cancel</button
      >
      <button
        on:click={() => {
          if (selected != undefined) {
            addRole(selected);
            open = !open;
            selected = [];
          }
        }}
        disabled={selected.length == 0}
        class="b-green disabled:opacity-50 disabled:cursor-not-allowed"
        >Add</button
      >
    </div>
  </div>
</Dialog>
