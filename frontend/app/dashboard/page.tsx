"use client"

import BookingDialog from "@/components/ui/BookingDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { Resource } from "@/shared/types"
import { useAuthStore } from "@/store/authStore"
import { Filter, LogOut, MapPin, Monitor } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardPage() {
    const [resources, setResources] = useState<Resource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    const [filterType, setFilterType] = useState<string>("all")
    const [filterDate, setFilterDate] = useState<string>("")

    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const router = useRouter()

    const { user, logout } = useAuthStore()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        if (!user) {
            router.push("/login")
            return
        }

        const fetchResources = async () => {
            try {
                const response = await api.get("/resources")
                setResources(response.data)
            } catch (error: any) {
                console.error("Resource loading error:", error)
                if (error.response?.status === 401 || error.response?.status === 403) {
                    logout()
                    router.push("/login")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchResources()
    }, [user, router, isMounted, logout])

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    const openBookingDialog = (resource: Resource) => {
        setSelectedResource(resource)
        setIsDialogOpen(true)
    }

    const filteredResources = resources.filter(resource => {
        if (filterType !== "all" && resource.type !== filterType) {
            return false
        }
        return true
    })

    if (!isMounted || isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-in fade-in duration-100">
            <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm mb-8">
                <div>
                    <h1 className="text-2xl font-bold">DeskManager</h1>
                    <p className="text-gray-500 text-sm">Welcome, {user?.firstName} ({user?.role})</p>
                </div>
                <div className="flex gap-4">
                    {user?.role === "admin" && (
                        <>
                            <Button variant="secondary" onClick={() => router.push("/admin/users")}>
                                Users
                            </Button>
                            <Button variant="secondary" onClick={() => router.push("/admin/resources")}>
                                Resources
                            </Button>
                        </>
                    )}
                    <Button variant="secondary" onClick={() => router.push("/bookings")}>
                        {user?.role === "admin" ? "All Bookings" : "My Bookings"}
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="flex gap-2">
                        <LogOut size={16} /> Logout
                    </Button>
                </div>
            </header>

            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex items-center gap-2 mb-2 md:hidden">
                    <Filter size={16} className="text-gray-500" />
                    <span className="font-medium">Filters</span>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <Label>Resource Type</Label>
                    <Select value={filterType} onValueChange={(value) => setFilterType(value || "all")}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Resources</SelectItem>
                            <SelectItem value="desk">Desks Only</SelectItem>
                            <SelectItem value="room">Meeting Rooms</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-64 space-y-2 mb-2">
                    <Label>Date (Check Availability)</Label>
                    <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>

                <Button
                    className="mb-2"
                    variant="outline"
                    onClick={() => {
                        setFilterType("all")
                        setFilterDate("")
                    }}
                >
                    Reset
                </Button>
            </div>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    Available Resources {filteredResources.length > 0 && `(${filteredResources.length})`}
                </h2>

                {filteredResources.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl text-center shadow-sm border border-dashed">
                        <p className="text-gray-500">No resources match your current filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <Card key={resource._id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                                    <Monitor className="text-gray-400" size={20} />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                        <MapPin size={16} />
                                        {resource.location}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded-full capitalize">
                                            {resource.type}
                                        </span>
                                        <Button size="sm" onClick={() => openBookingDialog(resource)}>
                                            Book Now
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <BookingDialog
                resource={selectedResource}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                initialDate={filterDate}
            />
        </div>
    )
}