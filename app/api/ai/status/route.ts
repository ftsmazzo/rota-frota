import {authorize} from "../../../../lib/auth";
export async function GET(request:Request){const user=await authorize(request);if(user instanceof Response)return user;return Response.json({configured:!!process.env.OPENROUTER_API_KEY},{headers:{"Cache-Control":"no-store"}})}
