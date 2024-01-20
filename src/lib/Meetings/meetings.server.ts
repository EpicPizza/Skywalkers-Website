
import { PUBLIC_DEFAULT_USER } from "$env/static/public";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod"

export const meetingSchema = z.object({
    name: z.string({ invalid_type_error: "Name must be a string.", required_error: "Name field must be filled."}).min(1, { message: "Name must be at least one character."}).max(100, { message: "Name cannot be more than a hundred characters."}),
    location: z.string({ invalid_type_error: "Location must be a string.", required_error: "Location field must be filled."}).min(1, { message: "Location must be at least one character."}).max(100, { message: "Location cannot be more than a hundred characters."}),
    lead: z.string({ invalid_type_error: "Lead uid must be a string.", required_error: "Lead field must be filled."}).min(1, { message: "Lead uid must be at least one character."}).max(100, { message: "Lead uid cannot be more than a hundred characters."}),
    synopsis: z.string({ invalid_type_error: "Synopsis uid must be a string.", required_error: "Synopsis field must be filled."}).min(0, { message: "Synopsis uid must be at least one character."}).max(100, { message: "Synopsis uid cannot be more than a hundred characters."}).optional(),
    mentor: z.string({ invalid_type_error: "Mentor uid must be a string.", required_error: "Mentor field must be filled."}).min(0, { message: "Mentor uid must be at least one character."}).max(100, { message: "Mentor uid cannot be more than a hundred characters."}).optional(),
    role: z.string({ invalid_type_error: "Role id must be a string.", required_error: "Role field must be filled."}).min(0, { message: "Role id must be at least one character."}).max(100, { message: "Role id cannot be more than a hundred characters."}).optional(),
    thumbnail: z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).or(z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).startsWith('icon:', { message: "Thumbnail must be a link or an icon."})),
    starts: z.date({ invalid_type_error: "Unknown start time.", required_error: "Start time must be filled."}),
    ends: z.date({ invalid_type_error: "Unknown end time.", required_error: "End time must be filled."}),
    virtual: z.boolean(),
})

export const recurringSchema = z.object({
    name: z.string({ invalid_type_error: "Name must be a string.", required_error: "Name field must be filled."}).min(1, { message: "Name must be at least one character."}).max(100, { message: "Name cannot be more than a hundred characters."}),
    location: z.string({ invalid_type_error: "Location must be a string.", required_error: "Location field must be filled."}).min(1, { message: "Location must be at least one character."}).max(100, { message: "Location cannot be more than a hundred characters."}),
    role: z.string({ invalid_type_error: "Role id must be a string.", required_error: "Role field must be filled."}).min(0, { message: "Role id must be at least one character."}).max(100, { message: "Role id cannot be more than a hundred characters."}).optional(),
    thumbnail: z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).or(z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).startsWith('icon:', { message: "Thumbnail must be a link or an icon."})),
    starts: z.date({ invalid_type_error: "Unknown start time.", required_error: "Start time must be filled."}),
    ends: z.date({ invalid_type_error: "Unknown end time.", required_error: "End time must be filled."}),
    recurring: z.union([z.literal("Weekly"), z.literal("Biweekly"), z.literal("Monthly")], { invalid_type_error: "Recurring type must be selected.", required_error: "Recurring type must be selected."}),
    day: z.union([z.literal("Monday"), z.literal("Tuesday"), z.literal("Wednesday"), z.literal("Thursday"), z.literal("Friday"), z.literal("Saturday"), z.literal("Sunday")], { invalid_type_error: "A day must be selected.", required_error: "A day must be selected."}),
    week: z.union([z.literal("First Week of the Month"), z.literal("Second Week of the Month"), z.literal("Third Week of the Month"), z.literal("Fourth Week of the Month")], { invalid_type_error: "A week must be selected.", required_error: "A week must be selected."}),
    virtual: z.boolean(),
})


export const duplicateSchema = z.object({
    meetings: z.object({
        id: z.string().min(1).max(100),
        starts: z.coerce.date(),
        ends: z.coerce.date(),
    }).array().min(1).max(100),
})

export const completeSchema = z.object({
    id: z.string().min(1).max(100),
    synopsis: z.string({ invalid_type_error: "Synopsis must be a string.", required_error: "A synopsis must be written."}).min(1, { message: "A synopsis must be written." }).max(10000, { message: "Ten thousand character max synopsis allowed."}),
    hours: z.object({
        time: z.number({ invalid_type_error: "Time must be a number.", required_error: "Hours contributed cannot be negative." }).nonnegative({ message: "Hours contributed cannot be negative." }).max(12, { message: "Max hours contributed is 12." }),
        id: z.string().min(1).max(100),
    }).array(),
    attachments: z.coerce.string().max(100).array().max(10),
    discord: z.boolean(),
})

