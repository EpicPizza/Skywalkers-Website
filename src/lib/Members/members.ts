import { z } from "zod";

const MainRole = z.union(
  [z.literal("mentor"), z.literal("parent"), z.literal("student")],
  {
    required_error: "A role must be choosen. ",
    invalid_type_error: "Role must be mentor, parent, or string.",
  },
);

export const EditProfile = z.object({
  id: z.string().min(1).max(100),
  name: z
    .string({
      required_error: "A name is required.",
      invalid_type_error: "Name must be a string.",
    })
    .min(1, { message: "Name must be at minimum one character." })
    .max(32, { message: "Name may not exceed 32 characters." }),
  pronouns: z
    .string({
      required_error: "Pronouns must be included, even if empty.",
      invalid_type_error: "Pronouns must be a string.",
    })
    .max(32, { message: "Pronouns may not exceed 32 characters." }),
});

export const QuarantineMember = z.object({
  id: z.string().min(1).max(100),
});

export const UnquarantineMember = z.object({
  id: z.string().min(1).max(100),
  name: z
    .string({
      required_error: "A name is required.",
      invalid_type_error: "Name must be a string.",
    })
    .min(1, { message: "Name must be at minimum one character." })
    .max(32, { message: "Name may not exceed 32 characters." }),
  pronouns: z
    .string({
      required_error: "Pronouns must be included, even if empty.",
      invalid_type_error: "Pronouns must be a string.",
    })
    .max(32, { message: "Pronouns may not exceed 32 characters." }),
  roles: z
    .string({
      required_error: "Something goofed up.",
      invalid_type_error: " Roles must be an array of strings. ",
    })
    .min(1, "Role id must be a least one character long.")
    .max(100, "Role id must not exceed a hundred characters.")
    .array(),
  role: MainRole,
});
