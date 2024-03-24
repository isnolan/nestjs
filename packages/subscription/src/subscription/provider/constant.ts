export enum Providers {
  APP = 'APP',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

/**
 * 订阅活动类型
 */
export enum NotificationType {
  SUBSCRIBED = 'SUBSCRIBED',
  RENEWED = 'RENEWED',
  GRACE_PERIOD = 'GRACE_PERIOD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DEFERRED = 'DEFERRED',
  REFUND = 'REFUND',
  REVOKED = 'REVOKED',
  CHANGED = 'CHANGED',
  OTHER = 'OTHER',
}

/**
 * 订阅生命周期状态
 */
export enum SubscriptionState {
  ACTIVE = 'ACTIVE', // 订阅中（含宽限期），正在使用中
  GRACE = 'GRACE', // 宽限期，订阅已到期，但是还可以使用一段时间
  EXPIRED = 'EXPIRED', // 订阅已到期
  CANCELLED = 'CANCELLED', // 订阅已取消
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
  AUD = 'AUD',
  CAD = 'CAD',
  CHF = 'CHF',
  CNY = 'CNY',
  SEK = 'SEK',
  NZD = 'NZD',
  MXN = 'MXN',
  SGD = 'SGD',
  HKD = 'HKD',
  NOK = 'NOK',
  KRW = 'KRW',
  TRY = 'TRY',
  RUB = 'RUB',
  INR = 'INR',
  BRL = 'BRL',
  ZAR = 'ZAR',
  TWD = 'TWD',
  DKK = 'DKK',
  PLN = 'PLN',
  THB = 'THB',
  IDR = 'IDR',
  HUF = 'HUF',
  CZK = 'CZK',
  ILS = 'ILS',
  CLP = 'CLP',
  PHP = 'PHP',
  AED = 'AED',
  COP = 'COP',
  SAR = 'SAR',
  MYR = 'MYR',
  RON = 'RON',
  ISK = 'ISK',
}
