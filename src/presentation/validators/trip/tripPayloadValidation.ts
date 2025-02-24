import { z } from "zod";

const tripPayloadValidation = z.object({
  destination: z.string().min(4),
  starts_at: z.coerce.date(),
  ends_at: z.coerce.date(),
  owner_name: z.string(),
  owner_email: z.string().email(),
  participants_to_invite: z.array(
    z.object({
      name: z.string().min(3),
      email: z.string().email(),
    })
  ),
});

export {
  tripPayloadValidation,
}
