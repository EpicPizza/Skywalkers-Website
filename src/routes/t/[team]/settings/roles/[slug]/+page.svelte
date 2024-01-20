<script lang="ts">
  import { page } from "$app/stores";
  import type {
    firebaseClient,
    SecondaryUser,
  } from "$lib/Firebase/firebase.js";
  import type { Role as RoleType } from "$lib/Roles/role";
  import Role from "$lib/Roles/Role.svelte";
  import type { DocumentReference } from "firebase-admin/firestore";
  import type { Unsubscribe } from "firebase/auth";
  import { collection, doc, onSnapshot } from "firebase/firestore";
  import { getContext, onMount } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import Loading from "$lib/Builders/Loading.svelte";
  import type { createCurrentTeam } from "$lib/stores.js";

  export let data;
  let role: RoleType;
  let found = false;
  let loading = true;
  let roles = data.roles;

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let team = getContext("team") as Writable<string>;

  let unsubscribeUser: Unsubscriber;
  let unsubscribeRole: Unsubscribe;

  onMount(() => {
    //mount();

    return () => {
      unsubscribeRole();
      unsubscribeUser();
    };
  });

  $: {
    if (data.role) {
      if (unsubscribeRole) unsubscribeRole();
      if (unsubscribeUser) unsubscribeUser();

      mount();
    }
  }

  function mount() {
    unsubscribeUser = client.subscribe((user) => {
      if (user == undefined || "preload" in user || user.teams == undefined)
        return;

      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeRole) unsubscribeRole();

      const db = client.getFirestore();
      const ref = doc(db, "teams", $team, "roles", data.role);

      unsubscribeRole = onSnapshot(ref, async (snapshot) => {
        loading = false;

        let data = snapshot.data();

        if (!data) return;

        let members = await getUsers(data.members as DocumentReference[]);

        role = {
          color: data.color as string,
          permissions: data.permissions as string[],
          level: data.level as number,
          name: data.name as string,
          connectTo: data.connectTo as string | null,
          members: members,
          id: snapshot.id,
        };

        found = true;
        loading = false;
      });
    });
  }

  async function getUsers(ids: DocumentReference[]) {
    let members = new Array<SecondaryUser>();

    for (let i = 0; i < ids.length; i++) {
      const user = await client.getUser(ids[i].id);
      if (user != undefined) members.push(user);
    }

    return members;
  }

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
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Roles</title>
</svelte:head>

{#if !found && !loading}
  <h1 class="p-8 text-2xl font-bold text-red-500 dark:text-red-500 text-center">
    Role Not Found
  </h1>
{:else if loading}
  <div class="w-full h-32 flex items-center justify-around">
    <Loading></Loading>
  </div>
{:else}
  <Role discord={data.discord.roles} {role}></Role>
{/if}
