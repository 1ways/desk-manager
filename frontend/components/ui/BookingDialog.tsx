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
import { addHours, format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { dayRangeIso, overlaps, toDateTime } from "@/lib/booking-time"

interface BookingDialogProps {
    resource: Resource | null
    isOpen: boolean
    onClose: () => void
    initialDate?: string
}

const TIME_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
]

interface BookedSlot {
    startTime: string
    endTime: string
    resourceId: string
}

export default function BookingDialog({ resource, isOpen, onClose, initialDate }: BookingDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string>("")
    const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([])

    const [bookingError, setBookingError] = useState("")
    const [bookingSuccess, setBookingSuccess] = useState("")
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)

    const isDateChanged = initialDate ?
        (selectedDate && format(selectedDate, "yyyy-MM-dd") !== initialDate) :
        !!selectedDate
    const hasChanges = isDateChanged || selectedTime !== ""

    useEffect(() => {
        if (isOpen) {
            setSelectedDate(initialDate ? new Date(initialDate) : new Date())
            setSelectedTime("")
            setBookingError("")
            setBookingSuccess("")
        }
    }, [isOpen, initialDate])

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

    const isSlotBooked = (time: string) => {
        if (!selectedDate) return false

        const slotStart = toDateTime(selectedDate, time)
        const slotEnd = addHours(slotStart, 3)

        return bookedSlots.some(slot =>
            overlaps(slotStart, slotEnd, new Date(slot.startTime), new Date(slot.endTime))
        )
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
        setSelectedTime("")
        setBookingError("")
        setBookingSuccess("")
        setShowUnsavedAlert(false)
        onClose()
    }

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setBookingError("")
        setBookingSuccess("")

        if (!selectedDate || !selectedTime) {
            setBookingError("Please select both date and time.")
            return
        }

        try {
            const dateStr = format(selectedDate, "yyyy-MM-dd")
            const startDateTime = new Date(`${dateStr}T${selectedTime}:00`).toISOString()

            const [hours, minutes] = selectedTime.split(":")
            const endDateTime = new Date(`${dateStr}T${String(Number(hours) + 3).padStart(2, "0")}:${minutes}:00`).toISOString()

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
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label>Time Slots (3 Hour)</Label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {TIME_SLOTS.map((time) => {
                                        const booked = isSlotBooked(time)
                                        const selected = selectedTime === time
                                        return (
                                            <Button
                                                key={time}
                                                type="button"
                                                variant={selected ? "default" : "outline"}
                                                disabled={booked || !selectedDate}
                                                onClick={() => setSelectedTime(time)}
                                                className={booked ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}
                                            >
                                                {time}
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {bookingError && <p className="text-sm text-red-500 font-medium">{bookingError}</p>}
                        {bookingSuccess && <p className="text-sm text-green-600 font-medium">{bookingSuccess}</p>}

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={!selectedTime || !selectedDate}>Confirm Booking</Button>
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