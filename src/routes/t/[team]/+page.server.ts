import { error, redirect } from "@sveltejs/kit";

export async function load({cookies, request, locals, url}) {
    if(locals.unverifiedTeam == null) throw error(400);
    //if((locals.unverifiedTeam && locals.teamInfo.get(locals.unverifiedTeam) == undefined)) throw redirect(307, "/");
    if(locals.user != undefined && !(url.searchParams.get("flow") === 'true')) {
        if(locals.team === null) {
            throw redirect(307, "/t/" + locals.unverifiedTeam + "/verify");
        }
    }

    console.log(locals.teamInfo);
    
    return { 
        errors: {
            signedout: url.searchParams.get("signin") === 'true' ? true : false,
            verified: url.searchParams.get("alrverify") === 'true' ? true : false,
        },
        teamInfo: locals.teamInfo,
        unverifiedTeam: locals.unverifiedTeam
    };
}