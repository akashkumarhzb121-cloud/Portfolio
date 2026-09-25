export interface NavigationItem {
  id: string;
  label: string;
  href: string;
}

export interface Project {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  fallbackGradient: string;
  technologies: string[];
  liveUrl: string;
  githubUrl: string;
  category?: string;
  featured?: boolean;
  highlights?: string[];
}

export interface Skill {
  name: string;
  category: string;
  iconName: string;
  color: string;
  description: string;
  level?: string;
}

export interface Service {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  deliverables: string[];
}

export interface SocialLink {
  label: string;
  href: string;
  iconName: 'github' | 'linkedin' | 'twitter' | 'mail' | 'instagram' | 'external';
  username?: string;
}