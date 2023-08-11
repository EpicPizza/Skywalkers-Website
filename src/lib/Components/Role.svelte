<script lang=ts>
    import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
    import type { Role } from "$lib/Roles/role";
    import { onMount, getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let id: string;

    let role: Promise<Role> = new Promise(() => {});

    onMount(() => {
        role = new Promise(async (resolve, reject) => {
            let currentRole = await client.getRole(id);

            if(currentRole == undefined) {
                reject("User not found.");
                return;
            }

            resolve(currentRole);
        })
    })
</script>

<slot {role}></slot>