"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const router = useRouter()
    const login = useAuthStore(state => state.login)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            const response = await api.post("/auth/login", { email, password })

            login(response.data.user, response.data.token)

            router.push("/dashboard")
        } catch (error: any) {
            setError(error.response?.data?.message || "Authorization error")
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 animate-in fade-in duration-100">
            <Card className="w-100">
                <CardHeader>
                    <CardTitle>Log In</CardTitle>
                    <CardDescription>Enter your login details to access your bookings</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="mail@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <Button type="submit" className="w-full">Log in</Button>

                        <p className="text-sm text-center text-gray-500 mt-4">
                            Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}