import { error, redirect } from "@sveltejs/kit";

export async function load(event) {
    if(event.locals.user == undefined) throw redirect(307, '/t/' + event.locals.unverifiedTeam);
    if(event.locals.unverifiedTeam == null) throw error(400);
    if(event.locals.team) {
        throw redirect(307, "/?alrverify=true");
    }

    return {
        verify: {
            errors: {
                invalid: event.url.searchParams.get("invalid") === 'true' ? true : false,
                redirected: event.url.searchParams.get("needverify") === 'true' ? true : false,
            }
        },
        unverifiedTeam: event.locals.unverifiedTeam
    }
}