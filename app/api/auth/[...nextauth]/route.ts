import type { NextRequest } from "next/server";
import authHandler from "@/lib/auth";

export const runtime = "nodejs";

export const GET = authHandler as (
  request: NextRequest
) => void | Response | Promise<void | Response>;

export const POST = authHandler as (
  request: NextRequest
) => void | Response | Promise<void | Response>;
