import { redirect } from "next/navigation";
import { optionalUserId } from "@/lib/auth";
export default async function Home() { redirect((await optionalUserId()) ? "/dashboard" : "/login"); }
