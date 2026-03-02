export type IncomePayload = {
  issuerName: string;
  issuerEin?: string;
  // Payer/employer address
  issuerAddress?: string;
  issuerAddress2?: string;
  issuerCity?: string;
  issuerState?: string;
  issuerZip?: string;
  // Account/control numbers
  accountNumber?: string;
  controlNumber?: string;
  recipientProfileId?: string;
  boxes?: Record<string, number | string | boolean>;
  stateWages?: number;
  stateWithholding?: number;
  localWages?: number;
  localWithholding?: number;
  notes?: string;
};

export type IncomeDocumentDecrypted = {
  id: string;
  year: number;
  formType: string;
  entityType: 'personal' | 'business';
  amount: number;
  fedWithholding: number;
  createdAt: string;
  updatedAt: string;
  payload: IncomePayload;
};
