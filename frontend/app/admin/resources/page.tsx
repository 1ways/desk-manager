"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react"
import { Resource } from "@/shared/types"

const emptyResourceData: Omit<Resource, "_id"> = { name: "", type: "desk", location: "", status: "active" }

export default function AdminResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)

    const [formData, setFormData] = useState(emptyResourceData)
    const [initialFormData, setInitialFormData] = useState(emptyResourceData)

    const router = useRouter()
    const { user } = useAuthStore()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        if (!user || user.role !== "admin") {
            router.push("/dashboard")
            return
        }

        fetchResources()
    }, [isMounted, user, router])

    const fetchResources = async () => {
        try {
            const response = await api.get("/resources?all=true")
            setResources(response.data)
        } catch (error) {
            console.error("Failed to fetch resources:", error)
            toast.error("Failed to load resources")
        } finally {
            setIsLoading(false)
        }
    }

    const openCreateDialog = () => {
        setEditingId(null)
        setFormData(emptyResourceData)
        setInitialFormData(emptyResourceData)
        setIsDialogOpen(true)
    }

    const openEditDialog = (resource: Resource) => {
        const editData = {
            name: resource.name,
            type: resource.type,
            location: resource.location,
            status: resource.status
        }
        setEditingId(resource._id)
        setFormData(editData)
        setInitialFormData(editData)
        setIsDialogOpen(true)
    }

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)

    const handleDialogCloseAttempt = (open: boolean) => {
        if (!open) {
            if (hasChanges) {
                setShowUnsavedAlert(true)
            } else {
                setIsDialogOpen(false)
            }
        }
    }

    const forceCloseDialog = () => {
        setShowUnsavedAlert(false)
        setIsDialogOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                await api.put(`/resources/${editingId}`, formData)
                toast.success("Resource updated successfully")
            } else {
                await api.post("/resources", formData)
                toast.success("Resource created successfully")
            }

            setIsDialogOpen(false)
            fetchResources()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save resource.")
        }
    }

    const confirmDelete = async () => {
        if (!resourceToDelete) return

        try {
            await api.delete(`/resources/${resourceToDelete}`)
            toast.success("Resource deleted successfully")
            fetchResources()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete resource")
        } finally {
            setResourceToDelete(null)
        }
    }

    if (!isMounted || isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading admin panel...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-in fade-in duration-100">
            <header className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft size={16} />
                    </Button>
                    <h1 className="text-2xl font-bold">Resource Management</h1>
                </div>
                <Button onClick={openCreateDialog} className="flex gap-2">
                    <Plus size={16} /> Add Resource
                </Button>
            </header>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {resources.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                    No resources found
                                </TableCell>
                            </TableRow>
                        ) : (
                            resources.map((resource) => (
                                <TableRow key={resource._id}>
                                    <TableCell className="font-medium">{resource.name}</TableCell>
                                    <TableCell className="capitalize">{resource.type}</TableCell>
                                    <TableCell>{resource.location}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded-full ${resource.status === "active" ? "bg-green-100 text-green-800" :
                                            resource.status === "maintenance" ? "bg-red-100 text-red-800" :
                                                "bg-gray-100 text-gray-800"
                                            }`}>
                                            {resource.status.toUpperCase()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(resource)}>
                                            <Edit size={16} className="text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setResourceToDelete(resource._id)}>
                                            <Trash2 size={16} className="text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogCloseAttempt}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Resource" : "Add New Resource"}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Name (e.g. Desk A1)</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val as "desk" | "room" })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desk">Desk</SelectItem>
                                            <SelectItem value="room">Room</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData({ ...formData, status: val as "active" | "maintenance" })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Location (e.g. 1st Floor, North Wing)</Label>
                                <Input
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleDialogCloseAttempt(false)}>Cancel</Button>
                            <Button type="submit">{editingId ? "Save Changes" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to discard them?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>Keep Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={forceCloseDialog} className="bg-red-600 hover:bg-red-700 text-white">
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the resource from our database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setResourceToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Resource
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}