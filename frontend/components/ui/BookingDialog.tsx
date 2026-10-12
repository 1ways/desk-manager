import { useEffect, useState } from "react"
import api from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface BookingDialogProps {
    resource: Resource | null
    isOpen: boolean
    onClose: () => void
    initialDate?: string
}

export default function BookingDialog({ resource, isOpen, onClose, initialDate }: BookingDialogProps) {
    const [bookingDate, setBookingDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [bookingError, setBookingError] = useState("")
    const [bookingSuccess, setBookingSuccess] = useState("")

    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
    const hasChanges = bookingDate !== (initialDate || "") || startTime !== "" || endTime !== ""

    useEffect(() => {
        if (isOpen) {
            setBookingDate(initialDate || "")
            setStartTime("")
            setEndTime("")
            setBookingError("")
            setBookingSuccess("")
        }
    }, [isOpen, initialDate])

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
        setBookingDate(initialDate || "")
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

        if (!bookingDate || !startTime || !endTime) {
            setBookingError("Please fill in all date and time fields")
            return
        }

        try {
            const startDateTime = new Date(`${bookingDate}T${startTime}`).toISOString()
            const endDateTime = new Date(`${bookingDate}T${endTime}`).toISOString()

            if (new Date(startDateTime) >= new Date(endDateTime)) {
                setBookingError("End time must be after start time")
                return
            }

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
            if (error.response?.status === 409) {
                setBookingError("This time slot is already booked. Please choose another time")
            } else {
                setBookingError(error.response?.data?.message || "An error occurred during booking")
            }
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-106.25">
                    <form onSubmit={handleBookingSubmit}>
                        <DialogHeader>
                            <DialogTitle>Book Resource</DialogTitle>
                            <DialogDescription>
                                Select the date and time for {resource?.name}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {bookingError && <p className="text-sm text-red-500 font-medium mb-2">{bookingError}</p>}
                        {bookingSuccess && <p className="text-sm text-green-600 font-medium mb-2">{bookingSuccess}</p>}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Confirm Booking</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have entered booking details. If you close this window, your data will be lost. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={resetAndClose} className="bg-red-600 hover:bg-red-700 text-white">
                            Discard Changes
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}