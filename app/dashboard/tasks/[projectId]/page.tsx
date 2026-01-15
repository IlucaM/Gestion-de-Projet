"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PlusIcon, PencilIcon, Trash2Icon, ArrowLeftIcon, SearchIcon } from "lucide-react"

import { useProjectStore, TaskStatus } from "@/hooks/useProjectStore"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type TaskForm = {
  title: string
  assignee?: string
  status: TaskStatus
  dueDate?: string
}

export default function ProjectTasksPage() {
  const params = useParams()
  const router = useRouter()
  const projectIdParam = params?.projectId as string

  const { projects, initialized, addTask, updateTask, removeTask } = useProjectStore()

  const normalizedProjectId = useMemo(() => {
    const id = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam
    return decodeURIComponent(id ?? "")
  }, [projectIdParam])

  const project = useMemo(
    () => projects.find(p => p.id === normalizedProjectId),
    [projects, normalizedProjectId]
  )

  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    assignee: "",
    status: "A faire",
    dueDate: "",
  })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all")
  const [search, setSearch] = useState("")

  const stats = useMemo(() => {
    if (!project) {
      return { total: 0, enCours: 0, termine: 0 }
    }
    const total = project.tasks.length
    const enCours = project.tasks.filter(t => t.status === "En cours").length
    const termine = project.tasks.filter(t => t.status === "Terminé").length
    return { total, enCours, termine }
  }, [project])

  const filteredTasks = useMemo(() => {
    if (!project) return []
    const term = search.trim().toLowerCase()
    return project.tasks.filter(t => {
      const matchTerm =
        !term ||
        t.title.toLowerCase().includes(term) ||
        (t.assignee ?? "").toLowerCase().includes(term)
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      return matchTerm && matchStatus
    })
  }, [project, search, statusFilter])

  if (!initialized) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-zinc-50 p-6 dark:bg-black">
        <header className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </header>
        <div className="h-24 animate-pulse rounded-xl border bg-white p-4 dark:bg-black" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-zinc-50 p-6 dark:bg-black">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Retour au tableau de bord</span>
          </Button>
          <h1 className="text-xl font-semibold">Le projet demandé n'existe plus ou son identifiant est invalide.</h1>
        </header>
        <p className="text-sm text-zinc-500">Vérifiez l'URL ou revenez au tableau de bord pour sélectionner un projet.</p>
      </div>
    )
  }

  function resetTaskForm() {
    setTaskForm({ title: "", assignee: "", status: "A faire", dueDate: "" })
    setEditingTaskId(null)
  }

  function submitTask() {
    if (!taskForm.title.trim()) return
    if (editingTaskId) {
      updateTask(project.id, editingTaskId, taskForm)
    } else {
      addTask(project.id, taskForm)
    }
    resetTaskForm()
  }

  function startEditTask(taskId: string) {
    const t = project.tasks.find(tsk => tsk.id === taskId)
    if (!t) return
    setTaskForm({
      title: t.title,
      assignee: t.assignee,
      status: t.status,
      dueDate: t.dueDate,
    })
    setEditingTaskId(taskId)
  }

  return (
    <div className="flex min-h-screen flex-col gap-6 bg-zinc-50 p-6 dark:bg-black">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Retour au tableau de bord</span>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Tâches du projet</h1>
            <p className="text-sm text-zinc-500">
              {project.name} — {project.owner || "Sans responsable"}
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total tâches</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En cours</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.enCours}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Terminées</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.termine}</CardContent>
        </Card>
      </section>

      <section className="rounded-xl border bg-white p-4 dark:bg-black">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.status}</Badge>
            <Badge variant="secondary">{project.tasks.length} tâches</Badge>
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="relative w-full md:w-72">
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Rechercher une tâche..."
                className="w-full pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 w-36 rounded-md border bg-transparent px-3 py-1 text-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | TaskStatus)}
            >
              <option value="all">Tous</option>
              <option value="A faire">A faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter / modifier une tâche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Titre de la tâche"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Assigné à</label>
              <Input
                value={taskForm.assignee ?? ""}
                onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))}
                placeholder="Personne"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Statut</label>
              <select
                className="h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                value={taskForm.status}
                onChange={e =>
                  setTaskForm(f => ({ ...f, status: e.target.value as TaskStatus }))
                }
              >
                <option>A faire</option>
                <option>En cours</option>
                <option>Terminé</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Échéance</label>
              <Input
                type="date"
                value={taskForm.dueDate ?? ""}
                onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={resetTaskForm}>
            Annuler
          </Button>
          <Button onClick={submitTask}>
            {editingTaskId ? <PencilIcon /> : <PlusIcon />} Ajouter/Sauvegarder
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      <section className="rounded-xl border bg-white p-4 dark:bg-black">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Liste des tâches</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Assigné</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>{t.assignee || "-"}</TableCell>
                <TableCell>
                  {t.status === "Terminé" ? (
                    <Badge variant="secondary">Terminé</Badge>
                  ) : t.status === "En cours" ? (
                    <Badge>En cours</Badge>
                  ) : (
                    <Badge variant="outline">A faire</Badge>
                  )}
                </TableCell>
                <TableCell>{t.dueDate || "-"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEditTask(t.id)}>
                    <PencilIcon /> Éditer
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeTask(project.id, t.id)}>
                    <Trash2Icon /> Supprimer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
