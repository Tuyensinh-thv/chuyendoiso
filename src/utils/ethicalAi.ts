import { TaskNQ57, UserAccount } from '../types';
import { getDaysDifference, CURRENT_DATE_STRING } from './dateUtils';
import { normalizePriority } from './storage';

export interface EthicalAiSettings {
  enabled: boolean;
  prioritizeMyDepartment: boolean;
  prioritizeUrgentDeadlines: boolean;
  prioritizeHighPriority: boolean;
  prioritizeNearCompletion: boolean;
  showExplainabilityBadges: boolean;
}

export const DEFAULT_ETHICAL_AI_SETTINGS: EthicalAiSettings = {
  enabled: true,
  prioritizeMyDepartment: true,
  prioritizeUrgentDeadlines: true,
  prioritizeHighPriority: true,
  prioritizeNearCompletion: true,
  showExplainabilityBadges: true,
};

const ETHICAL_AI_SETTINGS_KEY = 'hvu_nq57_ethical_ai_settings_v1';

export function loadEthicalAiSettings(): EthicalAiSettings {
  try {
    const data = localStorage.getItem(ETHICAL_AI_SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_ETHICAL_AI_SETTINGS, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Failed to load ethical AI settings', err);
  }
  return DEFAULT_ETHICAL_AI_SETTINGS;
}

export function saveEthicalAiSettings(settings: EthicalAiSettings): void {
  try {
    localStorage.setItem(ETHICAL_AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save ethical AI settings', err);
  }
}

export interface AiTaskRecommendation {
  task: TaskNQ57;
  score: number;
  reasons: string[];
  explanation: string;
  isHighImpact: boolean;
}

/**
 * Computes an ethical, fully explainable score and reasons for each task
 * based strictly on the user's opted-in settings and local task attributes.
 */
export function evaluateTaskForUser(
  task: TaskNQ57,
  user: UserAccount,
  settings: EthicalAiSettings
): AiTaskRecommendation {
  const reasons: string[] = [];
  let score = 0;

  if (!settings.enabled) {
    return {
      task,
      score: 0,
      reasons: [],
      explanation: 'Cá nhân hóa AI đang tắt',
      isHighImpact: false,
    };
  }

  // Factor 1: Department match
  const isMyDept =
    task.donViChuTri.toLowerCase().includes(user.donVi.toLowerCase()) ||
    task.donViPhoiHop.toLowerCase().includes(user.donVi.toLowerCase()) ||
    (user.email && task.emailPhuTrach === user.email);

  if (settings.prioritizeMyDepartment && isMyDept) {
    score += 40;
    reasons.push(`Đơn vị phụ trách (${user.donVi})`);
  }

  // Factor 2: Urgency / Deadline
  const daysDiff = getDaysDifference(task.thoiHan);
  if (settings.prioritizeUrgentDeadlines) {
    if (task.trangThai !== 'Đã hoàn thành') {
      if (daysDiff < 0) {
        score += 35;
        reasons.push(`Quá hạn ${Math.abs(daysDiff)} ngày`);
      } else if (daysDiff === 0) {
        score += 30;
        reasons.push('Hạn chót là hôm nay');
      } else if (daysDiff <= 3) {
        score += 25;
        reasons.push(`Sắp đến hạn (${daysDiff} ngày tới)`);
      } else if (daysDiff <= 7) {
        score += 15;
        reasons.push(`Trong tuần này (${daysDiff} ngày)`);
      }
    }
  }

  // Factor 3: Priority level
  const priority = normalizePriority(task.mucDoUuTien);
  if (settings.prioritizeHighPriority) {
    if (priority === 'High') {
      score += 20;
      reasons.push('Mức ưu tiên Cao');
    } else if (priority === 'Medium') {
      score += 10;
    }
  }

  // Factor 4: Near completion acceleration
  if (settings.prioritizeNearCompletion) {
    if (task.tiendo >= 60 && task.tiendo < 100 && task.trangThai !== 'Đã hoàn thành') {
      score += 15;
      reasons.push(`Đạt ${task.tiendo}% (gần hoàn thiện minh chứng)`);
    }
  }

  // Construct transparent explanation
  const explanation =
    reasons.length > 0
      ? reasons.join(' • ')
      : 'Nhiệm vụ tiêu chuẩn';

  const isHighImpact = score >= 50;

  return {
    task,
    score,
    reasons,
    explanation,
    isHighImpact,
  };
}

/**
 * Returns prioritized task list with transparent AI reasoning
 */
export function getEthicalAiRecommendations(
  tasks: TaskNQ57[],
  user: UserAccount,
  settings: EthicalAiSettings
): AiTaskRecommendation[] {
  if (!settings.enabled) return [];

  return tasks
    .map((t) => evaluateTaskForUser(t, user, settings))
    .filter((r) => r.score >= 25 && r.task.trangThai !== 'Đã hoàn thành')
    .sort((a, b) => b.score - a.score);
}
