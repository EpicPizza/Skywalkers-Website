import type { User } from "firebase/auth";
import {
  writable,
  type Readable,
  type Writable,
  type Unsubscriber,
} from "svelte/store";
import { get } from "svelte/store";
import type {
  FirestoreUser,
  Teams,
  firebaseClient,
} from "$lib/Firebase/firebase";
import type { DocumentReference } from "firebase/firestore";
import { browser } from "$app/environment";
import { persisted } from "svelte-persisted-store";

//here for reference, instead these stores are made with setContext in root layout (or said otherwise).

//export const mode = createMode();
//export const verified = createVerified();

/*export const navmenu = writable(false);
export const scroll = writable<boolean>(true);
export const navmode = writable<boolean>(); //false - reduced, true - full
export const localLoading = writable<boolean>(); //on same page loading signals
export const loading = writable<boolean>(); //on navigation loading
export const dialogOpen = writable<boolean>();
export const previous = writable<string | undefined>(); //only used for knowing where to go back for updating profile for menu like expected behavior
export const onScroll = writable<boolean>(false); //boolean signifies nothing, just changes when scroll happens
export const warning = writable<Warning | undefined>(undefined);*/

export interface Warning {
  color: "red" | "yellow" | "aqua" | "green" | "default";
  message: string;
}

export function createMode() {
  const { subscribe, set, update }: Writable<"dark" | "light"> =
    writable("light");
  const system = writable(false);
  let last: undefined | string = undefined;

  const getSystemTheme = (): "dark" | "light" => {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const setCookie = (theme: string) => {
    document.cookie = "theme=" + theme;
    last = theme;
    localStorage.setItem("theme", theme);
  };

  const serverInit = (cookie: string | undefined) => {
    if (cookie == undefined) {
      system.set(true);
      return undefined;
    } else if (cookie.startsWith("system")) {
      system.set(true);
      if (cookie.length > 7) {
        let theme = cookie.substring(7, cookie.length);
        if (theme == "dark" || theme == "light") {
          set(theme);
        } else {
          throw new Error("invalid");
        }
      }
      return undefined;
    } else if (cookie == "dark" || cookie == "light") {
      set(cookie);
      system.set(false);
      return cookie;
    } else {
      throw new Error("invalid");
    }
  };

  const clientInit = () => {
    serverInit(localStorage.getItem("theme") ?? undefined);

    if (get(system)) {
      set(getSystemTheme());
      setCookie("system|" + getSystemTheme());
      updateScheme(getSystemTheme());
    } else {
      update((n) => {
        updateScheme(n);
        return n;
      });
    }

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", async (event) => {
        if (get(system)) {
          set(getSystemTheme());
          setCookie("system|" + getSystemTheme());
          updateScheme(getSystemTheme());
        }
      });

    addEventListener("storage", (event) => {
      if (event.key == "theme") {
        let newTheme: string | null | undefined = event.newValue;
        newTheme = newTheme ? newTheme : undefined;
        serverInit(newTheme);
        updateScheme(
          newTheme == undefined
            ? getSystemTheme()
            : newTheme?.endsWith("light")
              ? "light"
              : "dark",
        );
      }
    });
  };

  const updateScheme = (theme: string) => {
    document.documentElement.style.colorScheme = theme;
    document.body.classList.remove(theme == "dark" ? "light" : "dark");
    document.body.classList.add(theme);
  };

  const toggle = () => {
    update((n) => {
      setCookie(n == "dark" ? "light" : "dark");
      system.set(false);
      return n == "dark" ? "light" : "dark";
    });
  };

  const reset = () => {
    set(getSystemTheme());
    setCookie("system|" + getSystemTheme());
    system.set(true);
    updateScheme(getSystemTheme());
  };

  const setTheme = (theme: "light" | "dark") => {
    set(theme);
    setCookie(theme);
    system.set(false);
    updateScheme(theme);
  };

  return {
    serverInit: serverInit,
    toggle: toggle,
    clientInit: clientInit,
    reset: reset,
    set: setTheme,
    getSystemTheme: getSystemTheme,
    subscribeSystem: system.subscribe,
    subscribe,
  };
}

export function createPersistentWritable(key: string, initial: string) {
  const { set, subscribe } = writable<string>(initial);

  const clientInit = () => {
    set(localStorage.getItem(key) ?? initial);
  };

  const setPersistent = (value: string) => {
    localStorage.setItem(key, value);
    set(value);
  };

  const updatePersistent = (callback: (value: string) => string) => {
    const value = callback(get({ subscribe }));

    localStorage.setItem(key, value);
    set(value);
  };

  return {
    set: setPersistent,
    subscribe,
    update: updatePersistent,
    clientInit,
  };
}

