import type { User } from "firebase/auth";
import { writable, type Readable, type Writable } from "svelte/store";
import { get } from 'svelte/store';

export const mode = createMode();

export const navmenu = writable(false);
export const scroll = writable<boolean>(true);
export const navmode = writable<boolean>(); //false - reduced, true - full
export const localLoading = writable<boolean>(); //on same page loading signals
export const loading = writable<boolean>(); //on navigation loading
export const team = writable<boolean>(false);

interface Warning {
    color: 'red' | 'yellow' | 'aqua' | 'green' | 'default',
    message: string,
}

export const warning = writable<Warning | undefined>(undefined);

function createMode() {
    const { subscribe, set, update }: Writable<'dark' | 'light'> = writable('light');
    const system = writable(false);
    let last: undefined | string = undefined;

    const getSystemTheme = (): 'dark' | 'light' => {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    const setCookie = (theme: string) => {
        document.cookie = "theme=" + theme;
        last = theme;
    }

    const serverInit = (cookie: string | undefined) => {
        if(cookie == undefined) {
            system.set(true);
            return undefined;
        } else if(cookie.startsWith('system')) {
            system.set(true);
            if(cookie.length > 7) {
                let theme = cookie.substring(7, cookie.length);
                if(theme == 'dark' || theme == 'light') {
                    set(theme);
                } else {
                    throw new Error("invalid");
                }
            }
            return undefined;
        } else if(cookie == 'dark' || cookie == 'light') {
            set(cookie);
            system.set(false);
            return cookie;
        } else {
            throw new Error("invalid");
        }
    }

    const clientInit = () => {
        if(get(system)) {
            set(getSystemTheme());
            setCookie('system|' + getSystemTheme());
            updateScheme(getSystemTheme());
        } else {
            update((n) => { updateScheme(n); return n; });
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async event => {
            if(get(system)) {
                set(getSystemTheme());
                setCookie('system|' + getSystemTheme());
                updateScheme(getSystemTheme());
            }
        });

        last = getCookie();

        //ignore these 6 errors, intervals do not get cleared between preview reloads, so this is a way delete old intervals

        if(window.interval != undefined) { clearInterval(window.interval); window.interval = undefined; }

        window.interval = setInterval(() => {
            let current = getCookie();
            if(last != current) {
                last = current;
                let cookiecontext = serverInit(current);
                updateScheme(cookiecontext == undefined ? getSystemTheme() : current?.endsWith('light') ? 'light' : 'dark');
            }
        }, 1000);
    }

    const getCookie = () => {
        if(Array.isArray(('; '+document.cookie).split(`; theme=`)) && ('; '+document.cookie).split(`; theme=`).pop() != undefined) {
            return ('; '+document.cookie).split(`; theme=`).pop()?.split(';')[0] == '' ? undefined : ('; '+document.cookie).split(`; theme=`).pop()?.split(';')[0];
        }
    }

    const updateScheme = (theme: string) => {
        document.documentElement.style.colorScheme = theme;
    }

    const toggle = () => {
        update((n) => {
            setCookie(n == 'dark' ? 'light' : 'dark');
            system.set(false);
            return n == 'dark' ? 'light' : 'dark';
        })
    }

    const reset = () => {
        set(getSystemTheme());
        setCookie('system|' + getSystemTheme());
        system.set(true);
    }

    const setTheme = (theme: 'light' | 'dark') => {
        set(theme);
        setCookie(theme);
        system.set(false);
        updateScheme(theme);
    }

    return {
        serverInit: serverInit,
        toggle: toggle,
        clientInit: clientInit,
        reset: reset,
        set: setTheme,
        getSystemTheme: getSystemTheme,
        subscribeSystem: system.subscribe,
        subscribe,
    }
}

    interface Link {
        href: string,
        display: string,
        protected: boolean,
    }

export const navLinks: Writable<Link[]> = writable([
    {
        href: "/",
        display: "Home",
        protected: false,
    },
    {
        href: "/resources",
        display: "Resources",
        protected: true,
    },
    {
        href: "/tasks",
        display: "Tasks",
        protected: true,
    },
    {
        href: "/meetings",
        display: "Meetings",
        protected: true,
    },
    {
        href: "/reports",
        display: "Reports",
        protected: true,
    }
]);