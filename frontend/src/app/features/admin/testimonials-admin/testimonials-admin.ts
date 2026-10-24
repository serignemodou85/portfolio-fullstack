import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminShell } from '../../../shared/components/admin-shell/admin-shell';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Testimonial, TestimonialService } from '../../../core/services/testimonial.service';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';

interface TestimonialForm {
  author_name: string;
  author_role: string;
  company: string;
  content: string;
  linkedin_url: string;
  is_published: boolean;
  order: number;
}

const EMPTY_FORM: TestimonialForm = {
  author_name: '',
  author_role: '',
  company: '',
  content: '',
  linkedin_url: '',
  is_published: false,
  order: 0,
};

@Component({
  selector: 'app-testimonials-admin',
  standalone: true,
  imports: [AdminShell, IconComponent, FormsModule],
  templateUrl: './testimonials-admin.html',
  styleUrl: './testimonials-admin.scss'
})
export class TestimonialsAdmin implements OnInit {
  private api = inject(TestimonialService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  lang = inject(LanguageService);

  readonly items = signal<Testimonial[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly publishedCount = computed(() => this.items().filter(t => t.is_published).length);

  form: TestimonialForm = { ...EMPTY_FORM };
  avatarFile: File | null = null;
  readonly maxLength = 700;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onAvatar(event: Event): void {
    this.avatarFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  edit(item: Testimonial): void {
    this.editingId.set(item.id);
    this.form = {
      author_name: item.author_name,
      author_role: item.author_role,
      company: item.company,
      content: item.content,
      linkedin_url: item.linkedin_url,
      is_published: item.is_published,
      order: item.order,
    };
    this.avatarFile = null;
  }

  reset(): void {
    this.editingId.set(null);
    this.form = { ...EMPTY_FORM };
    this.avatarFile = null;
  }

  submit(): void {
    if (this.saving() || !this.form.author_name.trim() || !this.form.content.trim()) {
      return;
    }
    const payload = new FormData();
    Object.entries(this.form).forEach(([key, value]) => payload.append(key, String(value)));
    if (this.avatarFile) {
      payload.append('avatar', this.avatarFile);
    }

    const id = this.editingId();
    const request = id ? this.api.update(id, payload) : this.api.create(payload);
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.lang.t(id ? 'tst.saved' : 'tst.created'));
        this.reset();
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(this.lang.t('tst.error'));
      },
    });
  }

  togglePublished(item: Testimonial): void {
    this.api.update(item.id, { is_published: !item.is_published }).subscribe({
      next: (updated) => this.items.update(list => list.map(t => (t.id === updated.id ? updated : t))),
      error: () => this.toast.error(this.lang.t('tst.error')),
    });
  }

  remove(item: Testimonial): void {
    this.confirm
      .confirm({ message: `${this.lang.t('tst.confirm_delete')} « ${item.author_name} » ?`, danger: true })
      .subscribe(ok => {
        if (!ok) return;
        this.api.remove(item.id).subscribe({
          next: () => {
            this.items.update(list => list.filter(t => t.id !== item.id));
            if (this.editingId() === item.id) this.reset();
          },
          error: () => this.toast.error(this.lang.t('tst.error')),
        });
      });
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
