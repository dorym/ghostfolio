import { DataService } from '@ghostfolio/client/services/data.service';
import { ImpersonationStorageService } from '@ghostfolio/client/services/impersonation-storage.service';
import { UserService } from '@ghostfolio/client/services/user/user.service';
import { prettifySymbol } from '@ghostfolio/common/helper';
import {
  AssetProfileIdentifier,
  PortfolioPosition,
  ToggleOption,
  User
} from '@ghostfolio/common/interfaces';
import { hasPermission, permissions } from '@ghostfolio/common/permissions';
import { internalRoutes } from '@ghostfolio/common/routes/routes';
import { HoldingType, HoldingsViewMode } from '@ghostfolio/common/types';
import { GfHoldingsTableComponent } from '@ghostfolio/ui/holdings-table';
import { GfHoldingsTable2Component } from '@ghostfolio/ui/holdings-table2';
import { GfToggleComponent } from '@ghostfolio/ui/toggle';
import { GfTreemapChartComponent } from '@ghostfolio/ui/treemap-chart';

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router, RouterModule } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { DataSource } from '@prisma/client';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  pieChartOutline,
  reorderFourOutline
} from 'ionicons/icons';
import { isNumber } from 'lodash';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  imports: [
    CommonModule,
    FormsModule,
    GfHoldingsTableComponent,
    GfHoldingsTable2Component,
    GfToggleComponent,
    GfTreemapChartComponent,
    IonIcon,
    MatButtonModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  selector: 'gf-home-holdings',
  styleUrls: ['./home-holdings.scss'],
  templateUrl: './home-holdings.html'
})
export class GfHomeHoldingsComponent implements OnDestroy, OnInit {
  public static DEFAULT_HOLDINGS_VIEW_MODE: HoldingsViewMode = 'TABLE';

  public deviceType: string;
  public hasImpersonationId: boolean;
  public hasPermissionToAccessHoldingsChart: boolean;
  public hasPermissionToCreateActivity: boolean;
  public holdings: PortfolioPosition[];
  public holdingType: HoldingType = 'ACTIVE';
  public holdingTypeOptions: ToggleOption[] = [
    { label: $localize`Active`, value: 'ACTIVE' },
    { label: $localize`Closed`, value: 'CLOSED' }
  ];
  public routerLinkPortfolioActivities =
    internalRoutes.portfolio.subRoutes.activities.routerLink;
  public user: User;
  public viewModeFormControl = new FormControl<HoldingsViewMode>(
    GfHomeHoldingsComponent.DEFAULT_HOLDINGS_VIEW_MODE
  );

  private unsubscribeSubject = new Subject<void>();

  public symbols: {
    [name: string]: {
      dataSource?: DataSource;
      name: string;
      symbol: string;
      value: number;
    };
  };

  public constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dataService: DataService,
    private deviceService: DeviceDetectorService,
    private impersonationStorageService: ImpersonationStorageService,
    private router: Router,
    private userService: UserService
  ) {
    addIcons({ gridOutline, reorderFourOutline, pieChartOutline });
  }

  public ngOnInit() {
    this.deviceType = this.deviceService.getDeviceInfo().deviceType;

    this.impersonationStorageService
      .onChangeHasImpersonation()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((impersonationId) => {
        this.hasImpersonationId = !!impersonationId;
      });

    this.userService.stateChanged
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((state) => {
        if (state?.user) {
          this.user = state.user;

          this.hasPermissionToAccessHoldingsChart = hasPermission(
            this.user.permissions,
            permissions.accessHoldingsChart
          );

          this.hasPermissionToCreateActivity = hasPermission(
            this.user.permissions,
            permissions.createOrder
          );

          this.initialize();

          this.changeDetectorRef.markForCheck();
        }
      });

    this.viewModeFormControl.valueChanges
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe((holdingsViewMode) => {
        this.dataService
          .putUserSetting({ holdingsViewMode })
          .pipe(takeUntil(this.unsubscribeSubject))
          .subscribe(() => {
            this.userService
              .get(true)
              .pipe(takeUntil(this.unsubscribeSubject))
              .subscribe((user) => {
                this.user = user;

                this.changeDetectorRef.markForCheck();
              });
          });
      });
  }

  public onChangeHoldingType(aHoldingType: HoldingType) {
    this.holdingType = aHoldingType;

    this.initialize();
  }

  public onHoldingClicked({ dataSource, symbol }: AssetProfileIdentifier) {
    if (dataSource && symbol) {
      this.router.navigate([], {
        queryParams: { dataSource, symbol, holdingDetailDialog: true }
      });
    }
  }

  public ngOnDestroy() {
    this.unsubscribeSubject.next();
    this.unsubscribeSubject.complete();
  }

  private fetchHoldings() {
    const filters = this.userService.getFilters();

    if (this.holdingType === 'CLOSED') {
      filters.push({ id: 'CLOSED', type: 'HOLDING_TYPE' });
    }

    return this.dataService.fetchPortfolioHoldings({
      filters,
      range: this.user?.settings?.dateRange
    });
  }

  private initiateAssetsAllocation() {
    // take from this.holding and fill this.symbols
    this.symbols = {};
    for (const [_, position] of Object.entries(this.holdings)) {
      let symbol = position.symbol;
      this.symbols[prettifySymbol(symbol)] = {
        dataSource: position.dataSource,
        name: position.name,
        symbol: prettifySymbol(symbol),
        value: isNumber(position.valueInBaseCurrency)
          ? position.valueInBaseCurrency
          : position.valueInPercentage
      };
    }
  }

  private initialize() {
    this.viewModeFormControl.disable({ emitEvent: false });

    if (
      this.hasPermissionToAccessHoldingsChart &&
      this.holdingType === 'ACTIVE'
    ) {
      this.viewModeFormControl.enable({ emitEvent: false });

      this.viewModeFormControl.setValue(
        this.deviceType === 'mobile'
          ? GfHomeHoldingsComponent.DEFAULT_HOLDINGS_VIEW_MODE
          : this.user?.settings?.holdingsViewMode ||
              GfHomeHoldingsComponent.DEFAULT_HOLDINGS_VIEW_MODE,
        { emitEvent: false }
      );
    } else if (this.holdingType === 'CLOSED') {
      this.viewModeFormControl.setValue(
        GfHomeHoldingsComponent.DEFAULT_HOLDINGS_VIEW_MODE,
        { emitEvent: false }
      );
    }

    this.holdings = undefined;

    this.fetchHoldings()
      .pipe(takeUntil(this.unsubscribeSubject))
      .subscribe(({ holdings }) => {
        this.holdings = holdings;
        this.initiateAssetsAllocation();
        this.changeDetectorRef.markForCheck();
      });
  }
}
