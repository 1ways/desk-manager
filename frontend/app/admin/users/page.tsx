"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Edit, Trash2, Shield, User as UserIcon } from "lucide-react"

interface UserData {
    _id: string
    firstName: string
    lastName: string
    email: string
    role: "admin" | "user"
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)

    const [editingUser, setEditingUser] = useState<UserData | null>(null)
    const [formData, setFormData] = useState<{ role: "admin" | "user" }>({ role: "user" })
    const [initialFormData, setInitialFormData] = useState<{ role: "admin" | "user" }>({ role: "user" })

    const router = useRouter()
    const { user: currentUser } = useAuthStore()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        if (!currentUser || currentUser.role !== "admin") {
            router.push("/dashboard")
            return
        }

        fetchUsers()
    }, [isMounted, currentUser, router])

    const fetchUsers = async () => {
        try {
            const response = await api.get("/users")
            setUsers(response.data)
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users list")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (user: UserData) => {
        setEditingUser(user)
        setFormData({ role: user.role })
        setInitialFormData({ role: user.role })
        setIsEditOpen(true)
    }

    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)

    const handleDialogCloseAttempt = (open: boolean) => {
        if (!open) {
            if (hasChanges) {
                setShowUnsavedAlert(true)
            } else {
                setIsEditOpen(false)
            }
        }
    }

    const forceCloseDialog = () => {
        setShowUnsavedAlert(false)
        setIsEditOpen(false)
    }

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        if (editingUser._id === currentUser?._id && formData.role === "user") {
            toast.error("You cannot revoke your own admin rights.")
            return
        }

        try {
            await api.patch(`/users/${editingUser._id}/role`, formData)
            toast.success("User role updated successfully")
            setIsEditOpen(false)
            fetchUsers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update role.")
        }
    }

    const confirmDelete = async () => {
        if (!userToDelete) return

        if (userToDelete === currentUser?._id) {
            toast.error("You cannot delete your own account.")
            setUserToDelete(null)
            return
        }

        try {
            await api.delete(`/users/${userToDelete}`)
            toast.success("User deleted successfully")
            fetchUsers()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete user.")
        } finally {
            setUserToDelete(null)
        }
    }

    if (!isMounted || isLoading) {
        return <div className="flex h-screen items-center justify-center">Loading users...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 animate-in fade-in duration-100">
            <header className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft size={16} />
                    </Button>
                    <h1 className="text-2xl font-bold">User Management</h1>
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => {
                                const isCurrentUser = u._id === currentUser?._id

                                return (
                                    <TableRow key={u._id} className={isCurrentUser ? "bg-blue-50/50" : ""}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    {u.role === "admin" ? <Shield size={14} /> : <UserIcon size={14} />}
                                                </div>
                                                {u.firstName} {u.lastName}
                                                {isCurrentUser && <span className="ml-2 text-xs text-blue-600 font-normal">(You)</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditDialog(u)}
                                                disabled={isCurrentUser}
                                            >
                                                <Edit size={16} className={isCurrentUser ? "text-gray-300" : "text-blue-600"} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setUserToDelete(u._id)}
                                                disabled={isCurrentUser}
                                            >
                                                <Trash2 size={16} className={isCurrentUser ? "text-gray-300" : "text-red-600"} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={handleDialogCloseAttempt}>
                <DialogContent>
                    <form onSubmit={handleRoleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit User Role</DialogTitle>
                            <DialogDescription>
                                Change permissions for {editingUser?.firstName} {editingUser?.lastName}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ role: val as "admin" | "user" })}
                                >
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleDialogCloseAttempt(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
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

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}