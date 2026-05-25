import prisma from "@/db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await prisma.task.findUnique({
      where: { id }
    })

    return Response.json(task)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load task"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    if (body?.status && !["TODO", "IN_PROGRESS", "DONE", "IN_REVIEW"].includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 })
    }

    const { id } = await params
    const existing = await prisma.task.findUnique({
      where: { id },
      select: { id: true, projectId: true, assigneeId: true }
    })

    if (!existing) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    if (body?.status) {
      // Only the task assignee or a project admin can change status
      const isAssignee = session.user.id === existing.assigneeId;
      if (!isAssignee) {
        const projectMember = await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId: session.user.id,
              projectId: existing.projectId,
            }
          },
          select: { role: true }
        });

        const isAdmin = projectMember?.role === 'ADMIN';
        if (!isAdmin) {
          return Response.json({ error: 'Forbidden: only the assignee or a project admin can change task status' }, { status: 403 });
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "assigneeId")) {
      const targetAssigneeId = body.assigneeId
      if (targetAssigneeId) {
        const validAssignee = await prisma.project.findFirst({
          where: {
            id: existing.projectId,
            OR: [
              { ownerId: targetAssigneeId },
              { members: { some: { userId: targetAssigneeId } } }
            ]
          },
          select: { id: true }
        })
        if (!validAssignee) {
          return Response.json({ error: "Assignee must be a project member" }, { status: 400 })
        }
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: body
    })

    return Response.json(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update task"
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    //only allow delete if user is project owner or admin

    const project = await prisma.task.findUnique({
      where: {
        id: (await params).id
      },
      select: {
        projectId: true
      }
    })
    if (!project) return Response.json({ error: "Task not found" }, { status: 404 })
    const checkIfProjectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: project?.projectId
        },
        OR: [
          { role: "ADMIN" },]
      }
    })
    if (!checkIfProjectMember) {
      return Response.json(
        { error: "You need to be Admin to perform this action" },
        { status: 403 }
      )
    }
    await prisma.task.delete({
      where: { id }
    })

    return Response.json({ success: true, message: "Deleted" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete task"
    return Response.json({ error: message }, { status: 500 })
  }
}