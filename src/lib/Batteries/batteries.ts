import { z } from "zod";

export const AddBattery = z.object({
  condition: z.union(
    [
      z.literal("Good"),
      z.literal("Fair"),
      z.literal("Bad"),
      z.literal("Unknown"),
    ],
    {
      required_error: "Enter a condition.",
      invalid_type_error: "Condition must be Good, Fair, or Bad.",
    },
  ),
  lastchecked: z.date({
    required_error: "Last checked required.",
    invalid_type_error: "Invalid date in last checked.",
  }),
  use: z.union(
    [
      z.literal("Competition"),
      z.literal("Practice"),
      z.literal("Testing"),
      z.literal("Decommissioned"),
      z.literal("Unknown"),
    ],
    {
      required_error: "Enter a use.",
      invalid_type_error: "Use must be one of the avilable options.",
    },
  ),
});

export interface Battery {
  condition: "Good" | "Fair" | "Bad" | "Unknown";
  lastchecked: Date;
  use: "Competition" | "Practice" | "Testing" | "Decommissioned";
  code: string;
  history: {
    timestamp: Date;
    message: string;
    author: string;
  }[];
}
