<script lang="ts">
  import Dialog from "$lib/Builders/Dialog.svelte";
  import Error from "$lib/Builders/Error.svelte";
  import Icon from "$lib/Builders/Icon.svelte";
  import Line from "$lib/Builders/Line.svelte";
  import Loading from "$lib/Builders/Loading.svelte";
  import { superForm } from "sveltekit-superforms/client";
  import type { SuperValidated } from "sveltekit-superforms";
  import type { Role, RoleForm } from "./role";

  export let open: boolean = false;
  export let role: Role;
  let colorElement: HTMLElement;
  let editForm: SuperValidated<typeof RoleForm>;
  export { editForm as form };

  console.log(role.id);

  const { tainted, allErrors, reset, message, form, enhance, delayed } =
    superForm(editForm, { id: "edit" });

  $: {
    if ($message == "Role Edited") {
      open = false;
    }
  }

  $: ((open) => {
    if (!form) return;
    reset();
    form.set({
      name: role.name,
      color: role.color,
    });
    tainted.set({});
  })(open);

  $: console.log($message, $allErrors, $form);

  let initialFocus: HTMLElement;
</script>

<Dialog bind:isOpen={open} width="24rem" bind:initialFocus>
  <h1 class="text-2xl" slot="title">Edit Role</h1>

  <div slot="content" class="mt-4">
    <form method="POST" action="?/edit" use:enhance>
      <Line class="mb-4"></Line>
      <div class="flex items-center">
        <h2 class="text-lg mr-2">Name:</h2>
        <input
          name="name"
          bind:value={$form.name}
          class="rounded-md p-1 w-full"
        />
      </div>
      <div class="flex items-center mt-3">
        <h2 class="text-lg mr-2">Color:</h2>
        <div class="w-6 h-6 hover:cursor-pointer rounded-full overflow-hidden">
          <input
            tabindex="-1"
            name="color"
            bind:value={$form.color}
            bind:this={colorElement}
            type="color"
            class="w-12 h-12 -translate-x-2 -translate-y-2"
          />
        </div>
        <button
          class="ml-1"
          on:click={(e) => {
            e.preventDefault();
            if (colorElement) {
              colorElement.click();
            }
          }}
        >
          <Icon icon="edit" scale="1.25rem"></Icon>
        </button>
      </div>
      <Error {message} disallowMessage="Role Edited" {allErrors}></Error>
      <Line class="my-4"></Line>

      <div class="flex flex-row-reverse">
        <button class="b-green">Save</button>
        <button
          bind:this={initialFocus}
          class="b-default mr-2 ml-2"
          on:click={(e) => {
            e.preventDefault();
            open = !open;
          }}>Cancel</button
        >
        {#if $delayed}
          <div class="scale-75 flex items-center h-[2.125rem] overflow-hidden">
            <Loading></Loading>
          </div>
        {/if}
      </div>
    </form>
  </div>
</Dialog>
