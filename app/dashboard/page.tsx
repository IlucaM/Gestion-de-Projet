"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon, PencilIcon, SearchIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { useProjectStore, ProjectStatus, TaskStatus } from "@/hooks/useProjectStore"

type ProjectForm = {
  name: string
  owner?: string
  status: ProjectStatus
  dueDate?: string
  progress?: number
}

type TaskForm = {
  title: string
  assignee?: string
  status: TaskStatus
  dueDate?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const {
    projects,
    totals,
    addProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    removeTask,
  } = useProjectStore()

  const [openProjectSheet, setOpenProjectSheet] = useState(false)
  const [search, setSearch] = useState("")
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "",
    owner: "",
    status: "En attente",
    dueDate: "",
    progress: 0,
  })

  const [openTasksSheetFor, setOpenTasksSheetFor] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    assignee: "",
    status: "A faire",
    dueDate: "",
  })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  function resetProjectForm() {
    setProjectForm({ name: "", owner: "", status: "En attente", dueDate: "", progress: 0 })
    setEditingProjectId(null)
  }

  function submitProject() {
    if (!projectForm.name.trim()) return
    if (editingProjectId) {
      updateProject(editingProjectId, projectForm)
    } else {
      addProject(projectForm)
    }
    setOpenProjectSheet(false)
    resetProjectForm()
  }

  function startEditProject(id: string) {
    const p = projects.find(pr => pr.id === id)
    if (!p) return
    setProjectForm({
      name: p.name,
      owner: p.owner,
      status: p.status,
      dueDate: p.dueDate,
      progress: p.progress,
    })
    setEditingProjectId(id)
    setOpenProjectSheet(true)
  }

  function submitTask(projectId: string) {
    if (!taskForm.title.trim()) return
    if (editingTaskId) {
      updateTask(projectId, editingTaskId, taskForm)
    } else {
      addTask(projectId, taskForm)
    }
    setTaskForm({ title: "", assignee: "", status: "A faire", dueDate: "" })
    setEditingTaskId(null)
  }

  function startEditTask(projectId: string, taskId: string) {
    const p = projects.find(pr => pr.id === projectId)
    const t = p?.tasks.find(tsk => tsk.id === taskId)
    if (!t) return
    setTaskForm({ title: t.title, assignee: t.assignee, status: t.status, dueDate: t.dueDate })
    setEditingTaskId(taskId)
    setOpenTasksSheetFor(projectId)
  }

  const filteredProjects = projects.filter(p => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(term) ||
      (p.owner ?? "").toLowerCase().includes(term) ||
      p.status.toLowerCase().includes(term)
    )
  })

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-zinc-50 p-6 dark:bg-black">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard de Gestion de Projet</h1>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <div className="relative w-full md:w-72">
            <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Rechercher un projet..."
              className="w-full pl-8"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="default"
            onClick={() => {
              resetProjectForm()
              setOpenProjectSheet(true)
            }}
          >
            <PlusIcon /> Nouveau projet
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Projets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.totalProjects}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tâches</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.totalTasks}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En cours</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.inProgressTasks}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En retard</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.lateProjects}</CardContent>
        </Card>
      </section>

      <section className="rounded-xl border bg-white p-4 dark:bg-black">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Liste des projets</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Progression</TableHead>
              <TableHead>Tâches</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.owner || "-"}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>{p.dueDate || "-"}</TableCell>
                <TableCell>{p.progress ?? 0}%</TableCell>
                <TableCell>{p.tasks.length}</TableCell>
                <TableCell className="relative flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/dashboard/tasks/${p.id}`)}
                  >
                    Tâches
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <span aria-hidden="true">⋮</span>
                        <span className="sr-only">Actions du projet</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditProject(p.id)}>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => removeProject(p.id)}
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Sheet open={openProjectSheet} onOpenChange={setOpenProjectSheet}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {editingProjectId ? "Modifier le projet" : "Nouveau projet"}
            </SheetTitle>
            <SheetDescription>Définissez les informations du projet</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={projectForm.name}
                onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nom du projet"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Responsable</label>
                <Input
                  value={projectForm.owner ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, owner: e.target.value }))}
                  placeholder="Responsable"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Échéance</label>
                <Input
                  type="date"
                  value={projectForm.dueDate ?? ""}
                  onChange={e => setProjectForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Statut</label>
                <select
                  className="h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  value={projectForm.status}
                  onChange={e =>
                    setProjectForm(f => ({ ...f, status: e.target.value as ProjectStatus }))
                  }
                >
                  <option>En attente</option>
                  <option>En cours</option>
                  <option>Terminé</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Progression (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={projectForm.progress ?? 0}
                  onChange={e =>
                    setProjectForm(f => ({ ...f, progress: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
          </div>
          <Separator />
          <CardFooter className="justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline">Annuler</Button>
            </SheetClose>
            <Button onClick={submitProject}>
              {editingProjectId ? <PencilIcon /> : <PlusIcon />} Sauvegarder
            </Button>
          </CardFooter>
        </SheetContent>
      </Sheet>

      
    </div>
  )
}
