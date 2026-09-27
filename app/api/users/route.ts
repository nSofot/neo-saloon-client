import prisma from "@/lib/prisma";
import { UserRegistrationRequestSchema } from "@/types/dto/userRegistrationRequest";
import type { UserRegistrationRequest } from "@/types/dto/userRegistrationRequest";
import  { UserSelfUpdateRequestSchema } from "@/types/dto/userSelfUpdateRequest";
import { RequestUserType } from "@/types/requestUser";
import { getUser, isPrivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

// GET /api/users - get all users`
export async function GET(request: NextRequest) {

    const havePrivilege = await isPrivileged(request, "users:read");

    if(!havePrivilege){
        return NextResponse.json(
            {
                message : "You are not authorized to view this information"
            },
            {
                status : 403
            }
        );
    }

    const pageNumberInString = request.nextUrl.searchParams.get("pageNumber");
    const pageSizeInString = request.nextUrl.searchParams.get("pageSize");

    const pageNumber = pageNumberInString ? parseInt(pageNumberInString) : 1;
    const pageSize = pageSizeInString ? parseInt(pageSizeInString) : 10;

    const userCount = await prisma.user.count();

    const totalPages = Math.ceil(userCount / pageSize);

    if(pageNumber > totalPages){
        return NextResponse.json(
            {
                message : "Page number exceeds total pages",
                totalPages : totalPages
            },
            {
                status : 400
            }
        );
    }

    const users = await prisma.user.findMany({
        skip : (pageNumber - 1) * pageSize,
        take : pageSize,
        select : {
            id : true,
            email : true,
            phone : true,
            firstName : true,
            lastName : true,
            password : false,
            role : true,
            status : true,
            lastLogin : true,
            privileges : true,
            profileImage : true
        }
    });


    return NextResponse.json(
        {
            message : "Users fetched successfully",
            users : users,
            pagination : {
                pageNumber : pageNumber,
                pageSize : pageSize,
                totalPages : totalPages,
                userCount : userCount
            }
        },
        {
            status : 200
        }
    );
}

// POST /api/users - create a new user
export async function POST(request: NextRequest) {

    //email, lastName, firstName, password, phone (optional)
    const body = await request.json();

    //validate the request body using zod
    try{
        const parseBody = UserRegistrationRequestSchema.parse(body);

        const existingUser = await prisma.user.findUnique({
            where : {
                email : parseBody.email
            }
        });

        if(existingUser != null){
            return NextResponse.json(
                {
                    message : "User with this email already exists"
                },
                {
                    status : 409
                }
            );
        }

        const passwordHash = await bcrypt.hash(parseBody.password, 12);

        await prisma.user.create({
            data : {
                email : parseBody.email,
                firstName : parseBody.firstName,
                lastName : parseBody.lastName,
                password : passwordHash,
                phone : parseBody.phone
            }
        });

        return NextResponse.json(
            {
                message : "User created successfully"
            },
            {
                status : 201
            }
        );

    }catch(error){

        if(error instanceof z.ZodError){
            return NextResponse.json(
                {
                    message : error.issues[0].message ?? "Invalid request body"
                },
                {
                    status : 400
                }
            );
        }

        return NextResponse.json(
            {
                message : "Invalid request body",
                error : error
            },
            {
                status : 400
            }
        );
    }
}

// OUT /api/users - update a user
export async function PUT(request: NextRequest) {

    const id = request.nextUrl.searchParams.get("id");

    const requestedUser: RequestUserType | null = await getUser(request);

    if(requestedUser == null){
        return NextResponse.json(
            {
                message : "You are not logged in"
            },
            {
                status : 401
            }
        );
    }

    try{
        const body = await request.json();

        if(requestedUser.id !== id){
            // User is trying to update their own information
            // never allow users to update their own role, status or privileges

            UserSelfUpdateRequestSchema.parse(body);


            const user = await prisma.user.findUnique({
                where : {
                    id : id || "0000"
                }
            });

            if(user == null){
                return NextResponse.json(
                    {
                        message : "User not found"
                    },
                    {
                        status : 404
                    }
                );
            }

            await prisma.user.update({
                where : {
                    id : id || "0000"
                },
                data : {
                    email : body.email || user.email,
                    firstName : body.firstName || user.firstName,
                    lastName : body.lastName || user.lastName,
                    phone : body.phone || user.phone,
                    profileImage : body.profileImage || user.profileImage // should be included in the token
                }
            });

            return NextResponse.json(
                {
                    message : "User updated successfully"
                },
                {
                    status : 200
                }
            );

        }else{
            // User is trying to update someone else's information

            const havePrivilege = await isPrivileged(request, "users:edit");

            if(!havePrivilege){
                return NextResponse.json(
                    {
                        message : "You do not have the privilege to update other users' information"
                    },
                    {
                        status : 403
                    }
                );
            }

            UserSelfUpdateRequestSchema.parse(body);

            const user = await prisma.user.findUnique({
                where : {
                    id : id || "0000"
                }
            });

            if(user == null){
                return NextResponse.json(
                    {
                        message : "User not found"
                    },
                    {
                        status : 404
                    }
                );
            }

            await prisma.user.update({
                where : {
                    id : id || "0000"
                },
                data : {
                    email : body.email || user.email,
                    firstName : body.firstName || user.firstName,
                    lastName : body.lastName || user.lastName,
                    phone : body.phone || user.phone,
                    profileImage : body.profileImage || user.profileImage,
                    role : body.role || user.role,
                    status : body.status || user.status,
                    privileges : body.privileges || user.privileges
                }
            });

            return NextResponse.json(
                {
                    message : "User updated successfully"
                },
                {
                    status : 200
                }
            );
        }
    }catch(error){

        if(error instanceof z.ZodError){
            return NextResponse.json(
                {
                    message : error.issues[0].message ?? "Invalid request body"
                },
                {
                    status : 400
                }
            );
        }

        return NextResponse.json(
            {
                message : "Server error",
                error : error
            },
            {
                status : 500
            }
        )
    }
}