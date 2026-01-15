"use client"

// Page principale du dashboard (client-side)
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

// Icônes utilisées pour les actions et indicateurs UI
import {
  PlusIcon,
  Trash2Icon,
  PencilIcon,
  SearchIcon,
  FolderKanban,
  ListChecks,
  Timer,
  AlertTriangle,
  Table2,
  LayoutTemplate,
} from "lucide-react"

// Composants UI standards (design system)
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

// Store global pour la gestion des projets
import { useProjectStore, ProjectStatus } from "@/hooks/useProjectStore"

type ProjectForm = {
  name: string
  owner?: string
  status: ProjectStatus
  dueDate?: string
  progress?: number
}

export default function DashboardPage() {
  // Router Next.js pour navigation dynamique
  const router = useRouter()

  // Store global : données et actions sur les projets
  const { projects, totals, addProject, updateProject, removeProject } = useProjectStore()

  // État UI : modals et formulaires
  const [openProjectSheet, setOpenProjectSheet] = useState(false)
  const [openStatsSheet, setOpenStatsSheet] = useState<"projets" | "taches" | "en-cours" | "en-retard" | null>(null)

  // État UI : recherche et filtres
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all")
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table")

  // État UI : édition de projet
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    name: "",
    owner: "",
    status: "En attente",
    dueDate: "",
    progress: 0,
  })

  // Filtrage optimisé des projets (recherche + statut)
  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return projects.filter(p => {
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        (p.owner ?? "").toLowerCase().includes(term) ||
        p.status.toLowerCase().includes(term)
      const matchStatus = statusFilter === "all" || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [projects, search, statusFilter])

  // Regroupement des projets par statut pour la vue Kanban
  const projectsByStatus = useMemo(
    () => ({
      "En attente": filteredProjects.filter(p => p.status === "En attente"),
      "En cours": filteredProjects.filter(p => p.status === "En cours"),
      "Terminé": filteredProjects.filter(p => p.status === "Terminé"),
    }),
    [filteredProjects]
  )

  // Liste de toutes les tâches avec leur projet associé (pour popup stats)
  const allTasks = useMemo(() => {
    return projects.flatMap(p =>
      p.tasks.map(t => ({
        ...t,
        projectId: p.id,
        projectName: p.name,
      }))
    )
  }, [projects])

  // Liste des projets en retard (échéance dépassée et non terminés)
  const lateProjects = useMemo(() => {
    const now = new Date().getTime()
    return projects.filter(p => {
      if (!p.dueDate) return false
      try {
        return new Date(p.dueDate).getTime() < now && p.status !== "Terminé"
      } catch {
        return false
      }
    })
  }, [projects])

  // Actions : gestion des projets
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950 p-6">
      <div className="w-full space-y-8">
        {/* En-tête du dashboard */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Gestion de Projets
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Suivez et gérez tous vos projets en un seul endroit
          </p>
        </header>

        {/* Cartes de statistiques */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            {
              label: "Projets",
              value: totals.totalProjects,
              icon: FolderKanban,
              color: "from-blue-500 to-blue-600",
              borderColor: "border-blue-200 dark:border-blue-900/60",
              iconColor: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Tâches",
              value: totals.totalTasks,
              icon: ListChecks,
              color: "from-emerald-500 to-emerald-600",
              borderColor: "border-emerald-200 dark:border-emerald-900/60",
              iconColor: "text-emerald-600 dark:text-emerald-400",
            },
            {
              label: "En cours",
              value: totals.inProgressTasks,
              icon: Timer,
              color: "from-amber-500 to-amber-600",
              borderColor: "border-amber-200 dark:border-amber-900/60",
              iconColor: "text-amber-600 dark:text-amber-400",
            },
            {
              label: "En retard",
              value: totals.lateProjects,
              icon: AlertTriangle,
              color: "from-rose-500 to-red-600",
              borderColor: "border-rose-200 dark:border-rose-900/60",
              iconColor: "text-rose-600 dark:text-rose-400",
            },
          ].map((stat, i) => {
            const statType = ["projets", "taches", "en-cours", "en-retard"][i] as "projets" | "taches" | "en-cours" | "en-retard"
            return (
              <Card
                key={i}
                className={`border ${stat.borderColor} bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950 cursor-pointer`}
                onClick={() => setOpenStatsSheet(statType)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className={`text-3xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </CardContent>
              </Card>
            )
          })}
        </section>

        {/* Barre de recherche et filtres */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un projet..."
                  className="w-full pl-10 pr-4"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as "all" | ProjectStatus)}
              >
                <option value="all">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
              </select>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 px-3 text-xs"
                >
                  <Table2 className="mr-1 size-4" />
                  Tableau
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  className="h-8 px-3 text-xs"
                >
                  <LayoutTemplate className="mr-1 size-4" />
                  Kanban
                </Button>
              </div>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => {
                  resetProjectForm()
                  setOpenProjectSheet(true)
                }}
              >
                <PlusIcon className="mr-1 size-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Vue tableau des projets */}
        {viewMode === "table" && (
          <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  <FolderKanban className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Liste des projets
                </h2>
                {/* Compteur de projets total */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{totals.totalProjects}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">projet{totals.totalProjects > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
                    <TableHead className="text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider py-4">
                      Nom
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider py-4">
                      Client
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider py-4">
                      Statut
                    </TableHead>
                    <TableHead className="text-slate-700 dark:text-slate-300 font-bold text-sm uppercase tracking-wider py-4 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                            <FolderKanban className="h-8 w-8 text-slate-400" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun projet trouvé</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500">Créez votre premier projet en cliquant sur &quot;Ajouter&quot;</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((p, index) => {
                      const statusClasses =
                        p.status === "En cours"
                          ? "border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 dark:border-amber-800 dark:from-amber-950/50 dark:to-amber-900/30 dark:text-amber-300 shadow-sm"
                          : p.status === "Terminé"
                            ? "border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-emerald-900/30 dark:text-emerald-300 shadow-sm"
                            : "border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/30 dark:text-blue-300 shadow-sm"

                      return (
                        <TableRow
                          key={p.id}
                          className={`group transition-all duration-200 ${index % 2 === 0
                              ? "bg-white dark:bg-slate-900"
                              : "bg-slate-50/50 dark:bg-slate-800/30"
                            } hover:bg-blue-50/80 dark:hover:bg-blue-950/40 border-b border-slate-200 dark:border-slate-800 cursor-pointer`}
                          onClick={() => router.push(`/dashboard/tasks/${p.id}`)}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                                  <span className="text-white font-bold text-sm">
                                    {p.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {p.name}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                {p.owner || <span className="text-slate-400 italic">Non assigné</span>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={`${statusClasses} font-semibold px-3 py-1`}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/dashboard/tasks/${p.id}`)}
                                className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                                title="Voir les tâches"
                              >
                                <ListChecks className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditProject(p.id)}
                                className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                                title="Modifier"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProject(p.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                                title="Supprimer"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Vue Kanban des projets */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["En attente", "En cours", "Terminé"] as ProjectStatus[]).map(status => {
              const statusColors = {
                "En attente": {
                  bg: "bg-blue-50 dark:bg-blue-950/30",
                  accent: "from-blue-500 to-blue-600",
                  border: "border-l-blue-500",
                },
                "En cours": {
                  bg: "bg-amber-50 dark:bg-amber-950/30",
                  accent: "from-amber-500 to-amber-600",
                  border: "border-l-amber-500",
                },
                "Terminé": {
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                  accent: "from-emerald-500 to-emerald-600",
                  border: "border-l-emerald-500",
                },
              }
              const colors = statusColors[status]

              return (
                <Card
                  key={status}
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800"
                >
                  <CardHeader className={`flex items-center gap-2 pb-4 border-b-2 ${colors.bg}`}>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors.accent}`} />
                    <CardTitle className="font-semibold text-zinc-900 dark:text-zinc-50">{status}</CardTitle>
                    <Badge className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {projectsByStatus[status].length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    {projectsByStatus[status].length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">Aucun projet</div>
                    ) : (
                      projectsByStatus[status].map(project => (
                        <Card
                          key={project.id}
                          className={`p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition ${colors.bg} ${colors.border}`}
                          onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{project.name}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon-sm">
                                  <span aria-hidden="true">⋮</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditProject(project.id)}>
                                  <PencilIcon className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 dark:text-red-400"
                                  onClick={() => removeProject(project.id)}
                                >
                                  <Trash2Icon className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-400">
                                {project.owner || "Sans responsable"}
                              </span>
                              <Badge className="bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 text-xs">
                                {project.tasks.length} tâches
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-zinc-500">
                                <span>Progression</span>
                                <span>{project.progress ?? 0}%</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${colors.accent} transition-[width] duration-300`}
                                  style={{ width: `${Math.min(Math.max(project.progress ?? 0, 0), 100)}%` }}
                                />
                              </div>
                            </div>
                            {project.dueDate && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Échéance: {project.dueDate}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Modal de création/édition de projet */}
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
                  <label className="text-sm font-medium">Client</label>
                  <Input
                    value={projectForm.owner ?? ""}
                    onChange={e => setProjectForm(f => ({ ...f, owner: e.target.value }))}
                    placeholder="Nom du client"
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

        {/* Stats Detail Sheet */}
        <Sheet open={openStatsSheet !== null} onOpenChange={open => !open && setOpenStatsSheet(null)}>
          <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold">
                {openStatsSheet === "projets" && "Tous les projets"}
                {openStatsSheet === "taches" && "Toutes les tâches"}
                {openStatsSheet === "en-cours" && "Projets en cours"}
                {openStatsSheet === "en-retard" && "Projets en retard"}
              </SheetTitle>
              <SheetDescription>
                {openStatsSheet === "projets" && `Liste complète de vos ${totals.totalProjects} projets`}
                {openStatsSheet === "taches" && `Liste complète de vos ${totals.totalTasks} tâches`}
                {openStatsSheet === "en-cours" && `Liste des ${totals.inProgressTasks} projets en cours`}
                {openStatsSheet === "en-retard" && `Liste des ${totals.lateProjects} projets en retard`}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {openStatsSheet === "projets" && (
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucun projet</p>
                  ) : (
                    projects.map(p => (
                      <Card
                        key={p.id}
                        className="cursor-pointer hover:shadow-md transition"
                        onClick={() => {
                          setOpenStatsSheet(null)
                          router.push(`/dashboard/tasks/${p.id}`)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h3>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                {p.owner || "Sans responsable"}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">{p.status}</Badge>
                                <span className="text-xs text-zinc-500">{p.tasks.length} tâches</span>
                                {p.dueDate && <span className="text-xs text-zinc-500">Échéance: {p.dueDate}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{p.progress ?? 0}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {openStatsSheet === "taches" && (
                <div className="space-y-3">
                  {allTasks.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucune tâche</p>
                  ) : (
                    allTasks.map(task => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition"
                        onClick={() => {
                          setOpenStatsSheet(null)
                          router.push(`/dashboard/tasks/${task.projectId}`)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{task.title}</h3>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                Projet: {task.projectName}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge
                                  variant={
                                    task.status === "Terminé"
                                      ? "secondary"
                                      : task.status === "En cours"
                                        ? "default"
                                        : "outline"
                                  }
                                >
                                  {task.status}
                                </Badge>
                                {task.assignee && (
                                  <span className="text-xs text-zinc-500">Assigné à: {task.assignee}</span>
                                )}
                                {task.dueDate && <span className="text-xs text-zinc-500">Échéance: {task.dueDate}</span>}
                                {task.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {openStatsSheet === "en-cours" && (
                <div className="space-y-3">
                  {projectsByStatus["En cours"].length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucun projet en cours</p>
                  ) : (
                    projectsByStatus["En cours"].map(p => (
                      <Card
                        key={p.id}
                        className="cursor-pointer hover:shadow-md transition"
                        onClick={() => {
                          setOpenStatsSheet(null)
                          router.push(`/dashboard/tasks/${p.id}`)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h3>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                {p.owner || "Sans responsable"}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                  {p.status}
                                </Badge>
                                <span className="text-xs text-zinc-500">{p.tasks.length} tâches</span>
                                {p.dueDate && <span className="text-xs text-zinc-500">Échéance: {p.dueDate}</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-amber-600">{p.progress ?? 0}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {openStatsSheet === "en-retard" && (
                <div className="space-y-3">
                  {lateProjects.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">Aucun projet en retard</p>
                  ) : (
                    lateProjects.map(p => (
                      <Card
                        key={p.id}
                        className="cursor-pointer hover:shadow-md transition border-l-4 border-red-500"
                        onClick={() => {
                          setOpenStatsSheet(null)
                          router.push(`/dashboard/tasks/${p.id}`)
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h3>
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              </div>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                                {p.owner || "Sans responsable"}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                                  {p.status}
                                </Badge>
                                <span className="text-xs text-zinc-500">{p.tasks.length} tâches</span>
                                {p.dueDate && (
                                  <span className="text-xs text-red-600 font-medium">Échéance: {p.dueDate}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-red-600">{p.progress ?? 0}%</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
