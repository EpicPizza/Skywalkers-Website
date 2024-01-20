<script lang="ts">
  import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
  import { getDefault } from "$lib/Meetings/helpers";
  import { onMount, getContext } from "svelte";

  let client = getContext("client") as ReturnType<typeof firebaseClient>;

  export let id: string;
  export let silent = false;

  let member: Promise<SecondaryUser> = new Promise(() => {});

  let mounted = false;

  onMount(() => {
    member = new Promise(async (resolve, reject) => {
      let user = await client.getUser(id);

      if (user == undefined) {
        if (silent) {
          resolve(getDefault(id));
        } else {
          reject("User not found.");
        }
        return;
      }

      resolve(user);

      mounted = true;
    });
  });

  $: {
    if (mounted && id) {
      member = new Promise(async (resolve, reject) => {
        let user = await client.getUser(id);

        if (user == undefined) {
          if (silent) {
            resolve(getDefault(id));
          } else {
            reject("User not found.");
          }
          return;
        }

        resolve(user);

        mounted = true;
      });
    }
  }
</script>

<slot {member} />
