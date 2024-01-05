import { message, superValidate } from "sveltekit-superforms/server";
import { attachmentHelpers, getUserList, meetingSchema } from "./meetings.server";
import { DEV, DOMAIN, NOTION, NOTION_MEETINGS, OWNER, SENDGRID, SENDGRIDFROM, SENDGRIDNAME, SENDGRIDREPLYTO, SENDGRIDTEMPLATE, TWILIONUMBER, TWILIOSID, TWILIOTOKEN } from "$env/static/private";
import { sendConfirmation, sendDM } from "$lib/Discord/discord.server";
import { firebaseAdmin, seralizeFirestoreUser } from "$lib/Firebase/firebase.server";
import { createEvent, deleteEvent, editEvent, getEvent } from "$lib/Google/calendar";
import { getClientWithCrendentials, getCalendar } from "$lib/Google/client";
import type { SuperValidated } from "sveltekit-superforms";
import { getRole, getRoleWithMembers } from "$lib/Roles/role.server";
import type { DocumentReference, Query, Transaction } from "firebase-admin/firestore";
import type { SecondaryUser } from "$lib/Firebase/firebase";
import type { Role } from "$lib/Roles/role";
import { getMember } from "$lib/Members/manage.server";
//@ts-ignore no types and it seems like a complicated one to add types to :/
import { promiseAllProps } from 'promise-all-props';
import { getDefault, getDefaultRole } from "./helpers";
import { Client } from "@notionhq/client";
import type { BlockObjectRequest, CreatePageParameters, UpdatePageParameters } from "@notionhq/client/build/src/api-endpoints";
import type { StringLiteral } from "typescript";
import {markdownToBlocks, markdownToRichText} from '@tryfabric/martian';
import mail, { type MailDataRequired } from '@sendgrid/mail';
import dnt from 'date-and-time';
import meridiem from "date-and-time/plugin/meridiem";
import { error } from "@sveltejs/kit";
import twilio from 'twilio';

dnt.plugin(meridiem);

//v1.0 - original 
//v1.1 - added notion
//v1.2 - bug, when meetings were updated to include notion, it didn't mark complete properly
//v1.3 - bug, forgot to add location in notion 

//v2.0 - confirmations

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
    confirmations: null | { id: string, result: null | boolean }[]
}

export interface Meeting extends NewMeeting {
    link: null | string
    version: string,
    calendar: string,
    update: boolean,
    notion: string,
    id: string,
}

export interface FetchedMeeting extends Omit<Meeting, 'synopsis' | 'mentor' | 'lead' | 'role' | 'signups'> {
    synopsis: SecondaryUser | null,
    mentor: SecondaryUser | null,
    lead: SecondaryUser,
    role: Role | null,
    signups: SecondaryUser[],
}

