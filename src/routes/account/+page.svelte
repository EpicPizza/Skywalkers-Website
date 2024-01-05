<script lang=ts>
    import { goto, invalidate, invalidateAll } from "$app/navigation";
    import Background from "$lib/Builders/Background.svelte";
    import Dialog from "$lib/Builders/Dialog.svelte";
    import Ellipse from "$lib/Builders/Ellipse.svelte";
    import Error from "$lib/Builders/Error.svelte";
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import Loading from "$lib/Builders/Loading.svelte";
    import Page from "$lib/Builders/Page.svelte";
    import type { firebaseClient } from "$lib/Firebase/firebase";
    import Footer from "$lib/Nav/Footer.svelte";
    import type { Warning, createPersistentWritable, createVerified } from "$lib/stores";
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import { onMount } from "svelte";
    import { superForm } from "sveltekit-superforms/client";
    import colors from "tailwindcss/colors";
    import Tooltip from "$lib/Builders/Tooltip.svelte";
    import Menu from '$lib/Batteries/Menu.svelte';

    let client = getContext('client') as ReturnType<typeof firebaseClient>;
    let verified = getContext('verified') as ReturnType<typeof createVerified>;
    let warning = getContext('warning') as Writable<Warning | undefined>;
    let dev = getContext('dev') as Writable<boolean>;

    let open = false;
    let confirmOpen = false;

    export let data;

    let selected: number = -1;

    const { enhance, form, delayed, message, allErrors, reset } = superForm(data.form);

    $: {
        if($message == 'Code Sent') {
            open = false;
            $message = undefined;
            confirmOpen = true;
        } else if($message == 'Verified') {
            confirmOpen = false;
            invalidate("discord-link").then(() => {
                init();
            });
        } else if($message != undefined && confirmOpen == false) {
            warning.set({
                color: 'red',
                message: $message,
            })
        }
    }

    let linked: string | undefined = undefined;

    onMount(async () => {
        await init();
    });

    async function init() {
        let users = await data.stream.users;

        if(users == undefined || data.id == undefined) return;

        for(let i = 0; i < users.length; i++) {
            if(users[i].id == data.id) {
                linked = users[i].username + (users[i].discrim = "0" ? "" : "#" + users[i].discrim);
            }
        }
    }

    async function changePreference(preference: string) {
        if(preference == 'Phone') {
            phoneOpen = true;
            phoneNumber = "";
            
            return;
        }

        preference = preference.toLowerCase();

        await fetch('/account/confirmations/' + preference, {
            method: 'POST'
        });

        invalidate("conf-preference");
    }

    let phoneOpen = false;
    let phoneNumber = "";
    let phoneError = "";

    async function finishPhone() {
        phoneError = "";
        
        const res = await fetch('/account/confirmations/phone', {
            method: 'POST',
            body: phoneNumber,
        });

        if(res.status == 400) {
            phoneError = "Invalid Phone Number";
        } else {
            phoneOpen = false;

            invalidate("conf-preference");
        }
    }
</script>

<svelte:head>
    <title>Skywalkers | Account</title>
</svelte:head>

