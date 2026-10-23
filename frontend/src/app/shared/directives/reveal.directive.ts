import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Fait apparaître l'élément quand il entre dans l'écran (classe `is-visible`, styles dans styles.scss).
 * Sans IntersectionObserver ou avec "réduire les animations", l'élément est visible tout de suite.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: { class: 'reveal' }
})
export class RevealDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  /** Décalage en ms, pour échelonner des éléments d'une même grille. */
  readonly revealDelay = input(0);

  ngOnInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return;
    }
    if (this.revealDelay()) {
      node.style.transitionDelay = `${this.revealDelay()}ms`;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          node.classList.add('is-visible');
          this.observer?.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
