import { message, superValidate } from "sveltekit-superforms/server";
import { getUserList, meetingSchema } from "./meetings.server";
import { OWNER } from "$env/static/private";
import { sendDM } from "$lib/Discord/discord.server";
import { firebaseAdmin, seralizeFirestoreUser } from "$lib/Firebase/firebase.server";
import { createEvent, deleteEvent, editEvent, getEvent } from "$lib/Google/calendar";
import { getClientWithCrendentials, getCalendar } from "$lib/Google/client";
import type { SuperValidated } from "sveltekit-superforms";
import { getRole, getRoleWithMembers } from "$lib/Roles/role.server";
import type { DocumentReference, Query } from "firebase-admin/firestore";
import type { SecondaryUser } from "$lib/Firebase/firebase";
import type { Role } from "$lib/Roles/role";
import { getMember } from "$lib/Members/manage.server";

//v1.0

export interface NewMeeting { 
    name: string, 
    location: string, 
    starts: Date, 
    ends: Date, 
    virtual: boolean, 
    lead: DocumentReference, 
    synopsis: DocumentReference | null,
    mentor: DocumentReference | null, 
    completed: boolean,
    thumbnail: string, 
    role: null | string,
    signups: string[],
}

export interface Meeting extends NewMeeting {
    link: null | string
    version: string,
    calendar: string,
    update: boolean,
    id: string,
}

export interface FetchedMeeting extends Omit<Meeting, 'synopsis' | 'mentor' | 'lead' | 'role' | 'signups'> {
    synopsis: SecondaryUser | null,
    mentor: SecondaryUser | null,
    lead: SecondaryUser,
    role: Role | null,
    signups: SecondaryUser[],
}

export async function createDefaultMeetingForm(id: string) {
    const form = await superValidate(meetingSchema);

    form.data.lead = id;

    form.data.starts = new Date();
    form.data.starts.setHours(17);
    form.data.starts.setMinutes(0);
    form.data.starts.setMilliseconds(0);

    form.data.ends = new Date();
    form.data.ends.setHours(20);
    form.data.ends.setMinutes(0);
    form.data.ends.setMilliseconds(0);

    form.data.thumbnail = "icon:event";

    return form;
}

export function getToday() {
    let today = new Date();
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);

    return today;
}

export async function getMeeting(id: string, user: string, team: string): Promise<Meeting> {
    const ref = firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(id);

    const data = (await ref.get()).data();

    if(data == undefined) throw { message: "Meeting Not Found", type: "display" };

    //if(data.completed == true) throw { message: "Not Editable; Meeting Completed", type: "display" };

    const meeting = {
        name: data.name as string,
        lead: data.lead,
        synopsis:  data.synopsis,
        mentor: data.mentor,
        location: data.location as string,
        starts: data.starts.toDate() as Date,
        ends: data.ends.toDate() as Date,
        thumbnail: data.thumbnail as string,
        completed: data.completed as boolean,
        role: data.role,
        link: data.link,
        id: id as string,
        update: data.update,
        version: data.version,
        signups: data.signups,
        virtual: data.virtual,
        calendar: data.calendar
    }
    
    return meeting;
}

export async function getMeetings(ref: Query) {
    const docs = (await ref.get()).docs;

    const meetings = new Array<Meeting>();

    for(let i = 0; i < docs.length; i++) {
        meetings.push({
            name: docs[i].data().name as string,
            id: docs[i].id as string,
            lead: docs[i].data().lead,
            synopsis: docs[i].data().synopsis,
            mentor: docs[i].data().mentor,
            location: docs[i].data().location as string,
            thumbnail: docs[i].data().thumbnail as string,
            starts: docs[i].data().starts.toDate() as Date,
            ends: docs[i].data().ends.toDate() as Date,
            role: docs[i].data().role,
            update: docs[i].data().update,
            link: docs[i].data().link,
            virtual: docs[i].data().virtual,
            version: docs[i].data().version,
            calendar: docs[i].data().calendar,
            completed: docs[i].data().completed,
            signups: docs[i].data().signups,
        })
    }

    return meetings;
}