export interface FetchedPromisedMeeting extends Omit<Meeting, 'synopsis' | 'mentor' | 'lead' | 'role' | 'signups'> {
    synopsis: Promise<SecondaryUser> | null,
    mentor: Promise<SecondaryUser> | null,
    lead: Promise<SecondaryUser>,
    role: Promise<Role | null> | null,
    signups: Promise<SecondaryUser[]>,
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

const update = {
    vonezzero: async function(meeting: Meeting, user: string, team: string) {
        console.log(meeting.id);

        const notion = new Client({ auth: NOTION });

        const page = {
            parent: {
                database_id: NOTION_MEETINGS,
            },
            properties: {
                title: {
                    type: 'title',
                    title: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.name
                            }
                        }
                    ]
                },
                Completed: {
                    type: 'checkbox',
                    checkbox: meeting.completed
                },
                Link: {
                    type: 'url',
                    url: DOMAIN + "/meetings/" + meeting.id,
                },
                Group: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': (await getRole(meeting.role ?? "000000", team))?.name ?? "Blank"
                            }
                        }
                    ]
                },
                Time: {
                    type: 'date',
                    date: {
                        start: meeting.starts.toISOString(),
                        end: meeting.ends.toISOString(),
                    }
                },
                Lead: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': (await getMember(meeting.lead.id))?.displayName ?? "None"
                            }
                        }
                    ]
                },
                Mentor: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.mentor ? (await getMember(meeting.mentor.id)).displayName ?? "None" : "None"
                            }
                        }
                    ]
                },
                Synopsis: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.synopsis ? (await getMember(meeting.synopsis.id)).displayName ?? "None" : "None"
                            }
                        }
                    ]
                },
                Warning: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': "EDIT IN WEBSITE, your changes here will be overwritten."
                            }
                        }
                    ]
                },
                Location: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.location,
                            }
                        }
                    ]
                },
            },
            children: []
        } satisfies CreatePageParameters;

        const notionMeeting = await notion.pages.create(page);

        if(meeting.completed) {
            const synopsis = await getSynopsis(meeting.id, user, team);

            const attachments = new Array<BlockObjectRequest>();

            for(let i = 0; i < synopsis.attachments.length; i++) {
                if(attachmentHelpers.isImage(synopsis.attachments[i].type)) {
                    attachments.push({
                        type: "image", 
                        image: {
                            type: "external", 
                            external: { 
                                url: synopsis.attachments[i].url 
                            }
                        }
                    })
                } else {
                    attachments.push({
                        type: "file",
                        file: {
                            type: "external",
                            external: {
                                url: synopsis.attachments[i].url 
                            },
                            name: synopsis.attachments[i].name + "." + synopsis.attachments[i].ext
                        }
                    })
                }
            }

            await notion.blocks.children.append({ block_id: notionMeeting.id, children: (markdownToBlocks(synopsis.body) as unknown as BlockObjectRequest[]).concat(attachments)})
                
        }

        await firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(meeting.id).update({
            notion: notionMeeting.id,
            version: "v1.3"
        })

        return notionMeeting.id;
    },
    vonezone: async function(meeting: Meeting, user: string, team: string) {
        if(meeting.completed) {
            await editSynopsis(meeting.notion, await getSynopsis(meeting.id, user, team)); //add files
        }

        const notion = new Client({ auth: NOTION });

        const page = {
            page_id: meeting.notion,
            properties: {
                Completed: {
                    type: 'checkbox',
                    checkbox: meeting.completed
                },
                Location: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.location,
                            }
                        }
                    ]
                },
            },
        } satisfies UpdatePageParameters;

        await notion.pages.update(page);

        await firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(meeting.id).update({
            version: "v1.3"
        })
    },
    voneztwo: async function(meeting: Meeting, user: string, team: string) {
        const notion = new Client({ auth: NOTION });

        const page = {
            page_id: meeting.notion,
            properties: {
                Location: {
                    type: 'rich_text',
                    rich_text: [
                        {
                            type: 'text',
                            text: {
                                'content': meeting.location,
                            }
                        }
                    ]
                },
            },
        } satisfies UpdatePageParameters;

        await notion.pages.update(page);

        await firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(meeting.id).update({
            version: "v1.3"
        })
    },
    vonezthree: async function(meeting: Meeting, user: string, team: string): Promise<Meeting> {
        await firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(meeting.id).update({
            version: "v2.0",
            confirmations: null,
        })

        meeting.confirmations = null;

        return meeting;
    }
}

export async function getMeeting(id: string, user: string, team: string): Promise<Meeting> {
    const ref = firebaseAdmin.getFirestore().collection('teams').doc(team).collection('meetings').doc(id);

    const data = (await ref.get()).data();

    if(data == undefined) throw { message: "Meeting Not Found", type: "display" };

    //if(data.completed == true) throw { message: "Not Editable; Meeting Completed", type: "display" };

    let meeting = {
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
        calendar: data.calendar,
        notion: data.notion,
        confirmations: data.confirmations,
    }

    if(meeting.version == "v1.0") {
        const id = await update.vonezzero(meeting, user, team);

        meeting.notion = id;
    } else if(meeting.version == "v1.1") {
        await update.vonezone(meeting, user, team);
    } else if(meeting.version == "v1.2") {
        await update.voneztwo(meeting, user, team);
    }
    
    if(meeting.version == "v1.3") {
        meeting = await update.vonezthree(meeting, user, team);
    }
    
    return meeting;
}

