// src/app/features/experience/experience.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { ExperienceItem } from '../../core/models/experience.model';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './experience.html',
  styleUrl: './experience.scss'
})
export class Experience implements OnInit {
  experiences: ExperienceItem[] = [];
  selectedType: 'all' | 'work' | 'education' | 'certification' = 'all';
  loading = true;
  error: string | null = null;

  constructor(private experienceService: ExperienceService) {}

  ngOnInit(): void {
    this.experienceService.getExperiences().subscribe({
      next: (items) => {
        this.experiences = items;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les expériences.';
        this.loading = false;
      }
    });
  }

  get filteredExperiences(): ExperienceItem[] {
    if (this.selectedType === 'all') {
      return this.experiences;
    }
    return this.experiences.filter((item) => item.type === this.selectedType);
  }

  get currentCount(): number {
    return this.experiences.filter((item) => item.is_current).length;
  }

  get certificationCount(): number {
    return this.experiences.filter((item) => item.type === 'certification').length;
  }

  setFilter(type: 'all' | 'work' | 'education' | 'certification'): void {
    this.selectedType = type;
  }

  getTypeLabel(type: string): string {
    if (type === 'work') {
      return 'Experience';
    }
    if (type === 'education') {
      return 'Formation';
    }
    return 'Certification';
  }

  getTypeClass(type: ExperienceItem['type']): string {
    if (type === 'work') {
      return 'type-work';
    }
    if (type === 'education') {
      return 'type-education';
    }
    return 'type-certification';
  }
}
