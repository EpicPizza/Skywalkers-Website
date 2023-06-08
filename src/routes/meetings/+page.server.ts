import { error, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");

    if(locals.team == false) throw redirect(307, "/verify?needverify=true");
}