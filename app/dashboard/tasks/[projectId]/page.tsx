"use client"

// Page de gestion des tâches d'un projet (client-side)
import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"

// Icônes utilisées pour les actions et indicateurs UI
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  ArrowLeftIcon,
  SearchIcon,
  ListChecks,
  Timer,
  CheckCircle2,
  AlertTriangle,
  LayoutTemplate,
  Table2,
} from "lucide-react"

// Store global pour la gestion des projets
import { useProjectStore, TaskStatus, Priority } from "@/hooks/useProjectStore"

// Composants UI standards (design system)
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"

type TaskForm = {
  title: string
  assignee?: string
  status: TaskStatus
  dueDate?: string
  priority: Priority
}

// Configuration des couleurs selon le statut de la tâche
const statusColors = {
  "A faire": {
    bg: "bg-red-50 dark:bg-red-950/30",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200",
    accent: "from-red-500 to-red-600",
    border: "border-l-red-500",
  },
  "En cours": {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200",
    accent: "from-amber-500 to-amber-600",
    border: "border-l-amber-500",
  },
  "Terminé": {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200",
    accent: "from-emerald-500 to-emerald-600",
    border: "border-l-emerald-500",
  },
}

// Configuration des couleurs selon la priorité de la tâche
const priorityColors = {
  Haute: { text: "text-red-600 dark:text-red-400", bg: "from-red-500 to-red-600" },
  Moyenne: { text: "text-amber-600 dark:text-amber-400", bg: "from-amber-500 to-amber-600" },
  Basse: { text: "text-blue-600 dark:text-blue-400", bg: "from-blue-500 to-blue-600" },
}

