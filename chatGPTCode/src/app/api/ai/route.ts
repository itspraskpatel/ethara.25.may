import { authOptions } from "@/app/api/lib/auth"
import { getServerSession } from "next-auth/next"
import prisma from "@/db/client/prismaClient"
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
        }
        const body = await req.json().catch(() => ({}))
        if (!body?.projectId) {
            return Response.json({ error: "projectId is required" }, { status: 400 })
        }
        const API_KEY = process.env.OPENROUTER_API_KEY
        if (!API_KEY) {
            return Response.json({ error: "OpenRouter API key is not configured" }, { status: 500 })
        }
        const allTasks = await prisma.task.findMany({
            where: { projectId: body.projectId },
            include: {
                assignee: {
                    select: { id: true, name: true }
                }
            }
        })
        const taskSummary = allTasks.map(task => 
            `• ${task.title} | Status: ${task.status} | Priority: ${task.priority} | Due: ${task.dueDate?.toISOString().split('T')[0] || 'N/A'} | Assigned: ${task.assignee?.name || 'Unassigned'}`
        ).join('\n')
        const messages = [
            {
                role: 'system',
                content: `You are a helpful project assistant. Create a clear, concise project summary in Markdown.
 
Format your response EXACTLY like this:
## Project Summary
 
### Status Overview
- [Task 1] — **Status:** TODO
- [Task 2] — **Status:** TODO
 
### Priority Items
- [High/Urgent task 1]
- [High/Urgent task 2]
 
### Assignments
- [Task name] — **Assigned to:** [Name]
 
Rules:
• Use bold only for labels (Status:, Priority:, Assigned to:)
• Keep each bullet to 1 line maximum
• Group by status and priority
• NO JSON, code blocks, or explanations`
            },
            {
                role: 'user',
                content: `Summarize this project:\n\n${taskSummary}`
            }
        ]
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-3.1-flash-lite-preview',
                // model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: messages,
                max_tokens: 800,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const message = errorData?.error || 'Failed to get response from OpenRouter'
            return Response.json({ error: message }, { status: 500 })
        }
        const data = await response.json()

        // The Nvidia reasoning model returns content in 'reasoning' field, not 'content'
        let summary = data?.choices?.[0]?.message?.content

        // Fallback to reasoning if content is null
        if (!summary && data?.choices?.[0]?.message?.reasoning) {
            summary = data?.choices?.[0]?.message?.reasoning
        }

        if (!summary) {
            return Response.json({ error: "No summary generated" }, { status: 500 })
        }

        return Response.json({ summary: summary })

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to process request"
        return Response.json({ error: message }, { status: 500 })
    }
}
