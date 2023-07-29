<script lang=ts>
    import Background from '$lib/Builders/Background.svelte';
    import Page from '$lib/Builders/Page.svelte';
    import Icon from '$lib/Builders/Icon.svelte';
    import Line from '$lib/Builders/Line.svelte';
    import type { SecondaryUser, firebaseClient } from '$lib/Firebase/firebase.js';
    import { Menu, MenuButton, MenuItem, MenuItems } from '@rgossiaux/svelte-headlessui';
    import { getContext, onDestroy, onMount } from 'svelte';
    import EditProfile from '$lib/Members/EditProfile.svelte';
    import KickMember from '$lib/Members/KickMember.svelte';
    import type { Unsubscriber } from 'svelte/store';
    import { collection, query, where, type Unsubscribe, onSnapshot } from 'firebase/firestore';

    export let data;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let unsubscribeClient: Unsubscriber | undefined;
    let unsubscribeFirestoreQuarantined: Unsubscribe | undefined;
    let unsubscribeFirestoreVerified: Unsubscribe | undefined;

    onMount(() => {
        unsubscribeClient = client.subscribe(async (user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            const db = client.getFirestore();

            if(user.permissions.includes('KICK_MEMBERS')) {
                unsubscribeFirestoreQuarantined = onSnapshot(query(collection(db, "quarantine"), where('team', '==', user.team)), (snapshot) => {
                    let quarantinedMembers = new Array<typeof data.quarantinedMembers[0]>();

                    for(let i = 0; i < snapshot.docs.length; i++) {
                        if(snapshot.docs[i].data() != undefined) {
                            quarantinedMembers.push({
                                ...snapshot.docs[i].data()
                            } as typeof data.quarantinedMembers[0]);
                        }
                    }

                    data.quarantinedMembers = quarantinedMembers;
                });
            }

            unsubscribeFirestoreVerified = onSnapshot(query(collection(db, "users"), where('team', '==', user.team)), (snapshot) => {
                let users = new Array<SecondaryUser>();

                for(let i = 0; i < snapshot.docs.length; i++) {
                    users.push({
                        displayName: snapshot.docs[i].data().displayName as string,
                        level: snapshot.docs[i].data().level as number,
                        permissions: snapshot.docs[i].data().permissions as string[],
                        photoURL: snapshot.docs[i].data().photoURL as string,
                        pronouns: snapshot.docs[i].data().pronouns as string,
                        team: snapshot.docs[i].data().team as string,
                        roles: [],
                        role: snapshot.docs[i].data().role as string,
                        id: snapshot.docs[i].id
                    })
                }

                data.members = users;
            })
        });
    })

    onDestroy(() => {
        if(unsubscribeClient) unsubscribeClient();
        if(unsubscribeFirestoreQuarantined) unsubscribeFirestoreQuarantined();
    })
</script>

