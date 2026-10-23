// src/app/shared/components/icon/icon.component.ts
import { Component, Input } from '@angular/core';
import {
  LucideAngularModule, LucideIconData,
  Archive, ArrowRight, Award, GraduationCap, ArrowUp, ChartColumn, Check, ChevronLeft, ChevronRight, CircleAlert, CircleCheck,
  Cloud, Code, Copy, Cpu, Database, Download, ExternalLink, Eye, EyeOff, File, Folder, FolderPlus, Globe, History, Info,
  LayoutDashboard, Lock, LogOut, Mail, MapPin, Menu, Monitor, Moon, Phone, Plus, RotateCw, Search, Send,
  Server, Settings, ShieldCheck, SquarePen, Sun, Trash2, TriangleAlert, User, X, Github, Linkedin
} from 'lucide-angular';

/**
 * Point d'entrée unique des icônes (Lucide). Les noms courts restent stables pour les
 * templates et pour les icônes de catégories enregistrées en base (`code`, `database`...).
 */
const ICONS: Record<string, LucideIconData> = {
  'alert': CircleAlert,
  'archive': Archive,
  'award': Award,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'chart': ChartColumn,
  'check': Check,
  'check-circle': CircleCheck,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'cloud': Cloud,
  'code': Code,
  'copy': Copy,
  'cpu': Cpu,
  'dashboard': LayoutDashboard,
  'database': Database,
  'download': Download,
  'edit': SquarePen,
  'external-link': ExternalLink,
  'eye': Eye,
  'eye-off': EyeOff,
  'file': File,
  'folder': Folder,
  'folder-plus': FolderPlus,
  'github': Github,
  'globe': Globe,
  'graduation': GraduationCap,
  'history': History,
  'info': Info,
  'linkedin': Linkedin,
  'lock': Lock,
  'log-out': LogOut,
  'mail': Mail,
  'map-pin': MapPin,
  'menu': Menu,
  'monitor': Monitor,
  'moon': Moon,
  'phone': Phone,
  'plus': Plus,
  'refresh': RotateCw,
  'search': Search,
  'send': Send,
  'server': Server,
  'settings': Settings,
  'shield': ShieldCheck,
  'sun': Sun,
  'trash': Trash2,
  'user': User,
  'warning': TriangleAlert,
  'x': X,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      [img]="icon"
      [size]="size"
      [strokeWidth]="strokeWidth"
      [class]="customClass"
      aria-hidden="true"
    ></lucide-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      line-height: 0;
    }
  `]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number | string = 20;
  @Input() strokeWidth: number | string = 2;
  @Input() customClass: string = '';

  get icon(): LucideIconData {
    return ICONS[(this.name || '').toLowerCase().trim()] ?? CircleAlert;
  }
}
