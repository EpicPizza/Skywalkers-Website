import { redirect } from "@sveltejs/kit";
import { get } from "svelte/store";

export async function load({cookies, request, locals, url}) {
    if(locals.user != undefined && !(url.searchParams.get("flow") === 'true')) {
        if(locals.team === false) {
            console.log("REDIRECTING");
            throw redirect(307, "/verify");
        }
    }
    
    return { 
        errors: {
            signedout: url.searchParams.get("signin") === 'true' ? true : false,
            verified: url.searchParams.get("alrverify") === 'true' ? true : false,
        },
    };
}