export async function getMeetings(ref: Query, user: string, team: string) {

    const docs = (await ref.get()).docs;

    const meetings = new Array<Meeting>();

    for(let i = 0; i < docs.length; i++) {
        let meeting = {
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
            notion: docs[i].data().notion,
            confirmations: null,
        } satisfies Meeting as Meeting;

        if(meeting.version == "v1.0") {
            const id = await update.vonezzero(meeting, user, team);
    
            meeting.notion = id;
        } else if(meeting.version == "v1.1") {
            await update.vonezone(meeting, user, team);
        } else if(meeting.version == "v1.2") {
            await update.voneztwo(meeting, user, team);
        }

        if(meeting.version == "v1.3") {
            meeting = await update.vonezthree(meeting, user, team);
        }

        meetings.push(meeting);
    }

    return meetings;
}

export async function getSynopsis(id: string, user: string, team: string) {
    const synopsisRef = firebaseAdmin.getFirestore().collection('teams').doc(team).collection('synopsis').doc(id);

    const synopsis = (await synopsisRef.get()).data();

    if(synopsis == undefined) throw { message: "Synopsis not found.", type: "display" };

    let hours: { member: SecondaryUser, time: number }[] = [];

    for(let i = 0; i < synopsis.hours.length; i++) {
        try { 
            let member = await getMember(synopsis.hours[i].member.id); 

            hours.push({
                member,
                time: synopsis.hours[i].time,
            })
        } catch(e) {
            let member = getDefault(synopsis.hours[i].member.id)

            hours.push({
                member,
                time: synopsis.hours[i].time,
            })
        }
    }

    return {
        body: synopsis.synopsis as string,
        hours: hours,
        attachments: synopsis.urls as {url: string, type: string, name: string, location: string, code: string, ext: string }[],
    };
}

export async function getSynopses(ref: Query, members: Map<string, SecondaryUser>) {
    const docs = (await ref.get()).docs;

    const synopses = new Array<{ body: string, hours: { member: SecondaryUser, time: number }[], attachments: {url: string, type: string, name: string, location: string, code: string, ext: string }[]}>();

    for(let i = 0; i < docs.length; i++) {
        const synopsis = docs[i].data();

        if(synopsis == undefined) throw { message: "Synopsis not found.", type: "display" };

        let hours: { member: SecondaryUser, time: number }[] = [];

        for(let i = 0; i < synopsis.hours.length; i++) {
            let member = members.get(synopsis.hours[i].member.id) ?? getDefault(synopsis.hours[i].member.id)

            hours.push({
                member,
                time: synopsis.hours[i].time,
            })
        }

        synopses.push({
            body: synopsis.synopsis as string,
            hours: hours,
            attachments: synopsis.urls as {url: string, type: string, name: string, location: string, code: string, ext: string }[],
        });
    }

    return synopses;
}

export async function getFetchedMeetings(ref: Query, user: string, team: string) {
    const rawMeetings = await getMeetings(ref, user, team);

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
            calendar: rawMeetings[i].calendar,
            notion: rawMeetings[i].notion,
            confirmations: rawMeetings[i].confirmations
        })

        if((meetings[i].lead != undefined && meetings[i].lead.team != team) || (meetings[i].synopsis != null && (meetings[i].synopsis as SecondaryUser).team != team) || (meetings[i].mentor != null && (meetings[i].mentor as SecondaryUser).team != team)) throw { message: "Meeting Requested Inaccessible Resource", type: "display" };
    }

    return meetings;
}

