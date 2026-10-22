"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, MapPin, XCircle, ArrowLeft, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PopulatedResource {
    _id: string
    name: string
    type: string
    location: string
}

interface PopulatedUser {
    _id: string
    firstName: string
    lastName: string
    email: string
}

interface Booking {
    _id: string
    resourceId: PopulatedResource
    userId?: PopulatedUser
    startTime: string
    endTime: string
    status: "confirmed" | "cancelled"
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const [error, setError] = useState("")

    const router = useRouter()
    const { user, logout } = useAuthStore()

    const isAdmin = user?.role === "admin"

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        if (!user) {
            router.push("/login")
            return
        }

        fetchBookings()
    }, [isMounted, user, router])

    const fetchBookings = async () => {
        try {
            const endpoint = isAdmin ? "/bookings/all" : "/bookings/me"
            const response = await api.get(endpoint)
            setBookings(response.data)
        } catch (err: any) {
            console.error("Failed to fetch bookings:", err)
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout()
                router.push("/login")
            } else {
                setError("Could not load booking history")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancelBooking = async (bookingId: string) => {
        try {
            await api.patch(`/bookings/${bookingId}/cancel`)

            setBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking._id === bookingId ? { ...booking, status: "cancelled" } : booking
                )
            )
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to cancel booking")
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-GB", {
            hour: "2-digit", minute: "2-digit"
        })
    }

    if (!isMounted || isLoading) {
        return <div className="flex h-screen items-center justify-center text-gray-500">Loading bookings...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-in fade-in duration-100">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft size={16} />
                    </Button>
                    <h1 className="text-2xl font-bold">
                        {isAdmin ? "All System Bookings" : "My Bookings"}
                    </h1>
                </div>
            </header>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.length === 0 && !error ? (
                    <p className="text-gray-500 col-span-full text-center py-10">No bookings found</p>
                ) : (
                    bookings.map((booking) => {
                        const isCancelled = booking.status === "cancelled"
                        const hasStarted = new Date(booking.startTime) <= new Date()

                        return (
                            <Card key={booking._id} className={`${isCancelled ? "opacity-60 bg-gray-100" : ""}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg">{booking.resourceId?.name}</CardTitle>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${isCancelled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                            }`}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">

                                    {isAdmin && booking.userId && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600 font-medium bg-blue-50 p-2 rounded-md mb-2">
                                            <UserIcon size={16} />
                                            {booking.userId.firstName} {booking.userId.lastName}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={16} />
                                        {booking.resourceId?.location}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar size={16} />
                                        {formatDate(booking.startTime)}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock size={16} />
                                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </div>

                                    {!isCancelled && (isAdmin || !hasStarted) && (
                                        <Button
                                            variant="destructive"
                                            className="w-full mt-4 flex items-center gap-2"
                                            onClick={() => handleCancelBooking(booking._id)}
                                        >
                                            <XCircle size={16} />
                                            Cancel Booking
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}