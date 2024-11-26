import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const response = await fetch('http://localhost:8000/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: body.query }),
    })

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`)
    }

    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    
    return NextResponse.json(data)
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json(
      { 
        error: 'Backend server no response.',
        details: err instanceof Error ? err.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}