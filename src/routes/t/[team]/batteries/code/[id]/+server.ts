import { DOMAIN } from "$env/static/private";
import { error, text } from "@sveltejs/kit";
import qrcode from "qrcode-generator";
import { z } from "zod";

const Number = z.coerce.number();

export async function GET({ params, locals }) {
  let id = params.id;
  let team = locals.unverifiedTeam;

  try {
    id = Number.parse(id).toString();
  } catch (e) {
    throw error(404, "Invalid Code");
  }

  if(team == null) throw error(404, "Invalid Code");

  let qr = await new Promise<string>((resolve) => {
    let qr = qrcode(0, "H");
    qr.addData(DOMAIN + "/t/" + locals.unverifiedTeam + "/batteries?id=" + id);
    qr.make();
    resolve(qr.createSvgTag());
  });

  return new Response(qr, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": "inline;filename=image.svg",
    },
  });
}
