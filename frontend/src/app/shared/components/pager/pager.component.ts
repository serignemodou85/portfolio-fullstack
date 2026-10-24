import { Component, inject, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { LanguageService } from '../../../core/services/language.service';
import { TableState } from '../../../core/utils/table-state';

/** Pied de tableau admin : précédent / page x sur n / suivant. Masqué s'il n'y a qu'une page. */
@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (table().totalPages() > 1) {
      <div class="table-footer">
        <div class="pagination">
          <button type="button" class="btn btn-icon btn-soft" (click)="table().setPage(table().page() - 1)" [disabled]="table().page() === 1" [attr.aria-label]="lang.t('exp.prev')">
            <app-icon name="chevron-left" [size]="14"></app-icon>
          </button>
          <span class="page-count">{{ lang.t('admin.pagination.page') }} {{ table().page() }} / {{ table().totalPages() }}</span>
          <button type="button" class="btn btn-icon btn-soft" (click)="table().setPage(table().page() + 1)" [disabled]="table().page() === table().totalPages()" [attr.aria-label]="lang.t('exp.next')">
            <app-icon name="chevron-right" [size]="14"></app-icon>
          </button>
        </div>
      </div>
    }
  `
})
export class PagerComponent {
  readonly lang = inject(LanguageService);
  readonly table = input.required<TableState<any, any>>();
}
