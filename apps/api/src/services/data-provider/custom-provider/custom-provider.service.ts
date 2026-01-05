import { YahooFinanceService } from '@ghostfolio/api/services/data-provider/yahoo-finance/yahoo-finance.service';
import {
  DataProviderInterface,
  GetDividendsParams,
  GetHistoricalParams,
  GetQuotesParams,
  GetSearchParams
} from '@ghostfolio/api/services/data-provider/interfaces/data-provider.interface';
import {
  DataProviderHistoricalResponse,
  DataProviderInfo,
  DataProviderResponse,
  // LookupItem,
  LookupResponse
} from '@ghostfolio/common/interfaces';

import { Injectable } from '@nestjs/common';
import { DataSource, SymbolProfile } from '@prisma/client';

@Injectable()
export class CustomProviderService implements DataProviderInterface {
  public constructor(
    private readonly yahooFinanceService: YahooFinanceService
  ) {}

  public canHandle() {
    return true;
  }

  public async getAssetProfile({
    symbol
  }: {
    symbol: string;
  }): Promise<Partial<SymbolProfile>> {
    let result = await this.yahooFinanceService.getAssetProfile({ symbol });
    result.dataSource = this.getName();
    return result;
  }

  public getDataProviderInfo(): DataProviderInfo {
    return {
      isPremium: false,
      name: 'Custom Provider',
      url: 'https://finance.yahoo.com'
    };
  }

  public async getDividends({
    from,
    granularity = 'day',
    symbol,
    to
  }: GetDividendsParams) {
    return this.yahooFinanceService.getDividends({
      from,
      granularity,
      symbol,
      to
    });
  }

  public async getHistorical({
    from,
    symbol,
    to
  }: GetHistoricalParams): Promise<{
    [symbol: string]: { [date: string]: DataProviderHistoricalResponse };
  }> {
    let augmented = await this.getHistoricalYahooAugmented({
      from,
      symbol,
      to
    });
    if (augmented != false) return augmented;

    return this.yahooFinanceService.getHistorical({ from, symbol, to });
  }

  public getMaxNumberOfSymbolsPerRequest() {
    return 50;
  }

  public getName(): DataSource {
    return DataSource.CUSTOMPROVIDER;
  }

  public async getQuotes({
    symbols
  }: GetQuotesParams): Promise<{ [symbol: string]: DataProviderResponse }> {
    return this.yahooFinanceService.getQuotes({ symbols }).then((responses) => {
      return Object.fromEntries(
        Object.entries(responses).map(([symbol, response]) => [
          symbol,
          {
            ...response,
            dataProviderInfo: this.getDataProviderInfo(),
            dataSource: this.getName()
          }
        ])
      );
    });
  }

  public getTestSymbol() {
    return 'AAPL';
  }

  public async search({
    includeIndices = false,
    query
  }: GetSearchParams): Promise<LookupResponse> {
    return this.yahooFinanceService
      .search({ includeIndices, query })
      .then((response) => {
        return {
          items: response.items.map((item) => {
            return {
              ...item,
              dataProviderInfo: this.getDataProviderInfo(),
              dataSource: this.getName()
            };
          })
        };
      });
  }

  private augmentHistoricalYahooData(symbol: string, marketPrice: number) {
    if (symbol === 'IN-FF1.TA' && marketPrice < 10000) {
      return marketPrice * 100;
    }
    if (symbol === 'IN-FF12.TA' && marketPrice < 1000) {
      return marketPrice * 100;
    }
    return marketPrice;
  }

  private async getHistoricalYahooAugmented({
    from,
    symbol,
    to
  }: GetHistoricalParams): Promise<
    | {
        [symbol: string]: { [date: string]: DataProviderHistoricalResponse };
      }
    | false
  > {
    let get_from_yahoo = false;

    if (['IN-FF1.TA', 'IN-FF12.TA'].includes(symbol)) {
      get_from_yahoo = true;
    }

    if (get_from_yahoo) {
      return this.yahooFinanceService
        .getHistorical({ from, symbol, to })
        .then((result) => {
          return Object.fromEntries(
            Object.entries(result).map(([symbol, dates]) => [
              symbol,
              Object.fromEntries(
                Object.entries(dates).map(([date, value]) => [
                  date,
                  {
                    marketPrice: this.augmentHistoricalYahooData(
                      symbol,
                      value.marketPrice
                    )
                  }
                ])
              )
            ])
          );
        });
    }

    return false;
  }

}