// Utilitaires : vérification des dates
function isOverdue(dueDate: string | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function isCloseToDue(dueDate: string | undefined): boolean {
  if (!dueDate) return false
  const date = new Date(dueDate)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
}

function formatDate(date: string | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
}

export default function ProjectTasksPage() {
  // Router Next.js pour navigation dynamique
  const params = useParams()
  const router = useRouter()
  const projectIdParam = params?.projectId as string

  // Store global : données et actions sur les projets
  const { projects, initialized, addTask, updateTask, removeTask } = useProjectStore()

  // Normalisation de l'ID du projet depuis l'URL
  const normalizedProjectId = useMemo(() => {
    const id = Array.isArray(projectIdParam) ? projectIdParam[0] : projectIdParam
    return decodeURIComponent(id ?? "")
  }, [projectIdParam])

  // Projet courant depuis le store
  const project = useMemo(
    () => projects.find(p => p.id === normalizedProjectId),
    [projects, normalizedProjectId]
  )

  // État UI : formulaire de tâche
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    assignee: "",
    status: "A faire",
    dueDate: "",
    priority: "Moyenne",
  })
  
  // État UI : recherche et filtres
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")
  const [search, setSearch] = useState("")
  const [openTaskSheet, setOpenTaskSheet] = useState(false)

  // Statistiques du projet (total, en cours, terminées, en retard)
  const stats = useMemo(() => {
    if (!project) {
      return { total: 0, enCours: 0, termine: 0, retard: 0 }
    }
    const total = project.tasks.length
    const enCours = project.tasks.filter(t => t.status === "En cours").length
    const termine = project.tasks.filter(t => t.status === "Terminé").length
    const retard = project.tasks.filter(t => isOverdue(t.dueDate) && t.status !== "Terminé").length
    return { total, enCours, termine, retard }
  }, [project])

  // Filtrage optimisé des tâches (recherche + statut + priorité)
  const filteredTasks = useMemo(() => {
    if (!project) return []
    const term = search.trim().toLowerCase()
    return project.tasks.filter(t => {
      const matchTerm =
        !term ||
        t.title.toLowerCase().includes(term) ||
        (t.assignee ?? "").toLowerCase().includes(term)
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter
      return matchTerm && matchStatus && matchPriority
    })
  }, [project, search, statusFilter, priorityFilter])

  // Regroupement des tâches par statut pour la vue Kanban
  const tasksByStatus = useMemo(
    () => ({
      "A faire": filteredTasks.filter(t => t.status === "A faire"),
      "En cours": filteredTasks.filter(t => t.status === "En cours"),
      "Terminé": filteredTasks.filter(t => t.status === "Terminé"),
    }),
    [filteredTasks]
  )

  if (!initialized) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-6">
        <header className="flex items-center gap-3">
          <div className="size-8 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-48 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        </header>
        <div className="h-24 animate-pulse rounded-xl border bg-white dark:bg-slate-900 p-4" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-screen flex-col gap-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Retour au tableau de bord</span>
          </Button>
          <h1 className="text-xl font-semibold">
            Le projet demandé n&apos;existe plus ou son identifiant est invalide.
          </h1>
        </header>
        <p className="text-sm text-slate-500">
          Vérifiez l&apos;URL ou revenez au tableau de bord pour sélectionner un projet.
        </p>
      </div>
    )
  }

  // Actions : gestion des tâches
  function resetTaskForm() {
    setTaskForm({ title: "", assignee: "", status: "A faire", dueDate: "", priority: "Moyenne" })
    setEditingTaskId(null)
    setOpenTaskSheet(false)
  }

  function submitTask() {
    if (!taskForm.title.trim() || !project) return
    if (editingTaskId) {
      updateTask(project.id, editingTaskId, taskForm)
    } else {
      addTask(project.id, {
        title: taskForm.title,
        assignee: taskForm.assignee,
        status: taskForm.status,
        dueDate: taskForm.dueDate,
        priority: taskForm.priority,
      })
    }
    resetTaskForm()
  }

  function startEditTask(taskId: string) {
    if (!project) return
    const t = project.tasks.find(tsk => tsk.id === taskId)
    if (!t) return
    setTaskForm({
      title: t.title,
      assignee: t.assignee,
      status: t.status,
      dueDate: t.dueDate,
      priority: t.priority,
    })
    setEditingTaskId(taskId)
    setOpenTaskSheet(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-6">
      {/* En-tête de la page */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeftIcon className="size-4" />
            <span className="sr-only">Retour au tableau de bord</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              {project.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {project.owner || "Sans responsable"}
            </p>
          </div>
        </div>
      </header>

      {/* Cartes de statistiques */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <ListChecks className="size-5" />,
            color: "from-blue-500 to-blue-600",
          },
          {
            label: "En cours",
            value: stats.enCours,
            icon: <Timer className="size-5" />,
            color: "from-amber-500 to-amber-600",
          },
          {
            label: "Terminées",
            value: stats.termine,
            icon: <CheckCircle2 className="size-5" />,
            color: "from-emerald-500 to-emerald-600",
          },
          {
            label: "En retard",
            value: stats.retard,
            icon: <AlertTriangle className="size-5" />,
            color: "from-red-500 to-red-600",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition border border-slate-200 dark:border-slate-800"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {stat.label}
              </CardTitle>
              <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white`}>
                {stat.icon}
              </div>
          </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              {stats.total > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-3">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                    style={{ width: `${(stat.value / stats.total) * 100}%` }}
                  />
                </div>
              )}
            </CardContent>
        </Card>
        ))}
      </section>

      {/* Barre de recherche et filtres */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
              type="text"
                placeholder="Rechercher une tâche..."
              className="w-full pl-10 pr-4"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <select
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "all" | TaskStatus)}
            >
              <option value="all">Tous les statuts</option>
              <option value="A faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
            <select
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as "all" | Priority)}
            >
              <option value="all">Toutes priorités</option>
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
            </select>
            <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8 px-3 text-xs gap-1"
              >
                <Table2 className="size-4" />
                Tableau
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="h-8 px-3 text-xs gap-1"
              >
                <LayoutTemplate className="size-4" />
                Kanban
              </Button>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg transition"
              onClick={() => {
                resetTaskForm()
                setOpenTaskSheet(true)
              }}
            >
              <PlusIcon className="mr-1 size-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </div>

      {/* Vue tableau des tâches */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Titre
                  </TableHead>
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Assigné
                  </TableHead>
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Priorité
                  </TableHead>
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Statut
                  </TableHead>
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Échéance
                  </TableHead>
                  <TableHead className="px-6 py-4 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      Aucune tâche trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map(task => (
                    <TableRow
                      key={task.id}
                      className={`border-b border-slate-200 dark:border-slate-800 hover:${statusColors[task.status].bg} transition ${
                        isOverdue(task.dueDate) && task.status !== "Terminé"
                          ? "bg-red-50/50 dark:bg-red-950/20"
                          : ""
                      }`}
                    >
                      <TableCell className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {task.title}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {task.assignee || "-"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`text-sm font-medium ${priorityColors[task.priority].text}`}>
                          ● {task.priority}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <select
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[task.status].badge} border-0 outline-none cursor-pointer`}
                          value={task.status}
                          onChange={e =>
                            updateTask(project.id, task.id, {
                              status: e.target.value as TaskStatus,
                            })
                          }
                        >
              <option value="A faire">A faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isOverdue(task.dueDate) && task.status !== "Terminé" && (
                            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                          )}
                          {isCloseToDue(task.dueDate) && !isOverdue(task.dueDate) && (
                            <Timer className="size-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="text-slate-600 dark:text-slate-400">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => startEditTask(task.id)}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeTask(project.id, task.id)}
                          className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Vue Kanban des tâches */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["A faire", "En cours", "Terminé"] as TaskStatus[]).map(status => (
            <Card
              key={status}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <CardHeader className={`flex items-center gap-2 pb-4 border-b-2 ${statusColors[status].bg}`}>
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${statusColors[status].accent}`} />
                <CardTitle className="font-semibold text-slate-900 dark:text-white">{status}</CardTitle>
                <Badge className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {tasksByStatus[status].length}
                </Badge>
        </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {tasksByStatus[status].length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Aucune tâche</div>
                ) : (
                  tasksByStatus[status].map(task => (
                    <Card
                      key={task.id}
                      className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition ${
                        isOverdue(task.dueDate) && task.status !== "Terminé"
                          ? "bg-red-50 dark:bg-red-950/20 border-l-red-500"
                          : `${statusColors[status].bg} ${statusColors[status].border}`
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <span className={`text-xs font-bold ${priorityColors[task.priority].text}`}>
                          ● {task.priority}
                        </span>
                        {isOverdue(task.dueDate) && task.status !== "Terminé" && (
                          <AlertTriangle className="ml-auto size-3 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <h4 className="font-medium text-slate-900 dark:text-white mb-2">{task.title}</h4>
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="text-slate-600 dark:text-slate-400">
                          {task.assignee || "Non assigné"}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditTask(task.id)}
                          className="flex-1 text-xs"
                        >
                          <PencilIcon className="mr-1 size-3" />
                          Éditer
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeTask(project.id, task.id)}
                          className="flex-1 text-xs"
                        >
                          <Trash2Icon className="mr-1 size-3" />
                          Suppr.
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition de tâche */}
      <Sheet open={openTaskSheet} onOpenChange={setOpenTaskSheet}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingTaskId ? "Modifier la tâche" : "Nouvelle tâche"}</SheetTitle>
            <SheetDescription>Renseignez les informations de la tâche du projet.</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre *</label>
              <Input
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Titre de la tâche"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Assigné</label>
              <Input
                value={taskForm.assignee ?? ""}
                onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))}
                placeholder="Nom de la personne"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <select
                  className="h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                  value={taskForm.priority}
                  onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as Priority }))}
                >
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Basse">Basse</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                className="h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                value={taskForm.status}
                onChange={e =>
                  setTaskForm(f => ({ ...f, status: e.target.value as TaskStatus }))
                }
              >
                  <option value="A faire">À faire</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
              </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Échéance</label>
              <Input
                type="date"
                value={taskForm.dueDate ?? ""}
                onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <Separator />
        <CardFooter className="justify-end gap-2">
            <SheetClose asChild>
          <Button variant="outline" onClick={resetTaskForm}>
            Annuler
          </Button>
            </SheetClose>
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg transition"
              onClick={submitTask}
              disabled={!taskForm.title.trim()}
            >
              {editingTaskId ? <PencilIcon className="mr-1 size-4" /> : <PlusIcon className="mr-1 size-4" />}
              {editingTaskId ? "Mettre à jour" : "Créer"}
          </Button>
        </CardFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
