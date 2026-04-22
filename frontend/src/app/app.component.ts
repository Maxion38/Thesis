import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './features/components/navbar/navbar.component';
import { MenuComponent, MenuItem } from './features/components/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('frontend');

  menuOpen = false;
  currentMenuName = 'Dashboard';
  private routerSubscription: Subscription = new Subscription();

  constructor(private router: Router) {}

  ngOnInit() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateCurrentMenuName(event.urlAfterRedirects);
      });

    // Set initial menu name
    this.updateCurrentMenuName(this.router.url);
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
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

  menuItems: MenuItem[] = [
    { titre: 'Dashboard', route: '/', exact: true },
    { titre: 'Parcours de formation', route: '/training-courses'},
    { titre: 'Gestion des participants', route: '/users'},
    { titre: 'Gestion des rapporteurs', route: '/supervisors'},
    { titre: 'Gestion des jurys', route: '/juries'},
    { titre: 'Notifications', route: '/notifications'},
  ];
}