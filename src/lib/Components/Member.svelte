<script lang=ts>
    import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
    import { onMount, getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let id: string;

    let member: Promise<SecondaryUser> = new Promise(() => {});

    onMount(() => {
        member = new Promise(async (resolve, reject) => {
            console.log(id)

            let user = await client.getUser(id);

            console.log(user);

            if(user == undefined) {
                reject("User not found.");
                return;
            }

            resolve(user);
        })
    })
</script>

<slot {member}></slot>