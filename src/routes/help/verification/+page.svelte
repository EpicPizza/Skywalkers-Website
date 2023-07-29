<script lang=ts>
    import { page } from "$app/stores";
    import Line from "$lib/Builders/Line.svelte";
    import Link from "$lib/Builders/Link.svelte";
</script>

<h1 class="font-bold text-4xl tracking-wide">The Verification Process</h1>
<p class="mt-2 opacity-75">Last updated 7/26/2023</p>
<Line class="my-4 mb-6"></Line>

<h2 class="font-bold opacity-80 text-lg mb-3">What new users see:</h2>
<p class="leading-7">New users do not get access to team resources on first sign in. Instead, they get redirected to the <span class="font-bold underline">/verify</span> page. Here they can enter the codes sent to them. The personal codes change between each set of codes, however the team code always stays the same.</p>

<!-- svelte-ignore a11y-img-redundant-alt -->
<img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Verify page for new users who have not been verified." src="/verify_page.png"/>

<p class="leading-7 mt-6">Once they click next, they get a confirmation message. This confirmation message includes the email to confirm the email they will be using, and the code just in case.</p>

<img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Verify page for new users who have not been verified." src="/verify_confirm.png"/>

<p class="leading-7 mt-6">Another verification method is via link. Once the link is sent to the team member, they can navigate to the link and sign in. They then get a final join button the verifies their account.</p>

<img class="w-full mt-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Verify page via link for new users." src="/verify_link.png"/>

<p class="leading-7 mt-6">Either way, the default permissions from the everyone role get applied to the user and they are now able to access any team resources allowed by the default permissions. Their profile can also now be edited if allowed by the default permissions.</p>

<h2 class="font-bold opacity-80 text-lg mb-3 mt-10">How to manage:</h2>
<p class="leading-7">If a team member has the permission to manage codes, they can navigate to the settings for codes through the profile menu on the top right. On this page, new codes can be created and designated for mentors, students, and parents. Each set of codes comes with their own link, and can also be restricted to an email for secruity.</p>

<img class="w-full my-6 border-border-light dark:border-border-dark border-[1px] rounded-xl" alt="Page for editing codes." src="/codes.png"/>

<p class="leading-7 mb-4">Members can also be kicked through the member list page, the link to this page is located at the same place as the link for the code settings. More information about kicked users can be found <Link href="/help/kicked">here</Link>.</p>