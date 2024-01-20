<script lang="ts">
  import Create from "$lib/Roles/Create.svelte";
  import Role from "$lib/Roles/RoleItem.svelte";
  import type { Role as RoleType } from "$lib/Roles/role";
  import Loading from "$lib/Builders/Loading.svelte";
  import type {
    SecondaryUser,
    firebaseClient,
  } from "$lib/Firebase/firebase.js";
  import type { Unsubscribe } from "firebase/auth";
  import { collection, onSnapshot, runTransaction } from "firebase/firestore";
  import { getContext, onDestroy, onMount } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import SortableList from "$lib/Builders/SortableList.svelte";
  import { setContext } from "svelte";
  import { TabPanel } from "@rgossiaux/svelte-headlessui";
  import { fly } from "svelte/transition";
  import Icon from "$lib/Builders/Icon.svelte";
  import type { clickOutside, createCurrentTeam } from "$lib/stores";
  import { page } from "$app/stores";
  import type {
    DocumentReference,
    DocumentSnapshot,
  } from "firebase-admin/firestore";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  let sidebar = getContext("sidebar") as Writable<boolean>;
  let clicked = getContext("clicked") as Writable<boolean>;
  let permissions = getContext("permissions") as Writable<string[]>;
  let currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;
  let team = getContext("team") as Writable<string>;

  export let data;

  let unsubscribeUser: Unsubscriber;
  let unsubscribeRoles: Unsubscribe;

  onMount(() => {
    unsubscribeUser = client.subscribe((user) => {
      if (user == undefined || "preload" in user || user.teams == undefined)
        return;

      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeRoles) unsubscribeRoles();

      const db = client.getFirestore();
      const ref = collection(db, "teams", $team, "roles");

      unsubscribeRoles = onSnapshot(ref, async (snapshots) => {
        const roles = new Array<RoleType>();

        for (let i = 0; i < snapshots.docs.length; i++) {
          let members = await getUsers(
            snapshots.docs[i].data().members as DocumentReference[],
          );

          roles.push({
            color: snapshots.docs[i].data().color as string,
            permissions: snapshots.docs[i].data().permissions as string[],
            level: snapshots.docs[i].data().level as number,
            name: snapshots.docs[i].data().name as string,
            connectTo: snapshots.docs[i].data().connectTo as string | null,
            members: members,
            id: snapshots.docs[i].id,
          });
        }

        roles.sort((a, b) => b.level - a.level);

        data.roles = roles;
      });
    });
  });

  async function getUsers(ids: DocumentReference[]) {
    let members = new Array<SecondaryUser>();

    for (let i = 0; i < ids.length; i++) {
      const user = await client.getUser(ids[i].id);
      if (user != undefined) members.push(user);
    }

    return members;
  }

  let waiting: Promise<Response>;

  function promiseState(p: Promise<any>) {
    const t = {};
    return Promise.race([p, t]).then(
      (v) => (v === t ? "pending" : "fulfilled"),
      () => "rejected",
    );
  }

  let loading = false;

  $: (async (promise: Promise<any> | undefined) => {
    if (promise == undefined) {
      loading = false;
      return;
    }

    const status = await promiseState(promise);

    if (status == "pending") {
      loading = true;
    } else {
      loading = false;
    }
  })(waiting);

  async function handleSort(e: CustomEvent) {
    let { from, to } = e.detail as any;

    if (
      parseInt(from) === parseInt(to) ||
      parseInt(to) === parseInt(from) + 1
    ) {
      //dont resort if going to same position
      return;
    }

    const level = $currentTeam == undefined ? 0 : $currentTeam.level;

    if (
      data.roles.length - from - 1 >= level ||
      data.roles.length - to - 1 >= level
    ) {
      return;
    }

    const status = await promiseState(waiting);

    if (status == "pending") return;

    let fromRole = data.roles[from]; // gets role that is being moved

    let movedRole = { ...fromRole }; // to differ from new/old role when role that is being moved gets inserted at new index
    (movedRole as any).moved = true;

    data.roles.splice(to, 0, movedRole); //inserts role being moved

    for (let i = 0; i < data.roles.length; i++) {
      //removes old moved role
      if (
        data.roles[i].id === fromRole.id &&
        (data.roles[i] as any).moved != true
      ) {
        data.roles.splice(i, 1);
      }
    }

    for (let i = 0; i < data.roles.length; i++) {
      //resets moved role
      if ((data.roles[i] as any).moved === true) {
        (data.roles[i] as any).moved = false;
      }
    }

    data.roles = data.roles; //rerender svelte

    waiting = fetch("/t/" + $team + "/api/roles/resort", {
      //actually resort in database
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        to: parseInt(to),
        from: parseInt(from),
      }),
    });

    await waiting;

    (async (promise: Promise<any> | undefined) => {
      if (promise == undefined) {
        loading = false;
        return;
      }

      const status = await promiseState(promise);

      if (status == "pending") {
        loading = true;
      } else {
        loading = false;
      }
    })(waiting);
  }

  onDestroy(() => {
    if (unsubscribeUser) unsubscribeUser();
    if (unsubscribeRoles) unsubscribeRoles();
  });

  let windowWidth: number;
  $: small = windowWidth < 640;
  let main = $page.route.id == "/settings/roles";
  let first = true;

  $: {
    if (first && !main) {
      first = false;
    } else {
      if (small === false) {
        $sidebar = true;
      } else if (small === true && !main) {
        $sidebar = false;
      } else if (main) {
        main = false;
      }
    }
  }

  $: checkIfClickedOutside($clicked);

  function checkIfClickedOutside(value: boolean) {
    if (
      (value == false || value == true) &&
      small == true &&
      $sidebar == true
    ) {
      $sidebar = false;
    }
  }

  function handleClick() {
    $sidebar = !$sidebar;
  }

  let rolePage: HTMLDivElement;

  $: {
    if ($page.params && rolePage) {
      rolePage.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  let ignore: number[] = [];

  $: {
    let ignoreList = new Array<number>();

    let userLevel =
      $client == undefined
        ? undefined
        : !$permissions.includes("MANAGE_ROLES")
          ? undefined
          : $currentTeam
            ? $currentTeam.level
            : 0;

    if (userLevel == undefined) {
      for (let i = 0; i < data.roles.length - 1; i++) {
        ignoreList.push(i);
      }
    } else {
      for (let i = 0; i < data.roles.length - 1; i++) {
        if (data.roles[i].level >= userLevel) {
          ignoreList.push(i);
        }
      }
    }

    ignore = [...ignoreList];
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

<div class="min-h-[calc(100dvh)] w-full pt-[82px] p-2 pattern">
  <div
    class="sm:flex min-h-[calc(100dvh-90px)] md:min-w-[768px] md:absolute md:left-1/2 md:-translate-x-1/2 rounded-xl border-[1px] border-border-light dark:border-border-dark overflow-hidden"
  >
    <div
      class="{$sidebar
        ? 'left-[7px]'
        : '-left-44'} rounded-l-xl -translate-y-[1px] transition-all absolute z-30 sm:relative sm:left-0 bg-backgroud-light dark:bg-backgroud-dark {small
        ? 'border-[1px] max-h-[calc(100dvh-90px)] min-h-[calc(100dvh-90px)]'
        : 'max-h-[calc(100dvh-91px)] min-h-[calc(100dvh-91px)] -mb-[1px]'} min-w-[11rem] max-w-[11rem] sm:m-h-full p-3 pt-0 border-border-light dark:border-border-dark border-r-[1px] flex flex-col justify-between"
    >
      <div class="relative overflow-auto flex-grow pt-3">
        <SortableList
          list={data.roles}
          disable={loading}
          class="relative after:pointer-events-none after:w-full after:h-1 after:bg-black after:dark:bg-white after:absolute after:-top-[3px] after:rounded-md"
          {ignore}
          softIgnore={data.roles.length - 1}
          on:sort={handleSort}
          let:item={role}
        >
          <Role
            on:click={() => {
              if (small) {
                handleClick();
              }
            }}
            {role}
          ></Role>
        </SortableList>
      </div>
      {#if $permissions.includes("MANAGE_ROLES") || $currentTeam == undefined || $currentTeam.level == undefined || $currentTeam.level <= 0}
        <Create form={data.forms.create}></Create>
      {/if}
      <button
        on:click|stopPropagation={handleClick}
        class="block sm:hidden z-10 {$sidebar
          ? ''
          : 'translate-x-2'} absolute m-2 p-2 left-44 bg-backgroud-light dark:bg-backgroud-dark rounded-md border-border-light dark:border-border-dark border-[1px] shadow-shadow-light dark:shadow-shadow-dark shadow-md"
      >
        <Icon
          style="transition-duration: 0.4s; transition-property: all; {$sidebar
            ? 'transform: rotate(180deg);'
            : 'transform: rotate(0deg);'}"
          class="transition"
          icon="chevron_right"
        ></Icon>
      </button>
      {#if loading}
        <div
          transition:fly={{ y: 8 }}
          class="flex absolute bottom-12 left-1/2 -translate-x-1/2 flex-col items-center p-2 bg-backgroud-light dark:bg-backgroud-dark border-border-light dark:border-border-dark border-[1px] rounded-md mb-2"
        >
          <Loading></Loading>
        </div>
      {/if}
    </div>
    <div
      bind:this={rolePage}
      on:scroll={() => {
        $sidebar = false;
      }}
      class="w-full bg-backgroud-light dark:bg-backgroud-dark min-h-[calc(100dvh-92px)] max-h-[calc(100dvh-92px)] overflow-auto sm:max-w-[592px] border-border-light dark:border-border-dark"
    >
      <slot />
    </div>
  </div>
</div>