<Background bottom=4.5rem>
    <Page size=44rem expand let:top>
        <div class="flex justify-between min-w-full items-center">
            <div class="flex items-end">
                <h1 class="text-3xl font-light mr-2">Members</h1>
                <p class="text-sm mb-1 opacity-50">(Team {$client?.team})</p>
            </div>
            <!--<button class="b-default">Generate</button>-->
        </div>
        
        <Line class="mt-2"></Line>

        <div class="pt-4 grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-x-4 gap-y-1">
            {#each data.members as member}
                <div class="w-full m-2 flex items-center">
                    <a class="flex items-center overflow-hidden" href="/settings/members/{member.id}">
                        <img referrerpolicy="no-referrer" class="rounded-full w-8 h-8 mr-2" alt="{member.displayName} Profile" src="{member.photoURL}"/>
                        <div class="whitespace-nowrap overflow-hidden overflow-ellipsis">{member.displayName}{member.pronouns == "" ? "" :  " (" + member.pronouns + ")"}</div>
                    </a>
                    {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('KICK_MEMBERS') || member.level >= $client.level) &&  !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('MANAGE_CODES') || member.level >= $client.level)}
                        <Menu class="grow flex flex-row-reverse">
                            <MenuButton class="bg-black dark:bg-white transition bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 hover:dark:bg-opacity-5 rounded-full ml-1 h-9 w-9 flex items-center justify-around">
                                <Icon scale=1.25rem rounded={true} icon=more_vert/>
                            </MenuButton>
                            <EditProfile {member} form={data.forms.editProfile} let:handleEditProfile>
                            <KickMember {member} form={data.forms.kickForm} let:handleKickMember>
                            <MenuItems style="transform: translateY({36 - top}px);" class="fixed z-10 bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark flex flex-col">
                                {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('KICK_MEMBERS') || member.level >= $client.level)}
                                    <MenuItem let:active on:click={handleKickMember}>
                                        <div class="float-left w-full px-2 py-1 pr-8 bg-black dark:bg-white {active ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"} hover:bg-opacity-10 dark:hover:bg-opacity-10 transition text-left rounded-md hover:cursor-pointer">
                                            Kick
                                        </div> 
                                    </MenuItem>
                                {/if}
                                {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('MANAGE_CODES') || member.level >= $client.level)}
                                    <MenuItem let:active on:click={handleEditProfile}>
                                        <div class="float-left w-full px-2 py-1 pr-8 bg-black dark:bg-white {active ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"} hover:bg-opacity-10 dark:hover:bg-opacity-10 transition text-left rounded-md hover:cursor-pointer">
                                            Edit Profile
                                        </div>
                                    </MenuItem>
                                {/if}
                            </MenuItems>
                            </KickMember>
                            </EditProfile>
                        </Menu>
                    {/if}
                </div>
            {/each}
        </div>

        {#if data.quarantinedMembers.length != 0}
            <h2 class="mt-8 text-lg opacity-80">Kicked:</h2>
        {/if}

        <div class="pt-2 grid grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))] gap-x-4 gap-y-1">
            {#each data.quarantinedMembers as member}
                <div class="w-full m-2 flex items-center">
                    <a class="flex items-center overflow-hidden" href="/settings/members/{member.id}">
                        <img referrerpolicy="no-referrer" class="rounded-full w-8 h-8 mr-2" alt="{member.data.displayName} Profile" src="{member.data.photoURL}"/>
                        <div class="whitespace-nowrap overflow-hidden overflow-ellipsis">{member.data.displayName}{member.data.pronouns == "" ? "" :  " (" + member.data.pronouns + ")"}</div>
                    </a>
                    {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('KICK_MEMBERS'))}
                        <Menu class="grow flex flex-row-reverse">
                            <MenuButton class="bg-black dark:bg-white transition bg-opacity-0 dark:bg-opacity-0 hover:bg-opacity-5 hover:dark:bg-opacity-5 rounded-full ml-1 h-9 w-9 flex items-center justify-around">
                                <Icon scale=1.25rem rounded={true} icon=more_vert/>
                            </MenuButton>
                            <MenuItems style="transform: translateY({36 - top}px);" class="fixed bg-backgroud-light dark:bg-backgroud-dark p-1.5 border-border-light dark:border-border-dark border-[1px] rounded-lg shadow-lg shadow-shadow-light dark:shadow-shadow-dark flex flex-col">
                                <MenuItem let:active href="/settings/members/{member.id}/unkick?redirect=main">
                                    <div class="float-left w-full px-2 py-1 pr-8 bg-black dark:bg-white {active ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"} hover:bg-opacity-10 dark:hover:bg-opacity-10 transition text-left rounded-md hover:cursor-pointer">
                                        Unkick
                                    </div> 
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="flex mt-8">
            <a class="b-secondary w-fit flex items-center gap-1" href="/settings"><Icon scale=1.25rem icon=arrow_back></Icon>Back</a>
        </div>
    </Page>
</Background>