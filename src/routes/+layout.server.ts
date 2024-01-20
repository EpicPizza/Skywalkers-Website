export const ssr = true;

export async function load({cookies, request, locals, depends }) {
    depends('client-cache');

    const mode = cookies.get('theme');

    let user;

    if(locals.user != undefined) {
        user = {
            photoURL: locals.user.photoURL,
            displayName: locals.user.displayName,
            email: locals.user.email,
            uid: locals.user.uid,
            pronouns:  locals.firestoreUser ? locals.firestoreUser.pronouns : undefined,
            teams: locals.firestoreUser ? locals.firestoreUser.teams : [],
            preload: true, //only exists for sake of comparing to real user object
        };
    } else {
        user = undefined;
    }

    return { unverifiedTeam: locals.unverifiedTeam, kicked: locals.kicked, teamInfo: locals.teamInfo, mode: mode, preload: user, team: locals.team }; //do not use any of these directly, this layout load consistenly only runs on initial page load, instead used associated stores
}