export async function getFetchedMeetingsOptimized(ref: Query, user: string, team: string, members: Map<string, SecondaryUser>, roles: Map<string, Role>) {
    const rawMeetings = await getMeetings(ref, user, team);

    const meetings = new Array<FetchedMeeting>();

    for(let i = 0; i < rawMeetings.length; i++) {
        let rawMeeting = rawMeetings[i];

        meetings.push({
            name: rawMeeting.name as string,
            lead: members.get(rawMeeting.lead.id) ?? getDefault(rawMeeting.lead.id),
            synopsis:  rawMeeting.synopsis == null ? null : members.get(rawMeeting.synopsis.id) ?? getDefault(rawMeeting.synopsis.id),
            mentor: rawMeeting.mentor == null ? null : members.get(rawMeeting.mentor.id) ?? getDefault(rawMeeting.mentor.id),
            location: rawMeeting.location as string,
            starts: rawMeeting.starts,
            ends: rawMeeting.ends,
            thumbnail: rawMeeting.thumbnail,
            completed: rawMeeting.completed,
            update: rawMeeting.update,
            role: rawMeeting.role ? roles.get(rawMeeting.role) ?? getDefaultRole(rawMeeting.role) : null,
            link: rawMeeting.link,
            id: rawMeeting.id as string,
            version: rawMeeting.version,
            signups: Array.from(rawMeeting.signups, (signup) => { return members.get(signup) ?? getDefault(signup) }),
            virtual: rawMeeting.virtual,
            calendar: rawMeeting.calendar,
            notion: rawMeeting.notion,
            confirmations: rawMeeting.confirmations,
        } satisfies FetchedMeeting)

        //not required since cache is already team scoped
        //if((meetings[i].lead != undefined && meetings[i].lead.team != team) || (meetings[i].synopsis != null && (meetings[i].synopsis as SecondaryUser).team != team) || (meetings[i].mentor != null && (meetings[i].mentor as SecondaryUser).team != team)) throw { message: "Meeting Requested Inaccessible Resource", type: "display" };
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
        calendar: rawMeeting.calendar,
        notion: rawMeeting.notion,
        confirmations: rawMeeting.confirmations,
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
        confirmations: null
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
        confirmations: null,
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

    const notion = new Client({ auth: NOTION });

    const page = {
        parent: {
            database_id: NOTION_MEETINGS,
        },
        properties: {
            title: {
                type: 'title',
                title: [
                    {
                        type: 'text',
                        text: {
                            'content':name
                        }
                    }
                ]
            },
            Completed: {
                type: 'checkbox',
                checkbox: false
            },
            Link: {
                type: 'url',
                url: DOMAIN + "/meetings/" + id,
            },
            Group: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getRole(role ?? "000000", team))?.name ?? "Blank"
                        }
                    }
                ]
            },
            Time: {
                type: 'date',
                date: {
                    start: starts.toISOString(),
                    end: ends.toISOString(),
                }
            },
            Lead: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getMember(lead.id))?.displayName ?? "None"
                        }
                    }
                ]
            },
            Mentor: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': mentor ? (await getMember(mentor.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Synopsis: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': synopsis ? (await getMember(synopsis.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Warning: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': "EDIT IN WEBSITE, your changes here will be overwritten."
                        }
                    }
                ]
            },
            Location: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': location,
                        }
                    }
                ]
            },
        },
        children: []
    } satisfies CreatePageParameters;

    const notionMeeting = await notion.pages.create(page);

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
        version: "v2.0",
        virtual: virtual,
        notion: notionMeeting.id,
        confirmations: null,
    } satisfies Meeting as Meeting;
 
    await db.runTransaction(async t => {
        t.create(ref.doc(id), meeting);

        firebaseAdmin.addLogWithTransaction("Meeting created.", "event", user, t);
    })

    return meeting;
}

interface NewSchedule extends NewMeeting {
    schedule: string,
}

