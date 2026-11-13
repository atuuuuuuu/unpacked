import { z } from 'zod'

/** One entry of Takeout's YouTube watch-history.json. */
export const watchEntry = z.object({
  header: z.string().optional(),
  title: z.string(),
  titleUrl: z.string().optional(),
  subtitles: z.array(z.object({ name: z.string(), url: z.string().optional() })).optional(),
  time: z.string(),
  details: z.array(z.object({ name: z.string() })).optional(),
})
