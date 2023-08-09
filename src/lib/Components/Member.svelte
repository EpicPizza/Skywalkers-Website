<script lang=ts>
    import type { SecondaryUser, firebaseClient } from "$lib/Firebase/firebase";
    import { onMount, getContext } from "svelte";

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    export let id: string;
    export let silent = false;

    let member: Promise<SecondaryUser> = new Promise(() => {});

    onMount(() => {
        member = new Promise(async (resolve, reject) => {
            console.log(id)

            let user = await client.getUser(id);

            console.log(user);

            if(user == undefined) {
                if(silent) {
                    resolve({
                        id: id,
                        permissions: [],
                        level: 0,
                        photoURL: "/unknown.webp",
                        displayName: "User Not Found",
                        role: "unknown",
                        team: "unknown",
                        pronouns: "",
                        roles: [],
                    } satisfies SecondaryUser)
                } else {
                    reject("User not found.");
                }
                return;
            }

            resolve(user);
        })
    })
</script>

<slot {member}></slot>