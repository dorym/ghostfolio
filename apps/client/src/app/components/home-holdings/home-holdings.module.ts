import { GfToggleModule } from '@ghostfolio/client/components/toggle/toggle.module';
import { GfHoldingsTableComponent } from '@ghostfolio/ui/holdings-table';
import { GfHoldingsTable2Component } from '@ghostfolio/ui/holdings-table2';
import { GfPortfolioProportionChartComponent } from '@ghostfolio/ui/portfolio-proportion-chart';
import { GfTreemapChartComponent } from '@ghostfolio/ui/treemap-chart';

import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterModule } from '@angular/router';

import { HomeHoldingsComponent } from './home-holdings.component';

@NgModule({
  declarations: [HomeHoldingsComponent],
  imports: [
    CommonModule,
    FormsModule,
    GfHoldingsTableComponent,
    GfHoldingsTable2Component,
    GfPortfolioProportionChartComponent,
    GfToggleModule,
    GfTreemapChartComponent,
    MatButtonModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GfHomeHoldingsModule {}
