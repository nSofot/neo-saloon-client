import z from "zod";

const UserSelfUpdateRequestSchema = z.object(
    {
        id: z.never().optional(),
        email: z.email().optional(),
        firstName: z.string().max(20).min(2).optional(),
        lastName: z.string().max(20).min(2).optional(),
        phone: z.string().regex(/^(\+94|0)?7[0-9]{8}$/).optional(),
        profilePicture: z.url().optional(),
        role: z.never().optional(),
        status: z.never().optional(),
        privileges: z.never().optional(),
        password: z.never().optional(),
    }
);

export type UserSelfUpdateRequest = z.infer<typeof UserSelfUpdateRequestSchema>;

export { UserSelfUpdateRequestSchema };