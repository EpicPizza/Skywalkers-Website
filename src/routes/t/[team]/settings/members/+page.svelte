<script lang="ts">
  import Background from "$lib/Builders/Background.svelte";
  import Page from "$lib/Builders/Page.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import type {
    SecondaryUser,
    firebaseClient,
  } from "$lib/Firebase/firebase.js";
  import {
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  } from "@rgossiaux/svelte-headlessui";
  import { getContext, onDestroy, onMount } from "svelte";
  import KickMember from "$lib/Members/KickMember.svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import {
    collection,
    query,
    where,
    type Unsubscribe,
    onSnapshot,
  } from "firebase/firestore";
  import type { createCurrentTeam } from "$lib/stores.js";
  import { page } from "$app/stores";

  export let data;

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let localLoading = getContext("localLoading") as Writable<boolean>;
  let team = getContext("team") as Writable<string>;
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

  let unsubscribeClient: Unsubscriber | undefined;
  let unsubscribeFirestoreVerified: Unsubscribe | undefined;

  onMount(() => {
    $localLoading = false;

    unsubscribeClient = client.subscribe(async (user) => {
      if (user == undefined || "preload" in user || user.teams == undefined)
        return;

      if (unsubscribeClient) unsubscribeClient();
      if (unsubscribeFirestoreVerified) unsubscribeFirestoreVerified();

      const db = client.getFirestore();

            unsubscribeFirestoreVerified = onSnapshot(query(collection(db, "users"), where('team', 'array-contains-any', [ $team ])), (snapshot) => {
                let users = new Array<SecondaryUser>();

          for (let i = 0; i < snapshot.docs.length; i++) {
            users.push({
              displayName: snapshot.docs[i].data().displayName as string,
              teams: snapshot.docs[i].data().teams,
              photoURL: snapshot.docs[i].data().photoURL as string,
              pronouns: snapshot.docs[i].data().pronouns as string,
              id: snapshot.docs[i].id,
            });
          }

          data.members = users;
        },
      );
    });
  });

  onDestroy(() => {
    if (unsubscribeClient) unsubscribeClient();
  });
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Members</title>
</svelte:head>

<Background>
  <Page size="44rem" expand let:top>
    <div class="flex justify-between min-w-full items-center">
      <div class="flex items-end">
        <h1 class="text-3xl font-light mr-2">Members</h1>
        <p class="text-sm mb-1 opacity-50">(Team {$team})</p>
      </div>
      <!--<button class="b-default">Generate</button>-->
    </div>

    <Line class="mt-2"></Line>

    <div
      class="pt-4 grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-x-4 gap-y-1"
    >
      {#each data.members as member}
        <div class="w-full m-2 flex items-center">
          <a
            class="flex items-center overflow-hidden"
            href="/t/{$team}/settings/members/{member.id}"
          >
            <img
              referrerpolicy="no-referrer"
              class="rounded-full w-8 h-8 mr-2"
              alt="{member.displayName} Profile"
              src={member.photoURL}
            />
            <div class="whitespace-nowrap overflow-hidden overflow-ellipsis">
              {member.displayName}{member.pronouns == ""
                ? ""
                : " (" + member.pronouns + ")"}
            </div>
          </a>
        </div>
      {/each}
    </div>

    <div class="flex mt-8">
      <a
        class="b-secondary w-fit flex items-center gap-1"
        href="/t/{$team}/settings"
        ><Icon scale="1.25rem" icon="arrow_back"></Icon>Back</a
      >
    </div>
  </Page>
</Background>
