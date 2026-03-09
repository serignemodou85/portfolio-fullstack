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

  getTypeLabel(type: string): string {
    if (type === 'work') {
      return 'Experience';
    }
    if (type === 'education') {
      return 'Formation';
    }
    return 'Certification';
  }
}
