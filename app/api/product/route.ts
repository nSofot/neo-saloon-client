import { NextRequest, NextResponse } from "next/server";
import { isPrivileged } from "@/utils/authentication";

export async function GET(request : NextRequest) {



}

export async function POST(request : NextRequest) {

    const isHasPrivilege = await isPrivileged(request, "products:add");

    if (!isHasPrivilege) {

        const body = await request.json();

    }else {
        return NextResponse.json({ message: "You have the privilege to add products." }, { status: 200 });
    }

}