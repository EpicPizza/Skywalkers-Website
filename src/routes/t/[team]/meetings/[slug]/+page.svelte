<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import MiniProfile from "$lib/Components/MiniProfile.svelte";
  import type {
    firebaseClient,
    SecondaryUser,
  } from "$lib/Firebase/firebase.js";
  import type {
    createCurrentTeam,
    createPermissions,
    Warning,
  } from "$lib/stores.js";
  import format from "date-and-time";
  import meridiem from "date-and-time/plugin/meridiem";
  import {
    doc,
    documentId,
    DocumentReference,
    onSnapshot,
    type Unsubscribe,
  } from "firebase/firestore";
  import { onDestroy, onMount, getContext } from "svelte";
  import type { Unsubscriber, Writable } from "svelte/store";
  import {
    add,
    deleteMeeting,
    remove,
    removeOtherMember,
  } from "$lib/Meetings/meetings.js";
  import { goto } from "$app/navigation";
  import type { Role } from "$lib/Roles/role.js";
  import { current } from "tailwindcss/colors.js";
  import Link from "$lib/Builders/Link.svelte";
  import Tooltip from "$lib/Builders/Tooltip.svelte";
  import { PUBLIC_DOMAIN, PUBLIC_MEETING_VERSION } from "$env/static/public";
  import type { Meeting } from "$lib/Meetings/helpers.server";
  import { confirmPasswordReset } from "firebase/auth";
  import { dev as env } from "$app/environment";
  import { getDefault } from "$lib/Meetings/helpers.js";
  import { page } from "$app/stores";
  import NewDialog from "$lib/Builders/NewDialog.svelte";
  import { isFirefox } from "@melt-ui/svelte/internal/helpers";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  let warning = getContext("warning") as Writable<Warning | undefined>;
  let dev = getContext("dev") as Writable<boolean>;
  let permissions = getContext("permissions") as ReturnType<
    typeof createPermissions
  >;
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

  format.plugin(meridiem);

  export let data;

  let unsubscribe: Unsubscriber | undefined;

  let loading; //signup button

  onMount(() => {
    if ($client == undefined || $client.teams == undefined) return;
    unsubscribe = client
      .doc<any>(
        doc(client.getFirestore(), "teams", $team, "meetings", data.meeting.id),
        "loading",
      )
      .subscribe(async (value) => {
        if (value == "loading") return;

        if (value == undefined) {
          goto(
            "/t/" +
              $team +
              "/meetings" +
              (data.meeting.completed
                ? "?completed=true&deleted=true"
                : "?deleted=true"),
          );
          return;
        }

        if (value.version != PUBLIC_MEETING_VERSION) {
          fetch("/t/" + $team + "/meetings/" + value.id + "/update");
        }

        let currentMeeting = value;
        if (currentMeeting == undefined) return;

        let signups = new Array<SecondaryUser>();

        const db = client.getFirestore();

        for (let i = 0; i < currentMeeting.signups.length; i++) {
          const user = await client.getUser(currentMeeting.signups[i]); //function checks cache then server, so if its undefined, it means it couldn't find it in either

          if (user != undefined) {
            signups.push(user);
          } else {
            signups.push(getDefault(currentMeeting.signups[i]));
          }
        }

        let synopsis: SecondaryUser | undefined = undefined;
        let mentor: SecondaryUser | undefined = undefined;
        let role: Role | undefined = undefined;

        if (currentMeeting.synopsis != null) {
          synopsis = (await client.getUser(
            currentMeeting.synopsis.id,
          )) as SecondaryUser;
        }

        if (currentMeeting.mentor != null) {
          mentor = (await client.getUser(
            currentMeeting.mentor.id,
          )) as SecondaryUser;
        }

        if (currentMeeting.role != null) {
          role = await client.getRole(currentMeeting.role, $team);
        }

        data.meeting = {
          name: currentMeeting.name as string,
          lead:
            ((await client.getUser(currentMeeting.lead.id)) as SecondaryUser) ??
            getDefault(currentMeeting.lead.id),
          synopsis:
            currentMeeting.synopsis == null
              ? null
              : synopsis == undefined
                ? getDefault(currentMeeting.synopsis.id)
                : synopsis,
          mentor:
            currentMeeting.mentor == null
              ? null
              : mentor == undefined
                ? getDefault(currentMeeting.mentor.id)
                : mentor,
          location: currentMeeting.location as string,
          starts: currentMeeting.starts.toDate() as Date,
          ends: currentMeeting.ends.toDate() as Date,
          thumbnail: currentMeeting.thumbnail as string,
          completed: currentMeeting.completed as boolean,
          update: currentMeeting.update,
          link: currentMeeting.link as string,
          role: role ?? null,
          id: data.meeting.id,
          signups: signups,
          version: currentMeeting.version,
          virtual: currentMeeting.virtual,
          calendar: currentMeeting.calendar,
          notion: currentMeeting.notion,
          confirmations: currentMeeting.confirmations,
          guests: currentMeeting.guests,
        };
      });
  });

  onDestroy(() => {
    if (unsubscribe != undefined) {
      unsubscribe();
    }
  });

  $: signedup = checkSignedUp(data.meeting.signups);

  function checkSignedUp(value: SecondaryUser[]) {
    for (let i = 0; i < value.length; i++) {
      if ($client != undefined && value[i].id == $client.uid) {
        return true;
      }
    }

    return false;
  }

  function checkConfirmation(
    confirmations: Meeting["confirmations"],
    id: string,
  ) {
    if (!confirmations) return null;

    for (let i = 0; i < confirmations.length; i++) {
      if (confirmations[i].id == id) {
        return confirmations[i].result;
      }
    }
  }

  async function confirm(answer: string) {
    await fetch(
      "/t/" +
        $team +
        "/meetings/" +
        data.meeting.id +
        "/confirmations/" +
        answer,
      {
        method: "POST",
      },
    );
  }

  async function addGuestSignup(close: Function) {
    let signup = "";

    if (name == "" || name == undefined) {
      warning.set({
        message: "Name field cannot be blank.",
        color: "red",
      });

      console.log("hi");

      return;
    } else {
      signup += name;
    }

    if (contact != "" && contact != undefined) {
      signup += ", " + contact;
    }

    if (availability != "" && availability != undefined) {
      signup += ", " + availability;
    }

    const res = await fetch(
      "/t/" + $team + "/meetings/" + data.meeting.id + "?public=" + data.public,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          signup: signup,
        }),
      },
    );

    if (res.status != 200) {
      warning.set({
        message: res.statusText,
        color: "red",
      });
    } else {
      close();

      setTimeout(() => {
        location.reload();
      }, 1000);
    }
  }

  async function removeGuestSignup(signup: string) {
    const url = new URL(
      PUBLIC_DOMAIN +
        "/t/" +
        $team +
        "/meetings/" +
        data.meeting.id +
        "?public=" +
        data.public,
    );

    url.searchParams.set("signup", signup);

    const res = await fetch(url, {
      method: "DELETE",
    });

    if (res.status != 200) {
      warning.set({
        message: res.statusText,
        color: "red",
      });
    } else {
      if (data.public) {
        location.reload();
      }
    }
  }

  let name: string;
  let contact: string;
  let availability: string;