export async function getFetchedMeetings(ref: Query, user: string, team: string) {
    const rawMeetings = await getMeetings(ref);

    const meetings = new Array<FetchedMeeting>();

    for(let i = 0; i < rawMeetings.length; i++) {
        meetings.push({
            name: rawMeetings[i].name as string,
            lead: await seralizeFirestoreUser((await rawMeetings[i].lead.get()).data(), rawMeetings[i].lead.id) as SecondaryUser,
            synopsis:  rawMeetings[i].synopsis == null ? null : await getMember((rawMeetings[i].synopsis as DocumentReference).id) ?? null,
            mentor: rawMeetings[i].mentor == null ? null : await getMember((rawMeetings[i].mentor as DocumentReference).id) ?? null,
            location: rawMeetings[i].location as string,
            starts: rawMeetings[i].starts,
            ends: rawMeetings[i].ends,
            thumbnail: rawMeetings[i].thumbnail,
            completed: rawMeetings[i].completed,
            update: rawMeetings[i].update,
            role: rawMeetings[i].role ? ((await getRole(rawMeetings[i].role as string, team)) ?? null) : null,
            link: rawMeetings[i].link,
            id: rawMeetings[i].id as string,
            version: rawMeetings[i].version,
            signups: await Promise.all(Array.from(rawMeetings[i].signups, (signup) => { return getMember(signup) })),
            virtual: rawMeetings[i].virtual,
            calendar: rawMeetings[i].calendar
        })

        if((meetings[i].lead != undefined && meetings[i].lead.team != team) || (meetings[i].synopsis != null && (meetings[i].synopsis as SecondaryUser).team != team) || (meetings[i].mentor != null && (meetings[i].mentor as SecondaryUser).team != team)) throw { message: "Meeting Requested Inaccessible Resource", type: "display" };
    }

    return meetings;
}

export async function getFetchedMeeting(id: string, user: string, team: string): Promise<FetchedMeeting> {
    const rawMeeting = await getMeeting(id, user, team);

    const meeting = {
        name: rawMeeting.name as string,
        lead: await seralizeFirestoreUser((await rawMeeting.lead.get()).data(), rawMeeting.lead.id) as SecondaryUser,
        synopsis:  rawMeeting.synopsis == null ? null : await getMember(rawMeeting.synopsis.id) ?? null,
        mentor: rawMeeting.mentor == null ? null : await getMember(rawMeeting.mentor.id) ?? null,
        location: rawMeeting.location as string,
        starts: rawMeeting.starts,
        ends: rawMeeting.ends,
        thumbnail: rawMeeting.thumbnail,
        completed: rawMeeting.completed,
        update: rawMeeting.update,
        role: rawMeeting.role ? ((await getRole(rawMeeting.role, team)) ?? null) : null,
        link: rawMeeting.link,
        id: id as string,
        version: rawMeeting.version,
        signups: await Promise.all(Array.from(rawMeeting.signups, (signup) => { return getMember(signup) })),
        virtual: rawMeeting.virtual,
        calendar: rawMeeting.calendar
    }

    if((meeting.lead != undefined && meeting.lead.team != team) || (meeting.synopsis != undefined && meeting.synopsis.team != team) || (meeting.mentor != undefined && meeting.mentor.team != team)) throw { message: "Meeting Requested Inaccessible Resource", type: "display" };

    return meeting;
}

export async function createMeetingFromForm(form: SuperValidated<typeof meetingSchema>, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    const meeting = await createMeeting({
        name: form.data.name,
        location: form.data.location,
        lead: db.collection('users').doc(form.data.lead),
        mentor: form.data.mentor == undefined || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
        synopsis: form.data.synopsis == undefined || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
        starts: form.data.starts,
        ends: form.data.ends,
        thumbnail: form.data.thumbnail,
        role: form.data.role ?? null,
        virtual: form.data.virtual,
        completed: false,
        signups: [],
    }, user, team);

    return meeting;
}

