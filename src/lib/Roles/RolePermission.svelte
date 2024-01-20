<script lang="ts">
  import Icon from "$lib/Builders/Icon.svelte";
  import {
    FieldValue,
    arrayRemove,
    arrayUnion,
    doc,
    runTransaction,
  } from "firebase/firestore";
  import type { Role } from "./role";
  import { getContext } from "svelte";
  import type { firebaseClient } from "$lib/Firebase/firebase";
  import type { createCurrentTeam, createPermissions } from "$lib/stores";
  import type { Writable } from "svelte/store";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  const currentPermissions = getContext("permissions") as ReturnType<
    typeof createPermissions
  >;
  const currentTeam = getContext("currentTeam") as ReturnType<
    typeof createCurrentTeam
  >;
  const team = getContext("team") as Writable<string>;

  export let permissions: string[];
  export let permission: string;
  export let role: Role;

  $: click = checkPermission(permissions);

  function checkPermission(currentPermissions: string[]) {
    let found = false;

    for (let i = 0; i < currentPermissions.length; i++) {
      if (currentPermissions[i] == permission) {
        found = true;
      }
    }

    return found;
  }

  function handleClick() {
    click = !click;

    for (let i = 0; i < permissions.length; i++) {
      if (permissions[i] == permission) {
        permissions.splice(i, 1);

        permissions = permissions;

        return;
      }
    }

    permissions.push(permission);

    permissions = permissions;
  }

  /*function addPermission(permission: string) {
        const unsubscribe = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();

            const ref = doc(db, "teams", user.team, "roles", role.id);

            await runTransaction(db, async (transaction) => {
                transaction.update(ref, {
                    permissions: arrayUnion(permission),
                })
            })

            unsubscribe();
        })
    }

    function removePermission(permission: string) {
        const unsubscribe = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();

            const ref = doc(db, "teams", user.team, "roles", role.id);

            await runTransaction(db, async (transaction) => {
                transaction.update(ref, {
                    permissions: arrayRemove(permission),
                })
            })

            unsubscribe();
        })
    }*/
</script>

<div class="flex items-start mb-5">
  <div class="w-full">
    <p class="mb-1"><slot name="title" /></p>
    <p class="text-sm opacity-50"><slot name="description" /></p>
  </div>
  <div class="flex ml-4">
    <button
      disabled={!$currentPermissions.includes("MANAGE_ROLES") ||
        $currentTeam == undefined ||
        $currentTeam.level == undefined ||
        $currentTeam.level <= role.level}
      on:click={handleClick}
      class="p-1 {click
        ? 'border-green-600 dark:border-green-600 bg-green-200 dark:bg-green-900 text-green-600'
        : 'border-border-light dark:border-border-dark text-border-light dark:text-border-dark'} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon icon="check"></Icon>
    </button>
  </div>
</div>
