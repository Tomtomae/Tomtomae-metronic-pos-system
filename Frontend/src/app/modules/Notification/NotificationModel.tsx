export interface NotificationUser {
    _id:string;
    first_name:string;
    last_name:string;
    pic?:string;
    picUrl?:string;
}

export interface NotificationModel{
    _id:string;
    recipient: string | NotificationUser;
    sender: string | NotificationUser;
    type:'QUOTATION_APPROVAL' | 'QUOTATION_APPROVED' | 'QUOTATION_REJECTED' | 'SYSTEM_ALERT';
    referenceId?: string;
    message:string;
    isRead:boolean;
    createdAt:string;
    updatedAt:string
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationModel[];
  unreadCount?: number; 
}