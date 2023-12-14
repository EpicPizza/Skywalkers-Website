import type { FirestoreUser, VerifiedUser } from "$lib/Firebase/firebase.js";
import { firebaseAdmin } from "$lib/Firebase/firebase.server.js";
import { getMember } from "$lib/Members/manage.server.js";
import { error, fail, redirect } from "@sveltejs/kit";
import { superForm } from "sveltekit-superforms/client";
import { message, superValidate } from "sveltekit-superforms/server";
import { z } from "zod";

const Finish = z.object({});

export async function load({ locals, params }) {
    if(locals.user == undefined) throw error(403, "Sign In Required");
    if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

    const database = firebaseAdmin.getFirestore();

    const ref = database.collection('teams').doc(locals.firestoreUser.team).collection('schedule').doc(params.id);

    const doc = await ref.get();

    if(!doc.data()) throw error(501, "Scheduler not found.");

    const form = superValidate(Finish);

    if(doc.data()?.status == true) {
        throw redirect(303, "/meetings?schedule=" + params.id);
    }

    return {
        form,
        schedule: {
            title: doc.data()?.title as string,
            description: doc.data()?.description as string,
            first: doc.data()?.first.toDate() as Date,
            days: doc.data()?.days as number,
            times: doc.data()?.times as number,
            length: doc.data()?.length as number,
            count: doc.data()?.count as number,
            member: doc.data()?.member as number,
            require: doc.data()?.require as string | null,
            location: doc.data()?.location as string | null,
            group: doc.data()?.group as string | null,
            signups: doc.data()?.signups as { [key: string]: { availability: { day: number, time: number }[] }},
            confirm: (doc.data()?.confirm ?? []) as null | { members: string[], slots: { day: number, time: number}[] }[],
        }
    }
}