export const editSchema = z.object({
    id: z.string().min(1).max(100),
    synopsis: z.string({ invalid_type_error: "Synopsis must be a string.", required_error: "A synopsis must be written."}).min(1, { message: "A synopsis must be written." }).max(10000, { message: "Ten thousand character max synopsis allowed."}),
    hours: z.object({
        time: z.number({ invalid_type_error: "Time must be a number.", required_error: "Hours contributed cannot be negative." }).nonnegative({ message: "Hours contributed cannot be negative." }).max(12, { message: "Max hours contributed is 12." }),
        id: z.string().min(1).max(100),
    }).array(),
    new: z.coerce.string().max(100).array().max(10),
    old: z.object({
        name: z.string({ invalid_type_error: "Name must be a string.", required_error: "A name is required for the attachment." }).min(1, {message: "Attachment name too small."}).max(100, { message: "Attachment name too long." }),
        description: z.string({ invalid_type_error: "Uh must be a string.", required_error: "A uh is required for the attachment." }).min(1, {message: "Uh name too small."}).max(100, { message: "Uh name too long." }),
        image: z.string({ invalid_type_error: "Uh must be a string.", required_error: "A uh is required for the attachment." }).min(1, {message: "Uh name too small."}).max(100, { message: "Uh name too long." }),
        remove: z.boolean({ invalid_type_error: "Remove value must be a boolean", required_error: "You must say whether you want an attachment to be removed." }) 
    }).array()
})

export async function getUserList(db: Firestore, team: string) {
    const userDocs = ((await db.collection('users').where('team', 'array-contains', team).get()).docs);

    let users = new Array<string>();

    userDocs.forEach((snapshot) => {
        if(snapshot.id != PUBLIC_DEFAULT_USER) {
            users.push(snapshot.id);
        }
    })

    return users;
}

export const attachmentHelpers = {
    arrayBufferToBuffer: (ab: ArrayBuffer) => {
        let buffer = Buffer.alloc(ab.byteLength);
        let view = new Uint8Array(ab);
    
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
    
        return buffer;
    },
    checkType: (type: string) => {
        switch(type) {
            case 'image/apng':
            case 'image/avif':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/webp':
            case 'application/pdf':
            case 'text/plain':
            case 'application/json':
            case 'text/csv':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.oasis.opendocument.presentation':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.oasis.opendocument.text':
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.oasis.opendocument.spreadsheet':
                return true;
            default:
                return false;
        }
    },
    isImage: (type: string): boolean => {
        switch(type) {
            case 'image/apng':
            case 'image/avif':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/webp':
                return true;
            case 'application/pdf':
            case 'text/plain':
            case 'application/json':
            case 'text/csv':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.oasis.opendocument.presentation':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.oasis.opendocument.text':
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.oasis.opendocument.spreadsheet':
            default:
                return false;
        }
    },
    isSecure: (type: string): boolean => {
        switch(type) {
            case 'text/plain':
            case 'application/json':
            case 'text/csv':
                return true;
            case 'image/apng':
            case 'image/avif':
            case 'image/gif':
            case 'image/jpeg':
            case 'image/png':
            case 'image/webp':
            case 'application/pdf':
            case 'application/vnd.ms-powerpoint':
            case 'application/vnd.oasis.opendocument.presentation':
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/msword':
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            case 'application/vnd.oasis.opendocument.text':
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            case 'application/vnd.oasis.opendocument.spreadsheet':
            default:
                return false;
        }
    },
    getCode: (previous: {url: string, type: string, name: string, location: string, code: string }[]): string => {
        const code = attachmentHelpers.getRandomCode();
    
        let found = false;
        for(let i = 0; i < previous.length; i++) {
            if(previous[i].code == code) {
                found = true;
            }
        }
    
        if(found) {
            return attachmentHelpers.getCode(previous);
        }
    
        return code;
    },
    getRandomNumber: () => {
        return crypto.getRandomValues(new Uint32Array(1))[0]/2**32;
    },
    getRandomCode: () => {
        let code = "";
    
        for(let i = 0; i < 6; i++) {
            code += Math.floor(attachmentHelpers.getRandomNumber() * 9 + 1);
        }
    
        return code;
    }
}