import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../../features/components/navbar/navbar.component';
import { MenuComponent, MenuItem } from '../../features/components/menu/menu.component';

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

  closeMenu() {
    this.menuOpen = false;
  }

  menuItems: MenuItem[] = [
    { titre: 'Accueil', iconName: 'home', route: '/', exact: true },
    { titre: 'Parcours', iconName: 'school', route: '/training-courses'},
    { titre: 'Participants', iconName: 'groups', route: '/users'},
    { titre: 'Rapporteurs', iconName: 'book', route: '/supervisors'},
    { titre: 'Jurys', iconName: 'account_balance', route: '/juries'},
    { titre: 'Notifications', iconName: 'notifications', route: '/notifications'},
  ];
}