export declare function initWhatsAppGateway(): Promise<void>;
export declare function sendWhatsAppMessage(recipientPhone: string, messageText: string): Promise<{
  success: boolean;
  provider?: string;
  recipient: string;
  messageId?: string;
  status?: string;
  error?: string;
}>;
export declare function getGatewayStatus(): {
  status: string;
  hasQR: boolean;
  qr?: string | null;
  qrDataUrl?: string | null;
};
export declare function disconnectWhatsAppGateway(): Promise<{ success: boolean }>;
