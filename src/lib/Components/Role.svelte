<script lang="ts">
  import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
  import type { Role } from "$lib/Roles/role";
  import { onMount, getContext } from "svelte";
  import type { Writable } from "svelte/store";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;
  let team = getContext("team") as Writable<string>;

  export let id: string;

  let role: Promise<Role> = new Promise(() => {});

  onMount(() => {
    role = new Promise(async (resolve, reject) => {
      let currentRole = await client.getRole(id, $team);

      if (currentRole == undefined) {
        reject("User not found.");
        return;
      }

      resolve(currentRole);
    });
  });
</script>

<slot {role} />
