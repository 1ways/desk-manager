export interface Resource {
    _id: string
    name: string
    type: "desk" | "room"
    location: string
    status: "active" | "maintenance"
    meshName?: string
}

export type Availability = "free" | "booked" | "maintenance"

export type BookingStatus = "cancelled" | "completed" | "in_progress" | "upcoming"

export interface ResourceWithAvailability extends Resource {
    availability: Availability
}