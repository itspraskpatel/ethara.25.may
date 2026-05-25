import prisma from "@/db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { tasks: true, members: true }
    })

    return Response.json(project)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load project"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    //check if admin
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: session.user.id,
        role: "ADMIN"
      }
    })

    if (!member) return Response.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => ({}))

    const updated = await prisma.project.update({
      where: { id },
      data: body
    })

    return Response.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.project.delete({
      where: { id, ownerId: session.user.id }
    })

    return Response.json({ success: true, message: "Deleted" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete project"
    return Response.json({ error: message }, { status: 500 })
  }
}