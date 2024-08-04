// pages/api/env.js
export const dynamic = "force-dynamic"
// import useEnv from "@/lib/useEnv"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// export default function handler(req, res) {
//   console.log(req)
//   res.status(200).json({ name: "John Doe" })
// }

export async function GET(request: Request, { params }: any) {
  console.log("rrrrrrr")
  // const req = NextRequest.arguments
  const host = request.headers.get("host")
  // const header = headers()

  console.log(host)
  try {
    const cloudfrontUrl = host

    if (!cloudfrontUrl) {
      return NextResponse.json(
        { error: "CloudFront URL is not defined" },
        { status: 400 }
      )
    }

    const response = await fetch(`${cloudfrontUrl}/env.json`)

    if (!response.ok) {
      throw new Error("Failed to fetch env.json")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error fetching env.json:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
