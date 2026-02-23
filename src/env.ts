import { z } from "zod";

export const env = z
  .object({
    GITHUB_TOKEN: z.string().optional(),
  })
  .parse(process.env);
