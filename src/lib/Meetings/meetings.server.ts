
import { PUBLIC_DEFAULT_USER } from "$env/static/public";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod"

export const meetingSchema = z.object({
    name: z.string({ invalid_type_error: "Name must be a string.", required_error: "Name field must be filled."}).min(1, { message: "Name must be at least one character."}).max(100, { message: "Name cannot be more than a hundred characters."}),
    location: z.string({ invalid_type_error: "Location must be a string.", required_error: "Location field must be filled."}).min(1, { message: "Location must be at least one character."}).max(100, { message: "Location cannot be more than a hundred characters."}),
    lead: z.string({ invalid_type_error: "Lead uid must be a string.", required_error: "Lead field must be filled."}).min(1, { message: "Lead uid must be at least one character."}).max(100, { message: "Lead uid cannot be more than a hundred characters."}),
    synopsis: z.string({ invalid_type_error: "Synopsis uid must be a string.", required_error: "Synopsis field must be filled."}).min(1, { message: "Synopsis uid must be at least one character."}).max(100, { message: "Synopsis uid cannot be more than a hundred characters."}).optional(),
    mentor: z.string({ invalid_type_error: "Mentor uid must be a string.", required_error: "Mentor field must be filled."}).min(1, { message: "Mentor uid must be at least one character."}).max(100, { message: "Mentor uid cannot be more than a hundred characters."}).optional(),
    role: z.string({ invalid_type_error: "Role id must be a string.", required_error: "Role field must be filled."}).min(1, { message: "Role id must be at least one character."}).max(100, { message: "Role id cannot be more than a hundred characters."}).optional(),
    thumbnail: z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).or(z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).startsWith('icon:', { message: "Thumbnail must be a link or an icon."})),
    starts: z.date({ invalid_type_error: "Unknown start time.", required_error: "Start time must be filled."}),
    ends: z.date({ invalid_type_error: "Unknown end time.", required_error: "End time must be filled."}),
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
    }).array()
})

export async function getUserList(db: Firestore, team: string) {
    const userDocs = ((await db.collection('users').where('team', '==', team).get()).docs);

    let users = new Array<string>();

    userDocs.forEach((snapshot) => {
        if(snapshot.id != PUBLIC_DEFAULT_USER) {
            users.push(snapshot.id);
        }
    })

    return users;
}