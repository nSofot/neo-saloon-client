import { NextRequest, NextResponse } from "next/server";
import { isPrivileged } from "@/utils/authentication";
import productCreationRequestSchema from "@/types/dto/productCreationRequest";
import z from "zod";
import prisma from "@/lib/prisma";

export async function GET(request : NextRequest) {



}

export async function POST(request : NextRequest) {

    const isHasPrivilege = await isPrivileged(request, "products:add");

    if (isHasPrivilege) {

        try{

            const body = await request.json();
            const parsedBody = productCreationRequestSchema.parse(body);

            await prisma.product.create(
                {
                    data : {
                        sku : parsedBody.sku,
                        name : parsedBody.name,
                        altNames : parsedBody.altNames,
                        description : parsedBody.description,
                        stock : parsedBody.stock,
                        status : parsedBody.status,
                        price : parsedBody.price,
                        comparePrice : parsedBody.comparePrice,
                        brand : parsedBody.brand,
                        model : parsedBody.model,
                        media : {
                            create : parsedBody.media
                        }
                    }
                }
            );

            return NextResponse.json(
                { message: "Product created successfully" }, 
                { status: 201 }
            );
            
        }catch (error) {
            
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    { message: error.issues[0].message ?? "Invalid input" }, 
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { message: "internal server error" }, 
                { status: 500 }
            );
        }

    }else {
        return NextResponse.json({ message: "You do not have the privilege to add products." }, { status: 403 });
    }

}