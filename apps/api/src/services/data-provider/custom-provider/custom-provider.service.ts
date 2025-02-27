// import { YahooFinanceDataEnhancerService } from '@ghostfolio/api/services/data-provider/data-enhancer/yahoo-finance/yahoo-finance.service';
import {
  DataProviderInterface,
  GetDividendsParams,
  GetHistoricalParams,
  GetQuotesParams,
  GetSearchParams
} from '@ghostfolio/api/services/data-provider/interfaces/data-provider.interface';
import { YahooFinanceService } from '@ghostfolio/api/services/data-provider/yahoo-finance/yahoo-finance.service';
import {
  IDataProviderHistoricalResponse,
  IDataProviderResponse
} from '@ghostfolio/api/services/interfaces/interfaces';
// import { DEFAULT_CURRENCY } from '@ghostfolio/common/config';
// import { DATE_FORMAT } from '@ghostfolio/common/helper';
import {
  DataProviderInfo,
  // LookupItem,
  LookupResponse
} from '@ghostfolio/common/interfaces';

import { Injectable } from '@nestjs/common';
import { DataSource, SymbolProfile } from '@prisma/client';

// import { addDays, format, isSameDay } from 'date-fns';
// import yahooFinance from 'yahoo-finance2';
// import { ChartResultArray } from 'yahoo-finance2/dist/esm/src/modules/chart';
// import {
//   HistoricalDividendsResult,
//   HistoricalHistoryResult
// } from 'yahoo-finance2/dist/esm/src/modules/historical';
// import { Quote } from 'yahoo-finance2/dist/esm/src/modules/quote';

@Injectable()
export class CustomProviderService implements DataProviderInterface {
  public constructor(
    // private readonly yahooFinanceDataEnhancerService: YahooFinanceDataEnhancerService,
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
    [symbol: string]: { [date: string]: IDataProviderHistoricalResponse };
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
  }: GetQuotesParams): Promise<{ [symbol: string]: IDataProviderResponse }> {
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
        [symbol: string]: { [date: string]: IDataProviderHistoricalResponse };
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

  // private convertToDividendResult(
  //   result: ChartResultArray
  // ): HistoricalDividendsResult {
  //   return result.events.dividends.map(({ amount: dividends, date }) => {
  //     return { date, dividends };
  //   });
  // }

  // private convertToHistoricalResult(
  //   result: ChartResultArray
  // ): HistoricalHistoryResult {
  //   return result.quotes;
  // }

  // private async getQuotesWithQuoteSummary(aYahooFinanceSymbols: string[]) {
  //   const quoteSummaryPromises = aYahooFinanceSymbols.map((symbol) => {
  //     return yahooFinance.quoteSummary(symbol).catch(() => {
  //       Logger.error(
  //         `Could not get quote summary for ${symbol}`,
  //         'YahooFinanceService'
  //       );
  //       return null;
  //     });
  //   });

  //   const quoteSummaryItems = await Promise.all(quoteSummaryPromises);

  //   return quoteSummaryItems
  //     .filter((item) => {
  //       return item !== null;
  //     })
  //     .map(({ price }) => {
  //       return price;
  //     });
  // }
}
