/**
 * Store global pour la gestion des projets et tâches
 * Utilise localStorage pour la persistance des données
 */

import { useEffect, useMemo, useState } from "react"

export type TaskStatus = "A faire" | "En cours" | "Terminé"
export type ProjectStatus = "En attente" | "En cours" | "Terminé"
export type Priority = "Haute" | "Moyenne" | "Basse"

export type Task = {
  id: string
  title: string
  status: TaskStatus
  assignee?: string
  dueDate?: string
  priority: Priority
}

export type Project = {
  id: string
  name: string
  owner?: string
  status: ProjectStatus
  dueDate?: string
  progress: number
  tasks: Task[]
}

const STORAGE_KEY = "gp.projects"

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as unknown as T) : fallback
  } catch {
    return fallback
  }
}

function uid(prefix = "") {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function useProjectStore() {
  const [projects, setProjects] = useState<Project[]>([])
  const [initialized, setInitialized] = useState(false)

  // Chargement initial depuis localStorage avec migration des données
  useEffect(() => {
    if (typeof window === "undefined") return
    const initial = safeParse<Project[]>(window.localStorage.getItem(STORAGE_KEY), [])
    // Migration: ajout d'une priorité par défaut pour compatibilité
    const migrated = initial.map(p => ({
      ...p,
      tasks: p.tasks.map(t => ({
        ...t,
        priority: t.priority || "Moyenne",
      })),
    }))
    setProjects(migrated)
    setInitialized(true)
  }, [])

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    if (!initialized) return
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
      }
    } catch {
      // Gestion silencieuse des erreurs (quota dépassé)
    }
  }, [projects, initialized])

  const totals = useMemo(() => {
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0)
    const doneTasks = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === "Terminé").length, 0)
    const inProgressTasks = projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === "En cours").length, 0)
    const now = new Date().getTime()
    const lateProjects = projects.filter(p => {
      if (!p.dueDate) return false
      try {
        return new Date(p.dueDate).getTime() < now && p.status !== "Terminé"
      } catch {
        return false
      }
    }).length
    return { totalProjects: projects.length, totalTasks, doneTasks, inProgressTasks, lateProjects }
  }, [projects])

  function addProject(input: Omit<Project, "id" | "tasks" | "progress"> & { progress?: number }) {
    const newProject: Project = {
      id: uid("p_"),
      name: input.name,
      owner: input.owner,
      status: input.status,
      dueDate: input.dueDate,
      progress: input.progress ?? 0,
      tasks: [],
    }
    setProjects(prev => [newProject, ...prev])
  }

  function updateProject(id: string, patch: Partial<Project>) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removeProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  function addTask(projectId: string, input: Omit<Task, "id">) {
    const task: Task = { ...input, priority: input.priority || "Moyenne", id: uid("t_") }
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, tasks: [task, ...p.tasks] } : p))
    )
  }

  function updateTask(projectId: string, taskId: string, patch: Partial<Task>) {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)) }
          : p
      )
    )
  }

  function removeTask(projectId: string, taskId: string) {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
      )
    )
  }

  return {
    projects,
    setProjects,
    initialized,
    totals,
    addProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    removeTask,
  }
}

