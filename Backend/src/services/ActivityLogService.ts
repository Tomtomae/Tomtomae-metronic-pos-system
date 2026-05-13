import { ActivityLogModel } from '../models/ActivityLog.js';

export const logActivity = async (
    userId: string,
    action: string,
    module: string,
    targetId?: string,
    details: string = ''
) => {
    try {
        await ActivityLogModel.create({
            user: userId,
            action,
            module,
            ...(targetId && { targetId }),
            details
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};