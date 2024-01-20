<script lang="ts">
  import Background from "$lib/Builders/Background.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import Page from "$lib/Builders/Page.svelte";
  import type {
    firebaseClient,
    FirestoreUser,
    SecondaryUser,
  } from "$lib/Firebase/firebase.js";
  import KickMember from "$lib/Members/KickMember.svelte";
  import RolePermission from "$lib/Roles/RolePermission.svelte";
  import {
    doc,
    DocumentReference,
    onSnapshot,
    type Unsubscribe,
  } from "firebase/firestore";
  import { getContext, onDestroy, onMount } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import OnDestroy from "$lib/Members/OnDestroy.svelte";
  import RoleTag from "$lib/Members/RoleTag.svelte";
  import StatusTag from "$lib/Members/StatusTag.svelte";
  import ProfileTag from "$lib/Members/ProfileTag.svelte";
  import RoleViewer from "$lib/Members/RoleViewer.svelte";
  import type { Role } from "$lib/Roles/role";
  import { goto, invalidate } from "$app/navigation";
  import type { createCurrentTeam, Warning } from "$lib/stores.js";
  import { page } from "$app/stores";

  export let data;

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let team = getContext("team") as Writable<string>;
  let permissions = getContext("permissions") as Writable<string>;
  let currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;
  let teamInfo = getContext("teamInfo") as Writable<
    Map<string, { name: string; website: string; icon: string }>
  >;
  let warning = getContext("warning") as Writable<Warning>;

  $: info = $teamInfo.get(
    $page.params.team == undefined
      ? $currentTeam
        ? $currentTeam.team
        : "000000"
      : $page.params.team,
  );

  let localLoading = getContext("localLoading") as Writable<boolean>;
  let loading = getContext("loading") as Writable<boolean>;

  let unsubscribeClient: Unsubscriber | undefined;
  let unsubscribeFirestore: Unsubscribe | undefined;

  onMount(() => {
    unsubscribeClient = client.subscribe((user) => {
      if (user == undefined || "preload" in user || user.teams == undefined)
        return;

      if (unsubscribeClient) unsubscribeClient();
      if (unsubscribeFirestore) unsubscribeFirestore();

      subscribeVerified();
    });
  });

  function subscribeVerified() {
    const db = client.getFirestore();

    const ref = doc(db, "users", data.member.user.id);

    unsubscribeFirestore = onSnapshot(ref, async (snapshot) => {
      if (!snapshot.exists()) {
        warning.set({
          message: "Member left.",
          color: "red",
        });

        goto("/t/" + $team + "/settings/members");

        return;
      }

      if (snapshot.data() == undefined) return;

      let snap = snapshot.data();

      let roleRefs: DocumentReference[] = [];

      for (let i = 0; i < snap.teams.length; i++) {
        if (snap.teams[i].team == $team) {
          roleRefs = snap.teams[i].roles as unknown as DocumentReference[];
        }
      }

      let roles = new Array<Role>();

      for (let i = 0; i < roleRefs.length; i++) {
        let role = await client.getRole(roleRefs[i].id, $team);
        if (role != undefined) {
          roles.push(role);
        }
      }

      for (let i = 0; i < snap.teams.length; i++) {
        if (snap.teams[i].team == $team) {
          snap.teams[i].roles = roles;
        }
      }

      data.member.user = {
        ...snap,
        id: data.member.user.id,
      } as SecondaryUser;

      $loading = false;
    });
  }

  onDestroy(() => {
    if (unsubscribeClient) unsubscribeClient();
    if (unsubscribeFirestore) unsubscribeFirestore();

    $loading = false;
  });

  function getRole(user: FirestoreUser) {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].role;
      }
    }

    return "Unknown";
  }

  function getRoles(user: FirestoreUser) {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].roles;
      }
    }

    return [];
  }

  function getLevel(user: FirestoreUser) {
    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == $team) {
        return user.teams[i].level;
      }
    }

    return 0;
  }
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Member Info</title>
</svelte:head>

<Background>
  <Page expand size="46rem" disableLoader>
    <ProfileTag
      role={getRole(data.member.user)}
      verified
      id={data.member.user.id}
      member={data.member.user}
    />
    <RoleViewer member={data.member.user} roles={data.roles} />
    <div class="flex flex-row-reverse mr-2">
      <div class="opacity-75 flex items-center mt-4">
        <Icon
          scale={0}
          class="ml-1 text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem]"
          icon="info"
        ></Icon>
        <p class="ml-2 lg:text-lg">
          Kicking members will reset their participation.
        </p>
      </div>
    </div>
    <div class="flex w-full mt-4 gap-2 flex-row-reverse items-center">
      {#if !($currentTeam == undefined || !$permissions.includes("KICK_MEMBERS") || getLevel(data.member.user) >= $currentTeam.level)}
        <KickMember
          disableSuccessMessage
          member={data.member.user}
          form={data.forms.kick}
          let:handleKickMember
        >
          <button on:click={handleKickMember} class="b-primary">Kick</button>
        </KickMember>
      {/if}
      {#if $localLoading}
        <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
          <Loading></Loading>
        </div>
      {/if}
      <div class="grow">
        <a
          class="b-secondary w-fit flex items-center gap-1"
          href="/t/{$team}/settings/members"
          ><Icon scale="1.25rem" icon="arrow_back"></Icon>Back</a
        >
      </div>
    </div>
    <OnDestroy />
  </Page>
</Background>
