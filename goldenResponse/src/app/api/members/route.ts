import prisma from "@/db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    if (!projectId) {
      return Response.json({ error: "projectId is required" }, { status: 400 })
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true }
    })

    return Response.json(members)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load members"
    return Response.json({ error: message }, { status: 500 })
  }
}

//add memeber
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.userId || !body?.projectId) {
      return Response.json({ error: "userId and projectId are required" }, { status: 400 })
    }
    //only add if admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const project = await prisma.project.findFirst({
      where: {
        id: body.projectId,
        ownerId: session.user.id
      }
    })
    if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })
      //check if already a member
    const existing = await prisma.projectMember.findFirst({
      where: {
        projectId: body.projectId,
        userId: body.userId
      }
    })
    if (existing) return Response.json({ error: "User is already a member" }, { status: 400 })
    const member = await prisma.projectMember.create({
      data: {
        projectId: body.projectId,
        userId: body.userId,
        role: body.role || "MEMBER"
      }
    })

    return Response.json(member)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add member"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body?.userId || !body?.projectId) {
      return Response.json({ error: "userId and projectId are required" }, { status: 400 })
    }
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (body.userId === session.user.id) {
      return Response.json({ error: "You cannot remove yourself" }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: body.projectId,
        ownerId: session.user.id
      }
    })
    if (!project) return Response.json({ error: "Forbidden , You are not the owner of this project" }, { status: 403 })
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: body.userId,
          projectId: body.projectId
        }
      }
    })

    return Response.json({ success: true, message: "Removed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove member"
    return Response.json({ error: message }, { status: 500 })
  }
}