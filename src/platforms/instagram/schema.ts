import { z } from 'zod'

/**
 * Instagram's relationship entry. Older exports put the username in string_list_data[].value;
 * exports since late 2024 sometimes put it in `title` and leave only an href.
 */
export const relationEntry = z.object({
  title: z.string().optional(),
  string_list_data: z
    .array(
      z.object({
        href: z.string().optional(),
        value: z.string().optional(),
        timestamp: z.number().optional(),
      }),
    )
    .optional(),
})

export type RelationEntry = z.infer<typeof relationEntry>
