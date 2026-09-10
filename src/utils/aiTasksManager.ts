/**
 * Chattoj AI Tasks & Automation Manager
 * Manages scheduled tasks, automated replies, and cron-like local actions
 * Stored 100% locally in browser / APK storage (Dexie / localStorage)
 */

import { AiTaskSchedule } from '../types';

const TASKS_STORAGE_KEY = 'chattoj_ai_scheduled_tasks';

export function getScheduledTasks(): AiTaskSchedule[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error loading AI scheduled tasks:', err);
    return [];
  }
}

export function saveScheduledTask(
  task: Omit<AiTaskSchedule, 'id' | 'createdAt'>
): AiTaskSchedule {
  const tasks = getScheduledTasks();
  const newTask: AiTaskSchedule = {
    ...task,
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  tasks.unshift(newTask);
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent('chattoj-tasks-updated'));
  return newTask;
}

export function deleteScheduledTask(taskId: string): void {
  const tasks = getScheduledTasks().filter(t => t.id !== taskId);
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent('chattoj-tasks-updated'));
}

export function toggleTaskStatus(taskId: string): void {
  const tasks = getScheduledTasks().map(t => {
    if (t.id === taskId) {
      const nextStatus: AiTaskSchedule['status'] = t.status === 'pending' ? 'completed' : 'pending';
      return { ...t, status: nextStatus };
    }
    return t;
  });
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent('chattoj-tasks-updated'));
}

export async function executeTaskNow(taskId: string): Promise<{ success: boolean; message: string }> {
  const tasks = getScheduledTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return { success: false, message: 'Tarea no encontrada en la base de datos local' };
  }

  // Simulate local task execution
  await new Promise(r => setTimeout(r, 600));

  const updatedTasks = tasks.map(t => {
    if (t.id === taskId) {
      return { ...t, status: 'completed' as const };
    }
    return t;
  });

  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
  window.dispatchEvent(new CustomEvent('chattoj-tasks-updated'));

  let actionReport = '';
  switch (task.type) {
    case 'message':
      actionReport = `Mensaje programado enviado con éxito a ${task.targetContactOrForum || 'Destinatario predeterminado'}: "${task.promptOrText.slice(0, 40)}..."`;
      break;
    case 'report':
      actionReport = `Reporte local generado y archivado en la bóveda: "${task.title}"`;
      break;
    case 'customer_support':
      actionReport = `Protocolo de atención automática activado para ${task.targetContactOrForum || 'canal'}`;
      break;
    default:
      actionReport = `Automatización local ejecutada: "${task.title}"`;
      break;
  }

  return {
    success: true,
    message: actionReport
  };
}