export async function createMeetingFromSchedule({ name, location, starts, ends, virtual, lead, synopsis, mentor, thumbnail, schedule, role, signups }: NewSchedule, user: string, team: string) {
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

    const notion = new Client({ auth: NOTION });

    const page = {
        parent: {
            database_id: NOTION_MEETINGS,
        },
        properties: {
            title: {
                type: 'title',
                title: [
                    {
                        type: 'text',
                        text: {
                            'content':name
                        }
                    }
                ]
            },
            Completed: {
                type: 'checkbox',
                checkbox: false
            },
            Link: {
                type: 'url',
                url: DOMAIN + "/meetings/" + id,
            },
            Group: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getRole(role ?? "000000", team))?.name ?? "Blank"
                        }
                    }
                ]
            },
            Time: {
                type: 'date',
                date: {
                    start: starts.toISOString(),
                    end: ends.toISOString(),
                }
            },
            Lead: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getMember(lead.id))?.displayName ?? "None"
                        }
                    }
                ]
            },
            Mentor: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': mentor ? (await getMember(mentor.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Synopsis: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': synopsis ? (await getMember(synopsis.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Warning: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': "EDIT IN WEBSITE, your changes here will be overwritten."
                        }
                    }
                ]
            },
            Location: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': location,
                        }
                    }
                ]
            },
        },
        children: []
    } satisfies CreatePageParameters;

    const notionMeeting = await notion.pages.create(page);

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
        version: "v2.0",
        virtual: virtual,
        notion: notionMeeting.id,
        confirmations: null,
        //@ts-expect-error
        schedule: schedule, //niche use for filtering scheduled meetings
    } satisfies Meeting as Meeting;

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

    const notion = new Client({ auth: NOTION });

    const page = {
        page_id: currentMeeting.notion,
        properties: {
            title: {
                type: 'title',
                title: [
                    {
                        type: 'text',
                        text: {
                            'content':name
                        }
                    }
                ]
            },
            Completed: {
                type: 'checkbox',
                checkbox: false
            },
            Link: {
                type: 'url',
                url: DOMAIN + "/meetings/" + currentMeeting.id,
            },
            Group: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getRole(role ?? "000000", team))?.name ?? "Blank"
                        }
                    }
                ]
            },
            Time: {
                type: 'date',
                date: {
                    start: starts.toISOString(),
                    end: ends.toISOString(),
                }
            },
            Lead: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': (await getMember(lead.id))?.displayName ?? "None"
                        }
                    }
                ]
            },
            Mentor: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': mentor ? (await getMember(mentor.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Synopsis: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': synopsis ? (await getMember(synopsis.id)).displayName ?? "None" : "None"
                        }
                    }
                ]
            },
            Warning: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': "EDIT IN WEBSITE, your changes here will be overwritten."
                        }
                    }
                ]
            },
            Location: {
                type: 'rich_text',
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            'content': location,
                        }
                    }
                ]
            },
        }
    } satisfies UpdatePageParameters;

    const notionMeeting = await notion.pages.update(page);

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
        version: "v2.0",
        virtual: virtual,
        notion: notionMeeting.id,
        confirmations: currentMeeting.confirmations,
    } satisfies Meeting;

    await db.runTransaction(async t => {
        t.update(ref.doc(currentMeeting.id), meeting as any); //weird type error?

        firebaseAdmin.addLogWithTransaction("Meeting edited.", "event", user, t);
    });
}

