declare module "lunar-javascript" {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getYearShengXiao(): string;
    getJieQi(): string;
    getDayYi(): string[];
    getDayJi(): string[];
  }
}
