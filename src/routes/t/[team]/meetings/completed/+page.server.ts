import { redirect } from "@sveltejs/kit";

export function load({ locals }) {
  throw redirect(
    307,
    "/t/" + locals.team ?? "000000" + "/meetings/completed/1",
  );
}
