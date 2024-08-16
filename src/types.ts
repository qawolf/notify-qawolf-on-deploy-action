import zod from "zod";

export const urlSchema = zod.string().url();
