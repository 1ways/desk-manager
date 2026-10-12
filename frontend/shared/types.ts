export interface Resource {
    _id: string
    name: string
    type: "desk" | "room"
    location: string
    status: string
}