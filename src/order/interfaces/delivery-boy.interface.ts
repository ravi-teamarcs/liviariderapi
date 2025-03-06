import { User } from '../../entity/user.entity';

export interface DeliveryBoyWithDistance {
    deliveryBoy: {
        id: number;
        login_email: string;
        phone_number: string;
        latitude: string;
        longitude: string;
        role_id: number;
        user_data: string;
    };
    distance: number;
    duration: number;
    durationText: string;
    rank?: number;
}
