<script>
    import Icon from "$lib/Builders/Icon.svelte";
    import Line from "$lib/Builders/Line.svelte";
    import { client } from "$lib/Firebase/firebase";
    import colors from 'tailwindcss/colors';
    import { mode, navmode } from "$lib/stores";
    import { Menu, MenuButton, MenuItem, MenuItems } from "@rgossiaux/svelte-headlessui";

    let x = Math.pow(Math.tan((Math.PI / 180) * 65), -1);

    $: console.log(x);
</script>

{#if $client == undefined}
    <button disabled class="b-bold whitespace-nowrap">Signed Out</button>
{:else if 'preload' in $client}
    <div class="h-full w-auto flex flex-col justify-around">
        <img referrerpolicy="no-referrer" alt="profile" src="{$client.photoURL}" class="h-10 w-10 rounded-full">
    </div>
{:else if typeof $client == 'object'}
    <Menu class="h-auto">
        <MenuButton class="b-clear flex flex-row-reverse">
            <div style="transform: rotate(330deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] z-10 border-transparent border-t-red-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <div style="transform: rotate(270deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] border-transparent border-t-green-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <div style="transform: rotate(210deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] border-transparent border-t-yellow-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <div style="transform: rotate(150deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] border-transparent border-t-purple-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <div style="transform: rotate(90deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] border-transparent border-t-orange-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <div style="transform: rotate(30deg); clip-path: polygon({((x * 50) + 50)}% 0%, {( 50 - (x * 50))}% 0%, 50% 50%);" class="border-[2px] border-transparent border-t-blue-500 h-[2.75rem] w-[2.75rem] -ml-[2.75rem] rounded-full"></div>
            <img referrerpolicy="no-referrer" alt="profile" src="{$client.photoURL}" class="h-9 w-9 m-1 rounded-full">
        </MenuButton>
        <MenuItems class="bg-backgroud-light absolute dark:bg-backgroud-dark border-border-light dark:border-border-dark shadow-shadow-light dark:shadow-shadow-dark shadow-lg translate-y-1 {$navmode == true ? 'right-2' : 'right-0'} box-border border-[1px] rounded-lg overflow-y-auto flex-col flex p-2 max-w-none">
            <MenuItem disabled href="/settings" class="p-2 py-1 rounded-t-md rounded-sm cursor-default">
                <div class="flex flex-row items-center">
                    <img referrerpolicy="no-referrer" alt="profile" src="{$client.photoURL}" class="h-14 w-14 rounded-full">
                    <div class="ml-3">
                        <p>{$client.displayName}</p>
                        <p class="opacity-75">{$client.email}</p>
                    </div>
                </div>
            </MenuItem>
            <Line class="my-2"/>
            <div class="flex flex-row">
                <MenuItem on:click={client.signOut} class="hover:cursor-pointer rounded-sm rounded-bl-md b-menu w-full flex justify-around items-center hover:after:content-['Sign_out'] hover:after:absolute hover:after:-translate-y-[1.825rem] tooltip">
                    <Icon icon=logout scale=1.75rem></Icon>
                </MenuItem>
                <MenuItem on:click={client.reset} class="hover:cursor-pointer rounded-sm b-menu w-full flex justify-around items-center hover:after:content-['Sign_out_of_all_devices'] hover:after:absolute hover:after:-translate-y-[1.825rem] tooltip">
                    <Icon icon=lock_reset scale=1.75rem></Icon>
                </MenuItem>
                <MenuItem class="hover:cursor-pointer rounded-br-md rounded-sm b-menu w-full flex justify-around items-center hover:after:content-['Settings'] hover:after:absolute hover:after:-translate-y-[1.825rem] tooltip">
                    <Icon icon=settings scale=1.75rem></Icon>
                </MenuItem>
            </div>
            <!--<hr>
            <MenuItem href="/settings" class="rounded-sm b-menu">
                Settings
            </MenuItem>
            <MenuItem href="/settings" class="rounded-b-md rounded-sm b-menu">
                Settings
            </MenuItem>-->
        </MenuItems>
    </Menu>
{/if}

<style lang=postcss>
    hr {
        @apply my-2 border-zinc-200 dark:border-zinc-700;
    }
</style>