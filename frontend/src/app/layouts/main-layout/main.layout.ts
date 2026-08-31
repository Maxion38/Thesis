import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../features/components/navbar/navbar.component';
import { MenuComponent, MenuItem } from '../../features/components/menu/menu.component';
import { IdleService } from '../../core/services/idle.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, MenuComponent],
  templateUrl: './main.layout.html',
  styleUrl: './main.layout.scss'
})

export class MainLayoutComponent implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');

  menuOpen = false;
  currentMenuName = 'Dashboard';
  menuItems: MenuItem[] = [];
  private routerSubscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private idleService: IdleService,
  ) {}

  ngOnInit() {
    this.menuItems = this.route.snapshot.data['menuItems'] ?? [];

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentMenuName(event.urlAfterRedirects);
      });

    // Set initial menu name
    this.updateCurrentMenuName(this.router.url);

    this.idleService.start();
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    this.idleService.stop();
  }

  private updateCurrentMenuName(url: string) {
    const currentItem = this.menuItems.find(item => {
      if (item.exact) {
        return url === item.route;
      }
      return url.startsWith(item.route);
    });
    this.currentMenuName = currentItem ? currentItem.titre : 'Dashboard';
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }
}
