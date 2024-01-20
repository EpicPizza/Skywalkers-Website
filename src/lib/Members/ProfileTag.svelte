<script lang=ts>
    import RoleTag from "./RoleTag.svelte";
    import StatusTag from "./StatusTag.svelte";

    export let id: string;
    export let member: { photoURL: string, displayName: string, pronouns: string };
    export let role: string;
    export let verified = false;
</script>

<div class="flex items-center">
    <img class="rounded-full w-14 sm:w-16" referrerpolicy="no-referrer" src="{member.photoURL}" alt="{member.displayName}'s Profile">
    <div class="ml-3 sm:ml-4 overflow-hidden">
        <div class="flex">
            <h1 class="text-xl sm:text-2xl overflow-hidden whitespace-nowrap overflow-ellipsis">{member.displayName}{member.pronouns == "" ? "" : " (" + member.pronouns + ")"}</h1>
            <RoleTag role={role}/>
        </div>
        <p class="mt-1 text-sm sm:text-base overflow-hidden whitespace-nowrap overflow-ellipsis">ID: {id}</p>
    </div>
    <div class="grow hidden sm:flex flex-row-reverse mb-auto">
        <StatusTag {verified}/>
    </div>
</div>

<div class="grow flex sm:hidden mt-5 gap-3">
    <StatusTag {verified} reduced/>
    <RoleTag reduced role={role}/>
</div>