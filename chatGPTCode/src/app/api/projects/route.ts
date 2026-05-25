import prisma from "../../../db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    return Response.json(projects)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load projects"
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
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const description = typeof body?.description === "string" ? body.description.trim() : undefined

    if (!name) {
      return Response.json({ error: "Project name is required" }, { status: 400 })
    }
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN"
          }
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    return Response.json(project)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project"
    return Response.json({ error: message }, { status: 500 })
  }
}