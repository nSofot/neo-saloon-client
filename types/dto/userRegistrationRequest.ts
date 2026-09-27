import {z} from "zod";

const UserRegistrationRequestSchema = z.object({
  email: z.email(),
  firstName: z.string().max(20).min(2),
  lastName: z.string().max(20).min(2),
  password: z.string().min(4).max(20),
  phone: z.string().regex(/^(\+94|0)?7[0-9]{8}$/).optional(),
  privileges: z.never().optional(),
});

export type UserRegistrationRequest = z.infer<typeof UserRegistrationRequestSchema>;

export { UserRegistrationRequestSchema };