<Background>
    <Page expand size=24rem>
        <h1 class="text-2xl font-bold">Your Account</h1>
        <Line class="mb-6 mt-2"></Line>
        {#if $verified}
            <div class="flex items-center justify-between">
                <p>Linked discord account: </p>
                <div class="flex gap-2 h-[34px]">
                    <button disabled={data.id != undefined} class="b-accent h-[34px]" on:click={() => { open = !open; reset(); selected = -1; }}>
                        {#if data.id == undefined}
                            <Icon icon=add></Icon>
                        {:else if linked == undefined}
                            Loading<Ellipse/>
                        {:else}
                            {linked}
                        {/if}
                    </button>
                    {#if data.id != undefined}
                        <form use:enhance method=POST>
                            <button on:click={() => { reset(); selected = -1; }} class="b-primary min-h-[34px]">
                                <Icon icon=remove></Icon>
                            </button>
                        </form>
                    {/if}
                </div>
            </div>
            <div class="flex items-center justify-between mt-2 pb-1">
                <p>Developer mode:</p>
                <button on:click={() => { $dev = !$dev; }} class="p-1 {$dev ? "border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500" : "border-border-light dark:border-border-dark text-border-light dark:text-border-dark"} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40">
                    <Icon icon=check></Icon>
                </button>
            </div>
            <div class="flex items-center justify-between mt-1 pb-1">
                <p>Recieve confirmations via:</p>
                <Menu raw={true} selected={data.preference} choices={["Email", "Discord", "Phone", "None"]} on:select={(e) => { changePreference(e.detail); }}>
                    <button class="b-secondary">
                        {data.preference}
                    </button>
                </Menu>
            </div>
        {:else}
            <div class="bg-yellow-500 bg-opacity-20 dark:bg-opacity-10 dark:text-yellow-500 text-yellow-900 flex rounded-lg p-4 gap-3">
                <Icon scale=2rem icon=warning></Icon>
                <p>There are no other settings available for unverified users.</p>
            </div>
        {/if}
        <div class="mt-6 flex justify-between items-center">
            <a href="/" class="b-primary flex items-center gap-1 w-fit">
                <Icon scale=1.25rem icon=arrow_back></Icon>Back Home
            </a>
            <a href="/account/delete" class="b-red float-right ml-2">
                Delete Account
             </a>
        </div>
    </Page>
</Background>

<Dialog bind:isOpen={confirmOpen} width=24rem>
    <h1 slot=title class="text-2xl">Connect Discord Account</h1>

    <div slot=description>
        <Line class="mt-4"></Line>
    </div>

    <p class="mt-4">Run the discord slash command <strong>/link</strong> on the Skywalkers Bot to get a code. Then enter the code here to finish linking.</p>

    <form use:enhance method=POST class="mt-6">
        <div class="w-[5.375rem]">
            <p class="text-sm -mt-5  translate-x-2 translate-y-4 w-min whitespace-nowrap bg-white dark:bg-zinc-800 px-1 leading-4">Code:</p>
            <input autocomplete="off" bind:value={$form.verify} placeholder=000000 name="verify" class="p-2 mt-2 w-full bg-white border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 border-[1px] rounded-md pl-3" type="string">
        </div>

        <Error {allErrors} {message} disallowMessage="Verified"></Error>

        <Line class="my-4"></Line>

        <div class="flex flex-row-reverse">  
            <button disabled={$form.verify == undefined || $form.verify == ""} class="b-green disabled:opacity-50 disabled:cursor-not-allowed">Confirm</button>
            <button class="b-default mr-2 ml-1" on:click|preventDefault={(e) => { e.preventDefault(); confirmOpen = !confirmOpen; reset(); selected = -1; }}>Cancel</button>
            {#if $delayed}
                <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                    <Loading></Loading>
                </div>
            {/if}
        </div>
    </form>
</Dialog>

<Dialog bind:isOpen={open} width=24rem>
    <h1 slot=title class="text-2xl">Connect Discord Account</h1>

    <div slot=description>
        <Line class="mt-4"></Line>
    </div>

    <div slot=content class="py-2 h-[calc(100dvh-17rem)] overflow-auto overflow-y-visible">
        {#await data.stream.users}
            <div class="flex justify-around">
                <Loading></Loading>
            </div>
        {:then users}
            {#if users != undefined}
                {#each users as user, i}
                    <button on:click={() => { selected = i; $form.id = user.id; }} class="flex w-full items-center transition rounded-md p-2 mb-1 bg-black dark:bg-white {selected == i ? "bg-opacity-10 dark:bg-opacity-10" : "bg-opacity-0 dark:bg-opacity-0"} hover:bg-opacity-10 dark:hover:bg-opacity-10">
                        <div style="background-color: {user.color == null ? colors.gray["500"] : user.color};" class="w-6 h-6 mr-2 rounded-full"></div>
                        <p>{user.username}{user.discrim == "0" ? "" : "#" + user.discrim}</p>
                    </button>
                {/each}
            {/if}
        {/await}
    </div>

    <Line class="mb-4"></Line>

    <div class="flex justify-between">
        {#await data.stream.users}
            <div class="w-full h-[34px]"></div>
        {:then users}
            {#if users != undefined}
                <div>
                    {#if selected != undefined && selected > -1}
                        <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                            <div style="background-color:  {users[selected].color == null ? colors.gray["500"] : users[selected].color};" class="w-4 h-4 mr-2 rounded-full"></div>
                            <p class="text-sm">{users[selected].username}{users[selected].discrim == "0" ? "" : "#" + users[selected].discrim}</p>
                        </div>
                    {:else if selected != undefined}
                        <div class="flex w-auto items-center transition rounded-md px-3 py-[7px] bg-black dark:bg-white bg-opacity-10 dark:bg-opacity-10">
                            <p class="text-sm">None Selected</p>
                        </div>
                    {/if}
                </div>
                <div>
                    <form use:enhance method=POST>
                        <input hidden type='text' name=id bind:value={$form.id}/>
                        <div class="flex">  
                            {#if $delayed}
                                <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
                                    <Loading></Loading>
                                </div>
                            {/if}
                            <button class="b-default mr-2 ml-1" on:click|preventDefault={(e) => { e.preventDefault(); open = !open; reset(); selected = -1; }}>Cancel</button>
                            <button disabled={selected == -1} class="b-green disabled:opacity-50 disabled:cursor-not-allowed">Connect</button>
                        </div>
                    </form>
                </div>
            {/if}
        {/await}
    </div>
</Dialog>

<Dialog bind:isOpen={phoneOpen} width=24rem>
    <h1 slot=title class="text-2xl">Add Phone Number</h1>

    <div slot=description>
        <Line class="mt-4"></Line>
    </div>

    <p class="mt-4">North American phone numbers only.</p>

    <div class="w-[5.375rem] mt-4">
        <p class="text-sm -mt-5 translate-x-2 translate-y-4 w-min whitespace-nowrap bg-white dark:bg-zinc-800 px-1 leading-4">Phone Number:</p>
        <input autocomplete="off" bind:value={phoneNumber} placeholder="000-000-0000" name="phone" class="p-2 mt-2 bg-white border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 border-[1px] rounded-md pl-3" type="string">
    </div>

    {#if phoneError != ""}
        <p class="mt-2 text-red-500 font-bold">{phoneError}</p>
    {/if}

    <Line class="my-4"></Line>

    <div class="flex flex-row-reverse">  
        <button disabled={phoneNumber.length == 0} on:click={finishPhone} class="b-green disabled:opacity-50 disabled:cursor-not-allowed">Add</button>
        <button class="b-default mr-2 ml-1" on:click|preventDefault={(e) => { e.preventDefault(); phoneOpen = !phoneOpen; }}>Cancel</button>
    </div>
</Dialog>