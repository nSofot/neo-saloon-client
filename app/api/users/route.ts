import prisma from "@/lib/prisma";
import { RequestUserType } from "@/types/requestUser";
import { getUser, isPrivileged } from "@/utils/authentication";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// GET /api/users - get all users
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

    if(body.email == null){
        return NextResponse.json(
            {
                message : "Email is required"
            },
            {
                status : 422
            }
        );
    }

    if(body.firstName == null){
        return NextResponse.json(
            {
                message : "First name is required"
            },
            {
                status : 422
            }
        );
    }

    if(body.lastName == null){
        return NextResponse.json(
            {
                message : "Last name is required"
            },
            {
                status : 422
            }
        );
    }

    if(body.password == null){
        return NextResponse.json(
            {
                message : "Password is required"
            },
            {
                status : 422
            }
        );
    }

    const existingUser = await prisma.user.findUnique({
        where : {
            email : body.email
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

    const passwordHash = await bcrypt.hash(body.password, 12);

    await prisma.user.create({
        data : {
            email : body.email,
            firstName : body.firstName,
            lastName : body.lastName,
            password : passwordHash,
            phone : body.phone
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

    const body = await request.json();

    if(requestedUser.id !== id){
        // User is trying to update their own information
        // never allow users to update their own role, status or privileges

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
}