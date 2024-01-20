<script lang="ts">
  import { writable, type Readable, type Writable } from "svelte/store";

  export let allErrors: Writable<any> | Readable<any> = writable([]);
  export let message: Writable<any> | Readable<any>;
  export let disallowMessage: string = "";
</script>

{#if $allErrors.length || ($message && (disallowMessage == "" || !$message.includes(disallowMessage)))}
  <div class="w-full h-4"></div>
{/if}
{#if $allErrors.length}
  <ul>
    {#each $allErrors as error}
      <li>
        {#if Array.isArray(error.messages)}
          {#each error.messages as code_error}
            <p class="text-red-500 dark:text-red-500 font-bold">{code_error}</p>
          {/each}
        {:else}
          <p class="text-red-500 dark:text-red-500 font-bold">
            {error.messages}
          </p>
        {/if}
      </li>
    {/each}
  </ul>
{/if}
{#if $message && (disallowMessage == "" || !$message.includes(disallowMessage))}
  <p class="text-red-500 dark:text-red-500 font-bold">{$message}</p>
{/if}