export async function completeMeeting(t: Transaction, id: string, ref: DocumentReference, complete: boolean, synopsis: { urls: { url: string, type: string, name: string, location: string, code: string, ext: string }[], hours: { member: DocumentReference, time: number }[], synopsis: string } | undefined = undefined) {
    t.update(ref, {
        completed: complete,
    });

    const notion = new Client({ auth: NOTION });

    const page = {
        page_id: id,
        properties: {
            Completed: {
                type: 'checkbox',
                checkbox: complete
            }
        },
    } satisfies UpdatePageParameters;

    await notion.pages.update(page);

    if(complete == false) {
        const children = await notion.blocks.children.list({ block_id: id });

        for(let i = 0; i < children.results.length; i++) {
            await notion.blocks.delete({ block_id: children.results[i].id });
        }
    } else if(synopsis) {
        const attachments = new Array<BlockObjectRequest>();

        for(let i = 0; i < synopsis.urls.length; i++) {
            if(attachmentHelpers.isImage(synopsis.urls[i].type)) {
                attachments.push({
                    type: "image", 
                    image: {
                        type: "external", 
                        external: { 
                            url: synopsis.urls[i].url 
                        }
                    }
                })
            } else {
                attachments.push({
                    type: "file",
                    file: {
                        type: "external",
                        external: {
                            url: synopsis.urls[i].url 
                        },
                        name: synopsis.urls[i].name + "." + synopsis.urls[i].ext
                    }
                })
            }
        }

        await notion.blocks.children.append({ block_id: id, children: (markdownToBlocks(synopsis.synopsis) as unknown as BlockObjectRequest[]).concat(attachments)})
    }
}

export async function editSynopsis(id: string, synopsis: { urls: { url: string, type: string, name: string, location: string, code: string, ext: string }[], hours: any[], synopsis: string } | { attachments: { url: string, type: string, name: string, location: string, code: string, ext: string }[], hours: any[], body: string } ) {
    const notion = new Client({ auth: NOTION });
    
    const children = await notion.blocks.children.list({ block_id: id });

    for(let i = 0; i < children.results.length; i++) {
        await notion.blocks.delete({ block_id: children.results[i].id });
    }

    const attachments = new Array<BlockObjectRequest>();

    if('attachments' in synopsis) {
        for(let i = 0; i < synopsis.attachments.length; i++) {
            if(attachmentHelpers.isImage(synopsis.attachments[i].type)) {
                attachments.push({
                    type: "image", 
                    image: {
                        type: "external", 
                        external: { 
                            url: synopsis.attachments[i].url 
                        }
                    }
                })
            } else {
                attachments.push({
                    type: "file",
                    file: {
                        type: "external",
                        external: {
                            url: synopsis.attachments[i].url 
                        },
                        name: synopsis.attachments[i].name + "." + synopsis.attachments[i].ext
                    }
                })
            }
        }
    } else {
        for(let i = 0; i < synopsis.urls.length; i++) {
            if(attachmentHelpers.isImage(synopsis.urls[i].type)) {
                attachments.push({
                    type: "image", 
                    image: {
                        type: "external", 
                        external: { 
                            url: synopsis.urls[i].url 
                        }
                    }
                })
            } else {
                attachments.push({
                    type: "file",
                    file: {
                        type: "external",
                        external: {
                            url: synopsis.urls[i].url 
                        },
                        name: synopsis.urls[i].name + "." + synopsis.urls[i].ext
                    }
                })
            }
        }
    }

    await notion.blocks.children.append({ block_id: id, children: (markdownToBlocks('synopsis' in synopsis ? synopsis.synopsis : synopsis.body) as unknown as BlockObjectRequest[]).concat(attachments)})
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

        const notion = new Client({ auth: NOTION });

        await notion.blocks.delete({ block_id: doc.data()?.notion });

        await deleteEvent(client, id, calendar);

        await ref.delete();
    }
}

