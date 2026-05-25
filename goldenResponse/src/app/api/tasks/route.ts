import prisma from "@/db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId") as string

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return Response.json(tasks)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load tasks"
    return Response.json({ error: message }, { status: 500 })
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    const projectId = typeof body?.projectId === "string" ? body.projectId : ""
    const dueDate = typeof body?.dueDate === "string" ? new Date(body.dueDate) : undefined
    const priority = typeof body?.priority === "string" ? body.priority : undefined
    const validPriority = priority && ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)

    if (!title || !projectId) {
      return Response.json({ error: "Title and projectId are required" }, { status: 400 })
    }

    if (body?.assigneeId) {
      const validAssignee = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: body.assigneeId },
            { members: { some: { userId: body.assigneeId } } }
          ]
        },
        select: { id: true,ownerId: true }
      })
      if (!validAssignee) {
        return Response.json({ error: "Assignee must be a project member" }, { status: 400 })
      }
      if(validAssignee.ownerId !== session.user.id) {
        // Only project owner can assign tasks to others
        return Response.json({ error: "Only project owner can assign tasks" }, { status: 403 })
      }
    }


    const task = await prisma.task.create({
      data: {
        title,
        projectId,
        dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : undefined,
        priority: validPriority ? priority : undefined,
        creatorId: session.user.id,
        assigneeId: body.assigneeId
      }
    })

    return Response.json(task)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create task"
    return Response.json({ error: message }, { status: 500 })
  }
}