import prisma from "@/db/client/prismaClient"
import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"

export async function GET(req: Request) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return Response.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const query = searchParams.get("q")?.trim()

		const users = await prisma.user.findMany({
			where: query
				? {
						OR: [
							{ name: { contains: query, mode: "insensitive" } },
							{ email: { contains: query, mode: "insensitive" } }
						]
					}
				: undefined,
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				createdAt: true
			},
			orderBy: {
				createdAt: "desc"
			}
		})

		return Response.json(users)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to load users"
		return Response.json({ error: message }, { status: 500 })
	}
}
