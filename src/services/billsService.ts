import apiClient from './apiClient';

export enum BillType {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  TV = 'tv',
  INTERNET = 'internet',
  BETTING = 'betting',
}

// Helper function to extract data from API response
const extractData = <T>(response: any): T => {
  if (response && typeof response === 'object') {
    if ('data' in response) {
      // Response format: { success: boolean, data: T }
      return response.data;
    }
    return response as T;
  }
  return response as T;
};

export interface BillTypeInfo {
  type: BillType;
  name: string;
  icon: string;
}

export interface Biller {
  code: string;
  name: string;
  shortName: string;
  type: BillType;
}

export interface BillerPackage {
  code: string;
  name: string;
  amount: number;
  fee: number;
  billerCode: string;
  billerName: string;
}

export interface NetworkProvider {
  code: string;
  name: string;
  color: string;
}

export interface ValidateCustomerResult {
  valid: boolean;
  customerName: string | null;
  address?: string;
  outstandingAmount?: number;
  customerNumber: string;
}

export interface PayBillRequest {
  type: BillType;
  billerCode: string;
  itemCode: string;
  customerId: string;
  amount: number;
  customerName?: string;
}

export interface BuyAirtimeRequest {
  phoneNumber: string;
  amount: number;
  provider: string;
}

export interface BuyDataRequest {
  phoneNumber: string;
  billerCode: string;
  packageCode: string;
  amount: number;
}

export interface PaymentResult {
  success: boolean;
  reference: string;
  amount: number;
  fee: number;
  newBalance: number;
  message: string;
  transactionDate: string;
}

export interface BillHistoryItem {
  id: string;
  type: BillType;
  amount: number;
  reference: string;
  customerId: string;
  customerName: string;
  status: string;
  createdAt: string;
}

export interface BillHistoryResponse {
  data: BillHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Functions
export const getBillTypes = async (): Promise<BillTypeInfo[]> => {
  const response = await apiClient.get<any>('/bills/types');
  return extractData<BillTypeInfo[]>(response);
};

export const getNetworkProviders = async (): Promise<NetworkProvider[]> => {
  const response = await apiClient.get<any>('/bills/providers');
  return extractData<NetworkProvider[]>(response);
};

export const getBillers = async (type: BillType): Promise<Biller[]> => {
  const response = await apiClient.get<any>('/bills/billers', { params: { type } });
  return extractData<Biller[]>(response);
};

export const getBillerPackages = async (billerCode: string): Promise<BillerPackage[]> => {
  const response = await apiClient.get<any>('/bills/packages', { params: { billerCode } });
  return extractData<BillerPackage[]>(response);
};

export const validateCustomer = async (
  billerCode: string,
  customerId: string,
  itemCode: string
): Promise<ValidateCustomerResult> => {
  const response = await apiClient.get<any>('/bills/validate', {
    params: { billerCode, customerId, itemCode },
  });
  return extractData<ValidateCustomerResult>(response);
};

export const payBill = async (request: PayBillRequest): Promise<PaymentResult> => {
  const response = await apiClient.post<any>('/bills/pay', request);
  return extractData<PaymentResult>(response);
};

export const buyAirtime = async (request: BuyAirtimeRequest): Promise<PaymentResult> => {
  const response = await apiClient.post<any>('/bills/airtime', request);
  return extractData<PaymentResult>(response);
};

export const buyData = async (request: BuyDataRequest): Promise<PaymentResult> => {
  const response = await apiClient.post<any>('/bills/data', request);
  return extractData<PaymentResult>(response);
};

export const getBillHistory = async (page = 1, limit = 20): Promise<BillHistoryResponse> => {
  const response = await apiClient.get<any>('/bills/history', { params: { page, limit } });
  return extractData<BillHistoryResponse>(response);
};

export default {
  getBillTypes,
  getNetworkProviders,
  getBillers,
  getBillerPackages,
  validateCustomer,
  payBill,
  buyAirtime,
  buyData,
  getBillHistory,
  BillType,
};
