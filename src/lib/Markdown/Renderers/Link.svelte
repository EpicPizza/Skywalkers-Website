<script lang="ts">
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";

  export let href: string = "";
  export let title: string | undefined = undefined;

  let domain = "";
  let beginning = "";
  let ending = "";

  function warn(e: Event) {
    if (localStorage.getItem("goto:" + domain) == "allow") return;

    e.preventDefault();

    let url = new URL(href);

    console.log(new URL(href));

    if (url.protocol != "http:" && url.protocol != "https:") return;

    domain = url.host;

    donotaskagain = false;
    open = true;

    beginning = url.protocol + "//";
    ending = url.href.substring((beginning + domain).length);
  }

  let open = false;
  let donotaskagain = false;

  function check() {
    if (donotaskagain) {
      localStorage.setItem("goto:" + domain, "allow");
    }
  }
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<a
  class="text-blue-500 leading-7 dark:text-blue-500 hover:underline inline"
  target="_blank"
  {href}
  on:click={warn}
  {title}><slot /></a
>

<Dialog width="20rem" bind:isOpen={open}>
  <h1 class="text-2xl" slot="title">You are leaving to</h1>

  <Line class="mt-4"></Line>

  <p
    class="p-2 mt-4 mb-1 rounded-lg bg-primary-200 dark:bg-primary-800 bg-opacity-25 break-all"
  >
    <span class="opacity-75">{beginning}</span><span class="font-bold"
      >{domain}</span
    ><span class="opacity-75">{ending}</span>
  </p>

  <div class="flex items-center gap-1 mt-2">
    <button
      on:click={() => {
        donotaskagain = !donotaskagain;
      }}
      class="p-0.5 {donotaskagain
        ? 'border-blue-700 dark:border-blue-500 bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-500'
        : 'border-border-light dark:border-border-dark text-border-light dark:text-border-dark'} border-[1px] rounded-md m-0.5 transition disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon icon="check" scale="1rem"></Icon>
    </button>
    <p class="text-sm opacity-50">Do not ask again for {domain}.</p>
  </div>

  <Line class="mt-4 mb-4"></Line>

  <div class="flex flex-row-reverse">
    <div class="flex flex-row gap-2">
      <button
        on:click={() => {
          open = !open;
        }}
        class="b-default">Cancel</button
      >
      <button
        class="b-green"
        on:click={() => {
          open = !open;
          window.open(href, "_blank");
          check();
        }}>Continue</button
      >
    </div>
  </div>
</Dialog>