export async function sendConfirmations(meeting: Meeting, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    const hasConfirmations = await db.runTransaction(async t => {
        const data = (await t.get(db.collection('teams').doc(team).collection('meetings').doc(meeting.id))).data();

        const confirmations = data?.confirmations;

        if(confirmations === null) {
            t.update(db.collection('teams').doc(team).collection('meetings').doc(meeting.id), {
                confirmations: Array.from(meeting.signups, signup => {
                    return { id: signup, result: null };
                }) satisfies Meeting["confirmations"],
            })

            return true;
        } else {
            return false;
        }
    })

    if(hasConfirmations == false) {
        throw { message: "Already has confirmations.", type: "display" };
    }

    mail.setApiKey(SENDGRID);

    if(DEV == 'FALSE') {
        meeting.starts.setHours(meeting.starts.getHours() - 8);
        meeting.ends.setHours(meeting.ends.getHours() - 8);
    }

    let time = dnt.format(meeting.starts, "h:mm a") + " - " + dnt.format(meeting.ends, "h:mm a");

    let emailTo = new Array<string>();
    let discordTo = new Array<string>();
    let phoneTo = new Array<{ id: string, number: string }>();

    for(let i = 0; i < meeting.signups.length; i++) {
        const ref = db.collection('users').doc(meeting.signups[i]).collection('settings').doc('confirmations');

        const doc = await ref.get();

        let preference: 'email' | 'discord' | 'phone' | 'none' = "email"; // Email | Discord | None

        if(doc.exists && doc.data() && doc.data()?.preference != null) {
            preference = doc.data()?.preference;
        }

        if(preference == 'discord') {
            discordTo.push(meeting.signups[i]);
        } else if(preference == 'email') {
            emailTo.push(meeting.signups[i])
        } else if(preference == 'phone') {
            if(typeof doc.data()?.number == 'string') {
                phoneTo.push({
                    id: meeting.signups[i],
                    number: doc.data()?.number
                })
            } else {
                emailTo.push(meeting.signups[i]);
            }
        }
    }

    for(let i = 0; i < discordTo.length; i++) {
        const discordRef = db.collection('users').doc(discordTo[i]).collection('settings').doc('discord');

        const discordDoc = await discordRef.get();

        let id: undefined | string = undefined;

        if(discordDoc.exists && discordDoc.data() && discordDoc.data()?.id != null) {
            id = discordDoc.data()?.id as string;
        }

        if(id == undefined) {
            emailTo.push(discordTo[i]) //fallback
        } else {
            try {
                await sendConfirmation(meeting, id);
            } catch(e) {
                console.log(e);
            }
        }
    }

    const client = twilio(TWILIOSID, TWILIOTOKEN);

    for(let i = 0; i < phoneTo.length; i++) {
        try {
            await client.messages.create({
                body: 'Hello from Twilio',
                from: TWILIONUMBER,
                to: phoneTo[i].number,
            })
        } catch(e) {
            console.log(e);

            emailTo.push(phoneTo[i].id);
        }
    }

    const members = await firebaseAdmin.getAuth().getUsers(Array.from(emailTo, (signup) => ({ uid: signup })));

    const emails = Array.from(members.users, member => member.email as string );

    const msg = {
        from: {
            email: SENDGRIDFROM,
            name: SENDGRIDNAME
        },
        templateId: SENDGRIDTEMPLATE,
        replyTo: SENDGRIDREPLYTO,
        subject: "Confirmation for " + meeting.name,
        dynamicTemplateData: {
            name: meeting.name,
            time: time,
            link: DOMAIN + "/meetings/" + meeting.id,
            subject: "Confirmation for " + meeting.name,
        },
        personalizations: Array.from(emails, email => {
            return {
                to: email,
            }
        })
    } satisfies MailDataRequired;

    mail.send(msg);
}

export async function markConfirmation(meeting: Meeting, result: null | boolean, user: string, team: string) {
    const db = firebaseAdmin.getFirestore();

    await db.runTransaction(async t => {
        const confirmations = (await t.get(db.collection('teams').doc(team).collection('meetings').doc(meeting.id))).data()?.confirmations as Meeting["confirmations"];

        if(!confirmations) return;

        for(let i = 0; i < confirmations.length; i++) {
            if(confirmations[i].id == user) {
                confirmations[i].result = result;
            }
        }

        t.update(db.collection('teams').doc(team).collection('meetings').doc(meeting.id), {
            confirmations: confirmations,
        })
    })
}