export async function editMeetingFromForm(currentMeeting: Meeting, form: SuperValidated<typeof meetingSchema>, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    await editMeeting(currentMeeting, {
        name: form.data.name,
        location: form.data.location,
        lead: db.collection('users').doc(form.data.lead),
        mentor: form.data.mentor == null || form.data.mentor == '' ? null : db.collection('users').doc(form.data.mentor),
        synopsis: form.data.synopsis == null || form.data.synopsis == '' ? null : db.collection('users').doc(form.data.synopsis),
        starts: form.data.starts,
        ends: form.data.ends,
        thumbnail: form.data.thumbnail,
        role: form.data.role ?? null,
        virtual: form.data.virtual,
        completed: false,
        signups: currentMeeting.signups,
    }, user, team);
}

export async function createFormFromMeeting(meeting: Meeting) {
    const form = await superValidate(meetingSchema);

    form.data.lead = meeting.lead.id;
    form.data.synopsis = meeting.synopsis == null ? "" : meeting.synopsis.id;
    form.data.mentor = meeting.mentor == null ? "" : meeting.mentor.id;
    form.data.name = meeting.name;
    form.data.location = meeting.location;
    form.data.starts = meeting.starts;
    form.data.ends = meeting.ends;
    form.data.thumbnail = meeting.thumbnail;
    form.data.role = meeting.role ?? "";
    form.data.virtual = meeting.link == null ? false : true;

    return form;
}

export async function validateFormMeeting(form: SuperValidated<typeof meetingSchema>, user: string, team: string) {
    let today = getToday();

    //if(form.data.starts.valueOf() < today.valueOf()) return message(form, "Past meetings cannot be made.");
    if(form.data.ends.valueOf() <= form.data.starts.valueOf()) return message(form, "Start time must be before end time.");

    const db = firebaseAdmin.getFirestore();
    
    const users = await getUserList(db, team);

    if(!users.includes(form.data.lead) || (form.data.mentor != null && form.data.mentor != '' && !users.includes(form.data.mentor)) || (form.data.synopsis != null && form.data.synopsis != '' && !users.includes(form.data.synopsis))) {
        return message(form, 'User(s) not found.', {
            status: 404
        });
    }

    if(!(form.data.role == undefined || form.data.role == '') && !(await db.collection('teams').doc(team).collection('roles').doc(form.data.role).get()).exists) return message(form, "Role not found.");

    const role = await getRole(form.data.role ?? "000000", team);

    if(role == undefined && form.data.role) return message(form, "Role not found.");

    return 0;
}

export async function createMeeting({ name, location, starts, ends, virtual, lead, synopsis, mentor, thumbnail, role, signups }: NewMeeting, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    const id = crypto.randomUUID();

    const ref = db.collection('teams').doc(team).collection('meetings');
    
    const eventOptions = {
        summary: name,
        location: location,
        description: "Find more details here: https://skywalkers.alexest.net/meetings/" + id + ".",
        start: {
            dateTime: starts,
            timeZone: "America/Los_Angeles"
        },
        end: {
            dateTime: ends,
            timeZone: "America/Los_Angeles"
        },
        recurrence: undefined as unknown,
        conferenceData: undefined as unknown,
    }

    if(virtual) {
        eventOptions.conferenceData = {
            createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
            },
        }
    }

    console.log(virtual);

    const client = await getClientWithCrendentials();

    if(client == undefined) {
        try {
            await sendDM("Authorization Needed", OWNER);
        } catch(e) {
            throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
        }

        throw { message: "Google calendar integration down.", type: "display" };
    }

    const calendar = await getCalendar();

    if(calendar == undefined) {
        try {
            await sendDM("Authorization Needed", OWNER);
        } catch(e) {
            throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
        }

        throw { message: "Google calendar integration down.", type: "display" };
    }

    const event = await createEvent(client, calendar, eventOptions);

    const meeting = {
        name: name,
        lead: lead,
        synopsis: synopsis,
        mentor: mentor,
        location: location,
        starts: starts,
        ends: ends,
        thumbnail: thumbnail,
        completed: false,
        role: role,
        calendar: event.id,
        link: event.link ?? null,
        signups: signups,
        update: signups.length == 0 ? false : true,
        id: id,
        version: "v1.0",
        virtual: virtual
    } as Meeting;

    await db.runTransaction(async t => {
        t.create(ref.doc(id), meeting);

        firebaseAdmin.addLogWithTransaction("Meeting created.", "event", user, t);
    })

    return meeting;
}

