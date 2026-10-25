import prisma from "@/lib/prisma";
import z from "zod";

const ProductsStatusEnum = z.enum(["ACTIVE", "INACTIVE","DELETED"]);
const MediaTypeEnum = z.enum(["IMAGE", "VIDEO"]);

export const productCreationRequestSchema = z.object({
    sku: z.string().max(50),
    name: z.string().max(100),
    altNames: z.array(z.string().max(100)).optional(),
    description: z.string(),
    stock: z.number().int().min(0),
    status: ProductsStatusEnum.optional().default("ACTIVE"),
    price: z.number().min(0),
    comparePrice: z.number().min(0).optional(),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    media: z.array(z.object({
        url: z.url(),
        type: MediaTypeEnum
    }))
})

export default productCreationRequestSchema;

export type ProductCreationRequest = z.infer<typeof productCreationRequestSchema>;