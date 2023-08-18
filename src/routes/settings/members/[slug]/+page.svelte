<script lang=ts>
    import Background from "$lib/Builders/Background.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient, SecondaryUser } from "$lib/Firebase/firebase.js";
    import EditProfile from "$lib/Members/EditProfile.svelte";
    import KickMember from "$lib/Members/KickMember.svelte";
    import RolePermission from "$lib/Roles/RolePermission.svelte";
    import { doc, DocumentReference, onSnapshot, type Unsubscribe } from "firebase/firestore";
    import { getContext, onDestroy, onMount } from "svelte";
    import type { Unsubscriber, Writable } from "svelte/store";
    import OnDestroy from "../../../../lib/Members/OnDestroy.svelte";
    import RoleTag from "../../../../lib/Members/RoleTag.svelte";
    import StatusTag from "../../../../lib/Members/StatusTag.svelte";
    import ProfileTag from "../../../../lib/Members/ProfileTag.svelte";
    import RoleViewer from "../../../../lib/Members/RoleViewer.svelte";
    import type { Role } from "$lib/Roles/role";
    import type { QuarantinedMember } from "$lib/Members/manage.server";
    import { invalidate } from "$app/navigation";

    export let data;

    let client = getContext('client') as ReturnType<typeof firebaseClient>;

    let localLoading = getContext('localLoading') as Writable<boolean>;
    let loading = getContext('loading') as Writable<boolean>;

    let unsubscribeClient: Unsubscriber | undefined;
    let unsubscribeFirestore: Unsubscribe | undefined;

    onMount(() => {
        unsubscribeClient = client.subscribe((user) => {
            if(user == undefined || 'preload' in user || user.team == undefined) return;

            if(unsubscribeClient) unsubscribeClient();
            if(unsubscribeFirestore) unsubscribeFirestore();

            if(data.member.kicked == false) {
                subscribeVerified();
            } else {
                subscribeKicked();
            }
        })
    })

    function subscribeKicked() {
        const db = client.getFirestore();

        const ref = doc(db, "quarantine", data.member.user.id);

        unsubscribeFirestore = onSnapshot(ref, async (snapshot) => {
            if(!snapshot.exists()) {
                if($loading == true) {
                    await invalidate('member-' + snapshot.id);
                    
                    return;
                }

                if(unsubscribeFirestore) unsubscribeFirestore();

                $loading = true;

                data.member.kicked = false;

                subscribeVerified();

                return;
            }

            if(snapshot.data() == undefined) return;
            if(data.member.kicked == false) return;

            data.member.user = {
                ...snapshot.data(),
            } as QuarantinedMember

            $loading = false;
        });
    }

    function subscribeVerified() {
        const db = client.getFirestore();

        const ref = doc(db, "users", data.member.user.id);

        unsubscribeFirestore = onSnapshot(ref, async (snapshot) => {
            if(!snapshot.exists()) {
                if($client != undefined && $client.permissions != undefined && $client.permissions.includes('KICKED_MEMBERS')) {
                    if($loading == true) {
                        await invalidate('member-' + snapshot.id);
                        
                        return;
                    }

                    if(unsubscribeFirestore) unsubscribeFirestore();

                    $loading = true;

                    data.member.kicked = true;

                    subscribeKicked();

                    return;
                } else {
                    await invalidate('member-' + snapshot.id);

                    return;
                }
            }

            if(snapshot.data() == undefined) return;
            if(data.member.kicked == true) return;

            let roleRefs = snapshot.data()?.roles as DocumentReference[];

            let roles = new Array<Role>();

            for(let i = 0; i < roleRefs.length; i++) {
                let role = await client.getRole(roleRefs[i].id);
                if(role != undefined) {
                    roles.push(role);
                }
            }

            data.member.user = {
                ...snapshot.data(),
                id: data.member.user.id,
                roles: roles,
            } as SecondaryUser

            $loading = false;
        })
    }

    onDestroy(() => {
        if(unsubscribeClient) unsubscribeClient();
        if(unsubscribeFirestore) unsubscribeFirestore();

        $loading = false;
    })
</script>

<svelte:head>
    <title>Skywalkers | Member Info</title>
</svelte:head>

<Background>
    <Page expand size="46rem" disableLoader>
        {#if data.member.kicked}
            <ProfileTag id={data.member.user.id} member={data.member.user.data}/>
            <div class="flex w-full mt-6 gap-2 flex-row-reverse items-center">
                <a href="/settings/members/{data.member.user.id}/unkick" class="b-primary">Unkick</a>
                <div class="grow">
                    <a class="b-secondary w-fit flex items-center gap-1" href="/settings/members"><Icon scale=1.25rem icon=arrow_back></Icon>Back</a>
                </div>
            </div>
        {:else}
            <ProfileTag verified id={data.member.user.id} member={data.member.user}/>
            <RoleViewer member={data.member.user} roles={data.roles}/>
            <div class="flex flex-row-reverse mr-2">
                <div class="opacity-75 flex items-center mt-4 ">
                    <Icon scale={0}  class="ml-1 text-[1.5rem] w-[1.5rem] h-[1.5rem] lg:text-[1.75rem] lg:w-[1.75rem] lg:h-[1.75rem]" icon=info></Icon>
                    <p class="ml-2 lg:text-lg">Kicking members will reset their hours.</p>
                </div>
            </div>
            <div class="flex w-full mt-4 gap-2 flex-row-reverse items-center">
                {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('KICK_MEMBERS') || data.member.user.level >= $client.level)}
                    <KickMember disableSuccessMessage member={data.member.user} form={data.forms.kick} let:handleKickMember>
                        <button on:click={handleKickMember} class="b-primary">Kick</button>
                    </KickMember>
                {/if}
                {#if !($client == undefined || $client.permissions == undefined || $client.level == undefined || !$client.permissions.includes('MANAGE_CODES') || data.member.user.level >= $client.level)}
                    <EditProfile member={data.member.user} form={data.forms.edit} let:handleEditProfile>
                        <button on:click={handleEditProfile} class="b-primary">Edit Profile</button>
                    </EditProfile>
                {/if}
                {#if $localLoading}
                    <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                        <Loading></Loading>
                    </div>
                {/if}
                <div class="grow">
                    <a class="b-secondary w-fit flex items-center gap-1" href="/settings/members"><Icon scale=1.25rem icon=arrow_back></Icon>Back</a>
                </div>
            </div>
            <OnDestroy/>
        {/if}
    </Page>
</Background>