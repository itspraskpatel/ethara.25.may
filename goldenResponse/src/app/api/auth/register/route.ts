import prisma from "@/db/client/prismaClient"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!name || !email || !password) {
      return Response.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return Response.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    })
    return Response.json(user)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed"
    return Response.json({ error: message }, { status: 500 })
  }
}