import colors from "tailwindcss/colors";

export type Indicator = { color: string; icon: string };
export type Hours = {
  total: number;
  deleted: boolean;
  entries: {
    total: number;
    id: string;
    latest: number;
    history: {
      total: number;
      reason: string | null;
      link: string | null;
      date: number;
      indicator: Indicator;
      id: string | null;
    }[];
  }[];
};

export const meetingIndicator: Indicator = {
  color: colors.blue["500"],
  icon: "event_note",
};
