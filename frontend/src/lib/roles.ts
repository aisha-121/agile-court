import type { Role } from '@/types';

export interface RoleConfig {
  name: string;
  sublabel: string;
  initials: string;
  color: string;
  avatarClass: string;
  dotClass: string;
  bubbleClass: string;
}

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  product_owner: {
    name: 'Priya',
    sublabel: 'Product Owner',
    initials: 'PO',
    color: 'text-amber-600 dark:text-amber-400',
    avatarClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dotClass: 'bg-amber-400',
    bubbleClass: 'bg-muted/50 border',
  },
  scrum_master: {
    name: 'Jordan',
    sublabel: 'Scrum Master',
    initials: 'SM',
    color: 'text-emerald-600 dark:text-emerald-400',
    avatarClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotClass: 'bg-emerald-400',
    bubbleClass: 'bg-muted/50 border',
  },
  tech_lead: {
    name: 'Alex',
    sublabel: 'Tech Lead',
    initials: 'TL',
    color: 'text-blue-600 dark:text-blue-400',
    avatarClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotClass: 'bg-blue-400',
    bubbleClass: 'bg-muted/50 border',
  },
};

export const ROLES = Object.entries(ROLE_CONFIG) as [Role, RoleConfig][];