</script>

<svelte:head>
  <title>{info?.name ?? "Skywalkers"} | Meeting Listing</title>
</svelte:head>

<div class="min-h-[calc(100dvh)] p-8 pt-[88px] flex justify-around">
    <div class="w-[36rem] lg:w-[44rem] min-h-full relative">
        {#if data.meeting.version != PUBLIC_MEETING_VERSION}
            <div class="flex justify-around w-full mt-8">
                <div class="flex items-center gap-2">
                    <div class="ml-4">
                        <div class="animate-spin">
                            <Icon style="transform: scaleX(-1);" scale=2rem icon="sync"/>
                        </div>
                    </div>
                    <div class="flex-grow-[1] flex flex-col md:flex-row md:items-center md:my-0 gap-1 md:gap-0 w-full overflow-auto">
                        <p class="text-left lg:text-lg 4 whitespace-nowrap">Updating Meeting</p>
                    </div>
                </div>
            </div>
            {#if $dev}
                <div class="flex items-center w-full justify-between mt-12 opacity-50">
                    <p class="flex items-center gap-1">{data.meeting.version} <Icon scale="1rem" icon=arrow_forward></Icon> {PUBLIC_MEETING_VERSION}</p>
                    <p>{data.meeting.id}</p>
                </div>
            {/if}
        {:else}
            <div class="w-full flex justify-between">
                <a href="/t/{$team}/meetings{data.meeting.completed ? "/completed" : ""}{data.public ? "?public=" + data.public : ""}" class="flex gap-1 p-1 mb-2 pr-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                    <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_back></Icon>
                    <p>Back</p>
                </a>
                {#if data.meeting.completed === false}
                    {#if $permissions.includes('ADD_SYNOPSES') || (data.meeting.lead != undefined && typeof data.meeting.lead == 'object' ? data.meeting.lead.id == $client?.uid : false) || (data.meeting.synopsis != undefined && typeof data.meeting.synopsis == 'object' ? data.meeting.synopsis.id == $client?.uid : false)}
                        <a href="/t/{$team}/meetings/{data.meeting.id}/complete" class="flex gap-1 p-1 mb-2 pl-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                            <p>Complete</p>
                            <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=double_arrow></Icon>
                        </a>
                    {/if}
                {:else}
                    <a href="/t/{$team}/synopsis/{data.meeting.id}" class="flex gap-1 p-1 mb-2 pl-2 items-center bg-black dark:bg-white bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-10 dark:hover:bg-opacity-10 rounded-md transition lg:text-lg">
                        <p>Synopsis</p>
                        <Icon scale={0} class="text-[1.25rem] w-[1.25rem] h-[1.25rem] lg:text-[1.5rem] lg:w-[1.5rem] lg:h-[1.5rem]" icon=arrow_forward></Icon>
                    </a>
                {/if}
            </div>
            <div class="p-4 lg:p-6 bg-accent-500 text-black rounded-2xl flex items-center">
                {#if data.meeting.thumbnail .startsWith("icon:")}
                    <Icon scale={0} class="text-[4rem] w-[4rem] h-[4rem] lg:text-[5rem] lg:w-[5rem] lg:h-[5rem]" icon={data.meeting.thumbnail.substring(5, data.meeting.thumbnail.length)}/>
                {/if}
                <div class="ml-4 lg:ml-5 grow">
                    <div class="text-2xl lg:text-3xl lg:mb-1">{data.meeting.name}</div>
                    {#if data.meeting.location == "Google Meet Link Insert"}
                        <div class="text-lg lg:text-xl">On <a class="underline text-blue-900" href="{data.meeting.link}">Google Meet</a></div>
                    {:else}
                        <div class="text-lg lg:text-xl opacity-80">At {data.meeting.location}</div>
                    {/if}   
                </div>
                <button on:click={() => { navigator.clipboard.writeText('/meeting id:' + data.meeting.id + ' team:' + $team); warning.set({ color: 'aqua', message: "Discord Slash Command Copied" }) }} class="p-2 rounded-full bg-accent-light dark:bg-accent-dark text-accent-text-light dark:text-accent-text-dark hover:brightness-95 transition">
                    <Icon icon=share scale=2rem class="-translate-x-0.5"/>
                </button>
            </div>
            {#if data.meeting.confirmations && signedup && !(checkConfirmation(data.meeting.confirmations, $client?.uid ?? "000000") === undefined) && !data.meeting.completed}
                {@const confirmation = checkConfirmation(data.meeting.confirmations, $client?.uid ?? "000000")}
                <div class="mt-4 rounded-2xl border border-border-light dark:border-border-dark w-full p-4 lg:p-6 lg:text-lg flex items-center justify-between">
                    <div>
                        <div class="flex items-center mb-4 sm:mb-2 opacity-50">
                            <Icon scale=1.75rem icon=confirmation_number></Icon>
                            <p class="text-lg lg:text-xl ml-2.5 lg:ml-3">Meeting Confirmation</p>
                        </div>
                        <p>Are you coming to this meeting?</p>
                    </div>
                    <div class="flex flex-col sm:flex-row items-center gap-2">
                        {#if confirmation === false}
                            <button data-sveltekit-preload-data="off" on:click={() => { confirm("yes") }}  class="b-green text-center w-16">Yes</button>
                            <button data-sveltekit-preload-data="off" disabled={true} class="b-red text-center w-16 disabled:opacity-25">No</button>
                        {:else if confirmation === true}
                            <button data-sveltekit-preload-data="off" disabled={true} class="b-green text-center w-16 disabled:opacity-25">Yes</button>
                            <button data-sveltekit-preload-data="off" on:click={() => { confirm("no") }} class="b-red text-center w-16">No</button>
                        {:else}
                            <button data-sveltekit-preload-data="off" on:click={() => { confirm("yes") }}  class="b-green text-center w-16">Yes</button>
                            <button data-sveltekit-preload-data="off" on:click={() => { confirm("no") }}  class="b-red text-center w-16">No</button>
                        {/if}
                    </div>
                </div>
            {/if}
            <div class="mt-6 flex gap-2 items-center">
                <div class="-translate-y-[1px]">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=schedule></Icon>
                </div>
                <p class="text-lg lg:text-xl">{format.format(data.meeting.starts, "ddd, M/D/YY: h:mm a")} - {format.format(data.meeting.ends, "h:mm a")}</p>
            </div>
            {#if data.meeting.link}
                <div class="mt-6 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=videocam></Icon>
                    <p class="text-lg lg:text-xl"><Link href="{data.meeting.link}">{data.meeting.link}</Link></p>
                </div>
            {/if}
            <div class="mt-4 flex gap-2 items-center">
                <div class="-translate-y-[2px]">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=star></Icon>
                </div>
                <span class="text-lg lg:text-xl">Lead:</span>
                <MiniProfile user={data.meeting.lead}></MiniProfile>
            </div>
            {#if data.meeting.synopsis != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=assignment></Icon>
                    <span class="text-lg lg:text-xl">Synopsis:</span>
                    {#if typeof data.meeting.synopsis != 'object' }
                        <MiniProfile user={undefined}></MiniProfile>
                    {:else}
                        <MiniProfile user={data.meeting.synopsis}></MiniProfile>
                    {/if}
                </div>
            {/if}
            {#if data.meeting.mentor != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=engineering></Icon>
                    <span class="text-lg lg:text-xl">Mentor:</span>
                    {#if typeof data.meeting.mentor != 'object' }
                        <MiniProfile user={undefined}></MiniProfile>
                    {:else}
                        <MiniProfile user={data.meeting.mentor}></MiniProfile>
                    {/if}
                </div>
            {/if}
            {#if data.meeting.role != undefined}
                <div class="mt-4 flex gap-2 items-center">
                    <Icon class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=group></Icon>
                    <span class="text-lg lg:text-xl">Group:</span>
                    <a href="/t/{$team}/settings/roles/{data.meeting.role.id}" class="flex items-center w-fit bg-zinc-200 dark:bg-zinc-600 rounded-full p-1 pr-4">
                        <div style="background-color: {data.meeting.role.color};" class="w-4 h-4 m-0.5 mx-2 lg:w-5 lg:h-5 lg:m-2 rounded-full"></div>
                        <p class="text-lg lg:text-xl">{data.meeting.role.name}</p>
                    </a>
                </div>
            {/if}
            <div class="mt-4 flex gap-2 items-center mb-6">
                <Icon class="-translate-y-[1px] text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem]" scale={0} icon=alarm></Icon>
                <span class="text-lg lg:text-xl">Completed:</span>
                <div class="{data.meeting.completed ? 'bg-green-500' : 'bg-red-500'} rounded-full h-8 w-8 lg:h-10 lg:w-10 flex justify-around items-center">
                    <Icon scale={0}  class="text-[1.75rem] w-[1.75rem] h-[1.75rem] lg:text-[2.25rem] lg:w-[2.25rem] lg:h-[2.25rem] text-backgroud-light dark:text-backgroud-dark" icon={data.meeting.completed ? 'check' : 'close'}></Icon>   
                </div>
            </div>
            <div class="p-4 lg:p-6 pb-2 lg:pb-4 border-border-light dark:border-border-dark border-[1px] rounded-2xl">
                <div class="flex items-center justify-between mb-4 h-[34px] lg:h-[38px]">
                    <h1 class="text-xl lg:text-2xl ml-1 mb-1">Sign Up List:</h1>
                    {#if data.meeting.completed == false && data.verified}
                        {#if signedup}
                        {#if !(data.meeting.role == null || (data.meeting.role && !data.meeting.role.permissions.includes('LEAVE_SIGNUP'))) || $permissions.includes('MODERATE_MEETINGS')}
                                <button class="b-secondary lg:text-lg" on:click={() => { remove(data.meeting.id, warning, client, $team ) }}>Leave</button>
                            {/if}
                        {:else}
                            <button class="b-primary lg:text-lg" on:click={() => { add(data.meeting.id, warning, client, $team ) }}>Sign Up</button>
                        {/if}
                    {/if}
                    {#if data.meeting.completed == false && data.public}
                        <NewDialog let:close size="20rem" title="Sign Up" class="b-primary lg:text-lg">
                            <svelte:fragment slot=button>
                                Sign Up
                            </svelte:fragment>
                            <svelte:fragment slot=content>
                                <div class="flex items-center gap-2">
                                    <h1 class="text-lg mt-2">Name:</h1>
                                    <input bind:value={name} class="rounded-md w-full mt-2 py-1 p-2">
                                </div>
                                <div class="flex items-center gap-2">
                                    <h1 class="text-lg mt-1.5">Contact:</h1>
                                    <input bind:value={contact} class="rounded-md w-full mt-2 py-1 p-2">
                                </div>
                                <div class="flex items-center gap-2">
                                    <h1 class="text-lg mt-1.5">Availability:</h1>
                                    <input bind:value={availability} class="rounded-md w-full mt-2 py-1 p-2">
                                </div>
                                <div class="flex flex-row-reverse mt-3 gap-2">
                                    <button on:click={() => { addGuestSignup(close); }} class="b-primary">Add</button>
                                </div>
                            </svelte:fragment>
                        </NewDialog>
                    {/if}
                </div>
                {#each data.meeting.signups as user}
                    {#if user != undefined}
                        <div class="flex items-center mb-3">
                            <img referrerpolicy="no-referrer" alt="{user.displayName}'s Profile Picture" src="{user.photoURL}" class="h-8 w-8 lg:h-9 lg:w-9 rounded-full ml-1 mr-2"/>
                            <h1 class="lg:text-lg">{user.displayName}{user.pronouns == "" ? "" : " (" + user.pronouns + ")"}</h1>
                            {#if data.meeting.confirmations}
                                {@const confirmation = checkConfirmation(data.meeting.confirmations, user.id)}
                                {#if confirmation === null}
                                    <Tooltip class="ml-1.5" text="Sent">
                                        <div class="w-5 h-5 my-0.5 text-backgroud-light dark:text-backgroud-dark bg-border-light dark:bg-border-dark rounded-full p-0.5"><Icon scale="1rem" icon="remove"></Icon></div>
                                    </Tooltip>
                                {:else if confirmation === true}
                                    <Tooltip class="ml-1.5" text="Confirmed">
                                        <div class="w-5 h-5 my-0.5 text-backgroud-light dark:text-backgroud-dark bg-green-500 rounded-full p-0.5"><Icon scale="1rem" icon="check"></Icon></div>
                                    </Tooltip>
                                {:else if confirmation === false}
                                    <Tooltip class="ml-1.5" text="Confirmed No">
                                        <div class="w-5 h-5 my-0.5 text-backgroud-light dark:text-backgroud-dark bg-red-500 rounded-full p-0.5"><Icon scale="1rem" icon="close"></Icon></div>
                                    </Tooltip>
                                {/if}
                            {/if}
                            {#if $permissions.includes('MODERATE_MEETINGS') && data.meeting.completed == false}
                                <button on:click={() => { removeOtherMember(data.meeting.id, warning, user.id, client, $team); }} class="b-default ml-auto h-[32px] lg:h-[36px]"><Icon class="text-[0.875rem] w-[0.875rem] h-[0.875rem] lg:text-[1.125rem] lg:w-[1.125rem] lg:h-[1.125rem]" scale={0} icon=remove></Icon></button>
                            {/if}
                        </div>
                    {/if}
                {:else}
                    {#if data.meeting.guests.length == 0}
                        <div class="w-full h-11 lg:h-12 items-center flex justify-around">
                            <h1 class="-translate-y-1 lg:text-lg">No one has signed up.</h1>
                        </div>
                    {/if}
                {/each}
                {#each data.meeting.guests as guest}
                    <div class="flex items-center mb-3">
                        <div class="h-8 w-8 lg:h-9 lg:w-9 min-w-[2rem] lg:min-w-[2.25rem] bg-accent-500 rounded-full ml-1 mr-2 flex items-center justify-around">
                            <p class="text-black font-bold text-lg">{guest.substring(0, 1).toUpperCase()}</p>
                        </div>
                        <h1 style="overflow-wrap: anywhere !important;" class="lg:text-lg max-w-[100vw-10rem] overflow-hidden">{guest}</h1>
                        <p class="text-sm bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10 px-1.5 py-1 rounded-md mx-2">Guest</p>
                        {#if data.meeting.completed == false}
                            <button on:click={() => { removeGuestSignup(guest); }} class="b-default ml-auto h-[32px] lg:h-[36px]"><Icon class="text-[0.875rem] w-[0.875rem] h-[0.875rem] lg:text-[1.125rem] lg:w-[1.125rem] lg:h-[1.125rem]" scale={0} icon=delete></Icon></button>
                        {/if}
                    </div>
                {/each}
            </div>
            {#if !(!(data.meeting.role == null || (data.meeting.role && !data.meeting.role.permissions.includes('LEAVE_SIGNUP'))) || $permissions.includes('MODERATE_MEETINGS')) && data.verified}
                <div class="opacity-75 flex items-center mt-3">
                    <Icon scale={0}  class="ml-1 text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem]" icon=info></Icon>
                    <p class="ml-2 lg:text-lg">If you sign up, you cannot undo it.</p>
                </div>
            {/if}
            <div class="max-w-[calc(100vw-2rem)]">
                <div class="pt-4 max-w-full overflow-x-scroll flex flex-row-reverse gap-2">
                    {#if data.meeting.completed == false && $permissions.includes('DELETE_MEETINGS')}
                        <button on:click={ async () => { await deleteMeeting(data.meeting.id, client, $team); }} class="b-secondary lg:text-lg flex gap-1 items-center"><Icon scale=1.25rem icon=delete/><span>Delete</span></button>
                    {/if}
                    {#if $permissions.includes('CREATE_MEETINGS')}
                        <a href="/t/{$team}/meetings/{data.meeting.id}/duplicate" class="b-secondary lg:text-lg flex gap-1 items-center"><Icon scale=1.25rem icon=content_copy/><span>Duplicate</span></a>
                    {/if}
                    {#if data.meeting.completed == false && $permissions.includes('EDIT_MEETINGS')}
                        <a href="/t/{$team}/meetings/{data.meeting.id}/edit" class="b-secondary lg:text-lg flex gap-1 items-center"><Icon scale=1.25rem icon=edit/><span>Edit</span></a>
                    {/if}
                    <a href="https://www.notion.so/{data.meeting.notion.replaceAll("-", "")}" class="b-secondary lg:text-lg flex gap-1 items-center"><span>Notion</span></a>
                </div>
            </div>
            {#if $dev}
                <div class="flex items-center flex-row-reverse mt-3 opacity-50 gap-5 pr-1">
                    <p>{data.meeting.version}</p>
                    <a target="_blank" href="https://console.firebase.google.com/u/0/project/frc-skywalkers{env ? "-dev" : ""}/firestore/data/~2Fteams~2F{$team}~2Fmeetings~2F{data.meeting.id}" class="hover:underline">
                        Firebase
                    </a>
                    <button on:click={(e) => { navigator.clipboard.writeText(data.meeting.id); }} class="hover:underline">
                        Copy ID
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>
