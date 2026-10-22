import { useEffect, useState } from "react"
import api from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Resource } from "@/shared/types"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { buildTimeOptions, dayRangeIso, overlaps, toDateTime } from "@/lib/booking-time"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface BookingDialogProps {
    resource: Resource | null
    isOpen: boolean
    onClose: () => void
    initialDate?: string
    initialStart?: string
    initialEnd?: string
}

interface BookedSlot {
    startTime: string
    endTime: string
    resourceId: string
}

const timeOptions = buildTimeOptions()

export default function BookingDialog({ resource, isOpen, onClose, initialDate, initialStart, initialEnd }: BookingDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")

    const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])

    const [bookingError, setBookingError] = useState("")
    const [bookingSuccess, setBookingSuccess] = useState("")
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)

    const initialDay = initialDate || format(new Date(), "yyyy-MM-dd")
    const isDateChanged = !!selectedDate && format(selectedDate, "yyyy-MM-dd") !== initialDay
    const isStartChanged = startTime !== (initialStart || "")
    const isEndChanged = endTime !== (initialEnd || "")
    const hasChanges = isDateChanged || isStartChanged || isEndChanged

    useEffect(() => {
        if (isOpen) {
            const date = initialDate ? new Date(initialDate) : new Date()
            const isStartInPast = !!initialStart && toDateTime(date, initialStart) < new Date()

            setSelectedDate(date)
            setStartTime(isStartInPast ? "" : initialStart || "")
            setEndTime(isStartInPast ? "" : initialEnd || "")
            setBookingError("")
            setBookingSuccess("")
        }
    }, [isOpen, initialDate, initialStart, initialEnd])

    useEffect(() => {
        if (!isOpen || !selectedDate || !resource) return

        let ignore = false

        const fetchAvailability = async () => {
            try {
                const { from, to } = dayRangeIso(selectedDate)
                const response = await api.get("/availability", {
                    params: { from, to, resourceId: resource._id }
                })

                if (!ignore) setBookedSlots(response.data)
            } catch (error) {
                console.error("Failed to fetch availability", error)
            }
        }

        fetchAvailability()

        return () => {
            ignore = true
        }
    }, [selectedDate, resource, isOpen])

    const isRangeFree = (day: Date, start: string, end: string): boolean => {
        const startDate = toDateTime(day, start)
        const endDate = toDateTime(day, end)

        if (endDate <= startDate) return false

        return !bookedSlots.some(slot =>
            overlaps(startDate, endDate, new Date(slot.startTime), new Date(slot.endTime))
        )
    }

    const isStartDisabled = (time: string): boolean => {
        if (!selectedDate) return true

        const start = toDateTime(selectedDate, time)
        if (start < new Date()) return true

        return bookedSlots.some(slot =>
            start >= new Date(slot.startTime) && start < new Date(slot.endTime)
        )
    }

    const isEndDisabled = (time: string): boolean => {
        if (!selectedDate || !startTime) return true
        return !isRangeFree(selectedDate, startTime, time)
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (hasChanges && !bookingSuccess) {
                setShowUnsavedAlert(true)
            } else {
                resetAndClose()
            }
        }
    }

    const resetAndClose = () => {
        setSelectedDate(undefined)
        setStartTime("")
        setEndTime("")
        setBookingError("")
        setBookingSuccess("")
        setShowUnsavedAlert(false)
        onClose()
    }

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setBookingError("")
        setBookingSuccess("")

        if (!selectedDate || !startTime || !endTime) {
            setBookingError("Please select date, start time and end time.")
            return
        }

        try {
            const startDateTime = toDateTime(selectedDate, startTime).toISOString()
            const endDateTime = toDateTime(selectedDate, endTime).toISOString()

            await api.post("/bookings", {
                resourceId: resource?._id,
                startTime: startDateTime,
                endTime: endDateTime
            })

            setBookingSuccess("Booking successfully created!")

            setTimeout(() => {
                resetAndClose()
            }, 2000)

        } catch (error: any) {
            setBookingError(error.response?.data?.message || "An error occurred during booking.")
        }
    }

    const handleDateChange = (date: Date | undefined) => {
        setSelectedDate(date)
        setStartTime("")
        setEndTime("")
    }

    const handleStartChange = (value: string) => {
        setStartTime(value)

        if (endTime && selectedDate && !isRangeFree(selectedDate, value, endTime)) {
            setEndTime("")
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-125">
                    <form onSubmit={handleBookingSubmit}>
                        <DialogHeader>
                            <DialogTitle>Book {resource?.name}</DialogTitle>
                            <DialogDescription>
                                Select an available date and time slot.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-6 py-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <Label>Date</Label>
                                <div className="border rounded-md p-2 flex justify-center bg-white">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={handleDateChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Time</Label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-xs text-gray-500">Start</Label>
                                        <Select value={startTime || null} onValueChange={(value) => handleStartChange(value ?? "")}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Start" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeOptions.slice(0, -1).map((time) => (
                                                    <SelectItem key={time} value={time} disabled={isStartDisabled(time)}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Label className="text-xs text-gray-500">End</Label>
                                        <Select value={endTime || null} onValueChange={(value) => setEndTime(value ?? "")}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="End" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {timeOptions.slice(1).map((time) => (
                                                    <SelectItem key={time} value={time} disabled={isEndDisabled(time)}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {bookedSlots.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        <p className="font-medium">Already booked:</p>
                                        {bookedSlots.map((slot) => (
                                            <p key={slot.startTime}>
                                                {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {bookingError && <p className="text-sm text-red-500 font-medium">{bookingError}</p>}
                        {bookingSuccess && <p className="text-sm text-green-600 font-medium">{bookingSuccess}</p>}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={!startTime || !endTime || !selectedDate}>Confirm Booking</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have selected a time slot. If you close this window, your data will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={resetAndClose} className="bg-red-600 hover:bg-red-700 text-white">
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}