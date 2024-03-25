export namespace stripe {
  export interface createCheckouDto {
    mode?: string;
    price_id: string;
    user_id: string;
    email?: string;
    success_url?: string;
    cancel_url?: string;
  }
}