export const actions = {
    default: async function({ locals, request, params }) {
        if(locals.user == undefined) throw error(403, "Sign In Required");
        if(locals.team == false || locals.firestoreUser == undefined) throw redirect(307, "/verify?needverify=true");

        const form = await superValidate(request, Finish);

        if(!form.valid) {
            return fail(400, { form });
        }

        const database = firebaseAdmin.getFirestore();

        const ref = database.collection('teams').doc(locals.firestoreUser.team).collection('schedule').doc(params.id);

        await ref.update({
            status: false,
        });
    
        const doc = await ref.get();

        const schedule = {
            title: doc.data()?.title as string,
            description: doc.data()?.description as string,
            first: doc.data()?.first.toDate() as Date,
            days: doc.data()?.days as number,
            times: doc.data()?.times as number,
            length: doc.data()?.length as number,
            count: doc.data()?.count as number,
            member: doc.data()?.member as number,
            require: doc.data()?.require as string | null,
            signups: doc.data()?.signups as { [key: string]: { availability: { day: number, time: number }[] }},
        };

        let spots: { day: number, time: number, members: string[] }[] = new Array();

        for(let i = 0; i < schedule.days; i++) {
            for(let j = 0; j < schedule.times; j++) {
                const keys = Object.keys(schedule.signups);

                let available: string[] = [];

                for(let x = 0; x < keys.length; x++) {
                    let availability = schedule.signups[keys[x]].availability;

                    for(let y = 0; y < availability.length; y++) {
                        if(availability[y].day == i && availability[y].time == j) {
                            available.push(keys[x]);
                        }
                    }
                }

                if(available.length != 0) {
                    spots.push({ day: i, time: j, members: available });
                }
            }
        }

        let filtered: typeof spots = [];

        interface User extends FirestoreUser {
            id: string;
        }

        let members: User[] = [];

        let possibleminimumnotreached = 0;
        let possiblerequirenotmet = 0;



        /*for(let i = 0; i < spots.length; i++) {
            let minimumreached = spots[i].members.length >= schedule.member;
            let requirementmet = false;

            for(let j = 0; j < spots[i].members.length; j++) {
                for(let x = 0; x < members.length; x++) {
                    if(members[x].id == spots[i].members[j]) {
                        for(let y = 0; y < members[x].roles.length; y++) {
                            if(members[x].roles[y].id == schedule.require) {
                                requirementmet = true;
                            }
                        }
                    } else {
                        let user = await getMember(spots[i].members[j]);

                        for(let y = 0; y < user.roles.length; y++) {
                            if(user.roles[y].id == schedule.require) {
                                requirementmet = true;
                            }
                        }

                        members.push({ ...user, id: spots[i].members[j]});
                    }
                }
            }
            
            console.log(minimumreached, schedule.require == null);

            if(!minimumreached) possibleminimumnotreached++;
            if(!(requirementmet || schedule.require == null)) possiblerequirenotmet++;

            if(minimumreached && (requirementmet || schedule.require == null)) {
                filtered.push(spots[i]);
            }
        }

        if(filtered.length == 0) {
            if(possibleminimumnotreached > possiblerequirenotmet) {
                return message(form, "Unable to schedule meetings. Possibly not enough people signed up.");
            } else if(possibleminimumnotreached < possiblerequirenotmet) {
                return message(form, "Unable to schedule meetings. Possibly not enough people with required role signed up.");
            } else {
                return message(form, "Unable to schedule meetings. Did anyone sign up?");
            }
        }*/

        filtered = spots;

        const confirmed: { members: string[], slots: { day: number, time: number}[] }[] = [];
        const taken: typeof spots = [];

        for(let i = 0; i < filtered.length; i++) {
            if(i > filtered.length - schedule.length) continue;

            let dayCount = 0;

            for(let j = 0; j < (schedule.length - 1); j++) {
                if(filtered[i + j].day == filtered[i + j + 1].day) {
                    dayCount++;
                }
            }

            let dayCheck = dayCount == schedule.length - 1;

            if(!dayCheck) continue;

            let hourCount = 0;

            for(let j = 0; j < (schedule.length - 1); j++) {
                if(filtered[i + j].time == filtered[i + j + 1].time - 1) {
                    hourCount++;
                }
            }

            let hourCheck = hourCount == schedule.length - 1;

            if(!hourCheck) continue;

            let found = false;

            for(let j = 0; j < schedule.length; j++) {
                for(let x = 0; x < taken.length; x++) {
                    if(filtered[i + j].day == taken[x].day && filtered[i + j].time == taken[x].time) {
                        found = true;
                    }
                }
            }

            if(found) continue;

            let membersInSlots = filtered[i].members;

            for(let j = 1; j < schedule.length; j++) {
                let found = [];

                for(let x = 0; x < membersInSlots.length; x++) {
                    for(let y = 0; y < filtered[i + j].members.length; y++) {
                        if(filtered[i + j].members[y] == membersInSlots[x]) {
                            found.push(filtered[i + j].members[y]);
                        }
                    }
                }

                membersInSlots = found;
            }

            let requirementmet = false;
            let who = -1;

            for(let j = 0; j < membersInSlots.length; j++) {
                let found = false;

                for(let x = 0; x < members.length; x++) {
                    if(members[x].id == membersInSlots[j]) {
                        for(let y = 0; y < members[x].roles.length; y++) {
                            if(members[x].roles[y].id == schedule.require) {
                                requirementmet = true;
                                who = j;
                            }
                        }

                        found = true;
                    }
                }

                if(!found) {
                    let user = await getMember(membersInSlots[j]);

                    for(let y = 0; y < user.roles.length; y++) {
                        if(user.roles[y].id == schedule.require) {
                            requirementmet = true;
                            who = j;
                        }
                    }
                }
            }

            console.log(requirementmet);

            if(!requirementmet && schedule.require != null) continue;

            if(schedule.require != null) {
                let id = membersInSlots[who];
                membersInSlots.splice(who, 1);
                membersInSlots.unshift(id);
            }

            console.log(membersInSlots.length, schedule.member);
            if(membersInSlots.length < schedule.member) continue;

            confirmed.push({
                members: membersInSlots,
                slots: [],
            })
            
            for(let j = 0; j < schedule.length; j++) {
                taken.push(filtered[i + j]);
                confirmed[confirmed.length - 1].slots.push({day: filtered[i + j].day, time: filtered[i + j].time});
            }
        }

        if(confirmed.length == 0) {
            return message(form, "Unable to find optimal meetings.");
        }

        ref.update({
            confirm: confirmed,
        })

        throw redirect(303, "/schedule/" + params.id + "?confirm=true");
    }
}