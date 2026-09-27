import z from "zod";

const UserSelfUpdateRequestSchema = z.object(
    {
        id: z.never().optional(),
        password: z.never().optional(),
    }
);

export type UserSelfUpdateRequest = z.infer<typeof UserSelfUpdateRequestSchema>;

export { UserSelfUpdateRequestSchema };