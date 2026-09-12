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

    const users = await prisma.user.findMany({
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
        }
    });

    return NextResponse.json(
        {
            message : "Users fetched successfully",
            users : users
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

    if(requestedUser.id !== id){
        // User is trying to update their own information
    }else{
        // User is trying to update someone else's information
    }
}