<script lang="ts" context="module">
  interface Cache {
    users: SecondaryUser[] | Promise<SecondaryUser[]>;
    cached: Date;
  }

  interface UndefinedCache {
    users: undefined;
    cached: undefined;
  }

  let cache: Cache | UndefinedCache = {
    users: undefined,
    cached: undefined,
  };
</script>

<script lang="ts">
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import type {
    FirestoreUser,
    SecondaryUser,
    firebaseClient,
  } from "$lib/Firebase/firebase";
  import type { Unsubscriber, Writable } from "svelte/store";
  import { getContext, onDestroy, onMount } from "svelte";
  import {
    collection,
    collectionGroup,
    getDocs,
    getDocsFromCache,
    getDocsFromServer,
    query,
    where,
  } from "firebase/firestore";
  import Loading from "$lib/Builders/Loading.svelte";
  import MiniProfile from "./MiniProfile.svelte";
  import { getDefault } from "$lib/Meetings/helpers";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let team = getContext("team") as Writable<string>;

  export let value: string | undefined;
  export let name: string;
  export let optional = false;
  let style: string = "";
  export { style as class };

  let open: boolean = false;
  let search: string = "";
  let selected: SecondaryUser | undefined;
  let current: SecondaryUser | undefined;

  let unsubscribe: Unsubscriber;
  let users = new Array<SecondaryUser>();

  function handleClick() {
    open = !open;
    selected = undefined;

    for (let i = 0; i < users.length; i++) {
      if (users[i].id == value) {
        selected = users[i];
      }
    }
  }

  onMount(async () => {
    //TODO: handle promise better, will bug if dialog gets opened too soon.

    if (
      cache.users != undefined &&
      new Date().valueOf() - cache.cached.valueOf() < 1000 * 60 * 15
    ) {
      users = await cache.users;

      current = undefined;

      for (let i = 0; i < users.length; i++) {
        if (users[i].id == value) {
          current = users[i];
        }
      }

      if (current == undefined) {
        current = getDefault("000000");
      }
    } else {
      cache = {
        cached: new Date(),
        users: new Promise((resolve) => {
          unsubscribe = client.subscribe(async (user) => {
            if (
              user == undefined ||
              "preload" in user ||
              user.teams == undefined
            ) {
              return;
            } //checking firebase sdk has loaded and user is verified

            if (unsubscribe) {
              unsubscribe();
            }

            let res = await fetch("/t/" + $team + "/api/users/list", {
              method: "POST",
            });

            let data = await res.json();

            cache.users = data.users == undefined ? [] : data.users;

            users = data.users == undefined ? [] : data.users;

            resolve(users);

            /*data.users.forEach((secondaryUser: SecondaryUser) => {
                            client.cacheUser(secondaryUser.id, secondaryUser);
                        });*/

            current = undefined;

            for (let i = 0; i < users.length; i++) {
              if (data.users[i].id == value) {
                current = data.users[i];
              }
            }

            if (current == undefined) {
              current = getDefault("000000");
            }
          });
        }),
      };
    }
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  function getRole(user: FirestoreUser) {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].role;
      }
    }

    return "Unknown";
  }

  let initialFocus: HTMLElement;
</script>

<input hidden autocomplete="off" type="text" bind:value {name} />
<p class={style}>
  {#if value == "" || value == undefined}
    Choose a Member
  {:else if current != undefined}
    {current.displayName}{current.pronouns ? " (" + current.pronouns + ")" : ""}
  {:else}
    loading...
  {/if}
</p>

<button
  class="-ml-[1.5rem] -translate-x-[0.25rem]"
  on:click={(e) => {
    e.preventDefault();
    handleClick();
  }}
>
  <Icon scale="1.25rem" icon="person"></Icon>
</button>

<Dialog bind:isOpen={open} bind:initialFocus>
  <h1 class="text-2xl" slot="title">Choose a Person</h1>

  <div slot="description" class="mt-4">
    <div class="flex">
      <input
        bind:value={search}
        class="w-full h-[2.125rem] p-2 rounded-md bg-zinc-200 dark:bg-zinc-700"
        placeholder="Search"
      />
      <button
        on:click={() => {
          search = "";
        }}
        class="px-2 mb-4 h-[2.125rem] ml-2 bg-blue-500 text-white dark:text-white rounded-md hover:opacity-95 transition"
        >Clear</button
      >
    </div>
    <Line></Line>
  </div>

  <div
    slot="content"
    class="pb-2 overflow-auto h-[calc(100dvh-17rem)] /* <<< skull emoji */"
  >
    {#if optional}
      {#key selected}
        <button
          on:click={() => {
            selected = undefined;
          }}
          class="mt-2 flex items-center p-2 bg-black dark:bg-white {selected ==
          undefined
            ? 'bg-opacity-20'
            : 'bg-opacity-5'} {selected == undefined
            ? 'dark:bg-opacity-20'
            : 'dark:bg-opacity-5'} w-full transition rounded-lg"
        >
          Leave Blank
        </button>
      {/key}
    {/if}
    {#each users as user}
      {#if search == "" || user.displayName
          .toLowerCase()
          .includes(search.toLowerCase())}
        {@const role = getRole(user)}
        <button
          on:click={() => {
            selected = user;
          }}
          class="mt-2 flex items-center p-2 bg-black dark:bg-white {selected &&
          selected.id == user.id
            ? 'bg-opacity-20'
            : 'bg-opacity-5'} {selected && selected.id == user.id
            ? 'dark:bg-opacity-20'
            : 'dark:bg-opacity-5'} w-full transition rounded-lg"
        >
          <img
            class="rounded-full h-12 w-12"
            alt={user.displayName + " Profile"}
            src={user.photoURL}
          />
          <div class="ml-3 overflow-hidden whitespace-nowrap overflow-ellipsis">
            <h1 class="text-left">
              {user.displayName}{user.pronouns == ""
                ? ""
                : " (" + user.pronouns + ")"}
            </h1>
            <h2 class="text-left text-sm opacity-80">
              {role.substring(0, 1).toUpperCase() +
                role.substring(1, role.length)}
              <span class="opacity-50">- {user.id}</span>
            </h2>
          </div>
        </button>
      {/if}
    {:else}
      <div class="w-full h-16 flex items-center justify-around">
        <Loading></Loading>
      </div>
    {/each}
  </div>

  <Line></Line>

  <div class="w-full flex flex-row-reverse justify-between items-center mt-4">
    <div>
      <button
        bind:this={initialFocus}
        on:click={() => {
          open = false;
        }}
        class="b-default"
      >
        Cancel
      </button>
      <button
        disabled={selected == undefined && !optional}
        on:click={() => {
          if (selected != undefined) {
            open = false;
            value = selected.id;
            current = selected;
          } else {
            open = false;
            value = "";
            current = undefined;
          }
        }}
        class="b-green ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Select
      </button>
    </div>
    {#if selected != undefined}
      <div
        class="flex items-center bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-3"
      >
        <img
          referrerpolicy="no-referrer"
          class="inline-block h-[1.625rem] w-[1.625rem] rounded-full"
          alt="{selected.displayName} Profile"
          src={selected.photoURL}
        />
        <span class="text-[1rem] ml-1.5"
          >{selected.displayName}{selected.pronouns == ""
            ? ""
            : " (" + selected.pronouns + ")"}</span
        >
      </div>
    {/if}
  </div>
</Dialog>
