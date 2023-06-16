
import { PUBLIC_DEFAULT_USER } from "$env/static/public";
import type { Firestore } from "firebase-admin/firestore";
import { z } from "zod"

export const meetingSchema = z.object({
    name: z.string({ invalid_type_error: "Name must be a string.", required_error: "Name field must be filled."}).min(1, { message: "Name must be at least one character."}).max(100, { message: "Name cannot be more than a hundred characters."}),
    location: z.string({ invalid_type_error: "Location must be a string.", required_error: "Location field must be filled."}).min(1, { message: "Location must be at least one character."}).max(100, { message: "Location cannot be more than a hundred characters."}),
    lead: z.string({ invalid_type_error: "Lead uid must be a string.", required_error: "Lead field must be filled."}).min(1, { message: "Lead uid must be at least one character."}).max(100, { message: "Lead uid cannot be more than a hundred characters."}),
    synopsis: z.string({ invalid_type_error: "Synopsis uid must be a string.", required_error: "Synopsis field must be filled."}).min(1, { message: "Synopsis uid must be at least one character."}).max(100, { message: "Synopsis uid cannot be more than a hundred characters."}),
    mentor: z.string({ invalid_type_error: "Mentor uid must be a string.", required_error: "Mentor field must be filled."}).min(1, { message: "Mentor uid must be at least one character."}).max(100, { message: "Mentor uid cannot be more than a hundred characters."}),
    thumbnail: z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).or(z.string({ invalid_type_error: "Thumbnail must be a stirng.", required_error: "Thumbnail field must be filled."}).url({ message: "Thumbnail must be a link or an icon."}).startsWith('icon:', { message: "Thumbnail must be a link or an icon."})),
    starts: z.date({ invalid_type_error: "Unknown start time.", required_error: "Start time must be filled."}),
    ends: z.date({ invalid_type_error: "Unknown end time.", required_error: "End time must be filled."}),
})

export async function getUserList(db: Firestore) {
    const userDocs = (await db.collection('users').listDocuments());

    let users = new Array<string>();

    userDocs.forEach((snapshot) => {
        if(snapshot.id != PUBLIC_DEFAULT_USER) {
            users.push(snapshot.id);
        }
    })

    return users;
}