export function createPermissions() {
  const { subscribe, set, update } = writable<string[]>([]);
  let unsubscribeTeam: Unsubscriber | undefined = undefined;
  let unsubscribeClient: Unsubscriber | undefined = undefined;

  const serverInit = (user: { teams: Teams } | undefined, team: string) => {
    if (user == undefined) return;

    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == team) {
        set(user.teams[i].permissions);
      }
    }
  };

  const clientInit = (
    client: ReturnType<typeof firebaseClient>,
    team: Writable<string>,
  ) => {
    if (unsubscribeTeam != undefined) {
      //just for development weirdness
      unsubscribeTeam();
      unsubscribeTeam = undefined;
    }

    if (unsubscribeClient != undefined) {
      //just for development weirdness
      unsubscribeClient();
      unsubscribeClient = undefined;
    }

    unsubscribeTeam = team.subscribe((current) => {
      const user = get({ subscribe: client.subscribe });

      if (user == undefined || user.teams == undefined) {
        set([]);
      } else {
        for (let i = 0; i < user.teams.length; i++) {
          if (user.teams[i].team == current) {
            set(user.teams[i].permissions);

            return;
          }
        }

        set([]);
      }
    });

    unsubscribeClient = client.subscribe((user) => {
      const currentTeam = get({ subscribe: team.subscribe });

      if (user == undefined || user.teams == undefined) {
        set([]);
      } else {
        for (let i = 0; i < user.teams.length; i++) {
          if (user.teams[i].team == currentTeam) {
            set(user.teams[i].permissions);

            return;
          }
        }

        set([]);
      }
    });
  };

  return {
    subscribe: subscribe,
    clientInit: clientInit,
    serverInit: serverInit,
  };
}

export function createCurrentTeam() {
  const { subscribe, set, update } = writable<Teams[0] | undefined>();
  let unsubscribeTeam: Unsubscriber | undefined = undefined;
  let unsubscribeClient: Unsubscriber | undefined = undefined;

  const serverInit = (user: { teams: Teams } | undefined, team: string) => {
    if (user == undefined) return;

    for (let i = 0; i < user.teams.length; i++) {
      if (user.teams[i].team == team) {
        set(user.teams[i]);
      }
    }
  };

  const clientInit = (
    client: ReturnType<typeof firebaseClient>,
    team: Writable<string>,
  ) => {
    if (unsubscribeTeam != undefined) {
      //just for development weirdness
      unsubscribeTeam();
      unsubscribeTeam = undefined;
    }

    if (unsubscribeClient != undefined) {
      //just for development weirdness
      unsubscribeClient();
      unsubscribeClient = undefined;
    }

    unsubscribeTeam = team.subscribe((current) => {
      const user = get({ subscribe: client.subscribe });

      if (user == undefined || user.teams == undefined) {
        set(undefined);
      } else {
        for (let i = 0; i < user.teams.length; i++) {
          if (user.teams[i].team == current) {
            set(user.teams[i]);

            return;
          }
        }

        set(undefined);
      }
    });

    unsubscribeClient = client.subscribe((user) => {
      const currentTeam = get({ subscribe: team.subscribe });

      if (user == undefined || user.teams == undefined) {
        set(undefined);
      } else {
        for (let i = 0; i < user.teams.length; i++) {
          if (user.teams[i].team == currentTeam) {
            set(user.teams[i]);

            return;
          }
        }

        set(undefined);
      }
    });
  };

  return {
    subscribe: subscribe,
    clientInit: clientInit,
    serverInit: serverInit,
  };
}

export function createVerified() {
  const { subscribe, set, update } = writable<boolean>();
  let unsubscribe: Unsubscriber | undefined = undefined;

  const serverInit = (value: boolean) => {
    set(value);
  };

  const clientInit = (
    client: ReturnType<typeof firebaseClient>,
    team: Writable<string>,
  ) => {
    if (unsubscribe != undefined) {
      //just for development weirdness
      unsubscribe();
      unsubscribe = undefined;
    }

    unsubscribe = client.subscribe((value) => {
      if (value == undefined || value.teams == undefined) {
        set(false);
      } else {
        set(true);
      }
    });
  };

  return {
    subscribe: subscribe,
    clientInit: clientInit,
    serverInit: serverInit,
  };
}

interface Link {
  href: string;
  display: string;
  protected: boolean;
  specific: boolean;
}

export const navLinks: Writable<Link[]> = writable([
  {
    href: "/",
    display: "Home",
    protected: false,
    specific: false,
  },
  {
    href: "/meetings",
    display: "Meetings",
    protected: true,
    specific: true,
  },
  {
    href: "/hours",
    display: "Hours",
    protected: true,
    specific: true,
  },
  {
    href: "/batteries",
    display: "Batteries",
    protected: true,
    specific: true,
  },
  {
    href: "/schedule",
    display: "Scheduler",
    protected: true,
    specific: true,
  },
]);

export function devMode() {
  const { subscribe, set, update } = persisted("dev", false);

  return {
    subscribe,
    set,
    update,
  };
}

//https://svelte.dev/repl/0ace7a508bd843b798ae599940a91783?version=3.16.7
export function clickOutside(node: HTMLElement) {
  const handleClick = (event: any) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent("click_outside", node as any));
    }
  };

  document.addEventListener("click", handleClick, true);

  return {
    destroy() {
      document.removeEventListener("click", handleClick, true);
    },
  };
}