export async function editMeeting(currentMeeting: Meeting, { name, location, starts, ends, virtual, lead, synopsis, mentor, thumbnail, role, signups }: NewMeeting, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    const ref = db.collection('teams').doc(team).collection('meetings');
    
    const client = await getClientWithCrendentials();

    if(client == undefined) {
        try {
            await sendDM("Authorization Needed", OWNER);
        } catch(e) {
            throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
        }

        throw { message: "Google calendar integration down.", type: "display" };
    }

    const calendar = await getCalendar();

    if(calendar == undefined) {
        try {
            await sendDM("Authorization Needed", OWNER);
        } catch(e) {
            throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
        }

        throw { message: "Google calendar integration down.", type: "display" };
    }

    const currentEvent = await getEvent(client, currentMeeting.calendar, calendar);

        const eventOptions = {
            summary: name,
            location: location,
            start: {
                dateTime: starts,
                timeZone: "America/Los_Angeles"
            },
            end: {
                dateTime: ends,
                timeZone: "America/Los_Angeles"
            },
            conferenceData: undefined as unknown,
        }

        if(virtual && !currentEvent.conferenceData) {
            eventOptions.conferenceData = {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                },
            }
        }
    
        const event = await editEvent(client, currentMeeting.calendar, calendar, eventOptions);

        const meeting = {
            name: name,
            lead: lead,
            synopsis: synopsis,
            mentor: mentor,
            location: location,
            starts: starts,
            ends: ends,
            thumbnail: thumbnail,
            completed: false,
            role: role,
            calendar: event.id,
            link: event.link ?? null,
            signups: signups,
            update: currentMeeting.update,
            id: currentMeeting.id,
            version: "v1.0",
            virtual: virtual
        } as Meeting;
    
        await db.runTransaction(async t => {
            t.update(ref.doc(currentMeeting.id), meeting as any); //weird type error?
    
            firebaseAdmin.addLogWithTransaction("Meeting edited.", "event", user, t);
        });
}

export async function deleteMeetings(meetings: string[], user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    for(let i = 0; i < meetings.length; i++) {
        const ref = db.collection("teams").doc(team).collection("meetings").doc(meetings[i]);

        const doc = await ref.get();

        if(!doc.exists) {
            continue;
        }

        const id = doc.data()?.calendar;

        const client = await getClientWithCrendentials();

        if(client == undefined) {
            try {
                await sendDM("Authorization Needed", OWNER);
            } catch(e) {
                throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
            }
    
            throw { message: "Google calendar integration down.", type: "display" };
        }

        const calendar = await getCalendar();
    
        if(calendar == undefined) {
            try {
                await sendDM("Authorization Needed", OWNER);
            } catch(e) {
                throw { message: "Google calendar integration down. Discord bot down. Please contact support, something has gone really wrong.", type: "display" };
            }
    
            throw { message: "Google calendar integration down.", type: "display" };
        }

        await deleteEvent(client, id, calendar);

        await ref.delete();
    }
}